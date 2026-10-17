import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'game_ops'].includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  const { id, name, description, logo_url, is_active, min_load_cents, max_load_cents } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })

  const payload = { name: name.trim(), description: description?.trim() || null, logo_url: logo_url?.trim() || null, is_active: !!is_active, min_load_cents: min_load_cents || 100, max_load_cents: max_load_cents || 500000 }

  let data, error
  if (id) {
    ({ data, error } = await supabaseAdmin.from('game_panels').update(payload).eq('id', id).select().single())
  } else {
    ({ data, error } = await supabaseAdmin.from('game_panels').insert(payload).select().single())
  }
  if (error) return res.status(500).json({ error: error.message })

  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: id ? 'game_updated' : 'game_created', target_type: 'game_panels', target_id: data.id, details: payload }).then(() => {}, () => {})
  return res.status(200).json({ message: 'Saved', game: data })
}
