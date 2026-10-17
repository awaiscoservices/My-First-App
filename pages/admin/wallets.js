import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import DataTable, { StatusPill } from '../../components/admin/DataTable'
import { supabase } from '../../lib/supabase'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const purple = '#a855f7'
const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function AdminWallets() {
  const [selected, setSelected] = useState(null)
  const [adjForm, setAdjForm] = useState({ amount_dollars: '', reason: '', direction: 'credit' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState(null)

  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setToken(session?.access_token))
  })

  const openAdj = (row) => { setSelected(row); setAdjForm({ amount_dollars: '', reason: '', direction: 'credit' }); setMsg('') }

  const submitAdj = async () => {
    if (!adjForm.amount_dollars || !adjForm.reason.trim()) { setMsg('Amount and reason required'); return }
    const cents = Math.round(parseFloat(adjForm.amount_dollars) * 100)
    if (isNaN(cents) || cents <= 0) { setMsg('Invalid amount'); return }
    setSaving(true); setMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/wallets/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id: selected.user_id, amount_cents: cents, direction: adjForm.direction, reason: adjForm.reason }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setSelected(null) }
    else setMsg(d.error || 'Failed')
  }

  return (
    <AdminLayout>
      <DataTable
        title="💰 Player Wallets"
        endpoint="/api/admin/wallets/list"
        searchPlaceholder="Search by player name or email…"
        rowMapper={r => ({
          id: r.id,
          user_id: r.user_id,
          player: r.profiles?.full_name || '—',
          email: r.profiles?.email || '—',
          cash_balance: r.cash_balance_cents ?? 0,
          bonus_balance: r.bonus_balance_cents ?? 0,
          total_deposited: r.total_deposited_cents ?? 0,
          total_withdrawn: r.total_withdrawn_cents ?? 0,
          status: r.profiles?.status || 'active',
          updated: r.updated_at,
        })}
        columns={[
          { key: 'player', label: 'Player', fontWeight: 600 },
          { key: 'email', label: 'Email', color: 'rgba(255,255,255,0.45)', fontSize: 12 },
          {
            key: 'cash_balance', label: 'Cash Balance', render: r => (
              <span style={{ color: r.cash_balance > 0 ? green : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{fmt(r.cash_balance)}</span>
            )
          },
          {
            key: 'bonus_balance', label: 'Bonus Balance', render: r => (
              <span style={{ color: r.bonus_balance > 0 ? purple : 'rgba(255,255,255,0.4)' }}>{fmt(r.bonus_balance)}</span>
            )
          },
          { key: 'total_deposited', label: 'Total Deposited', render: r => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{fmt(r.total_deposited)}</span> },
          { key: 'status', label: 'Status', render: r => <StatusPill status={r.status} /> },
        ]}
        renderActions={row => (
          <button onClick={() => openAdj(row)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: gold, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
            Adjust
          </button>
        )}
        emptyMsg="No wallets found."
      />

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw', fontFamily: 'Outfit, sans-serif' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, margin: '0 0 6px' }}>Wallet Adjustment</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>
              {selected.player} — Cash: <span style={{ color: green }}>{fmt(selected.cash_balance)}</span>
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Direction</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: 'credit', label: '+ Credit', c: green }, { v: 'debit', label: '− Debit', c: red }].map(d => (
                  <div key={d.v} onClick={() => setAdjForm(f => ({ ...f, direction: d.v }))} style={{ flex: 1, padding: '9px', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: adjForm.direction === d.v ? `rgba(${d.v === 'credit' ? '34,197,94' : '239,68,68'},0.1)` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${adjForm.direction === d.v ? d.c : 'rgba(255,255,255,0.08)'}`,
                    color: adjForm.direction === d.v ? d.c : 'rgba(255,255,255,0.4)',
                  }}>{d.label}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Amount (USD) *</label>
              <input type="number" min="0.01" step="0.01" value={adjForm.amount_dollars} onChange={e => setAdjForm(f => ({ ...f, amount_dollars: e.target.value }))} placeholder="0.00"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Reason *</label>
              <textarea value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for adjustment…" rows={3} maxLength={500}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'vertical' }} />
            </div>

            {msg && <div style={{ color: red, fontSize: 12, marginBottom: 12 }}>⚠ {msg}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submitAdj} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, background: `linear-gradient(135deg, #b45309, ${gold})`, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
                {saving ? 'Saving…' : 'Apply Adjustment'}
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: '11px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
