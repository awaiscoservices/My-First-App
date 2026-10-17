import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ALLOWED_ROLES = ['super_admin', 'finance']
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: actor } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) return res.status(403).json({ error: 'Forbidden' })
  const { withdrawal_id, action, notes } = req.body
  if (!withdrawal_id || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'withdrawal_id and action required' })
  const { data: wd } = await supabaseAdmin.from('withdrawals').select('*').eq('id', withdrawal_id).single()
  if (!wd) return res.status(404).json({ error: 'Withdrawal not found' })
  if (wd.status !== 'pending') return res.status(400).json({ error: `Already ${wd.status}` })

  if (action === 'reject') {
    // Refund wallet — was debited at submission
    const { data: wallet } = await supabaseAdmin.from('wallets').select('id, cash_balance_cents, total_withdrawn_cents, version').eq('user_id', wd.user_id).single()
    if (wallet) {
      const newCash = wallet.cash_balance_cents + wd.amount_cents
      await supabaseAdmin.from('wallets').update({ cash_balance_cents: newCash, version: wallet.version + 1, updated_at: new Date().toISOString() }).eq('id', wallet.id).eq('version', wallet.version)
      await supabaseAdmin.from('ledger').insert({ user_id: wd.user_id, type: 'adjustment', direction: 'credit', amount_cents: wd.amount_cents, balance_after_cents: newCash, reference_id: wd.reference_id, description: `Withdrawal rejected — refunded: ${wd.reference_id}` })
    }
    await supabaseAdmin.from('withdrawals').update({ status: 'rejected', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', withdrawal_id)
    await supabaseAdmin.from('notifications').insert({ user_id: wd.user_id, title: '❌ Withdrawal Rejected', message: `Your withdrawal of $${(wd.amount_cents/100).toFixed(2)} was rejected and refunded to your wallet.${notes ? ' Note: '+notes : ''} Ref: ${wd.reference_id}` })
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'withdrawal_rejected', target_type: 'withdrawal', target_id: withdrawal_id, details: { reference_id: wd.reference_id, notes } })
    return res.status(200).json({ success: true, status: 'rejected' })
  }

  // APPROVE — wallet already debited at submission, just mark complete and update totals
  const { data: wallet } = await supabaseAdmin.from('wallets').select('id, total_withdrawn_cents').eq('user_id', wd.user_id).single()
  if (wallet) {
    await supabaseAdmin.from('wallets').update({ total_withdrawn_cents: (wallet.total_withdrawn_cents || 0) + wd.amount_cents, updated_at: new Date().toISOString() }).eq('id', wallet.id)
  }
  await supabaseAdmin.from('withdrawals').update({ status: 'completed', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', withdrawal_id)
  // Update ledger entry type from withdrawal_hold to withdrawal
  await supabaseAdmin.from('ledger').update({ type: 'withdrawal' }).eq('reference_id', wd.reference_id).eq('user_id', wd.user_id).eq('type', 'withdrawal_hold')
  await supabaseAdmin.from('notifications').insert({ user_id: wd.user_id, title: '✅ Withdrawal Sent', message: `Your withdrawal of $${(wd.amount_cents/100).toFixed(2)} to ${wd.payout_method_label} has been processed. Ref: ${wd.reference_id}` })
  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'withdrawal_approved', target_type: 'withdrawal', target_id: withdrawal_id, details: { reference_id: wd.reference_id, amount_cents: wd.amount_cents, payout_method: wd.payout_method_label } })
  return res.status(200).json({ success: true, status: 'completed' })
}
