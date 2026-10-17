import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (staff?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin.from('profiles')
    .select('id, full_name, email, role, status, created_at')
    .neq('role', 'player')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ rows: data || [] })
}
