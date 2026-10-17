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
  const { redemption_id, action, notes, verified_amount_cents } = req.body
  if (!redemption_id || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'redemption_id and action required' })
  const { data: redemption } = await supabaseAdmin.from('redemptions').select('*').eq('id', redemption_id).single()
  if (!redemption) return res.status(404).json({ error: 'Redemption not found' })
  if (redemption.status !== 'pending') return res.status(400).json({ error: `Already ${redemption.status}` })

  if (action === 'reject') {
    await supabaseAdmin.from('redemptions').update({ status: 'rejected', notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', redemption_id)
    await supabaseAdmin.from('notifications').insert({ user_id: redemption.user_id, title: '❌ Redemption Rejected', message: `Your redemption request of $${(redemption.amount_cents/100).toFixed(2)} for ${redemption.game_panel_name} was rejected.${notes ? ' Note: '+notes : ''} Ref: ${redemption.reference_id}` })
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'redemption_rejected', target_type: 'redemption', target_id: redemption_id, details: { reference_id: redemption.reference_id, notes } })
    return res.status(200).json({ success: true, status: 'rejected' })
  }

  // APPROVE — credit wallet NOW (redemption does NOT debit at submission, admin verifies in-game score first)
  const creditAmount = verified_amount_cents || redemption.amount_cents
  const { data: wallet } = await supabaseAdmin.from('wallets').select('id, cash_balance_cents, total_withdrawn_cents, version').eq('user_id', redemption.user_id).single()
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' })
  const newCash = wallet.cash_balance_cents + creditAmount
  const { data: updated } = await supabaseAdmin.from('wallets')
    .update({ cash_balance_cents: newCash, version: wallet.version + 1, updated_at: new Date().toISOString() })
    .eq('id', wallet.id).eq('version', wallet.version).select('id').single()
  if (!updated) return res.status(409).json({ error: 'Wallet conflict, retry' })

  await supabaseAdmin.from('ledger').insert({ user_id: redemption.user_id, type: 'redemption', direction: 'credit', amount_cents: creditAmount, balance_after_cents: newCash, reference_id: redemption.reference_id, description: `Redemption approved — ${redemption.game_panel_name}`, metadata: { redemption_id, reviewed_by: user.id } })

  // XP — 1 per $2 redeemed
  const xpGain = Math.floor(creditAmount / 200)
  if (xpGain > 0) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('xp_points').eq('id', redemption.user_id).single()
    if (profile) await supabaseAdmin.from('profiles').update({ xp_points: (profile.xp_points || 0) + xpGain }).eq('id', redemption.user_id)
  }

  await supabaseAdmin.from('redemptions').update({ status: 'approved', amount_cents: creditAmount, notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', redemption_id)
  await supabaseAdmin.from('notifications').insert({ user_id: redemption.user_id, title: '✅ Redemption Approved', message: `Your redemption of $${(creditAmount/100).toFixed(2)} from ${redemption.game_panel_name} has been credited to your wallet. Ref: ${redemption.reference_id}` })
  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'redemption_approved', target_type: 'redemption', target_id: redemption_id, details: { reference_id: redemption.reference_id, amount_cents: creditAmount } })
  return res.status(200).json({ success: true, status: 'approved', new_balance_cents: newCash })
}
