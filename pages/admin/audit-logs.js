import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

const fmtDate = d => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const ACTION_COLORS = {
  approve: '#22c55e', reject: '#ef4444', suspend: '#ef4444',
  create: '#22c55e', update: '#fbbf24', delete: '#ef4444',
  login: '#06b6d4', adjust: '#a855f7', verify: '#22c55e',
}

export default function AdminAuditLogs() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const ACTION_TYPES = ['all', 'approve', 'reject', 'create', 'update', 'adjust', 'suspend', 'verify']

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    let q = supabase.from('audit_logs')
      .select('*, admin:profiles!audit_logs_admin_id_fkey(full_name,email), target:profiles!audit_logs_target_user_id_fkey(full_name)')
      .order('created_at', { ascending: false }).limit(200)
    if (filter !== 'all') q = q.eq('action', filter)
    const { data } = await q
    setRows(data || [])
    setLoading(false)
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.admin?.full_name?.toLowerCase().includes(s) || r.admin?.email?.toLowerCase().includes(s) || r.target?.full_name?.toLowerCase().includes(s) || r.entity_type?.toLowerCase().includes(s) || r.action?.toLowerCase().includes(s)
  })

  return (
    <AdminLayout>
      <Head><title>Audit Logs — Admin</title></Head>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Audit Logs</h1>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>Complete admin action history — read only</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', padding: 4, borderRadius: 10, flexWrap: 'wrap' }}>
          {ACTION_TYPES.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700, background: filter === s ? 'rgba(251,191,36,.7)' : 'transparent', color: filter === s ? '#fff' : 'rgba(255,255,255,.4)', textTransform: 'capitalize', transition: 'all .15s' }}>{s}</button>
          ))}
        </div>
        <input type="text" placeholder="Search admin, player, action…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: 'none', minWidth: 240 }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {['Admin', 'Action', 'Entity', 'Target Player', 'Details', 'Time'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>No audit logs found</td></tr>
              : filtered.map(r => {
                const color = ACTION_COLORS[r.action] || '#fbbf24'
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.admin?.full_name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{r.admin?.email}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: color + '22', color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{r.action}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#a855f7', textTransform: 'capitalize' }}>{r.entity_type?.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{r.target?.full_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,.4)', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.notes || (r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : '—')}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
