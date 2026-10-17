import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setToken(session?.access_token); fetchSettings(session?.access_token) })
  }, [])

  const fetchSettings = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/admin/settings/get', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setSettings(d.settings || []) }
    setLoading(false)
  }

  const saveSetting = async (key, value) => {
    setSaving(key)
    const res = await fetch('/api/admin/settings/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    if (res.ok) { setSaved(key); setTimeout(() => setSaved(null), 2000); fetchSettings() }
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', maxWidth: 700 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, marginBottom: 8 }}>⚙️ Platform Settings</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Global platform configuration. Changes take effect immediately.</p>

        {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div> : settings.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            No settings configured yet. Settings are stored in the <code style={{ color: gold }}>platform_settings</code> table.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {settings.map(s => (
              <div key={s.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'monospace', color: gold }}>{s.key}</div>
                    {s.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.description}</div>}
                  </div>
                  {saved === s.key && <span style={{ color: green, fontSize: 12 }}>✓ Saved</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={edits[s.key] !== undefined ? edits[s.key] : (s.value || '')}
                    onChange={e => setEdits(p => ({ ...p, [s.key]: e.target.value }))}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                  <button
                    onClick={() => saveSetting(s.key, edits[s.key] !== undefined ? edits[s.key] : s.value)}
                    disabled={saving === s.key}
                    style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: gold, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
                    {saving === s.key ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
