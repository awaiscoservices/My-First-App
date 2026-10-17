import AdminLayout from '../../components/layout/AdminLayout'
import DataTable from '../../components/admin/DataTable'

const green = '#22c55e'; const red = '#ef4444'; const gold = '#fbbf24'
function fmt(c) { return `$${((c || 0) / 100).toFixed(2)}` }
function fmtDate(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

export default function AdminAdjustments() {
  return (
    <AdminLayout>
      <DataTable
        title="⚖️ Wallet Adjustments"
        endpoint="/api/admin/adjustments/list"
        searchPlaceholder="Search by reason…"
        rowMapper={r => ({
          id: r.id,
          player: r.profiles?.full_name || '—',
          email: r.profiles?.email || '—',
          direction: r.direction,
          amount: fmt(r.amount_cents),
          reason: r.reason || '—',
          by: r.staff?.full_name || '—',
          ref: r.reference_id || '—',
          date: fmtDate(r.created_at),
        })}
        columns={[
          { key: 'date', label: 'Date', color: 'rgba(255,255,255,0.4)' },
          { key: 'player', label: 'Player' },
          { key: 'direction', label: 'Type', render: r => <span style={{ color: r.direction === 'credit' ? green : red, fontWeight: 600 }}>{r.direction === 'credit' ? '+ Credit' : '− Debit'}</span> },
          { key: 'amount', label: 'Amount', render: r => <span style={{ color: r.direction === 'credit' ? green : red, fontWeight: 700 }}>{r.amount}</span> },
          { key: 'reason', label: 'Reason', maxWidth: 240, wrap: true, color: 'rgba(255,255,255,0.7)' },
          { key: 'by', label: 'Done By', color: 'rgba(255,255,255,0.4)' },
          { key: 'ref', label: 'Ref', render: r => <span style={{ fontFamily: 'monospace', color: gold, fontSize: 12 }}>{r.ref}</span> },
        ]}
        emptyMsg="No adjustments found."
      />
    </AdminLayout>
  )
}
