import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { createPagesBrowserClient } from '@supabase/ssr';
const supabase = createPagesBrowserClient();

const TYPES = ['','deposit','withdrawal','game_load','redemption','adjustment','bonus','withdrawal_reversal'];

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('ledger_entries')
      .select('id, ref_id, type, direction, amount_cents, created_at, players:player_id(display_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (typeFilter) q = q.eq('type', typeFilter);
    if (dateFrom) q = q.gte('created_at', dateFrom);
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59');
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }, [typeFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const fmt = cents => cents != null ? `$${(cents/100).toFixed(2)}` : '—';
  const fmtDate = d => d ? new Date(d).toLocaleString() : '—';
  const dirColor = d => d === 'credit' ? '#4ade80' : '#f87171';

  return (
    <AdminLayout>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontFamily: 'Cinzel,serif', fontSize: 26, color: '#fbbf24', margin: '0 0 24px' }}>Ledger / Transactions</h1>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={typeFilter} onChange={e=>{ setTypeFilter(e.target.value); setPage(0); }} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#e2e8f0', fontSize: 14 }}>
            {TYPES.map(t => <option key={t} value={t}>{t||'All Types'}</option>)}
          </select>
          <input value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(0);}} type="date" style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#e2e8f0', fontSize: 14 }} />
          <input value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(0);}} type="date" style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#e2e8f0', fontSize: 14 }} />
          <button onClick={fetchItems} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)', background: 'transparent', color: '#fbbf24', cursor: 'pointer', fontWeight: 600 }}>↻ Refresh</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>
        : items.length === 0 ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>No transactions found</div>
        : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
                  {['Ref ID','Player','Type','Dir','Amount','Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i%2===0?'rgba(255,255,255,0.02)':'transparent' }}>
                      <td style={{ padding: '10px 12px', color: '#fbbf24', fontFamily: 'monospace', fontSize: 13 }}>{item.ref_id||'—'}</td>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>
                        <div>{item.players?.display_name||'—'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{item.players?.email}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', textTransform: 'capitalize' }}>{item.type?.replace(/_/g,' ')}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ color: dirColor(item.direction), fontWeight: 700, textTransform: 'uppercase', fontSize: 12 }}>{item.direction}</span></td>
                      <td style={{ padding: '10px 12px', color: dirColor(item.direction), fontWeight: 700 }}>{item.direction==='credit'?'+':'-'}{fmt(item.amount_cents)}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page===0?'#475569':'#e2e8f0', cursor: page===0?'default':'pointer' }}>← Prev</button>
              <span style={{ color: '#94a3b8', padding: '7px 10px' }}>Page {page+1}</span>
              <button onClick={() => setPage(p=>p+1)} disabled={items.length<PAGE_SIZE} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: items.length<PAGE_SIZE?'#475569':'#e2e8f0', cursor: items.length<PAGE_SIZE?'default':'pointer' }}>Next →</button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
