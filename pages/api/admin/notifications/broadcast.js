import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'marketing', 'support'].includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  const { title, message, target } = req.body // target: 'all' | 'active'
  if (!title?.trim() || !message?.trim()) return res.status(400).json({ error: 'Title and message required' })

  // Get target players
  let q = supabaseAdmin.from('profiles').select('id').eq('role', 'player')
  if (target === 'active') q = q.eq('status', 'active')
  const { data: players } = await q

  if (!players?.length) return res.status(200).json({ message: 'No players found', sent: 0 })

  // Batch insert notifications
  const rows = players.map(p => ({ user_id: p.id, type: 'broadcast', title: title.trim(), message: message.trim() }))
  const BATCH = 100
  let sent = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabaseAdmin.from('notifications').insert(rows.slice(i, i + BATCH))
    if (!error) sent += Math.min(BATCH, rows.length - i)
  }

  await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'broadcast_sent', target_type: 'notifications', details: { title, target, sent } }).then(() => {}, () => {})
  return res.status(200).json({ message: 'Broadcast sent', sent })
}
