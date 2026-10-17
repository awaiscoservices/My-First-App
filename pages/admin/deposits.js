import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'
const fmt = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtDate = d => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function AdminDeposits() {
  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const openRow = (row) => { setSelected(row); setAction(''); setNotes(''); setMsg('') }

  const submit = async (act) => {
    setSaving(true); setMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/deposits/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ deposit_id: selected.id, action: act, notes }),
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
        title="💳 Deposits"
        endpoint="/api/admin/deposits/list"
        searchPlaceholder="Search by player name, email, or ref ID…"
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
          amount: r.amount_cents,
          bonus: r.bonus_cents || 0,
          method: r.payment_method_name || r.payment_method_type || '—',
          status: r.status,
          date: fmtDate(r.created_at),
          proof_url: r.proof_url,
          notes: r.notes,
          // keep full row for modal
          _raw: r,
        })}
        columns={[
          { key: 'date', label: 'Date', color: 'rgba(255,255,255,0.4)', fontSize: 12 },
          { key: 'player', label: 'Player', fontWeight: 600 },
          { key: 'reference_id', label: 'Ref ID', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.reference_id}</span> },
          { key: 'method', label: 'Method', color: 'rgba(255,255,255,0.5)' },
          { key: 'amount', label: 'Amount', render: r => <span style={{ color: green, fontWeight: 700 }}>{fmt(r.amount)}</span> },
          { key: 'bonus', label: 'Bonus', render: r => r.bonus > 0 ? <span style={{ color: gold, fontSize: 12 }}>+{fmt(r.bonus)}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span> },
          { key: 'status', label: 'Status', render: r => <StatusPill status={r.status} /> },
        ]}
        renderActions={row => row.status === 'pending' ? (
          <button onClick={() => openRow(row._raw || row)} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: gold, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Review</button>
        ) : null}
        emptyMsg="No deposits found."
      />

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSelected(null)}>
          <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 460, maxWidth: '100%', fontFamily: 'Outfit, sans-serif' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, margin: '0 0 4px' }}>Review Deposit</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 20px', fontFamily: 'monospace' }}>{selected.reference_id}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Player', selected.profiles?.full_name || '—'],
                ['Email', selected.profiles?.email || '—'],
                ['Amount', fmt(selected.amount_cents)],
                ['Method', selected.payment_method_name || selected.payment_method_type || '—'],
                ['Submitted', fmtDate(selected.created_at)],
                ['Status', selected.status],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.proof_url && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Proof of Payment</div>
                <a href={selected.proof_url} target="_blank" rel="noreferrer" style={{ color: gold, fontSize: 13 }}>View Proof ↗</a>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal note or rejection reason…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'none' }} />
            </div>

            {msg && <div style={{ color: red, fontSize: 12, marginBottom: 12 }}>⚠ {msg}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => submit('approve')} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: green, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
                ✅ Approve
              </button>
              <button onClick={() => submit('reject')} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: red, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
                ❌ Reject
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: '11px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
