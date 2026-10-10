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
  if (!admin || admin.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' })

  const { id, name, min_wagered_cents, bonus_rate_percent, color } = req.body
  if (!id) return res.status(400).json({ error: 'id required' })

  const { error } = await supabaseAdmin.from('player_levels').update({
    name, min_wagered_cents, bonus_rate_percent, color, updated_at: new Date().toISOString()
  }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })

  await supabaseAdmin.from('audit_logs').insert({
    action: 'level_update', performed_by: admin.id,
    target_type: 'player_level', target_id: id,
    details: { name, min_wagered_cents, bonus_rate_percent }
  })

  return res.status(200).json({ success: true })
}
