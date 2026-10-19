import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

const fmt = c => {
  if (c === null || c === undefined) return '—'
  const abs = Math.abs(c)
  const str = '$' + (abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
  return c < 0 ? '−' + str : '+' + str
}
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function AdminAdjustments() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params = new URLSearchParams({ type: filter !== 'all' ? filter : '', limit: '200' })
      const res = await fetch(`/api/admin/adjustments/list?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const d = await res.json()
      setRows(d.rows || d.adjustments || [])
    } catch (e) { console.error('Failed to load adjustments', e); setRows([]) }
    setLoading(false)
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.profiles?.full_name?.toLowerCase().includes(s) || r.profiles?.email?.toLowerCase().includes(s) || r.reason?.toLowerCase().includes(s)
  })

  return (
    <AdminLayout>
      <Head><title>Adjustments — Admin</title></Head>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Adjustments</h1>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>Manual wallet adjustment history</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', padding: 4, borderRadius: 10 }}>
          {['all', 'credit', 'debit'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700, background: filter === s ? 'rgba(251,191,36,.7)' : 'transparent', color: filter === s ? '#fff' : 'rgba(255,255,255,.4)', textTransform: 'capitalize', transition: 'all .15s' }}>{s}</button>
          ))}
        </div>
        <input type="text" placeholder="Search player, email, reason…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', minWidth: 240 }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {['Player', 'Type', 'Amount', 'Bucket', 'Reason', 'By', 'Date'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>No adjustments found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.profiles?.full_name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{r.profiles?.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, textTransform: 'uppercase', background: r.type === 'credit' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', color: r.type === 'credit' ? '#22c55e' : '#ef4444' }}>{r.type}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: r.type === 'credit' ? '#22c55e' : '#ef4444' }}>{fmt(r.type === 'credit' ? r.amount_cents : -r.amount_cents)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: r.bucket === 'bonus' ? 'rgba(168,85,247,.15)' : 'rgba(255,255,255,.08)', color: r.bucket === 'bonus' ? '#a855f7' : 'rgba(255,255,255,.4)', textTransform: 'capitalize' }}>{r.bucket || 'cash'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.6)', maxWidth: 240 }}>{r.reason || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{r.admin?.full_name || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
