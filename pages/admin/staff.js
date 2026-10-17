import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'
const ROLES = ['super_admin', 'finance', 'game_ops', 'support', 'kyc_agent', 'risk', 'reporting', 'marketing']
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }

export default function AdminStaff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', role: 'support' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [tempPwd, setTempPwd] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setToken(session?.access_token); fetchStaff(session?.access_token) })
  }, [])

  const fetchStaff = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/admin/staff/list', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setStaff(d.rows || []) }
    setLoading(false)
  }

  const invite = async () => {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/staff/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'invite', ...form }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setTempPwd(d.temp_password); setShowInvite(false); setForm({ email: '', full_name: '', role: 'support' }); fetchStaff() }
    else setMsg(d.error || 'Failed')
  }

  const changeRole = async (id, role) => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/admin/staff/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'update_role', staff_id: id, role }),
    })
    fetchStaff()
  }

  const deactivate = async (id) => {
    if (!confirm('Deactivate this staff member?')) return
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/admin/staff/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'deactivate', staff_id: id }),
    })
    fetchStaff()
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>👥 Staff Management</h1>
          <button onClick={() => setShowInvite(true)} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Invite Staff</button>
        </div>

        {tempPwd && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: green, fontSize: 13, margin: 0 }}>✅ Staff invited! Temporary password: <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{tempPwd}</strong> — share this securely.</p>
            <button onClick={() => setTempPwd(null)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>Dismiss</button>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div> : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Joined', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.full_name}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{s.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={s.role} onChange={e => changeRole(s.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: gold, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', outline: 'none' }}>
                        {ROLES.map(r => <option key={r} value={r} style={{ background: '#0d0a1a' }}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}><StatusPill status={s.status} /></td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)' }}>{fmtDate(s.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.status !== 'suspended' && (
                        <button onClick={() => deactivate(s.id)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: red, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showInvite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowInvite(false)}>
            <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: gold, fontFamily: 'Outfit, sans-serif', marginBottom: 20 }}>Invite Staff Member</h3>
              {[{ label: 'Email *', key: 'email', type: 'email' }, { label: 'Full Name', key: 'full_name', type: 'text' }].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
                </div>
              ))}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>Role *</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }}>
                  {ROLES.filter(r => r !== 'super_admin').map(r => <option key={r} value={r} style={{ background: '#0d0a1a' }}>{r}</option>)}
                </select>
              </div>
              {msg && <p style={{ color: red, fontSize: 12, marginBottom: 12 }}>{msg}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={invite} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>{saving ? 'Inviting…' : 'Send Invite'}</button>
                <button onClick={() => setShowInvite(false)} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
