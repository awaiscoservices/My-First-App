import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ALLOWED_ROLES = ['super_admin', 'finance', 'game_ops']
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: actor } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) return res.status(403).json({ error: 'Forbidden' })
  const { load_id, action, notes } = req.body
  if (!load_id || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'load_id and action required' })
  const { data: load } = await supabaseAdmin.from('game_loads').select('*').eq('id', load_id).single()
  if (!load) return res.status(404).json({ error: 'Game load not found' })
  if (load.status !== 'pending') return res.status(400).json({ error: `Already ${load.status}` })
  if (action === 'reject') {
    // Refund wallet — load was debited at submission
    const { data: wallet } = await supabaseAdmin.from('wallets').select('id, cash_balance_cents, bonus_balance_cents, version').eq('user_id', load.user_id).single()
    if (wallet) {
      const bucket = load.wallet_bucket === 'bonus' ? 'bonus_balance_cents' : 'cash_balance_cents'
      const currentBal = load.wallet_bucket === 'bonus' ? wallet.bonus_balance_cents : wallet.cash_balance_cents
      const newBal = currentBal + load.amount_cents
      const updateObj = { [bucket]: newBal, version: wallet.version + 1, updated_at: new Date().toISOString() }
      await supabaseAdmin.from('wallets').update(updateObj).eq('id', wallet.id).eq('version', wallet.version)
      await supabaseAdmin.from('ledger').insert({ user_id: load.user_id, type: 'game_load_return', direction: 'credit', amount_cents: load.amount_cents, balance_after_cents: newBal, reference_id: load.reference_id, description: `Game load rejected — refunded: ${load.game_panel_name}` })
    }
    await supabaseAdmin.from('game_loads').update({ status: 'rejected', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', load_id)
    await supabaseAdmin.from('notifications').insert({ user_id: load.user_id, title: '❌ Game Load Rejected', message: `Your game load of $${(load.amount_cents/100).toFixed(2)} for ${load.game_panel_name} was rejected and refunded. ${notes ? 'Note: '+notes : ''} Ref: ${load.reference_id}` })
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'game_load_rejected', target_type: 'game_load', target_id: load_id, details: { reference_id: load.reference_id, notes } })
    return res.status(200).json({ success: true, status: 'rejected' })
  }
  // APPROVE
  await supabaseAdmin.from('game_loads').update({ status: 'approved', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', load_id)
  await supabaseAdmin.from('notifications').insert({ user_id: load.user_id, title: '✅ Game Load Approved', message: `Your game load of $${(load.amount_cents/100).toFixed(2)} for ${load.game_panel_name} (${load.game_account_username}) has been processed. Ref: ${load.reference_id}` })
  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'game_load_approved', target_type: 'game_load', target_id: load_id, details: { reference_id: load.reference_id, amount_cents: load.amount_cents } })
  return res.status(200).json({ success: true, status: 'approved' })
}
