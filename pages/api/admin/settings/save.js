import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (staff?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' })

  const { key, value } = req.body
  if (!key) return res.status(400).json({ error: 'Key required' })

  const { error } = await supabaseAdmin.from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: 'key' })

  if (error) return res.status(500).json({ error: error.message })
  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'setting_changed', target_type: 'platform_settings', target_id: key, details: { key, value } }).then(() => {}, () => {})
  return res.status(200).json({ message: 'Setting saved' })
}
