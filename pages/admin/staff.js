import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

const STAFF_ROLES = ['super_admin', 'finance', 'game_ops', 'support', 'kyc_agent', 'risk', 'reporting', 'marketing']

export default function StaffAdmin() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', role: 'support' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .in('role', STAFF_ROLES)
      .order('created_at', { ascending: false })
    setStaff(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function invite(e) {
    e.preventDefault(); setError(null); setSuccess(null)
    if (!form.email.trim() || !form.role) { setError('Email and role required'); return }
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/staff/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action: 'invite', email: form.email, role: form.role })
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error); return }
    setSuccess(`Invitation sent to ${form.email}`)
    setForm({ email: '', role: 'support' })
    load()
  }

  async function changeRole(target_user_id, role) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/staff/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action: 'update_role', target_user_id, role })
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error); return }
    load()
  }

  const inp = { background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', width: '100%' }

  return (
    <AdminLayout>
      <Head><title>Staff — Admin</title></Head>
      <div style={{ padding: '24px 32px', maxWidth: 900 }}>
        <h1 style={{ color: '#fbbf24', fontFamily: 'Cinzel, serif', fontSize: 26, marginBottom: 24 }}>Staff Management</h1>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Invite Staff Member</h2>
          <form onSubmit={invite} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} placeholder="staff@example.com" required />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', height: 44 }}>
              {saving ? 'Inviting…' : 'Send Invite'}
            </button>
          </form>
          {error && <div style={{ color: '#f87171', fontSize: 14, marginTop: 10 }}>{error}</div>}
          {success && <div style={{ color: '#86efac', fontSize: 14, marginTop: 10 }}>{success}</div>}
        </div>

        {loading ? <div style={{ color: '#94a3b8' }}>Loading…</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Name', 'Email', 'Role', 'Change Role'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: 600 }}>{s.full_name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{s.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#1e3a5f', color: '#93c5fd', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{s.role}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select defaultValue={s.role} onChange={e => changeRole(s.id, e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#f1f5f9', fontSize: 13 }}>
                        {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.length === 0 && <div style={{ color: '#64748b', padding: 20 }}>No staff members yet.</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
