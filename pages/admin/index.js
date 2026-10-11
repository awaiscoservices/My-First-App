import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'
const green = '#22c55e'
const red = '#ef4444'
const purple = '#a855f7'
const blue = '#3b82f6'

function StatCard({ label, value, sub, color = gold, icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}22`,
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
    </div>
  )
}

// Inline bar chart — no external deps
function BarChart({ data, color = gold, height = 120 }) {
  if (!data?.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No data</div>
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div
            title={`${d.label}: ${d.display || d.value}`}
            style={{
              width: '100%',
              height: `${Math.max((d.value / max) * (height - 24), 2)}px`,
              background: `linear-gradient(to top, ${color}cc, ${color}66)`,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.5s ease',
              cursor: 'default',
            }}
          />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textAlign: 'center' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// Sparkline using inline SVG
function Sparkline({ values, color = gold, width = 200, height = 40 }) {
  if (!values?.length) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`${color}18`} stroke="none" />
    </svg>
  )
}

function fmt(cents) {
  return `$${((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtNum(n) {
  return Number(n || 0).toLocaleString()
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function last7Labels() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i); return DAYS[d.getDay()]
  })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setLoading(false); return }

    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {
      console.error('Analytics fetch error', e)
    }
    setLoading(false)
  }

  const s = stats || {}
  const labels7 = last7Labels()

  return (
    <AdminLayout>
      <Head><title>Dashboard — Casinoze Admin</title></Head>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: gold, margin: 0 }}>Platform Overview</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Live stats · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={fetchStats}
            style={{
              padding: '8px 18px',
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 8,
              color: gold,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            <div style={{
              width: 32, height: 32, border: `3px solid rgba(251,191,36,0.2)`,
              borderTopColor: gold, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading analytics…
          </div>
        ) : (
          <>
            {/* KPI Cards Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Players" value={fmtNum(s.total_players)} sub={`${fmtNum(s.new_players_today)} new today`} color={blue} />
              <StatCard icon="💰" label="Total Deposits" value={fmt(s.total_deposits_cents)} sub={`${fmtNum(s.deposits_count)} transactions`} color={green} />
              <StatCard icon="📤" label="Total Withdrawals" value={fmt(s.total_withdrawals_cents)} sub={`${fmtNum(s.withdrawals_count)} paid out`} color={red} />
              <StatCard icon="🎮" label="Active Game Accounts" value={fmtNum(s.active_game_accounts)} sub={`${fmtNum(s.pending_game_accounts)} pending`} color={purple} />
            </div>

            {/* KPI Cards Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <StatCard icon="⏳" label="Pending Deposits" value={fmtNum(s.pending_deposits)} sub="Awaiting approval" color={gold} />
              <StatCard icon="⏳" label="Pending Withdrawals" value={fmtNum(s.pending_withdrawals)} sub="Awaiting approval" color={gold} />
              <StatCard icon="🆔" label="KYC Pending" value={fmtNum(s.pending_kyc)} sub="Needs review" color={gold} />
              <StatCard icon="🎫" label="Open Tickets" value={fmtNum(s.open_tickets)} sub="Support queue" color={gold} />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Deposits last 7 days */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '20px 20px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: green, margin: 0 }}>Deposits — Last 7 Days</h3>
                  <span style={{ fontSize: 20, fontWeight: 700, color: green }}>{fmt(s.deposits_7d_cents)}</span>
                </div>
                <BarChart
                  color={green}
                  height={100}
                  data={(s.deposits_by_day || labels7.map(l => ({ label: l, value: 0 }))).map((d, i) => ({
                    ...d, label: labels7[i] || d.label,
                    display: fmt(d.value),
                  }))}
                />
              </div>

              {/* Withdrawals last 7 days */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '20px 20px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: red, margin: 0 }}>Withdrawals — Last 7 Days</h3>
                  <span style={{ fontSize: 20, fontWeight: 700, color: red }}>{fmt(s.withdrawals_7d_cents)}</span>
                </div>
                <BarChart
                  color={red}
                  height={100}
                  data={(s.withdrawals_by_day || labels7.map(l => ({ label: l, value: 0 }))).map((d, i) => ({
                    ...d, label: labels7[i] || d.label,
                    display: fmt(d.value),
                  }))}
                />
              </div>
            </div>

            {/* Player Growth Sparkline */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '20px 24px',
              marginBottom: 28,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: blue, margin: '0 0 4px' }}>New Player Signups — Last 14 Days</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Daily registrations trend</p>
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, color: blue }}>{fmtNum(s.new_players_14d)}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <Sparkline
                  values={(s.signups_by_day || Array(14).fill(0)).map(d => typeof d === 'object' ? d.value : d)}
                  color={blue}
                  width={Math.max(600, 600)}
                  height={60}
                />
              </div>
            </div>

            {/* Recent Activity Table */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: gold, margin: 0 }}>Recent Transactions</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Reference', 'Player', 'Type', 'Amount', 'Status', 'Time'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(s.recent_transactions || []).length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No transactions yet</td></tr>
                    ) : (s.recent_transactions || []).map((tx, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontSize: 11 }}>{tx.reference_id}</td>
                        <td style={{ padding: '12px 16px', color: '#fff' }}>{tx.player_name || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: tx.type === 'deposit' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: tx.type === 'deposit' ? green : red,
                          }}>
                            {tx.type?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: tx.type === 'deposit' ? green : red, fontWeight: 600 }}>
                          {tx.type === 'deposit' ? '+' : '-'}{fmt(tx.amount_cents)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                            background: tx.status === 'approved' ? 'rgba(34,197,94,0.1)' : tx.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                            color: tx.status === 'approved' ? green : tx.status === 'pending' ? gold : red,
                          }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                          {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
