import { createPagesServerClient } from '@supabase/ssr';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const svc = createPagesServerClient({ req, res }, { supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL });
  const { data: staff } = await svc.from('staff_profiles').select('role').eq('user_id', session.user.id).single();
  if (!staff || staff.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { level_id, name, min_xp, bonus_rate_percent, color } = req.body;
  if (!level_id) return res.status(400).json({ error: 'level_id required' });
  const { error } = await svc.from('vip_levels').update({ name, min_xp, bonus_rate_percent, color, updated_at: new Date().toISOString() }).eq('id', level_id);
  if (error) return res.status(500).json({ error: error.message });
  await svc.from('audit_logs').insert({ action: 'level_update', performed_by: session.user.id, target_type: 'vip_level', target_id: level_id, details: { name, min_xp, bonus_rate_percent } });
  return res.status(200).json({ success: true });
}
