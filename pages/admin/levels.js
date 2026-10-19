import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

const fmt = c => c != null ? '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'

function LevelModal({ level, onClose, onSave }) {
  const isNew = !level
  const [form, setForm] = useState({
    name: level?.name || '',
    rank: level?.rank || '',
    min_wager_cents: level?.min_wager_cents ? (level.min_wager_cents / 100).toFixed(2) : '',
    cashback_percent: level?.cashback_percent || '',
    weekly_bonus_cents: level?.weekly_bonus_cents ? (level.weekly_bonus_cents / 100).toFixed(2) : '',
    monthly_bonus_cents: level?.monthly_bonus_cents ? (level.monthly_bonus_cents / 100).toFixed(2) : '',
    withdrawal_limit_cents: level?.withdrawal_limit_cents ? (level.withdrawal_limit_cents / 100).toFixed(2) : '',
    accent_color: level?.accent_color || '#fbbf24',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!form.name.trim()) { setError('Level name is required'); return }
    if (!form.rank) { setError('Rank is required'); return }
    setSaving(true); setError('')
    const body = {
      ...form,
      rank: parseInt(form.rank),
      min_wager_cents: form.min_wager_cents ? Math.round(parseFloat(form.min_wager_cents) * 100) : 0,
      cashback_percent: form.cashback_percent ? parseFloat(form.cashback_percent) : 0,
      weekly_bonus_cents: form.weekly_bonus_cents ? Math.round(parseFloat(form.weekly_bonus_cents) * 100) : 0,
      monthly_bonus_cents: form.monthly_bonus_cents ? Math.round(parseFloat(form.monthly_bonus_cents) * 100) : 0,
      withdrawal_limit_cents: form.withdrawal_limit_cents ? Math.round(parseFloat(form.withdrawal_limit_cents) * 100) : null,
    }
    const result = await onSave(level?.id, body)
    if (result?.error) { setError(result.error); setSaving(false) }
    else onClose()
  }

  const fields = [
    { key: 'name', label: 'Level Name', placeholder: 'e.g. Gold', type: 'text', col: '1/-1' },
    { key: 'rank', label: 'Rank (Order)', placeholder: '1', type: 'number', col: null },
    { key: 'cashback_percent', label: 'Cashback %', placeholder: '5', type: 'number', col: null },
    { key: 'min_wager_cents', label: 'Min Wager ($)', placeholder: '1000.00', type: 'number', col: null },
    { key: 'withdrawal_limit_cents', label: 'Withdrawal Limit ($)', placeholder: '10000.00', type: 'number', col: null },
    { key: 'weekly_bonus_cents', label: 'Weekly Bonus ($)', placeholder: '50.00', type: 'number', col: null },
    { key: 'monthly_bonus_cents', label: 'Monthly Bonus ($)', placeholder: '200.00', type: 'number', col: null },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0e1a2e', border: '1px solid rgba(251,191,36,.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>{isNew ? 'Create Level' : 'Edit Level'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {fields.map(f => (
            <div key={f.key} style={{ gridColumn: f.col || 'auto' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} min="0" step={f.type === 'number' && f.key !== 'rank' && f.key !== 'cashback_percent' ? '0.01' : '1'}
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Accent Color</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={form.accent_color} onChange={e => setForm(p => ({ ...p, accent_color: e.target.value }))} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'none', cursor: 'pointer', padding: 4 }} />
              <span style={{ fontSize: 13, color: '#fff', fontFamily: 'monospace' }}>{form.accent_color}</span>
            </div>
          </div>
        </div>
        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>⚠ {error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', borderRadius: 10, color: '#050505', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>{saving ? 'Saving…' : isNew ? 'Create Level' : 'Save'}</button>
          <button onClick={onClose} style={{ padding: '11px 16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLevels() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(undefined)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  async function load() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/levels/list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const d = await res.json()
      setRows(d.rows || d.levels || [])
    } catch (e) { console.error('Failed to load levels', e); setRows([]) }
    setLoading(false)
  }

  async function handleSave(id, form) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/levels/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(id ? { level_id: id, ...form } : form),
    })
    const d = await res.json()
    if (!res.ok) return { error: d.error }
    showToast(id ? 'Level updated' : 'Level created')
    load()
    return {}
  }

  const filtered = rows.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <Head><title>VIP Levels — Admin</title></Head>
      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,.95)' : 'rgba(34,197,94,.95)', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>{toast.msg}</div>}
      {selected !== undefined && <LevelModal level={selected || null} onClose={() => setSelected(undefined)} onSave={handleSave} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>VIP Levels</h1>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>Configure player tier benefits and thresholds</p>
        </div>
        <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', borderRadius: 10, color: '#050505', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>+ Create Level</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input type="text" placeholder="Search level…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', minWidth: 220 }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {['Rank', 'Level', 'Min Wager', 'Cashback', 'Weekly Bonus', 'Monthly Bonus', 'Withdrawal Limit', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>No levels found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.4)' }}>#{r.rank}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.accent_color || '#fbbf24', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>{fmt(r.min_wager_cents)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#22c55e', fontWeight: 700 }}>{r.cashback_percent ? r.cashback_percent + '%' : '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{fmt(r.weekly_bonus_cents)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{fmt(r.monthly_bonus_cents)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{r.withdrawal_limit_cents ? fmt(r.withdrawal_limit_cents) : 'Unlimited'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setSelected(r)} style={{ padding: '6px 12px', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 8, color: '#fbbf24', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Edit</button>
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
