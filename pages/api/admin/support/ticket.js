/**
 * GET /api/admin/support/ticket?id=
 * POST /api/admin/support/ticket — reply or close ticket
 */
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: staff } = await supabaseAdmin.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['super_admin', 'support', 'finance', 'game_ops'].includes(staff?.role)) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { id } = req.query
    const [ticket, messages] = await Promise.all([
      supabaseAdmin.from('support_tickets').select('*, profiles!support_tickets_user_id_fkey(full_name, email)').eq('id', id).single(),
      supabaseAdmin.from('support_messages').select('*, profiles!support_messages_sender_id_fkey(full_name, role)').eq('ticket_id', id).order('created_at'),
    ])
    return res.status(200).json({ ticket: ticket.data, messages: messages.data || [] })
  }

  if (req.method === 'POST') {
    const { ticket_id, action, message } = req.body

    if (action === 'reply') {
      if (!message?.trim()) return res.status(400).json({ error: 'Message required' })
      await supabaseAdmin.from('support_messages').insert({ ticket_id, sender_id: user.id, message: message.trim(), is_staff: true })
      await supabaseAdmin.from('support_tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', ticket_id)
      await supabaseAdmin.from('support_tickets').select('user_id').eq('id', ticket_id).single().then(({ data }) => {
        if (data) supabaseAdmin.from('notifications').insert({ user_id: data.user_id, type: 'support_reply', title: 'Support Reply', message: `Staff replied to your ticket.` }).then(() => {}, () => {})
      })
    } else if (action === 'close') {
      await supabaseAdmin.from('support_tickets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', ticket_id)
    } else {
      return res.status(400).json({ error: 'Invalid action' })
    }
    return res.status(200).json({ message: 'Done' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
