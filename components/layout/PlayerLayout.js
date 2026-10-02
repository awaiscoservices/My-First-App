import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import MoneyDisplay from '../ui/MoneyDisplay'

const NAV = [
  { href: '/dashboard',              icon: '⚡', label: 'Dashboard'      },
  { href: '/dashboard/games',        icon: '🎮', label: 'Games'          },
  { href: '/dashboard/game-accounts',icon: '🃏', label: 'My Games'       },
  { href: '/dashboard/wallet',       icon: '💎', label: 'Wallet'         },
  { href: '/dashboard/deposit',      icon: '➕', label: 'Add Money'      },
  { href: '/dashboard/transactions', icon: '📋', label: 'Transactions'   },
  { href: '/dashboard/redeem',       icon: '🏆', label: 'Redeem'         },
  { href: '/dashboard/withdraw',     icon: '💸', label: 'Withdraw'       },
  { href: '/dashboard/rewards',      icon: '⭐', label: 'Rewards & VIP'  },
  { href: '/dashboard/referrals',    icon: '👥', label: 'Referrals'      },
  { href: '/dashboard/kyc',          icon: '🔐', label: 'Verification'   },
  { href: '/dashboard/support',      icon: '💬', label: 'Support'        },
  { href: '/dashboard/profile',      icon: '👤', label: 'Profile'        },
]

export default function PlayerLayout({ children }) {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: prof }, { data: wal }, { count }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
    ])

    setProfile(prof)
    setWallet(wal)
    setUnread(count || 0)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href) => {
    if (href === '/dashboard') return router.pathname === '/dashboard'
    return router.pathname.startsWith(href)
  }

  const totalBalance = wallet
    ? (wallet.cash_balance_cents || 0) + (wallet.bonus_balance_cents || 0)
    : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#04000d', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'rgba(255,255,255,.02)',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform .25s',
      }}
        className="player-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎰</div>
            <div>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '.04em', lineHeight: 1.2 }}>CASINOZE</div>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 11, fontWeight: 900, color: '#f59e0b', letterSpacing: '.04em', lineHeight: 1.2 }}>ROOM</div>
            </div>
          </Link>
        </div>

        {/* Wallet summary */}
        {wallet && (
          <div style={{ margin: '12px 12px 4px', background: 'linear-gradient(135deg,rgba(168,85,247,.15),rgba(245,158,11,.08))', border: '1px solid rgba(168,85,247,.2)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Total Balance</div>
            <MoneyDisplay cents={totalBalance} size="xl" color="#fff" />
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Cash</div>
                <MoneyDisplay cents={wallet.cash_balance_cents} size="sm" color="#10b981" />
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)' }} />
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Bonus</div>
                <MoneyDisplay cents={wallet.bonus_balance_cents} size="sm" color="#f59e0b" />
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', scrollbarWidth: 'none' }}>
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                  textDecoration: 'none',
                  background: active ? 'linear-gradient(135deg,rgba(168,85,247,.2),rgba(168,85,247,.08))' : 'transparent',
                  border: active ? '1px solid rgba(168,85,247,.25)' : '1px solid transparent',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,.5)', flex: 1 }}>{item.label}</span>
                {item.label === 'Support' && unread > 0 && (
                  <span style={{ background: '#a855f7', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99 }}>{unread}</span>
                )}
                {active && <span style={{ width: 3, height: 16, background: '#a855f7', borderRadius: 2, flexShrink: 0 }} />}
              </Link>
            )
          })}
        </nav>

        {/* Profile + signout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,.03)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(profile.full_name || 'U')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name}</div>
                <div style={{ fontSize: 10, color: '#a855f7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Level {profile.player_level_id || 1}</div>
              </div>
            </div>
          )}
          <button onClick={handleSignOut} disabled={signingOut} style={{ width: '100%', padding: '9px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,.08)'}
          >
            {signingOut ? '⏳' : '🚪'} {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40 }} />
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="player-main">

        {/* Top bar */}
        <header style={{ height: 56, borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(4,0,13,.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30 }}>
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(p => !p)} className="mobile-hamburger" style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4 }}>☰</button>

          {/* Page title from router */}
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>
            {NAV.find(n => isActive(n.href))?.label || 'Dashboard'}
          </div>

          {/* Right: notifications + quick deposit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard/notifications" style={{ position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', fontSize: 16 }}>
              🔔
              {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#a855f7', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99 }}>{unread}</span>}
            </Link>
            <Link href="/dashboard/deposit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', borderRadius: 10, color: '#04000d', fontSize: 12, fontWeight: 800, textDecoration: 'none', letterSpacing: '.02em' }}>
              ➕ Add Money
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 28px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .player-sidebar {
            transform: translateX(-100%);
            z-index: 50;
          }
          .player-sidebar.open {
            transform: translateX(0) !important;
          }
          .player-main {
            margin-left: 0 !important;
          }
          .mobile-hamburger {
            display: flex !important;
          }
        }
        .player-sidebar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
