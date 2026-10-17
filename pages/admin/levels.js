import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const red = '#ef4444'
const EMPTY = { id: null, name: '', min_xp: 0, color: '#fbbf24', icon: '⭐', perks: '' }

export default function AdminLevels() {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setToken(session?.access_token); fetchLevels(session?.access_token) })
  }, [])

  const fetchLevels = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/admin/levels/list', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setLevels(d.rows || []) }
    setLoading(false)
  }

  const save = async () => {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/levels/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editing),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setEditing(null); fetchLevels() }
    else setMsg(d.error || 'Failed')
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>⭐ Player Levels</h1>
          <button onClick={() => setEditing(EMPTY)} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Add Level</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {levels.map((l, i) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${l.color || gold}30`, borderRadius: 12 }}>
                <div style={{ fontSize: 28 }}>{l.icon || '⭐'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: l.color || gold }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Min XP: {l.min_xp?.toLocaleString()}</div>
                  {l.perks && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l.perks}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>Level {i + 1}</div>
                <button onClick={() => setEditing({ ...l })} style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: gold, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditing(null)}>
            <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: gold, fontFamily: 'Outfit, sans-serif', marginBottom: 20 }}>{editing.id ? 'Edit Level' : 'Add Level'}</h3>
              {[
                { label: 'Level Name *', key: 'name', type: 'text' },
                { label: 'Min XP Required *', key: 'min_xp', type: 'number' },
                { label: 'Icon (emoji)', key: 'icon', type: 'text' },
                { label: 'Color (hex)', key: 'color', type: 'text' },
                { label: 'Perks description', key: 'perks', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} value={editing[f.key] || ''} onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
                </div>
              ))}
              {msg && <p style={{ color: red, fontSize: 12, marginBottom: 12 }}>{msg}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>{saving ? 'Saving…' : 'Save Level'}</button>
                <button onClick={() => setEditing(null)} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
