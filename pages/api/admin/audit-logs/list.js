import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'risk', 'reporting'].includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  const { page = 0, limit = 25, search = '' } = req.query
  const offset = parseInt(page) * parseInt(limit)

  let q = supabaseAdmin.from('audit_logs')
    .select('id, action, target_type, target_id, details, created_at, profiles!audit_logs_actor_id_fkey(full_name, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)

  if (search) q = q.ilike('action', `%${search}%`)

  const { data, count, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ rows: data || [], total: count || 0 })
}
