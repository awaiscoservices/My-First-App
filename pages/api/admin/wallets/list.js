import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ALLOWED_ROLES = ['super_admin', 'finance', 'support', 'risk', 'reporting']

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: actor } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) return res.status(403).json({ error: 'Forbidden' })

  const { page = '1', limit = '25', search = '' } = req.query
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, parseInt(limit))
  const offset = (pageNum - 1) * limitNum

  let query = supabaseAdmin
    .from('wallets')
    .select(`
      id, user_id, cash_balance_cents, bonus_balance_cents,
      total_deposited_cents, total_withdrawn_cents, updated_at,
      profiles!wallets_user_id_fkey(full_name, email, status)
    `, { count: 'exact' })
    .order('cash_balance_cents', { ascending: false })
    .range(offset, offset + limitNum - 1)

  if (search) {
    query = query.or(`profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({
    rows: data || [],
    total: count || 0,
    page: pageNum,
    pages: Math.ceil((count || 0) / limitNum),
  })
}
