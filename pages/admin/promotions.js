import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'
function fmt(c) { return `$${((c || 0) / 100).toFixed(2)}` }

const EMPTY = { id: null, name: '', description: '', bonus_pct: 0, bonus_flat_cents: 0, min_deposit_cents: 0, max_bonus_cents: '', is_active: true, starts_at: '', ends_at: '' }

export default function AdminPromotions() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setToken(session?.access_token); fetchPromos(session?.access_token) })
  }, [])

  const fetchPromos = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/admin/promotions/list', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setPromos(d.rows || []) }
    setLoading(false)
  }

  const save = async () => {
    setSaving(true); setMsg('')
    const payload = {
      ...editing,
      bonus_pct: parseFloat(editing.bonus_pct) || 0,
      bonus_flat_cents: Math.round((parseFloat(editing.bonus_flat_cents) || 0) * 100),
      min_deposit_cents: Math.round((parseFloat(editing.min_deposit_cents) || 0) * 100),
      max_bonus_cents: editing.max_bonus_cents ? Math.round(parseFloat(editing.max_bonus_cents) * 100) : null,
    }
    const res = await fetch('/api/admin/promotions/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setEditing(null); fetchPromos() }
    else setMsg(d.error || 'Failed')
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>🎁 Promotions</h1>
          <button onClick={() => setEditing(EMPTY)} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ New Promo</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div> : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Name', 'Bonus %', 'Flat Bonus', 'Min Deposit', 'Max Bonus', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{p.description}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: gold }}>{p.bonus_pct > 0 ? `${p.bonus_pct}%` : '—'}</td>
                    <td style={{ padding: '12px 16px', color: green }}>{p.bonus_flat_cents > 0 ? fmt(p.bonus_flat_cents) : '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{fmt(p.min_deposit_cents)}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{p.max_bonus_cents ? fmt(p.max_bonus_cents) : '—'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusPill status={p.is_active ? 'active' : 'inactive'} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setEditing({ ...p, bonus_flat_cents: (p.bonus_flat_cents || 0) / 100, min_deposit_cents: (p.min_deposit_cents || 0) / 100, max_bonus_cents: p.max_bonus_cents ? p.max_bonus_cents / 100 : '' })}
                        style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: gold, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditing(null)}>
            <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: gold, fontFamily: 'Outfit, sans-serif', marginBottom: 20 }}>{editing.id ? 'Edit Promotion' : 'New Promotion'}</h3>
              {[
                { label: 'Name *', key: 'name', type: 'text' },
                { label: 'Description', key: 'description', type: 'text' },
                { label: 'Bonus % (e.g. 100 = 100%)', key: 'bonus_pct', type: 'number' },
                { label: 'Flat Bonus ($)', key: 'bonus_flat_cents', type: 'number' },
                { label: 'Min Deposit ($)', key: 'min_deposit_cents', type: 'number' },
                { label: 'Max Bonus Cap ($, blank = unlimited)', key: 'max_bonus_cents', type: 'number' },
                { label: 'Starts At', key: 'starts_at', type: 'datetime-local' },
                { label: 'Ends At', key: 'ends_at', type: 'datetime-local' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} value={editing[f.key] || ''} onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
                </div>
              ))}
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="promoActive" checked={!!editing.is_active} onChange={e => setEditing(p => ({ ...p, is_active: e.target.checked }))} />
                <label htmlFor="promoActive" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Active</label>
              </div>
              {msg && <p style={{ color: red, fontSize: 12, marginBottom: 12 }}>{msg}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditing(null)} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
