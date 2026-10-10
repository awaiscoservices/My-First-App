import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: admin } = await supabaseAdmin.from('profiles').select('id, role').eq('id', user.id).single()
  if (!admin || !['super_admin', 'kyc_agent'].includes(admin.role)) return res.status(403).json({ error: 'Forbidden' })

  const { id, action, reason } = req.body
  if (!id || !['verified', 'rejected', 'more_info_required'].includes(action)) return res.status(400).json({ error: 'Invalid params' })
  if (['rejected', 'more_info_required'].includes(action) && !reason?.trim()) return res.status(400).json({ error: 'Reason required' })

  const { data: rec } = await supabaseAdmin.from('kyc_records').select('*').eq('id', id).single()
  if (!rec) return res.status(404).json({ error: 'Not found' })
  if (!['pending', 'under_review'].includes(rec.status)) return res.status(409).json({ error: `Already ${rec.status}` })

  const { error: updateErr } = await supabaseAdmin.from('kyc_records').update({
    status: action, rejection_reason: reason?.trim() || null,
    reviewed_by: admin.id, reviewed_at: new Date().toISOString(),
  }).eq('id', id)
  if (updateErr) return res.status(500).json({ error: updateErr.message })

  await supabaseAdmin.from('profiles').update({ kyc_status: action }).eq('id', rec.user_id)

  await supabaseAdmin.from('notifications').insert({
    user_id: rec.user_id, type: `kyc_${action}`,
    title: action === 'verified' ? 'Identity Verified ✅' : action === 'rejected' ? 'Verification Rejected' : 'More Information Needed',
    message: action === 'verified' ? 'Your identity is verified. Withdrawals are now unlocked.' : `${reason}`,
    read: false, created_at: new Date().toISOString()
  })

  await supabaseAdmin.from('audit_logs').insert({
    action: `kyc_${action}`, performed_by: admin.id,
    target_type: 'kyc_record', target_id: id,
    details: { user_id: rec.user_id, reason: reason || null }
  })

  return res.status(200).json({ success: true })
}
