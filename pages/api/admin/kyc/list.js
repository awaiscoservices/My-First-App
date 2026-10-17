import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ALLOWED_ROLES = ['super_admin', 'kyc_agent', 'support', 'risk']

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!ALLOWED_ROLES.includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  const { page = 0, limit = 25, search = '', status = '' } = req.query
  const offset = parseInt(page) * parseInt(limit)

  let q = supabaseAdmin.from('kyc_records')
    .select('id, user_id, status, document_type, submitted_at, reviewed_at, reviewer_notes, profiles!kyc_records_user_id_fkey(full_name, email)', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)

  if (status) q = q.eq('status', status)
  if (search) q = q.ilike('profiles.full_name', `%${search}%`)

  const { data, count, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ rows: data || [], total: count || 0 })
}
