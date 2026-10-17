import { createClient } from '@supabase/supabase-js'

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

  const { deposit_id, action, notes } = req.body
  if (!deposit_id || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'deposit_id and action (approve|reject) required' })

  const { data: deposit } = await supabaseAdmin
    .from('deposits').select('*').eq('id', deposit_id).single()
  if (!deposit) return res.status(404).json({ error: 'Deposit not found' })
  if (deposit.status !== 'pending') return res.status(400).json({ error: `Deposit already ${deposit.status}` })

  if (action === 'reject') {
    await supabaseAdmin.from('deposits').update({ status: 'rejected', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', deposit_id)
    await supabaseAdmin.from('notifications').insert({ user_id: deposit.user_id, title: '❌ Deposit Rejected', message: `Your deposit of $${(deposit.amount_cents / 100).toFixed(2)} (${deposit.reference_id}) was not approved.${notes ? ' Note: ' + notes : ''}` })
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'deposit_rejected', target_type: 'deposit', target_id: deposit_id, details: { reference_id: deposit.reference_id, notes } })
    return res.status(200).json({ success: true, status: 'rejected' })
  }

  // APPROVE — credit wallet
  const { data: wallet } = await supabaseAdmin.from('wallets').select('id, cash_balance_cents, bonus_balance_cents, total_deposited_cents, version').eq('user_id', deposit.user_id).single()
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

  const cashCredit = deposit.amount_cents
  const bonusCredit = deposit.bonus_cents || 0
  const newCash = wallet.cash_balance_cents + cashCredit
  const newBonus = wallet.bonus_balance_cents + bonusCredit
  const newDeposited = (wallet.total_deposited_cents || 0) + cashCredit

  const { data: updated } = await supabaseAdmin.from('wallets')
    .update({ cash_balance_cents: newCash, bonus_balance_cents: newBonus, total_deposited_cents: newDeposited, version: wallet.version + 1, updated_at: new Date().toISOString() })
    .eq('id', wallet.id).eq('version', wallet.version).select('id').single()

  if (!updated) return res.status(409).json({ error: 'Wallet conflict, please retry' })

  // Ledger
  await supabaseAdmin.from('ledger').insert({
    user_id: deposit.user_id, type: 'deposit', direction: 'credit',
    amount_cents: cashCredit, balance_after_cents: newCash,
    reference_id: deposit.reference_id, description: `Deposit approved — ${deposit.payment_method_name || deposit.payment_method_type}`,
    metadata: { deposit_id, reviewed_by: user.id },
  })
  if (bonusCredit > 0) {
    await supabaseAdmin.from('ledger').insert({
      user_id: deposit.user_id, type: 'bonus', direction: 'credit',
      amount_cents: bonusCredit, balance_after_cents: newCash,
      reference_id: deposit.reference_id, description: `Deposit bonus`,
    })
  }

  // XP — 1 per $1 deposited
  const xpGain = Math.floor(cashCredit / 100)
  if (xpGain > 0) await supabaseAdmin.from('profiles').update({ xp_points: supabaseAdmin.rpc('increment', { row_id: deposit.user_id, amount: xpGain }) }).eq('id', deposit.user_id)

  // Mark deposit approved
  await supabaseAdmin.from('deposits').update({ status: 'approved', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', deposit_id)

  // Notify player
  await supabaseAdmin.from('notifications').insert({
    user_id: deposit.user_id,
    title: '✅ Deposit Approved',
    message: `Your deposit of $${(cashCredit / 100).toFixed(2)} has been approved and credited to your wallet.${bonusCredit > 0 ? ` Bonus: +$${(bonusCredit / 100).toFixed(2)}` : ''} Ref: ${deposit.reference_id}`,
  })

  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'deposit_approved', target_type: 'deposit', target_id: deposit_id, details: { reference_id: deposit.reference_id, amount_cents: cashCredit, bonus_cents: bonusCredit } })

  return res.status(200).json({ success: true, status: 'approved', new_balance_cents: newCash })
}
