import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/ui/StatusBadge'

const fmt = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

function AdjustModal({ wallet, onClose, onSave }) {
  const [type, setType] = useState('credit')
  const [amount, setAmount] = useState('')
  const [bucket, setBucket] = useState('cash')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    const cents = Math.round(parseFloat(amount) * 100)
    if (!cents || cents <= 0) { setError('Enter a valid amount'); return }
    if (!reason.trim()) { setError('Reason is required for audit'); return }
    setSaving(true); setError('')
    const result = await onSave(wallet.user_id, { type, amount_cents: cents, bucket, reason })
    if (result?.error) { setError(result.error); setSaving(false) }
    else onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0e1a2e', border: '1px solid rgba(251,191,36,.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Wallet Adjustment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{wallet.profiles?.full_name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{wallet.profiles?.email}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>CASH</div><div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{fmt(wallet.balance_cents || 0)}</div></div>
            <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>BONUS</div><div style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{fmt(wallet.bonus_cents || 0)}</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['credit', 'debit'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${type === t ? (t === 'credit' ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,.1)'}`, background: type === t ? (t === 'credit' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)') : 'transparent', color: type === t ? (t === 'credit' ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,.35)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '.05em' }}>{t === 'credit' ? '+ Credit' : '− Debit'}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['cash', 'bonus'].map(b => (
            <button key={b} onClick={() => setBucket(b)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${bucket === b ? '#fbbf24' : 'rgba(255,255,255,.1)'}`, background: bucket === b ? 'rgba(251,191,36,.1)' : 'transparent', color: bucket === b ? '#fbbf24' : 'rgba(255,255,255,.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", textTransform: 'capitalize' }}>{b}</button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Amount (USD)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 18, fontWeight: 700 }}>$</span>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',sans-serif", outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Reason <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Required — audit log entry…"
            style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
        </div>

        {error && <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>⚠ {error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '11px', background: type === 'credit' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>{saving ? 'Saving…' : `Apply ${type === 'credit' ? 'Credit' : 'Debit'}`}</button>
          <button onClick={onClose} style={{ padding: '11px 16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminWallets() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  async function load() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params = new URLSearchParams({ limit: '100' })
      const res = await fetch(`/api/admin/wallets/list?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const d = await res.json()
      setRows(d.rows || [])
    } catch (e) { console.error('Failed to load wallets', e); setRows([]) }
    setLoading(false)
  }

  async function handleSave(userId, body) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/wallets/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id: userId, ...body }),
    })
    const d = await res.json()
    if (!res.ok) return { error: d.error }
    showToast('Wallet adjusted')
    load()
    return {}
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.profiles?.full_name?.toLowerCase().includes(s) || r.profiles?.email?.toLowerCase().includes(s)
  })

  return (
    <AdminLayout>
      <Head><title>Wallets — Admin</title></Head>
      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,.95)' : 'rgba(34,197,94,.95)', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>{toast.msg}</div>}
      {selected && <AdjustModal wallet={selected} onClose={() => setSelected(null)} onSave={handleSave} />}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Wallets</h1>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>View player balances and apply manual adjustments</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search player or email…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', minWidth: 280 }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {['Player', 'Cash Balance', 'Bonus Balance', 'Total', 'Status', 'Updated', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>No wallets found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.profiles?.full_name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{r.profiles?.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{fmt(r.balance_cents || 0)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{fmt(r.bonus_cents || 0)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{fmt((r.balance_cents || 0) + (r.bonus_cents || 0))}</td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={r.profiles?.status || 'active'} size="xs" /></td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{fmtDate(r.updated_at)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setSelected(r)} style={{ padding: '6px 14px', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 8, color: '#fbbf24', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
