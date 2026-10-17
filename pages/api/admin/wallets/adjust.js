import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ALLOWED_ROLES = ['super_admin', 'finance']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: actor } = await supabaseAdmin.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) return res.status(403).json({ error: 'Forbidden' })

  const { user_id, amount_cents, direction, reason } = req.body
  if (!user_id || !amount_cents || !direction || !reason?.trim()) return res.status(400).json({ error: 'user_id, amount_cents, direction, reason required' })
  if (!['credit', 'debit'].includes(direction)) return res.status(400).json({ error: 'direction must be credit or debit' })
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) return res.status(400).json({ error: 'amount_cents must be positive integer' })

  // Generate reference ID
  const { data: seqRow } = await supabaseAdmin.rpc('next_reference_id', { prefix: 'ADJ' }).single()
  const reference_id = seqRow || `ADJ-${Date.now()}`
  const idempotency_key = randomUUID()

  // Fetch wallet with optimistic lock
  const { data: wallet, error: walletErr } = await supabaseAdmin
    .from('wallets').select('id, cash_balance_cents, version').eq('user_id', user_id).single()
  if (walletErr || !wallet) return res.status(404).json({ error: 'Wallet not found' })

  if (direction === 'debit' && wallet.cash_balance_cents < amount_cents) {
    return res.status(400).json({ error: 'Insufficient balance for debit' })
  }

  const new_balance = direction === 'credit'
    ? wallet.cash_balance_cents + amount_cents
    : wallet.cash_balance_cents - amount_cents

  // Optimistic lock update
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('wallets')
    .update({ cash_balance_cents: new_balance, version: wallet.version + 1, updated_at: new Date().toISOString() })
    .eq('id', wallet.id).eq('version', wallet.version)
    .select('id').single()

  if (updateErr || !updated) return res.status(409).json({ error: 'Wallet update conflict, please retry' })

  // Ledger entry
  await supabaseAdmin.from('ledger').insert({
    user_id,
    type: 'adjustment',
    direction,
    amount_cents,
    balance_after_cents: new_balance,
    reference_id,
    idempotency_key,
    description: `Admin adjustment: ${reason}`,
    metadata: { admin_id: user.id, admin_name: actor.full_name, reason },
  })

  // wallet_adjustments record
  await supabaseAdmin.from('wallet_adjustments').insert({
    user_id,
    admin_id: user.id,
    amount_cents,
    direction,
    reason,
    reference_id,
    balance_before_cents: wallet.cash_balance_cents,
    balance_after_cents: new_balance,
  })

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'wallet_adjustment',
    target_type: 'wallet',
    target_id: wallet.id,
    details: { user_id, amount_cents, direction, reason, reference_id },
  })

  // Notify player
  await supabaseAdmin.from('notifications').insert({
    user_id,
    title: direction === 'credit' ? '💰 Wallet Credited' : '💸 Wallet Debited',
    message: `Your wallet has been ${direction === 'credit' ? 'credited' : 'debited'} $${(amount_cents / 100).toFixed(2)}. Ref: ${reference_id}`,
  })

  return res.status(200).json({ success: true, reference_id, new_balance_cents: new_balance })
}
