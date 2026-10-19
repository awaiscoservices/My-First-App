/**
 * GET /api/admin/pending-counts
 * Returns pending/open counts for all sidebar badges — uses service role to bypass RLS.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'player') return res.status(403).json({ error: 'Forbidden' })

  const [deposits, gameAccounts, gameLoads, redemptions, withdrawals, kyc, support] = await Promise.all([
    supabaseAdmin.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('game_accounts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('game_loads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('redemptions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('kyc_records').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  return res.status(200).json({
    '/admin/deposits':      deposits.count      || 0,
    '/admin/game-accounts': gameAccounts.count  || 0,
    '/admin/game-loads':    gameLoads.count      || 0,
    '/admin/redemptions':   redemptions.count   || 0,
    '/admin/withdrawals':   withdrawals.count   || 0,
    '/admin/kyc':           kyc.count           || 0,
    '/admin/support':       support.count       || 0,
  })
}
