import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';

export default function AdminLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchLevels = async () => {
    setLoading(true);
    const { data } = await supabase.from('player_levels').select('*').order('level_number');
    setLevels(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchLevels(); }, []);

  const showToast = (msg, t='success') => { setToast({ msg, type: t }); setTimeout(() => setToast(null), 4000); };

  const startEdit = (lv) => { setEditing(lv.id); setForm({ name: lv.name, min_xp: lv.min_xp, bonus_rate_percent: lv.bonus_rate_percent, color: lv.color||'#fbbf24' }); };
  const cancelEdit = () => { setEditing(null); setForm({}); };

  const handleSave = async (levelId) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/levels/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level_id: levelId, ...form, min_xp: parseInt(form.min_xp)||0, bonus_rate_percent: parseFloat(form.bonus_rate_percent)||0 }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error||'Failed');
      showToast('Level updated');
      setEditing(null); fetchLevels();
    } catch (e) { showToast(e.message,'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontFamily: 'Cinzel,serif', fontSize: 26, color: '#fbbf24', margin: '0 0 24px' }}>VIP Levels</h1>

        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr style={{ borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
                {['Level','Name','Min XP','Bonus Rate','Color','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {levels.map((lv,i) => editing===lv.id ? (
                  <tr key={lv.id} style={{ borderBottom: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.04)' }}>
                    <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 700 }}>#{lv.level_number}</td>
                    <td style={{ padding: '10px 12px' }}><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', width: 140 }} /></td>
                    <td style={{ padding: '10px 12px' }}><input type="number" value={form.min_xp} onChange={e=>setForm(f=>({...f,min_xp:e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', width: 100 }} /></td>
                    <td style={{ padding: '10px 12px' }}><input type="number" step="0.1" value={form.bonus_rate_percent} onChange={e=>setForm(f=>({...f,bonus_rate_percent:e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', width: 80 }} /></td>
                    <td style={{ padding: '10px 12px' }}><input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{ width: 40, height: 32, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleSave(lv.id)} disabled={submitting} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#4ade80', color: '#0f172a', fontWeight: 700, fontSize: 12 }}>Save</button>
                        <button onClick={cancelEdit} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={lv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i%2===0?'rgba(255,255,255,0.02)':'transparent' }}>
                    <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 700 }}>#{lv.level_number}</td>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 600 }}>{lv.name}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{(lv.min_xp||0).toLocaleString()} XP</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{lv.bonus_rate_percent}%</td>
                    <td style={{ padding: '10px 12px' }}><div style={{ width: 24, height: 24, borderRadius: 6, background: lv.color||'#fbbf24' }} /></td>
                    <td style={{ padding: '10px 12px' }}><button onClick={() => startEdit(lv)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 2000, background: toast.type==='error'?'#f87171':'#4ade80', color: '#0f172a' }}>{toast.msg}</div>}
    </AdminLayout>
  );
}
