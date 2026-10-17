import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }

function KYCActions({ row, refresh }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  if (row.status !== 'pending' && row.status !== 'under_review') return <StatusPill status={row.status} />

  const act = async (action) => {
    if (action === 'reject' && !notes.trim()) { setMsg('Reason required'); return }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/kyc/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ kyc_id: row.id, action, notes }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { setOpen(false); setNotes(''); refresh() }
    else setMsg(data.error || 'Failed')
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: gold, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Review</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpen(false)}>
          <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 400, maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>Review KYC</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>{row.player_name}</strong> — {row.document_type || 'Document'}
            </p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / rejection reason…" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', resize: 'vertical', outline: 'none' }} />
            {msg && <p style={{ color: red, fontSize: 12, marginTop: 6 }}>{msg}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => act('approve')} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: green, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>✓ Approve</button>
              <button onClick={() => act('reject')} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: red, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>✗ Reject</button>
              <button onClick={() => setOpen(false)} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminKYC() {
  return (
    <AdminLayout>
      <DataTable
        title="🪪 KYC Verification"
        endpoint="/api/admin/kyc/list"
        searchPlaceholder="Search by player name…"
        filterOptions={[
          { value: 'pending', label: 'Pending' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'verified', label: 'Verified' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        rowMapper={r => ({
          id: r.id,
          player_name: r.profiles?.full_name || '—',
          email: r.profiles?.email || '—',
          document_type: r.document_type || '—',
          status: r.status,
          submitted_at: fmtDate(r.submitted_at),
          reviewed_at: fmtDate(r.reviewed_at),
        })}
        columns={[
          { key: 'player_name', label: 'Player' },
          { key: 'email', label: 'Email', color: 'rgba(255,255,255,0.5)' },
          { key: 'document_type', label: 'Document' },
          { key: 'status', label: 'Status', render: r => <StatusPill status={r.status} /> },
          { key: 'submitted_at', label: 'Submitted', color: 'rgba(255,255,255,0.5)' },
          { key: 'reviewed_at', label: 'Reviewed', color: 'rgba(255,255,255,0.5)' },
        ]}
        renderActions={(row, refresh) => <KYCActions row={row} refresh={refresh} />}
        emptyMsg="No KYC submissions found."
      />
    </AdminLayout>
  )
}
