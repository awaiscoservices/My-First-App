import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'

const EMPTY = { id: null, name: '', description: '', logo_url: '', is_active: true, min_load_cents: 100, max_load_cents: 500000 }

export default function AdminGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setToken(session?.access_token); fetchGames(session?.access_token) })
  }, [])

  const fetchGames = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/admin/games/list', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setGames(d.rows || []) }
    setLoading(false)
  }

  const save = async () => {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/games/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...editing, min_load_cents: Math.round(parseFloat(editing.min_load_cents || 1) * 100), max_load_cents: Math.round(parseFloat(editing.max_load_cents || 5000) * 100) }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setEditing(null); fetchGames() }
    else setMsg(d.error || 'Failed')
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>🎮 Game Panels</h1>
          <button onClick={() => setEditing(EMPTY)} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Add Game</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {games.map(g => (
              <div key={g.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{g.name}</div>
                    <StatusPill status={g.is_active ? 'active' : 'inactive'} />
                  </div>
                  {g.logo_url && <img src={g.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{g.description || 'No description'}</p>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
                  Load: ${((g.min_load_cents || 0) / 100).toFixed(0)} – ${((g.max_load_cents || 0) / 100).toFixed(0)}
                </div>
                <button onClick={() => setEditing({ ...g, min_load_cents: (g.min_load_cents || 0) / 100, max_load_cents: (g.max_load_cents || 0) / 100 })} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: gold, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditing(null)}>
            <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 460, maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: gold, fontFamily: 'Outfit, sans-serif', marginBottom: 20 }}>{editing.id ? 'Edit Game' : 'Add Game'}</h3>
              {[
                { label: 'Name *', key: 'name', type: 'text' },
                { label: 'Description', key: 'description', type: 'text' },
                { label: 'Logo URL', key: 'logo_url', type: 'text' },
                { label: 'Min Load ($)', key: 'min_load_cents', type: 'number' },
                { label: 'Max Load ($)', key: 'max_load_cents', type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} value={editing[f.key] || ''} onChange={e => setEditing(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
                </div>
              ))}
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isActive" checked={!!editing.is_active} onChange={e => setEditing(p => ({ ...p, is_active: e.target.checked }))} />
                <label htmlFor="isActive" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Active (visible to players)</label>
              </div>
              {msg && <p style={{ color: red, fontSize: 12, marginBottom: 12 }}>{msg}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
                  {saving ? 'Saving…' : 'Save Game'}
                </button>
                <button onClick={() => setEditing(null)} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
