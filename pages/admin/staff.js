import { useEffect, useState, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import { STAFF_ROLES } from '../../lib/adminSchemas'

const G = '#fbbf24'
const input = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }
const btn = (primary) => ({ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', border: primary ? 'none' : '1px solid rgba(251,191,36,.4)', background: primary ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'transparent', color: primary ? '#050505' : G })
const label = r => r.replace('_', ' ')
const ROLE_HELP = { super_admin: 'Everything', finance: 'Deposits, withdrawals, wallets', game_ops: 'Game accounts, loads, redemptions', support: 'Tickets, players', kyc_agent: 'Identity checks', risk: 'KYC and risk', reporting: 'Read-only reports', marketing: 'Promotions, levels' }

export default function Staff() {
  const [rows, setRows] = useState([])
  const [me, setMe] = useState(null)
  const [msg, setMsg] = useState(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('support')
  const [pick, setPick] = useState({})
  const [busy, setBusy] = useState(false)

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token
  const load = useCallback(async () => {
    const res = await fetch('/api/admin/staff', { headers: { Authorization: `Bearer ${await token()}` } })
    const j = await res.json()
    if (!res.ok) return setMsg({ ok: false, t: j.error })
    setRows(j.rows || []); setMe(j.me)
  }, [])
  useEffect(() => { load() }, [load])

  async function change(body, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` }, body: JSON.stringify(body) })
    const j = await res.json(); setBusy(false)
    setMsg({ ok: res.ok, t: j.message || j.error })
    if (res.ok) { setEmail(''); setPick({}); load() }
  }

  return (
    <AdminLayout>
      <Head><title>Staff & Roles — Admin</title></Head>
      <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, marginBottom: 4 }}>Staff & Roles</h1>
      <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, marginBottom: 18 }}>Choose who can use the admin panel and what they can do. The person must have registered on the site first.</p>
      {msg && <div style={{ background: msg.ok ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.1)', border: `1px solid ${msg.ok ? 'rgba(16,185,129,.35)' : 'rgba(239,68,68,.3)'}`, color: msg.ok ? '#10b981' : '#f87171', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{msg.ok ? '✓ ' : ''}{msg.t}</div>}

      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 16, padding: 18, marginBottom: 18 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>＋ Add a staff member</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Their account email" style={{ ...input, flex: '1 1 240px' }} />
          <select value={role} onChange={e => setRole(e.target.value)} style={input}>{STAFF_ROLES.map(r => <option key={r} value={r}>{label(r)} — {ROLE_HELP[r]}</option>)}</select>
          <button disabled={busy || !email.trim()} style={{ ...btn(true), opacity: busy || !email.trim() ? .45 : 1 }} onClick={() => change({ email, role }, role === 'super_admin' ? 'Super admins can do EVERYTHING, including moving money and changing other staff. Continue?' : null)}>Add</button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(251,191,36,.14)', borderRadius: 16, overflow: 'hidden' }}>
        {rows.map((r, i) => {
          const chosen = pick[r.id] || r.role, isMe = r.id === me
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 18px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{r.name || 'Unnamed'} {isMe && <span style={{ color: G, fontSize: 11, fontWeight: 800 }}>(you)</span>}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', wordBreak: 'break-all' }}>{r.email}</div>
              </div>
              <select disabled={isMe} value={chosen} onChange={e => setPick({ ...pick, [r.id]: e.target.value })} style={{ ...input, opacity: isMe ? .5 : 1 }}>{STAFF_ROLES.map(x => <option key={x} value={x}>{label(x)}</option>)}</select>
              <button disabled={isMe || busy || chosen === r.role} style={{ ...btn(true), opacity: isMe || chosen === r.role ? .4 : 1 }}
                onClick={() => change({ user_id: r.id, role: chosen }, chosen === 'super_admin' ? 'Make this person a super admin? They will be able to do everything.' : null)}>Save</button>
              <button disabled={isMe || busy} style={{ ...btn(false), color: '#f87171', borderColor: 'rgba(239,68,68,.35)', opacity: isMe ? .4 : 1 }}
                onClick={() => change({ user_id: r.id, role: 'player' }, `Remove all staff access for ${r.name || r.email}?`)}>Remove access</button>
            </div>
          )
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>Loading…</div>}
      </div>
    </AdminLayout>
  )
}
