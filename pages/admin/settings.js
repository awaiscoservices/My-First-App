import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { createPagesBrowserClient } from '@supabase/ssr';
const supabase = createPagesBrowserClient();

const SETTING_DEFS = [
  { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean', description: 'Prevents new logins and deposits when enabled' },
  { key: 'min_deposit_cents', label: 'Minimum Deposit ($)', type: 'dollars', description: 'Minimum deposit amount in dollars' },
  { key: 'max_withdrawal_cents', label: 'Maximum Withdrawal ($)', type: 'dollars', description: 'Maximum single withdrawal amount' },
  { key: 'welcome_bonus_cents', label: 'Welcome Bonus ($)', type: 'dollars', description: 'Bonus credited on first deposit' },
  { key: 'kyc_required_withdrawal_cents', label: 'KYC Required Above ($)', type: 'dollars', description: 'KYC verification required for withdrawals above this amount' },
  { key: 'max_game_load_cents', label: 'Max Game Load ($)', type: 'dollars', description: 'Maximum single game load amount' },
  { key: 'referral_bonus_cents', label: 'Referral Bonus ($)', type: 'dollars', description: 'Bonus for referring a new player' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_settings').select('key, value');
    const map = {};
    (data||[]).forEach(r => { map[r.key] = r.value; });
    setSettings(map);
    // Init form
    const formVals = {};
    SETTING_DEFS.forEach(def => {
      if (def.type === 'boolean') formVals[def.key] = map[def.key] === 'true' || map[def.key] === true;
      else if (def.type === 'dollars') formVals[def.key] = map[def.key] ? (parseInt(map[def.key])/100).toFixed(2) : '';
      else formVals[def.key] = map[def.key]||'';
    });
    setForm(formVals);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const showToast = (msg, t='success') => { setToast({ msg, type: t }); setTimeout(() => setToast(null), 4000); };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const updates = SETTING_DEFS.map(def => {
        let value;
        if (def.type === 'boolean') value = form[def.key] ? 'true' : 'false';
        else if (def.type === 'dollars') value = String(Math.round(parseFloat(form[def.key]||0)*100));
        else value = form[def.key]||'';
        return { key: def.key, value };
      });
      const res = await fetch('/api/admin/settings/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error||'Failed');
      showToast('Settings saved');
      fetchSettings();
    } catch (e) { showToast(e.message,'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 24, maxWidth: 700 }}>
        <h1 style={{ fontFamily: 'Cinzel,serif', fontSize: 26, color: '#fbbf24', margin: '0 0 8px' }}>Platform Settings</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 28px' }}>Changes apply immediately. All modifications are logged in audit logs.</p>

        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>
        : (
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 24 }}>
            {SETTING_DEFS.map((def, i) => (
              <div key={def.key} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: i < SETTING_DEFS.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{def.label}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{def.description}</div>
                  </div>
                  <div style={{ marginLeft: 20 }}>
                    {def.type === 'boolean' ? (
                      <div onClick={() => setForm(f=>({...f,[def.key]:!f[def.key]}))} style={{ width: 48, height: 26, borderRadius: 13, background: form[def.key]?'#fbbf24':'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: form[def.key]?24:3, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                    ) : (
                      <input type="number" step="0.01" min="0" value={form[def.key]||''} onChange={e=>setForm(f=>({...f,[def.key]:e.target.value}))} style={{ width: 140, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14, textAlign: 'right' }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleSave} disabled={submitting} style={{ width: '100%', padding: 13, borderRadius: 8, border: 'none', cursor: submitting?'not-allowed':'pointer', fontWeight: 700, fontSize: 15, background: '#fbbf24', color: '#0f172a', opacity: submitting?0.7:1 }}>{submitting?'Saving…':'Save Settings'}</button>
          </div>
        )}
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 2000, background: toast.type==='error'?'#f87171':'#4ade80', color: '#0f172a' }}>{toast.msg}</div>}
    </AdminLayout>
  );
}
