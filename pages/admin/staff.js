import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/ui/StatusBadge'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const ROLES = ['super_admin', 'finance', 'game_ops', 'support', 'kyc_agent', 'risk', 'reporting', 'marketing']

function StaffModal({ member, onClose, onSave }) {
  const isNew = !member
  const [form, setForm] = useState({
    email: member?.email || '',
    full_name: member?.full_name || '',
    role: member?.role || 'support',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!form.email.trim() || !form.full_name.trim()) { setError('Email and name are required'); return }
    setSaving(true); setError('')
    const result = await onSave(member?.id, form)
    if (result?.error) { setError(result.error); setSaving(false) }
    else onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0e1a2e', border: '1px solid rgba(251,191,36,.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>{isNew ? 'Invite Staff' : 'Edit Staff'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[{ key: 'full_name', label: 'Full Name', placeholder: 'Staff member name', type: 'text' }, { key: 'email', label: 'Email', placeholder: 'staff@casinoze.com', type: 'email' }].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} disabled={!isNew && f.key === 'email'}
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', boxSizing: 'border-box', opacity: !isNew && f.key === 'email' ? 0.5 : 1 }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none' }}>
              {ROLES.map(r => <option key={r} value={r} style={{ background: '#0e1a2e' }}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>⚠ {error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', borderRadius: 10, color: '#050505', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>{saving ? 'Saving…' : isNew ? 'Send Invite' : 'Save Changes'}</button>
          <button onClick={onClose} style={{ padding: '11px 16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminStaff() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(undefined)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [filter])

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  async function load() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params = new URLSearchParams({ role: filter !== 'all' ? filter : '', limit: '100' })
      const res = await fetch(`/api/admin/staff/list?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const d = await res.json()
      setRows(d.rows || d.staff || [])
    } catch (e) { console.error('Failed to load staff', e); setRows([]) }
    setLoading(false)
  }

  async function handleSave(id, form) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/staff/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(id ? { staff_id: id, ...form } : form),
    })
    const d = await res.json()
    if (!res.ok) return { error: d.error }
    showToast(id ? 'Staff updated' : 'Invite sent')
    load()
    return {}
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.full_name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || r.role?.toLowerCase().includes(s)
  })

  return (
    <AdminLayout>
      <Head><title>Staff — Admin</title></Head>
      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,.95)' : 'rgba(34,197,94,.95)', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>{toast.msg}</div>}
      {selected !== undefined && <StaffModal member={selected || null} onClose={() => setSelected(undefined)} onSave={handleSave} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Staff</h1>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>Manage admin team members and roles</p>
        </div>
        <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', borderRadius: 10, color: '#050505', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>+ Invite Staff</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', padding: 4, borderRadius: 10, flexWrap: 'wrap' }}>
          {['all', ...ROLES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700, background: filter === s ? 'rgba(251,191,36,.7)' : 'transparent', color: filter === s ? '#fff' : 'rgba(255,255,255,.4)', textTransform: 'capitalize', transition: 'all .15s' }}>{s.replace(/_/g, ' ')}</button>
          ))}
        </div>
        <input type="text" placeholder="Search name, email, role…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', minWidth: 220 }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>No staff found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.full_name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{r.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: 'rgba(168,85,247,.15)', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '.04em' }}>{r.role?.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={r.status || 'active'} size="xs" /></td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
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
