-- ============================================================
-- Casinoze Room — database support for the new dashboard pages
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

-- 1) Columns the pages read/write on existing tables ---------
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists kyc_status text default 'not_started';
alter table profiles add column if not exists referred_by uuid references profiles(id);

alter table game_loads add column if not exists game_account_id uuid;
alter table game_loads add column if not exists amount_cents bigint;

alter table redemptions add column if not exists game_account_id uuid;
alter table redemptions add column if not exists amount_cents bigint;
alter table redemptions add column if not exists player_notes text;

alter table withdrawals add column if not exists amount_cents bigint;
alter table withdrawals add column if not exists method text;
alter table withdrawals add column if not exists destination text;

-- 2) New tables -----------------------------------------------
create table if not exists kyc_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_legal_name text, dob date, address text,
  id_type text, id_number text, front_path text, back_path text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null, category text, message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 3) Row Level Security ---------------------------------------
alter table kyc_records     enable row level security;
alter table support_tickets enable row level security;
alter table redemptions     enable row level security;
alter table withdrawals     enable row level security;
alter table notifications   enable row level security;

drop policy if exists "own kyc read"   on kyc_records;
drop policy if exists "own kyc insert" on kyc_records;
create policy "own kyc read"   on kyc_records for select using (user_id = auth.uid());
create policy "own kyc insert" on kyc_records for insert with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "own tickets read"   on support_tickets;
drop policy if exists "own tickets insert" on support_tickets;
create policy "own tickets read"   on support_tickets for select using (user_id = auth.uid());
create policy "own tickets insert" on support_tickets for insert with check (user_id = auth.uid());

-- players can only READ these; requests are created by the functions below
drop policy if exists "own redemptions read" on redemptions;
drop policy if exists "own withdrawals read" on withdrawals;
create policy "own redemptions read" on redemptions for select using (user_id = auth.uid());
create policy "own withdrawals read" on withdrawals for select using (user_id = auth.uid());

drop policy if exists "own notifications read"   on notifications;
drop policy if exists "own notifications update" on notifications;
create policy "own notifications read"   on notifications for select using (user_id = auth.uid());
create policy "own notifications update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4) KYC submission marks the profile as pending ---------------
create or replace function kyc_mark_pending() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set kyc_status = 'pending' where id = new.user_id;
  return new;
end $$;
drop trigger if exists trg_kyc_pending on kyc_records;
create trigger trg_kyc_pending after insert on kyc_records
  for each row execute function kyc_mark_pending();

-- 5) Players must not be able to edit protected profile fields --
--    (otherwise anyone could set kyc_status = 'verified' themselves)
create or replace function protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then   -- direct edits from the browser only
    new.kyc_status      := old.kyc_status;
    new.status          := old.status;
    new.player_level_id := old.player_level_id;
    new.total_xp        := old.total_xp;
    new.referral_code   := old.referral_code;
    new.referred_by     := old.referred_by;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile on profiles;
create trigger trg_protect_profile before update on profiles
  for each row execute function protect_profile_columns();

-- 6) Request functions (all checks run inside the database) ----
create or replace function request_redemption(p_game_account_id uuid, p_amount_cents bigint, p_notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'Invalid amount'; end if;
  if not exists (select 1 from game_accounts
                 where id = p_game_account_id and user_id = v_uid and status = 'active') then
    raise exception 'Game account not found or not active';
  end if;
  insert into redemptions (user_id, game_account_id, amount_cents, player_notes, status)
  values (v_uid, p_game_account_id, p_amount_cents, p_notes, 'pending')
  returning id into v_id;
  return v_id;
end $$;

create or replace function request_withdrawal(p_amount_cents bigint, p_method text, p_destination text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_kyc text; v_w wallets%rowtype; v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'Invalid amount'; end if;
  select kyc_status into v_kyc from profiles where id = v_uid;
  if v_kyc is distinct from 'verified' then raise exception 'Identity verification required'; end if;

  select * into v_w from wallets where user_id = v_uid for update;   -- lock the wallet row
  if not found or v_w.withdrawable_cents < p_amount_cents or v_w.cash_balance_cents < p_amount_cents then
    raise exception 'Amount exceeds your withdrawable balance';
  end if;

  -- hold the funds until an admin approves or rejects the request
  update wallets
     set cash_balance_cents = cash_balance_cents - p_amount_cents,
         withdrawable_cents = withdrawable_cents - p_amount_cents,
         reserved_cents     = reserved_cents + p_amount_cents
   where user_id = v_uid;

  insert into withdrawals (user_id, amount_cents, method, destination, status)
  values (v_uid, p_amount_cents, p_method, p_destination, 'pending')
  returning id into v_id;
  return v_id;
end $$;

create or replace function request_game_load(p_game_account_id uuid, p_amount_cents bigint)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_min bigint; v_w wallets%rowtype; v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'Invalid amount'; end if;

  select coalesce(gp.min_load_cents, 0) into v_min
    from game_accounts ga join game_panels gp on gp.id = ga.game_panel_id
   where ga.id = p_game_account_id and ga.user_id = v_uid and ga.status = 'active';
  if not found then raise exception 'Game account not found or not active'; end if;
  if p_amount_cents < v_min then
    raise exception 'Minimum load for this game is $%', to_char(v_min / 100.0, 'FM999990.00');
  end if;

  select * into v_w from wallets where user_id = v_uid for update;
  if not found or v_w.cash_balance_cents < p_amount_cents then
    raise exception 'Not enough cash balance. Add money first.';
  end if;

  -- hold the cash until the load is processed
  update wallets
     set cash_balance_cents = cash_balance_cents - p_amount_cents,
         withdrawable_cents = least(withdrawable_cents, cash_balance_cents - p_amount_cents),
         reserved_cents     = reserved_cents + p_amount_cents
   where user_id = v_uid;

  insert into game_loads (user_id, game_account_id, amount_cents, status)
  values (v_uid, p_game_account_id, p_amount_cents, 'pending')
  returning id into v_id;
  return v_id;
end $$;

-- Links a new player to whoever owns the referral code they signed up with
create or replace function apply_referral(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_ref uuid;
begin
  if v_uid is null or p_code is null or length(trim(p_code)) = 0 then return false; end if;
  select id into v_ref from profiles where upper(referral_code) = upper(trim(p_code)) and id <> v_uid;
  if v_ref is null then return false; end if;
  update profiles set referred_by = v_ref where id = v_uid and referred_by is null;
  return found;
end $$;

revoke all on function request_redemption(uuid, bigint, text) from public;
revoke all on function request_withdrawal(bigint, text, text)  from public;
revoke all on function request_game_load(uuid, bigint) from public;
revoke all on function apply_referral(text) from public;
grant execute on function request_game_load(uuid, bigint) to authenticated;
grant execute on function apply_referral(text) to authenticated;
grant execute on function request_redemption(uuid, bigint, text) to authenticated;
grant execute on function request_withdrawal(bigint, text, text)  to authenticated;

-- 7) Private storage bucket for ID documents --------------------
insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

drop policy if exists "kyc upload own folder" on storage.objects;
drop policy if exists "kyc read own folder"   on storage.objects;
create policy "kyc upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc read own folder" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
