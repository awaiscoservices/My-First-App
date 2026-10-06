import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import StatusBadge from '../../components/ui/StatusBadge'
import { getMyTransactions, getMyPendingCounts, getMyGameAccounts, txTypeLabel, txTypeColor } from '../../lib/wallet'

// ─── QUICK ACTION CARD ──────────────────────────────────────
function QuickAction({ href, icon, label, desc, color }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{
        padding: '20px', borderRadius: 16,
        background: hov ? `linear-gradient(135deg,${color}22,${color}08)` : 'rgba(255,255,255,.03)',
        border: `1px solid ${hov ? color + '66' : 'rgba(255,255,255,.07)'}`,
        transition: 'all .2s', transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 12px 40px rgba(0,0,0,.4), 0 0 20px ${color}22` : 'none',
        cursor: 'pointer',
      }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </Link>
  )
}

// ─── WALLET BALANCE CARD ────────────────────────────────────
function WalletCard({ label, cents, color, icon, sub }) {
  return (
    <div style={{
      padding: '22px', borderRadius: 16,
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.07)',
      flex: 1, minWidth: 140,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <MoneyDisplay cents={cents} size="xl" color={color} />
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ─── PENDING BADGE ──────────────────────────────────────────
function PendingCard({ label, count, href, color }) {
  if (!count) return null
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: `${color}12`, border: `1px solid ${color}33`, marginBottom: 8, transition: 'all .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}20`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}12`}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{label}</span>
      <span style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99 }}>{count} pending</span>
    </Link>
  )
}

// ─── MAIN PAGE ──────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [gameAccounts, setGameAccounts] = useState([])
  const [pending, setPending] = useState({ deposits: 0, loads: 0, redeems: 0, withdrawals: 0 })
  const [level, setLevel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [panels, setPanels] = useState([])
  useEffect(() => { supabase.from('game_panels').select('id,name,logo_url,accent_color,default_bonus_pct').eq('is_active', true).order('sort_order').then(({ data }) => setPanels(data || [])) }, [])

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)

    try {
      const [
        { data: prof },
        { data: wal },
        txs,
        accounts,
        counts,
      ] = await Promise.all([
        supabase.from('profiles').select('*, kyc_records(status)').eq('id', u.id).single(),
        supabase.from('wallets').select('*').eq('user_id', u.id).single(),
        getMyTransactions(u.id, { limit: 8 }),
        getMyGameAccounts(u.id),
        getMyPendingCounts(u.id),
      ])

      setProfile(prof)
      setWallet(wal)
      setTransactions(txs || [])
      setGameAccounts(accounts || [])
      setPending(counts)

      // Load player level
      if (prof?.player_level_id) {
        const { data: lvl } = await supabase
          .from('player_levels')
          .select('*')
          .eq('id', prof.player_level_id)
          .single()
        setLevel(lvl)
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPending = pending.deposits + pending.loads + pending.redeems + pending.withdrawals

  if (loading) return (
    <PlayerLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Loading your dashboard…</div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PlayerLayout>
  )

  return (
    <PlayerLayout>
      <Head><title>Dashboard — Casinoze Room</title></Head>

      {/* ── WELCOME ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Player'} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── KYC BANNER ── */}
      {profile?.kyc_status === 'not_started' && (
        <Link href="/dashboard/kyc" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Verify Your Identity</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Complete KYC to unlock withdrawals and higher limits</div>
              </div>
            </div>
            <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>Verify Now →</span>
          </div>
        </Link>
      )}

      {/* ── WALLET BALANCES ── */}
      {wallet && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>Your Wallet</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <WalletCard label="Cash Balance"   cents={wallet.cash_balance_cents}      color="#10b981" icon="💵" sub="Available to play or withdraw" />
            <WalletCard label="Bonus Balance"  cents={wallet.bonus_balance_cents}      color="#f59e0b" icon="🎁" sub="Bonus credits from promotions" />
            <WalletCard label="Reserved"       cents={wallet.reserved_cents}           color="#94a3b8" icon="🔒" sub="Held for pending requests" />
            <WalletCard label="Withdrawable"   cents={wallet.withdrawable_cents}       color="#fbbf24" icon="💸" sub="Available to withdraw" />
          </div>
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <QuickAction href="/dashboard/deposit"      icon="➕" label="Add Money"    desc="Deposit funds to your wallet"      color="#10b981" />
          <QuickAction href="/dashboard/load-game"    icon="🎮" label="Load Game"    desc="Send credits to a game room"       color="#fbbf24" />
          <QuickAction href="/dashboard/redeem"       icon="🏆" label="Redeem"       desc="Request a redemption from game"    color="#f59e0b" />
          <QuickAction href="/dashboard/withdraw"     icon="💸" label="Withdraw"     desc="Withdraw funds to your account"    color="#3b82f6" />
        </div>
      </div>

      {/* ── GAMES STRIP ── */}
      {panels.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>Our Games</span>
            <Link href="/dashboard/games" style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
            {panels.map(g => {
              const c = g.accent_color || '#fbbf24'
              return (
                <Link key={g.id} href="/dashboard/games" style={{ textDecoration: 'none', flex: '0 0 130px', borderRadius: 16, overflow: 'hidden', position: 'relative', background: `linear-gradient(160deg,${c}33,#0a0a0a)`, border: `1px solid ${c}44` }}>
                  {g.default_bonus_pct > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderBottomLeftRadius: 10 }}>{g.default_bonus_pct}%</span>}
                  <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    {g.logo_url ? <img src={g.logo_url} alt={g.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 36 }}>🎮</span>}
                  </div>
                  <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center', background: 'rgba(0,0,0,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PENDING REQUESTS ── */}
      {totalPending > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>
            Pending Requests <span style={{ background: '#fbbf24', color: '#000', fontSize: 9, padding: '2px 7px', borderRadius: 99, marginLeft: 6, fontWeight: 800 }}>{totalPending}</span>
          </div>
          <PendingCard label="Deposits"    count={pending.deposits}    href="/dashboard/deposit"      color="#10b981" />
          <PendingCard label="Game Loads"  count={pending.loads}       href="/dashboard/game-accounts" color="#fbbf24" />
          <PendingCard label="Redemptions" count={pending.redeems}     href="/dashboard/redeem"       color="#f59e0b" />
          <PendingCard label="Withdrawals" count={pending.withdrawals} href="/dashboard/withdraw"     color="#3b82f6" />
        </div>
      )}

      {/* ── GRID: transactions + level + games ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Recent Transactions */}
        <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Recent Transactions</span>
            <Link href="/dashboard/transactions" style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>No transactions yet</div>
              <Link href="/dashboard/deposit" style={{ display: 'inline-block', marginTop: 12, color: '#fbbf24', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Make your first deposit →</Link>
            </div>
          ) : (
            <div>
              {transactions.map((tx, i) => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: txTypeColor(tx.type) === '#10b981' ? 'rgba(16,185,129,.12)' : 'rgba(248,113,113,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                      {txTypeColor(tx.type) === '#10b981' ? '⬆️' : '⬇️'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{txTypeLabel(tx.type)}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: txTypeColor(tx.type) }}>
                      {tx.direction === 'credit' ? '+' : '-'}<MoneyDisplay cents={tx.amount_cents} size="sm" color={txTypeColor(tx.type)} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{tx.wallet_bucket}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Player Level */}
          {level && (
            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 14 }}>Your Level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${level.badge_color}22`, border: `2px solid ${level.badge_color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⭐</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: level.badge_color }}>{level.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{profile?.total_xp || 0} XP</div>
                </div>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: level.badge_color, borderRadius: 3, width: `${Math.min(100, ((profile?.total_xp || 0) / level.xp_required) * 100)}%`, transition: 'width .5s' }} />
              </div>
              <Link href="/dashboard/rewards" style={{ display: 'block', marginTop: 12, fontSize: 12, color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>View benefits →</Link>
            </div>
          )}

          {/* My Games */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>My Game Accounts</span>
              <Link href="/dashboard/games" style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>+ Add Game</Link>
            </div>
            {gameAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎮</div>
                <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, marginBottom: 10 }}>No game accounts yet</div>
                <Link href="/dashboard/games" style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>Browse Games →</Link>
              </div>
            ) : (
              gameAccounts.slice(0, 4).map(ga => (
                <div key={ga.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ga.game_panels?.accent_color || '#fbbf24'}22`, border: `1px solid ${ga.game_panels?.accent_color || '#fbbf24'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎮</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ga.game_panels?.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{ga.game_username || 'Pending setup'}</div>
                  </div>
                  <StatusBadge status={ga.status} size="xs" />
                </div>
              ))
            )}
          </div>

          {/* Quick KYC status */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>🔐 Verification</span>
              <StatusBadge status={profile?.kyc_status || 'not_started'} size="xs" />
            </div>
            {profile?.kyc_status !== 'verified' && (
              <Link href="/dashboard/kyc" style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>
                {profile?.kyc_status === 'not_started' ? 'Start verification →' : 'Check status →'}
              </Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PlayerLayout>
  )
}
