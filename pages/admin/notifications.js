import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const purple = '#a855f7'

export default function AdminNotifications() {
  const [form, setForm] = useState({ title: '', message: '', target: 'all' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) { setError('Title and message required'); return }
    setSending(true); setError(''); setResult(null)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) { setResult(data); setForm(f => ({ ...f, title: '', message: '' })) }
    else setError(data.error || 'Failed')
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', maxWidth: 600 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, marginBottom: 8 }}>📣 Broadcast Notification</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Send a push notification to all or active players.</p>

        {result && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: green, fontSize: 13, margin: 0 }}>✅ Broadcast sent to <strong>{result.sent}</strong> players.</p>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Audience</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ value: 'all', label: '🌐 All Players' }, { value: 'active', label: '✅ Active Only' }].map(t => (
                <div key={t.value} onClick={() => setForm(f => ({ ...f, target: t.value }))} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 500,
                  background: form.target === t.value ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${form.target === t.value ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: form.target === t.value ? gold : 'rgba(255,255,255,0.5)',
                }}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 🎁 New Promotion Live!" maxLength={80}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Your message to players…" rows={4} maxLength={500}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>{form.message.length}/500</div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: red, fontSize: 13 }}>⚠ {error}</div>}

          <button onClick={send} disabled={sending} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: sending ? 'rgba(251,191,36,0.2)' : `linear-gradient(135deg, #b45309, ${gold})`, color: sending ? 'rgba(255,255,255,0.4)' : '#000', fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            {sending ? 'Sending…' : `📣 Send to ${form.target === 'all' ? 'All' : 'Active'} Players`}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
