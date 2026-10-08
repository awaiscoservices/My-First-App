import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin',              icon: '📊', label: 'Dashboard',       roles: ['super_admin','finance','game_ops','support','kyc_agent','risk','reporting','marketing'] },
    ],
  },
  {
    label: 'Players',
    items: [
      { href: '/admin/players',      icon: '👥', label: 'Players',         roles: ['super_admin','support','kyc_agent','risk','finance'] },
      { href: '/admin/kyc',          icon: '🔐', label: 'KYC Review',      roles: ['super_admin','kyc_agent','risk'] },
      { href: '/admin/risk',         icon: '⚠️', label: 'Risk Flags',      roles: ['super_admin','risk','finance'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/deposits',     icon: '💳', label: 'Deposits',        roles: ['super_admin','finance'] },
      { href: '/admin/game-accounts',icon: '🎮', label: 'Game Accounts',   roles: ['super_admin','game_ops'] },
      { href: '/admin/game-loads',   icon: '🔄', label: 'Game Loads',      roles: ['super_admin','game_ops'] },
      { href: '/admin/redemptions',  icon: '🏆', label: 'Redemptions',     roles: ['super_admin','game_ops','finance'] },
      { href: '/admin/withdrawals',  icon: '💸', label: 'Withdrawals',     roles: ['super_admin','finance'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/wallets',      icon: '💎', label: 'Wallets',         roles: ['super_admin','finance'] },
      { href: '/admin/transactions', icon: '📋', label: 'Transactions',    roles: ['super_admin','finance','reporting'] },
      { href: '/admin/adjustments',  icon: '⚖️', label: 'Adjustments',     roles: ['super_admin','finance'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/games',        icon: '🕹️', label: 'Game Panels',     roles: ['super_admin'] },
      { href: '/admin/payments',     icon: '💰', label: 'Payment Methods', roles: ['super_admin','finance'] },
      { href: '/admin/promotions',   icon: '🎁', label: 'Promotions',      roles: ['super_admin','marketing'] },
      { href: '/admin/levels',       icon: '⭐', label: 'Player Levels',   roles: ['super_admin','marketing'] },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/admin/support',      icon: '💬', label: 'Support Tickets', roles: ['super_admin','support'] },
      { href: '/admin/notifications',icon: '🔔', label: 'Notifications',   roles: ['super_admin','support'] },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/staff',        icon: '👤', label: 'Staff & Roles',   roles: ['super_admin'] },
      { href: '/admin/audit-logs',   icon: '🔍', label: 'Audit Logs',      roles: ['super_admin'] },
      { href: '/admin/settings',     icon: '⚙️', label: 'Settings',        roles: ['super_admin'] },
    ],
  },
]

// Pending counts badge colors
const PENDING_COLORS = {
  '/admin/deposits':      '#10b981',
  '/admin/game-accounts': '#a855f7',
  '/admin/redemptions':   '#f59e0b',
  '/admin/withdrawals':   '#3b82f6',
  '/admin/kyc':           '#ec4899',
  '/admin/support':       '#6366f1',
}

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [pendingCounts, setPendingCounts] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => { loadAdminData() }, [])

  async function loadAdminData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!prof || prof.role === 'player') {
      router.push('/dashboard')
      return
    }

    setProfile(prof)
    setAuthorized(true)
    loadPendingCounts()
  }

  async function loadPendingCounts() {
    const [deposits, gameAccounts, redemptions, withdrawals, kyc, support] = await Promise.all([
      supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('game_accounts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('kyc_records').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ])
    setPendingCounts({
      '/admin/deposits':       deposits.count || 0,
      '/admin/game-accounts':  gameAccounts.count || 0,
      '/admin/redemptions':    redemptions.count || 0,
      '/admin/withdrawals':    withdrawals.count || 0,
      '/admin/kyc':            kyc.count || 0,
      '/admin/support':        support.count || 0,
    })
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href) => {
    if (href === '/admin') return router.pathname === '/admin'
    return router.pathname.startsWith(href)
  }

  const canSee = (roles) => {
    if (!profile) return false
    return roles.includes(profile.role)
  }

  const roleColors = {
    super_admin: '#ef4444', finance: '#10b981', game_ops: '#a855f7',
    support: '#3b82f6', kyc_agent: '#ec4899', risk: '#f97316',
    reporting: '#6366f1', marketing: '#f59e0b',
  }
  const roleColor = roleColors[profile?.role] || '#6b7280'

  if (!authorized) return (
    <div style={{ minHeight: '100vh', background: '#04000d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div>Verifying access…</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#030008', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── ADMIN SIDEBAR ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'rgba(255,255,255,.025)',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        overflowY: 'auto', scrollbarWidth: 'none',
      }} className="admin-sidebar">

        {/* Logo */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '.04em' }}>CASINOZE</div>
              <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 9, fontWeight: 900, color: '#ef4444', letterSpacing: '.04em' }}>ADMIN</div>
            </div>
          </Link>
        </div>

        {/* Staff profile chip */}
        {profile && (
          <div style={{ margin: '10px 10px 4px', padding: '10px 12px', background: `${roleColor}12`, border: `1px solid ${roleColor}30`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{profile.full_name}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: roleColor, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {profile.role.replace('_', ' ')}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 8px' }}>
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => canSee(item.roles))
            if (visibleItems.length === 0) return null
            return (
              <div key={section.label} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', padding: '6px 10px 4px' }}>{section.label}</div>
                {visibleItems.map(item => {
                  const active = isActive(item.href)
                  const pending = pendingCounts[item.href] || 0
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                        textDecoration: 'none',
                        background: active ? 'rgba(239,68,68,.15)' : 'transparent',
                        border: active ? '1px solid rgba(239,68,68,.25)' : '1px solid transparent',
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,.5)', flex: 1 }}>{item.label}</span>
                      {pending > 0 && (
                        <span style={{ background: PENDING_COLORS[item.href] || '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99, flexShrink: 0 }}>{pending}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', marginBottom: 6, color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            🌐 View Site
          </Link>
          <button onClick={handleSignOut} disabled={signingOut} style={{ width: '100%', padding: '8px 10px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            🚪 {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40 }} />}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="admin-main">

        {/* Top bar */}
        <header style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(3,0,8,.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(p => !p)} className="mobile-ham" style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>☰</button>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>
            Admin Panel
            <span style={{ margin: '0 8px', color: 'rgba(255,255,255,.2)' }}>›</span>
            <span style={{ color: '#fff' }}>
              {NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.href))?.label || 'Dashboard'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={loadPendingCounts} style={{ padding: '6px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              🔄 Refresh
            </button>
            <div style={{ padding: '5px 12px', background: `${roleColor}18`, border: `1px solid ${roleColor}30`, borderRadius: 8, fontSize: 10, fontWeight: 800, color: roleColor, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {profile?.role?.replace('_', ' ')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style>{`
        .admin-sidebar::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform .25s; }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { margin-left: 0 !important; }
          .mobile-ham { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
