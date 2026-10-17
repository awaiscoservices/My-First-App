import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ALLOWED_ROLES = ['super_admin', 'finance', 'game_ops', 'support']
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: actor } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) return res.status(403).json({ error: 'Forbidden' })
  const { page = '1', limit = '25', search = '', status = '' } = req.query
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, parseInt(limit))
  const offset = (pageNum - 1) * limitNum
  let query = supabaseAdmin
    .from('game_loads')
    .select(`id, reference_id, amount_cents, wallet_bucket, game_panel_name, game_account_username, status, notes, created_at, profiles!game_loads_user_id_fkey(full_name, email)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1)
  if (status) query = query.eq('status', status)
  if (search) query = query.or(`reference_id.ilike.%${search}%,game_panel_name.ilike.%${search}%,profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`)
  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ rows: data || [], total: count || 0, page: pageNum, pages: Math.ceil((count || 0) / limitNum) })
}
