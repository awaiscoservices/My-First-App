import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'
const fmt = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })

const EMPTY_FORM = { name: '', type: 'bank_transfer', icon: '', description: '', instructions: '', account_details: '', min_deposit_cents: '', max_deposit_cents: '', default_bonus_pct: '0', is_active: true, is_auto: false, requires_proof: false, requires_reference: false, sort_order: '0' }
const TYPES = ['bank_transfer', 'crypto', 'cashapp', 'venmo', 'zelle', 'paypal', 'other']

export default function AdminPayments() {
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | row obj
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setToken(session?.access_token); fetchMethods(session?.access_token) })
  }, [])

  const fetchMethods = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/admin/payments/list', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setMethods(d.rows || []) }
    setLoading(false)
  }

  const openAdd = () => { setForm(EMPTY_FORM); setMsg(''); setModal('add') }
  const openEdit = (row) => {
    setForm({
      id: row.id, name: row.name || '', type: row.type || 'bank_transfer', icon: row.icon || '',
      description: row.description || '', instructions: row.instructions || '', account_details: row.account_details || '',
      min_deposit_cents: row.min_deposit_cents ? String(row.min_deposit_cents / 100) : '',
      max_deposit_cents: row.max_deposit_cents ? String(row.max_deposit_cents / 100) : '',
      default_bonus_pct: String(row.default_bonus_pct || 0), is_active: row.is_active ?? true,
      is_auto: row.is_auto ?? false, requires_proof: row.requires_proof ?? false,
      requires_reference: row.requires_reference ?? false, sort_order: String(row.sort_order || 0),
    })
    setMsg(''); setModal(row)
  }

  const save = async () => {
    if (!form.name.trim()) { setMsg('Name is required'); return }
    setSaving(true); setMsg('')
    const payload = {
      ...form,
      min_deposit_cents: form.min_deposit_cents ? Math.round(parseFloat(form.min_deposit_cents) * 100) : null,
      max_deposit_cents: form.max_deposit_cents ? Math.round(parseFloat(form.max_deposit_cents) * 100) : null,
      default_bonus_pct: parseFloat(form.default_bonus_pct) || 0,
      sort_order: parseInt(form.sort_order) || 0,
    }
    const res = await fetch('/api/admin/payments/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setModal(null); fetchMethods() }
    else setMsg(d.error || 'Failed')
  }

  const F = ({ label, fkey, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>{label}</label>
      <input type={type} value={form[fkey]} onChange={e => setForm(p => ({ ...p, [fkey]: e.target.value }))} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
    </div>
  )

  const Toggle = ({ label, fkey }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <div onClick={() => setForm(p => ({ ...p, [fkey]: !p[fkey] }))} style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative', background: form[fkey] ? gold : 'rgba(255,255,255,0.12)', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: form[fkey] ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </div>
  )

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>💳 Deposit Methods</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Configure how players can deposit funds.</p>
          </div>
          <button onClick={openAdd} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Add Method</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : methods.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No deposit methods yet. Add one above.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {methods.map(m => (
              <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${m.is_active ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: 18, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{m.icon} {m.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase' }}>{m.type}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: m.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: m.is_active ? green : 'rgba(255,255,255,0.3)', border: `1px solid ${m.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {m.description && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 10px', lineHeight: 1.4 }}>{m.description}</p>}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                  {m.min_deposit_cents && <span>Min: {fmt(m.min_deposit_cents)}</span>}
                  {m.max_deposit_cents && <span>Max: {fmt(m.max_deposit_cents)}</span>}
                  {m.default_bonus_pct > 0 && <span style={{ color: green }}>+{m.default_bonus_pct}% bonus</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {m.is_auto && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>Auto</span>}
                  {m.requires_proof && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}>Needs Proof</span>}
                  {m.requires_reference && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>Needs Ref</span>}
                </div>
                <button onClick={() => openEdit(m)} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Edit</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 500, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Outfit, sans-serif' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, margin: '0 0 20px' }}>{modal === 'add' ? 'Add Deposit Method' : `Edit: ${form.name}`}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div style={{ gridColumn: '1 / -1' }}><F label="Name *" fkey="name" placeholder="e.g. Cash App" /></div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', marginBottom: 14 }}>
                  {TYPES.map(t => <option key={t} value={t} style={{ background: '#0d0a1a' }}>{t}</option>)}
                </select>
              </div>
              <F label="Icon (emoji)" fkey="icon" placeholder="💳" />
              <F label="Min Deposit ($)" fkey="min_deposit_cents" type="number" placeholder="5.00" />
              <F label="Max Deposit ($)" fkey="max_deposit_cents" type="number" placeholder="5000.00" />
              <F label="Bonus %" fkey="default_bonus_pct" type="number" placeholder="0" />
              <F label="Sort Order" fkey="sort_order" type="number" placeholder="0" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Short player-facing description…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>Instructions (shown to player)</label>
              <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={3} placeholder="Step-by-step deposit instructions…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>Account Details (shown to player)</label>
              <textarea value={form.account_details} onChange={e => setForm(p => ({ ...p, account_details: e.target.value }))} rows={2} placeholder="e.g. $casinoze on CashApp"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Toggle label="Active (visible to players)" fkey="is_active" />
              <Toggle label="Auto-approve deposits" fkey="is_auto" />
              <Toggle label="Requires proof of payment" fkey="requires_proof" />
              <Toggle label="Requires reference number" fkey="requires_reference" />
            </div>

            {msg && <div style={{ color: red, fontSize: 12, marginBottom: 12 }}>⚠ {msg}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>{saving ? 'Saving…' : 'Save Method'}</button>
              <button onClick={() => setModal(null)} style={{ padding: '11px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
