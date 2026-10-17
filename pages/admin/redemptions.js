import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const purple = '#a855f7'
const fmt = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtDate = d => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function AdminRedemptions() {
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [verifiedAmount, setVerifiedAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const openRow = (row) => {
    setSelected(row)
    setNotes('')
    setVerifiedAmount((row.amount_cents / 100).toFixed(2))
    setMsg('')
  }

  const submit = async (action) => {
    setSaving(true); setMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    const body = { redemption_id: selected.id, action, notes }
    if (action === 'approve') {
      const cents = Math.round(parseFloat(verifiedAmount) * 100)
      if (!cents || cents <= 0) { setMsg('Enter a valid verified amount'); setSaving(false); return }
      body.verified_amount_cents = cents
    }
    const res = await fetch('/api/admin/redemptions/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setSelected(null); setRefreshKey(k => k + 1) }
    else setMsg(d.error || 'Failed')
  }

  return (
    <AdminLayout>
      <DataTable
        key={refreshKey}
        title="🔄 Redemptions"
        endpoint="/api/admin/redemptions/list"
        searchPlaceholder="Search by player, game, or ref ID…"
        filterOptions={[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ]}
        rowMapper={r => ({
          id: r.id,
          player: r.profiles?.full_name || '—',
          email: r.profiles?.email || '—',
          reference_id: r.reference_id,
          game: r.game_panel_name || '—',
          account: r.game_account_username || '—',
          amount: r.amount_cents,
          status: r.status,
          date: fmtDate(r.created_at),
          notes: r.notes,
          _raw: r,
        })}
        columns={[
          { key: 'date', label: 'Date', color: 'rgba(255,255,255,0.4)', fontSize: 12 },
          { key: 'player', label: 'Player', fontWeight: 600 },
          { key: 'game', label: 'Game', color: purple },
          { key: 'account', label: 'Account', render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, color: gold }}>{r.account}</span> },
          { key: 'amount', label: 'Requested', render: r => <span style={{ color: green, fontWeight: 700 }}>+{fmt(r.amount)}</span> },
          { key: 'status', label: 'Status', render: r => <StatusPill status={r.status} /> },
        ]}
        renderActions={row => row.status === 'pending' ? (
          <button onClick={() => openRow(row._raw || row)} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: gold, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Review</button>
        ) : null}
        emptyMsg="No redemptions found."
      />

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSelected(null)}>
          <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 480, maxWidth: '100%', fontFamily: 'Outfit, sans-serif' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, margin: '0 0 4px' }}>Review Redemption</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px', fontFamily: 'monospace' }}>{selected.reference_id}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['Player', selected.profiles?.full_name || '—'],
                ['Email', selected.profiles?.email || '—'],
                ['Game', selected.game_panel_name || '—'],
                ['Account', selected.game_account_username || '—'],
                ['Requested Amount', fmt(selected.amount_cents)],
                ['Submitted', fmtDate(selected.created_at)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Key field: admin enters verified in-game amount */}
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: green, marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}>✅ Verified In-Game Amount (USD)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: green, fontSize: 18, fontWeight: 700 }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={verifiedAmount}
                  onChange={e => setVerifiedAmount(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.3)', color: green, fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif', outline: 'none' }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '8px 0 0' }}>
                Log into the game panel and verify the player's actual balance before entering. This amount will be credited to their wallet.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Rejection reason or processing note…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'none' }} />
            </div>

            <div style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              ℹ️ <strong style={{ color: green }}>Approve</strong> — credits verified amount to wallet + awards XP (1 per $2). <strong style={{ color: red }}>Reject</strong> — no wallet change needed (nothing was debited at submission).
            </div>

            {msg && <div style={{ color: red, fontSize: 12, marginBottom: 12 }}>⚠ {msg}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => submit('approve')} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: green, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>✅ Approve & Credit</button>
              <button onClick={() => submit('reject')} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: red, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>❌ Reject</button>
              <button onClick={() => setSelected(null)} style={{ padding: '11px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
