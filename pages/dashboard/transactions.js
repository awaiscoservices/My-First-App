import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const purple = '#a855f7'; const blue = '#3b82f6'

const fmt = (cents) => '$' + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const TYPE_META = {
  deposit:          { label: 'Deposit',       icon: '⬇️',  color: green },
  game_load:        { label: 'Game Load',     icon: '🎮',  color: purple },
  game_load_return: { label: 'Load Return',   icon: '↩️',  color: blue },
  redemption:       { label: 'Redeem',        icon: '💰',  color: gold },
  withdrawal:       { label: 'Withdrawal',    icon: '⬆️',  color: red },
  withdrawal_hold:  { label: 'Withdrawal',    icon: '⬆️',  color: red },
  adjustment:       { label: 'Adjustment',    icon: '⚙️',  color: 'rgba(255,255,255,0.5)' },
  bonus:            { label: 'Bonus',         icon: '🎁',  color: gold },
  referral:         { label: 'Referral',      icon: '👥',  color: green },
}

const STATUS_STYLE = {
  pending:   { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  color: gold,   label: 'Pending' },
  approved:  { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: green,  label: 'Approved' },
  completed: { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: green,  label: 'Completed' },
  rejected:  { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: red,    label: 'Rejected' },
  failed:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: red,    label: 'Failed' },
  cancelled: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', label: 'Cancelled' },
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'loads', label: 'Game Loads' },
  { key: 'redemptions', label: 'Redemptions' },
]

export default function TransactionsPage() {
  const [tab, setTab] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setToken(session.access_token)
      await fetchData(session.access_token)
    }
    init()
  }, [])

  const fetchData = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/player/transactions', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) { const d = await res.json(); setData(d) }
    setLoading(false)
  }

  const pendingCount = data
    ? (data.pending.deposits.length + data.pending.withdrawals.length + data.pending.loads.length + data.pending.redemptions.length)
    : 0

  // Build unified list per tab
  const getRows = () => {
    if (!data) return []
    const { deposits, withdrawals, loads, redemptions } = data.recent
    if (tab === 'deposits') return deposits.map(d => ({ ...d, _type: 'deposit', _amount: d.amount_cents, _desc: d.payment_method_name || 'Deposit', _dir: 'credit' }))
    if (tab === 'withdrawals') return withdrawals.map(w => ({ ...w, _type: 'withdrawal', _amount: w.amount_cents, _desc: w.payout_method_label || w.payout_method_type || 'Withdrawal', _dir: 'debit' }))
    if (tab === 'loads') return loads.map(l => ({ ...l, _type: 'game_load', _amount: l.amount_cents, _desc: l.game_panel_name || 'Game Load', _dir: 'debit' }))
    if (tab === 'redemptions') return redemptions.map(r => ({ ...r, _type: 'redemption', _amount: r.amount_cents, _desc: r.game_panel_name || 'Redemption', _dir: 'credit' }))
    // All: merge and sort by date
    const all = [
      ...deposits.map(d => ({ ...d, _type: 'deposit', _amount: d.amount_cents, _desc: d.payment_method_name || 'Deposit', _dir: 'credit' })),
      ...withdrawals.map(w => ({ ...w, _type: 'withdrawal', _amount: w.amount_cents, _desc: w.payout_method_label || w.payout_method_type || 'Withdrawal', _dir: 'debit' })),
      ...loads.map(l => ({ ...l, _type: 'game_load', _amount: l.amount_cents, _desc: l.game_panel_name || 'Game Load', _dir: 'debit' })),
      ...redemptions.map(r => ({ ...r, _type: 'redemption', _amount: r.amount_cents, _desc: r.game_panel_name || 'Redemption', _dir: 'credit' })),
    ]
    return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  const rows = getRows()

  return (
    <DashboardLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>📋 My Transactions</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Track all your deposits, withdrawals, game loads and redemptions.</p>
          </div>
          <button onClick={() => fetchData(token)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>↻ Refresh</button>
        </div>

        {/* Pending alerts */}
        {!loading && pendingCount > 0 && (
          <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: gold, fontSize: 13, margin: '0 0 10px', fontWeight: 600 }}>⏳ {pendingCount} Pending Request{pendingCount > 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.pending.deposits.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <span>⬇️ Deposit — {d.reference_id}</span>
                  <span style={{ color: green, fontWeight: 600 }}>{fmt(d.amount_cents)}</span>
                </div>
              ))}
              {data.pending.withdrawals.map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <span>⬆️ Withdrawal — {w.reference_id}</span>
                  <span style={{ color: red, fontWeight: 600 }}>−{fmt(w.amount_cents)}</span>
                </div>
              ))}
              {data.pending.loads.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <span>🎮 Load — {l.reference_id}</span>
                  <span style={{ color: purple, fontWeight: 600 }}>−{fmt(l.amount_cents)}</span>
                </div>
              ))}
              {data.pending.redemptions.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <span>💰 Redeem — {r.reference_id}</span>
                  <span style={{ color: gold, fontWeight: 600 }}>{fmt(r.amount_cents)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 16px', border: 'none', borderBottom: `2px solid ${tab === t.key ? gold : 'transparent'}`, background: 'none', color: tab === t.key ? gold : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'color 0.15s', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14 }}>No transactions yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((row) => {
              const meta = TYPE_META[row._type] || { label: row._type, icon: '•', color: 'rgba(255,255,255,0.5)' }
              const isCredit = row._dir === 'credit'
              return (
                <div key={`${row._type}-${row.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', gap: 12 }}>
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{meta.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row._desc} · {fmtDate(row.created_at)}
                    </div>
                    {row.reference_id && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: 2 }}>{row.reference_id}</div>
                    )}
                  </div>
                  {/* Status */}
                  <div style={{ flexShrink: 0 }}>
                    <StatusPill status={row.status} />
                  </div>
                  {/* Amount */}
                  <div style={{ fontSize: 16, fontWeight: 700, color: isCredit ? green : red, flexShrink: 0, textAlign: 'right', minWidth: 80 }}>
                    {isCredit ? '+' : '−'}{fmt(row._amount)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
