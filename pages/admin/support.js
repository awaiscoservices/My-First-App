import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const blue = '#3b82f6'

function fmtDate(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

function TicketModal({ row, onClose }) {
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  useState(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const res = await fetch(`/api/admin/support/ticket?id=${row.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      setTicket(data.ticket)
      setMessages(data.messages || [])
    })
  }, [])

  const send = async (action) => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/admin/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ticket_id: row.id, action, message: reply }),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ color: gold, fontFamily: 'Outfit, sans-serif', margin: 0 }}>#{row.id?.slice(0, 8)} — {row.subject}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 }}>{row.player_name} · <StatusPill status={row.status} /></p>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: m.is_staff ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.is_staff ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`, alignSelf: m.is_staff ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{m.profiles?.full_name} · {fmtDate(m.created_at)}</div>
              <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5 }}>{m.message}</div>
            </div>
          ))}
        </div>
        <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply…" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', resize: 'none', outline: 'none', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => send('reply')} disabled={loading || !reply.trim()} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: blue, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Send Reply</button>
          {row.status !== 'closed' && <button onClick={() => send('close')} disabled={loading} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Close Ticket</button>}
        </div>
      </div>
    </div>
  )
}

export default function AdminSupport() {
  const [selected, setSelected] = useState(null)
  return (
    <AdminLayout>
      {selected && <TicketModal row={selected} onClose={() => setSelected(null)} />}
      <DataTable
        title="🎧 Support Tickets"
        endpoint="/api/admin/support/list"
        searchPlaceholder="Search by subject…"
        filterOptions={[
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ]}
        rowMapper={r => ({ id: r.id, subject: r.subject, player_name: r.profiles?.full_name || '—', status: r.status, priority: r.priority || 'normal', category: r.category || '—', updated_at: fmtDate(r.updated_at) })}
        columns={[
          { key: 'subject', label: 'Subject', maxWidth: 200, wrap: true },
          { key: 'player_name', label: 'Player' },
          { key: 'status', label: 'Status', render: r => <StatusPill status={r.status} /> },
          { key: 'priority', label: 'Priority', color: 'rgba(255,255,255,0.5)' },
          { key: 'category', label: 'Category', color: 'rgba(255,255,255,0.5)' },
          { key: 'updated_at', label: 'Updated', color: 'rgba(255,255,255,0.4)' },
        ]}
        renderActions={(row) => (
          <button onClick={() => setSelected(row)} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: blue, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Open</button>
        )}
        emptyMsg="No support tickets found."
      />
    </AdminLayout>
  )
}
