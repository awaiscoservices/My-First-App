/**
 * Reusable admin data table with search, status filter, pagination, refresh.
 * Props: title, endpoint, columns, rowMapper, filters, actions, emptyMsg
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'
const red = '#ef4444'
const green = '#22c55e'
const purple = '#a855f7'
const blue = '#3b82f6'

export function StatusPill({ status }) {
  const map = {
    active: { bg: 'rgba(34,197,94,0.15)', color: green, label: 'Active' },
    inactive: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', label: 'Inactive' },
    pending: { bg: 'rgba(251,191,36,0.15)', color: gold, label: 'Pending' },
    approved: { bg: 'rgba(34,197,94,0.15)', color: green, label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.15)', color: red, label: 'Rejected' },
    completed: { bg: 'rgba(34,197,94,0.15)', color: green, label: 'Completed' },
    suspended: { bg: 'rgba(239,68,68,0.15)', color: red, label: 'Suspended' },
    open: { bg: 'rgba(59,130,246,0.15)', color: blue, label: 'Open' },
    closed: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', label: 'Closed' },
    verified: { bg: 'rgba(34,197,94,0.15)', color: green, label: 'Verified' },
    flagged: { bg: 'rgba(239,68,68,0.15)', color: red, label: 'Flagged' },
    under_review: { bg: 'rgba(251,191,36,0.15)', color: gold, label: 'Under Review' },
    enabled: { bg: 'rgba(34,197,94,0.15)', color: green, label: 'Enabled' },
    disabled: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', label: 'Disabled' },
  }
  const s = map[status] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: status }
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
      {s.label}
    </span>
  )
}

export default function DataTable({ title, endpoint, columns, rowMapper, filterOptions, renderActions, emptyMsg = 'No records found.', searchPlaceholder = 'Search…' }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [token, setToken] = useState(null)
  const PER_PAGE = 25

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setToken(session.access_token)
    })
  }, [])

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page, limit: PER_PAGE })
    if (search) params.set('search', search)
    if (filter !== 'all') params.set('status', filter)
    const res = await fetch(`${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setRows((data.rows || data.data || []).map(rowMapper || (r => r)))
      setTotal(data.total || 0)
    }
    setLoading(false)
  }, [token, endpoint, page, search, filter])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0 }}>{title}</h1>
        <button onClick={fetchData} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: gold, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder={searchPlaceholder}
          style={{ flex: 1, minWidth: 180, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Outfit, sans-serif' }}
        />
        {filterOptions && (
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(0) }} style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Outfit, sans-serif' }}>
            <option value="all" style={{ background: '#0d0a1a' }}>All</option>
            {filterOptions.map(f => <option key={f.value} value={f.value} style={{ background: '#0d0a1a' }}>{f.label}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: `2px solid rgba(251,191,36,0.2)`, borderTopColor: gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>{emptyMsg}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {columns.map(c => (
                    <th key={c.key} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{c.label}</th>
                  ))}
                  {renderActions && <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {columns.map(c => (
                      <td key={c.key} style={{ padding: '12px 16px', color: c.color || '#fff', whiteSpace: c.wrap ? 'normal' : 'nowrap', maxWidth: c.maxWidth || 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                    {renderActions && <td style={{ padding: '12px 16px' }}>{renderActions(row, fetchData)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <span>Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page === 0 ? 'default' : 'pointer', fontFamily: 'Outfit, sans-serif' }}>← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: page >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontFamily: 'Outfit, sans-serif' }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
