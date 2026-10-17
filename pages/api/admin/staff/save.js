import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const VALID_ROLES = ['super_admin', 'finance', 'game_ops', 'support', 'kyc_agent', 'risk', 'reporting', 'marketing']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const { data: actor } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (actor?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' })

  const { action, staff_id, role, email, full_name } = req.body

  if (action === 'invite') {
    // Create auth user + profile with staff role
    if (!email?.trim() || !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Valid email and role required' })
    const tempPassword = Math.random().toString(36).slice(2, 10) + 'X1!'
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(), password: tempPassword, email_confirm: true,
      user_metadata: { full_name: full_name?.trim() || email.split('@')[0] }
    })
    if (createErr) return res.status(400).json({ error: createErr.message })
    await supabaseAdmin.from('profiles').update({ role, full_name: full_name?.trim() || email.split('@')[0] }).eq('id', newUser.user.id)
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'staff_invited', target_type: 'profiles', target_id: newUser.user.id, details: { email, role } }).then(() => {}, () => {})
    return res.status(201).json({ message: 'Staff invited', temp_password: tempPassword })
  }

  if (action === 'update_role') {
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' })
    if (staff_id === user.id) return res.status(400).json({ error: 'Cannot change own role' })
    await supabaseAdmin.from('profiles').update({ role }).eq('id', staff_id)
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'staff_role_changed', target_type: 'profiles', target_id: staff_id, details: { new_role: role } }).then(() => {}, () => {})
    return res.status(200).json({ message: 'Role updated' })
  }

  if (action === 'deactivate') {
    if (staff_id === user.id) return res.status(400).json({ error: 'Cannot deactivate yourself' })
    await supabaseAdmin.from('profiles').update({ status: 'suspended' }).eq('id', staff_id)
    await supabaseAdmin.auth.admin.updateUserById(staff_id, { ban_duration: '876600h' })
    await supabaseAdmin.from('audit_logs').insert({ actor_id: user.id, action: 'staff_deactivated', target_type: 'profiles', target_id: staff_id }).then(() => {}, () => {})
    return res.status(200).json({ message: 'Staff deactivated' })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
