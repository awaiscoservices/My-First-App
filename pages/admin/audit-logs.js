import AdminLayout from '../../components/layout/AdminLayout'
import DataTable from '../../components/admin/DataTable'

const gold = '#fbbf24'
function fmtDate(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

export default function AdminAuditLogs() {
  return (
    <AdminLayout>
      <DataTable
        title="📋 Audit Logs"
        endpoint="/api/admin/audit-logs/list"
        searchPlaceholder="Search by action…"
        rowMapper={r => ({
          id: r.id,
          actor: r.profiles?.full_name || '—',
          actor_role: r.profiles?.role || '—',
          action: r.action,
          target_type: r.target_type || '—',
          target_id: r.target_id ? String(r.target_id).slice(0, 8) : '—',
          details: r.details ? JSON.stringify(r.details).slice(0, 80) : '—',
          date: fmtDate(r.created_at),
        })}
        columns={[
          { key: 'date', label: 'Time', color: 'rgba(255,255,255,0.4)' },
          { key: 'actor', label: 'Actor' },
          { key: 'actor_role', label: 'Role', color: 'rgba(255,255,255,0.4)' },
          { key: 'action', label: 'Action', render: r => <span style={{ fontFamily: 'monospace', color: gold, fontSize: 12 }}>{r.action}</span> },
          { key: 'target_type', label: 'Target', color: 'rgba(255,255,255,0.5)' },
          { key: 'details', label: 'Details', color: 'rgba(255,255,255,0.35)', maxWidth: 260, wrap: true },
        ]}
        emptyMsg="No audit logs found."
      />
    </AdminLayout>
  )
}
