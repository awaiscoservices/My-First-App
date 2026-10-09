import { useEffect, useState, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../layout/AdminLayout'
import { MANAGE } from '../../lib/adminSchemas'

const G = '#fbbf24'
const input = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }
const btn = (primary) => ({ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', border: primary ? 'none' : '1px solid rgba(251,191,36,.4)', background: primary ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'transparent', color: primary ? '#050505' : G })

// database value  <->  what the form shows / sends
const toInput = (f, v) => f.type === 'bool' ? !!v : v == null ? '' : f.type === 'usd' ? String(v / 100) : f.type === 'json' ? JSON.stringify(v, null, 2) : String(v)
const fromInput = (f, v) => {
  if (f.type === 'bool' || v === '') return v
  if (f.type === 'usd') { const n = parseFloat(v); return isNaN(n) ? v : Math.round(n * 100) }
  if (f.type === 'int' || f.type === 'pct') { const n = Number(v); return isNaN(n) ? v : n }
  return v
}

function Editor({ cfg, kind, row, onSaved, onCancel }) {
  const creating = !row
  const start = () => Object.fromEntries(cfg.fields.map(f => [f.key, toInput(f, row ? row[f.key] : f.type === 'bool' ? true : null)]))
  const [d, setD] = useState(start)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const dirty = creating || cfg.fields.some(f => d[f.key] !== toInput(f, row[f.key]))

  async function save() {
    setMsg(null); setBusy(true)
    const fields = {}
    for (const f of cfg.fields) if (creating || d[f.key] !== toInput(f, row[f.key])) fields[f.key] = fromInput(f, d[f.key])
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/admin/manage', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ kind, op: creating ? 'create' : 'update', id: row?.id, fields }) })
    const j = await res.json(); setBusy(false)
    if (!res.ok) return setMsg({ ok: false, t: j.error || 'Could not save' })
    setMsg({ ok: true, t: j.message }); onSaved()
  }

  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${creating ? 'rgba(251,191,36,.4)' : 'rgba(251,191,36,.14)'}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{creating ? '＋ Add new' : cfg.name(row)}</div>
        {!creating && 'is_active' in row && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: row.is_active ? 'rgba(16,185,129,.12)' : 'rgba(148,163,184,.15)', color: row.is_active ? '#10b981' : '#94a3b8' }}>{row.is_active ? 'ACTIVE' : 'HIDDEN'}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 12, marginBottom: 14 }}>
        {cfg.fields.map(f => (
          <div key={f.key} style={f.type === 'json' ? { gridColumn: '1 / -1' } : undefined}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>{f.label}</label>
            {f.type === 'bool'
              ? <button type="button" onClick={() => setD({ ...d, [f.key]: !d[f.key] })} style={{ ...btn(d[f.key]), padding: '8px 16px' }}>{d[f.key] ? '✓ On' : 'Off'}</button>
              : f.type === 'json'
                ? <textarea rows={3} value={d[f.key]} onChange={e => setD({ ...d, [f.key]: e.target.value })} style={{ ...input, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }} />
                : <div style={{ display: 'flex', gap: 8 }}>
                    <input type={f.type === 'color' ? 'text' : ['int', 'pct', 'usd'].includes(f.type) ? 'number' : 'text'} step={f.type === 'usd' || f.type === 'pct' ? '0.01' : undefined} value={d[f.key]} onChange={e => setD({ ...d, [f.key]: e.target.value })} style={input} />
                    {f.type === 'color' && /^#[0-9a-fA-F]{6}$/.test(d[f.key]) && <span style={{ width: 40, borderRadius: 10, background: d[f.key], border: '1px solid rgba(255,255,255,.2)', flexShrink: 0 }} />}
                  </div>}
          </div>
        ))}
      </div>
      {msg && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: msg.ok ? '#10b981' : '#f87171' }}>{msg.ok ? '✓ ' : ''}{msg.t}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={busy || !dirty} onClick={save} style={{ ...btn(true), opacity: busy || !dirty ? .45 : 1 }}>{busy ? 'Saving…' : creating ? 'Create' : 'Save changes'}</button>
        {creating && <button onClick={onCancel} style={btn(false)}>Cancel</button>}
      </div>
    </div>
  )
}

export default function ManageList({ kind }) {
  const cfg = MANAGE[kind]
  const [rows, setRows] = useState([])
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`/api/admin/manage?kind=${kind}`, { headers: { Authorization: `Bearer ${token}` } })
    const j = await res.json()
    if (!res.ok) setErr(j.error || 'Could not load'); else { setErr(''); setRows(j.rows || []) }
    setLoading(false)
  }, [kind])
  useEffect(() => { load() }, [load])

  return (
    <AdminLayout>
      <Head><title>{cfg.title} — Admin</title></Head>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div><h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, marginBottom: 4 }}>{cfg.title}</h1><p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, margin: 0 }}>{cfg.sub}</p></div>
        {!adding && <button onClick={() => setAdding(true)} style={btn(true)}>＋ Add new</button>}
      </div>
      {err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{err}</div>}
      {adding && <Editor cfg={cfg} kind={kind} row={null} onSaved={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} />}
      {loading ? <div style={{ color: 'rgba(255,255,255,.4)', padding: 30, textAlign: 'center' }}>Loading…</div>
        : rows.length === 0 && !adding && !err ? <div style={{ color: 'rgba(255,255,255,.35)', padding: 40, textAlign: 'center' }}>Nothing here yet. Click “Add new”.</div>
        : rows.map(r => <Editor key={r.id + JSON.stringify(r)} cfg={cfg} kind={kind} row={r} onSaved={load} />)}
    </AdminLayout>
  )
}
