import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'

const red = '#ef4444'; const gold = '#fbbf24'; const green = '#22c55e'
function fmtDate(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

const SEVERITY_COLOR = { low: 'rgba(255,255,255,0.5)', medium: gold, high: red, critical: '#ff0000' }

export default function AdminRisk() {
  return (
    <AdminLayout>
      <DataTable
        title="🚨 Risk Flags"
        endpoint="/api/admin/risk/list"
        searchPlaceholder="Search by flag type…"
        rowMapper={r => ({
          id: r.id,
          player: r.profiles?.full_name || '—',
          email: r.profiles?.email || '—',
          flag_type: r.flag_type,
          severity: r.severity || 'low',
          description: r.description || '—',
          resolved: r.resolved,
          date: fmtDate(r.created_at),
        })}
        columns={[
          { key: 'date', label: 'Date', color: 'rgba(255,255,255,0.4)' },
          { key: 'player', label: 'Player' },
          { key: 'flag_type', label: 'Flag Type', render: r => <span style={{ fontFamily: 'monospace', color: gold, fontSize: 12 }}>{r.flag_type}</span> },
          { key: 'severity', label: 'Severity', render: r => <span style={{ color: SEVERITY_COLOR[r.severity] || red, fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>{r.severity}</span> },
          { key: 'description', label: 'Description', color: 'rgba(255,255,255,0.55)', maxWidth: 260, wrap: true },
          { key: 'resolved', label: 'Status', render: r => <StatusPill status={r.resolved ? 'completed' : 'flagged'} /> },
        ]}
        emptyMsg="No risk flags found."
      />
    </AdminLayout>
  )
}
