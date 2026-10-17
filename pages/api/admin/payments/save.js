import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ALLOWED_ROLES = ['super_admin', 'finance']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: actor } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) return res.status(403).json({ error: 'Forbidden' })

  const {
    id, name, type, icon, description, instructions, account_details,
    min_deposit_cents, max_deposit_cents, default_bonus_pct,
    is_active, is_auto, requires_proof, requires_reference, sort_order,
  } = req.body

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  const payload = {
    name: name.trim(),
    type: type || 'other',
    icon: icon || null,
    description: description?.trim() || null,
    instructions: instructions?.trim() || null,
    account_details: account_details?.trim() || null,
    min_deposit_cents: min_deposit_cents || null,
    max_deposit_cents: max_deposit_cents || null,
    default_bonus_pct: default_bonus_pct ?? 0,
    is_active: is_active ?? true,
    is_auto: is_auto ?? false,
    requires_proof: requires_proof ?? false,
    requires_reference: requires_reference ?? false,
    sort_order: sort_order ?? 0,
    updated_at: new Date().toISOString(),
  }

  let result
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('payment_methods').update(payload).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    result = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('payment_methods').insert(payload).select().single()
    if (error) return res.status(500).json({ error: error.message })
    result = data
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: user.id,
    action: id ? 'payment_method_updated' : 'payment_method_created',
    target_type: 'payment_method',
    target_id: result.id,
    details: { name, type, is_active },
  })

  return res.status(200).json({ success: true, row: result })
}
