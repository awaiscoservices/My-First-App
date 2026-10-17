import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'marketing'].includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  const { id, name, min_xp, color, icon, perks } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  if (min_xp == null) return res.status(400).json({ error: 'Min XP required' })

  const payload = { name: name.trim(), min_xp: parseInt(min_xp), color: color || '#fbbf24', icon: icon || '⭐', perks: perks || null }

  let data, error
  if (id) {
    ({ data, error } = await supabaseAdmin.from('player_levels').update(payload).eq('id', id).select().single())
  } else {
    ({ data, error } = await supabaseAdmin.from('player_levels').insert(payload).select().single())
  }
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ message: 'Saved', level: data })
}
