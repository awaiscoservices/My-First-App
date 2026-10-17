import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'

const green = '#22c55e'; const red = '#ef4444'; const gold = '#fbbf24'
function fmt(c) { return `$${((c || 0) / 100).toFixed(2)}` }
function fmtDate(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

export default function AdminTransactions() {
  return (
    <AdminLayout>
      <DataTable
        title="📒 Ledger / Transactions"
        endpoint="/api/admin/transactions/list"
        searchPlaceholder="Search by reference ID…"
        filterOptions={[
          { value: 'deposit', label: 'Deposits' },
          { value: 'withdrawal_hold', label: 'Withdrawal Hold' },
          { value: 'withdrawal_refund', label: 'Withdrawal Refund' },
          { value: 'game_load_hold', label: 'Game Load' },
          { value: 'game_load_refund', label: 'Load Refund' },
          { value: 'redemption', label: 'Redemption' },
          { value: 'adjustment', label: 'Adjustments' },
          { value: 'bonus', label: 'Bonus' },
        ]}
        rowMapper={r => ({
          id: r.id,
          player: r.profiles?.full_name || '—',
          type: r.type,
          direction: r.direction,
          amount: fmt(r.amount_cents),
          balance_after: fmt(r.balance_after_cents),
          reference_id: r.reference_id || '—',
          description: r.description || '—',
          date: fmtDate(r.created_at),
        })}
        columns={[
          { key: 'date', label: 'Date', color: 'rgba(255,255,255,0.4)' },
          { key: 'player', label: 'Player' },
          { key: 'type', label: 'Type', color: 'rgba(255,255,255,0.6)' },
          { key: 'direction', label: 'Dir', render: r => <span style={{ color: r.direction === 'credit' ? green : red, fontWeight: 600 }}>{r.direction === 'credit' ? '▲' : '▼'} {r.direction}</span> },
          { key: 'amount', label: 'Amount', render: r => <span style={{ color: r.direction === 'credit' ? green : red, fontWeight: 700 }}>{r.amount}</span> },
          { key: 'balance_after', label: 'Balance After', color: 'rgba(255,255,255,0.5)' },
          { key: 'reference_id', label: 'Ref', render: r => <span style={{ fontFamily: 'monospace', color: gold, fontSize: 12 }}>{r.reference_id}</span> },
        ]}
        emptyMsg="No ledger entries found."
      />
    </AdminLayout>
  )
}
