import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['super_admin', 'kyc_agent', 'support'].includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  const { kyc_id, action, notes } = req.body
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' })
  if (action === 'reject' && !notes?.trim()) return res.status(400).json({ error: 'Rejection reason required' })

  const { data: kyc } = await supabaseAdmin.from('kyc_records').select('id, user_id, status').eq('id', kyc_id).single()
  if (!kyc) return res.status(404).json({ error: 'KYC record not found' })
  if (kyc.status !== 'pending' && kyc.status !== 'under_review') return res.status(400).json({ error: 'KYC is not pending review' })

  const newStatus = action === 'approve' ? 'verified' : 'rejected'

  await supabaseAdmin.from('kyc_records').update({
    status: newStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    reviewer_notes: notes?.trim() || null,
  }).eq('id', kyc_id)

  if (action === 'approve') {
    await supabaseAdmin.from('profiles').update({ kyc_verified: true }).eq('id', kyc.user_id).then(() => {}, () => {})
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: kyc.user_id,
    type: `kyc_${newStatus}`,
    title: action === 'approve' ? 'KYC Approved ✅' : 'KYC Rejected',
    message: action === 'approve'
      ? 'Your identity verification has been approved.'
      : `Your KYC was rejected: ${notes}`,
  }).then(() => {}, () => {})

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: user.id, action: `kyc_${action}`, target_type: 'kyc_records', target_id: kyc_id,
    details: { notes, reviewed_by: staff.full_name },
  }).then(() => {}, () => {})

  return res.status(200).json({ message: `KYC ${action}d` })
}
