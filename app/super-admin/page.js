'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser } from '@/lib/client-cache';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const M = '#2563EB', GOLD = '#D4AF37', NAVY = '#0F172A', EMERALD = '#10B981', SLATE = '#64748B';

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showConfig, setShowConfig] = useState(false);
  const [editSchool, setEditSchool] = useState(null);
  const [saving, setSaving] = useState(false);

  // Global Config State
  const [globalConfig, setGlobalConfig] = useState({
    platformName: '', platformMotto: '',
    smsGateway: { apiKey: '', username: '', senderId: '' },
    pricing: { basic: 25000, premium: 50000 },
    maintenanceMode: false
  });
  const [announcement, setAnnouncement] = useState({ message: '', priority: 'normal', active: false });

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || (u.tenantId !== 'platform-master' && u.role !== 'super-admin')) { 
      router.push('/login'); return; 
    }
    setUser(u);

    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/saas/stats'),
        fetch('/api/saas/global-config')
      ]);
      const stats = await statsRes.json();
      const conf = await configRes.json();

      setData(stats);
      if (conf.config) setGlobalConfig(conf.config);
      if (conf.announcement) setAnnouncement(conf.announcement);
    } catch (e) {
      console.error('Failed to load super admin data:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const saveConfig = async () => {
    if (!editSchool) return;
    setSaving(true);
    try {
      const res = await fetch('/api/saas/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_billing', tenantId: editSchool.id, ...editSchool })
      });
      if (res.ok) { setShowConfig(false); load(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const saveGlobalConfig = async () => {
    setSaving(true);
    try {
      await fetch('/api/saas/global-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', payload: globalConfig })
      });
      alert('✅ Global Configuration Saved!');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const saveBroadcast = async () => {
    setSaving(true);
    try {
      await fetch('/api/saas/global-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_announcement', payload: announcement })
      });
      alert('🚀 Broadcast Updated Successfully!');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (tid, name) => {
    if (!confirm(`⚠️ CRITICAL ACTION: Are you sure you want to PERMANENTLY DELETE ${name} (${tid})?`)) return;
    if (!confirm(`Type the school ID "${tid}" to confirm deletion:`)) return;
    try {
      const res = await fetch('/api/saas/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_school', tenantId: tid })
      });
      if (res.ok) load();
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ border: `4px solid ${M}22`, borderTopColor: M, borderRadius: '50%', width: 50, height: 50, animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
        <div style={{ color: NAVY, fontWeight: 700, fontSize: 18 }}>👑 Authenticating Super-Admin…</div>
      </div>
      <style jsx>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );

  const schools = data?.schools || [];
  const chartData = [
    { name: 'Jan', rev: 45000 }, { name: 'Feb', rev: 52000 }, { name: 'Mar', rev: 48000 },
    { name: 'Apr', rev: 61000 }, { name: 'May', rev: 75000 }, { name: 'Jun', rev: (data?.totalRevenue || 0) }
  ];

  return (
    <div className="page on" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <div className="page-hdr" style={{ background: NAVY, color: '#fff', padding: '30px 40px', borderRadius: '0 0 30px 30px', marginBottom: 30 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>👑 EduVantage Command Center</h1>
          <p style={{ color: '#94A3B8', margin: '5px 0 0 0' }}>Global Oversight: {globalConfig.platformName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase' }}>Total Network Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FCD34D' }}>KES {(data?.totalRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="tabs" style={{ margin: '0 40px 30px', display: 'flex', gap: 10 }}>
        <TabBtn icon="📊" label="Overview" on={tab === 'overview'} onClick={() => setTab('overview')} />
        <TabBtn icon="🏫" label="Institutions" on={tab === 'schools'} onClick={() => setTab('schools')} />
        <TabBtn icon="⚙️" label="Global Settings" on={tab === 'settings'} onClick={() => setTab('settings')} />
        <TabBtn icon="📢" label="Broadcasts" on={tab === 'broadcast'} onClick={() => setTab('broadcast')} />
        <TabBtn icon="🕵️" label="Audit Logs" on={tab === 'audit'} onClick={() => setTab('audit')} />
      </div>

      <div style={{ padding: '0 40px 40px' }}>
        {tab === 'overview' && (
          <>
            <div className="sg sg4" style={{ marginBottom: 30 }}>
              <StatCard title="Active Schools" val={data?.activeSchools || 0} icon="🏫" bg="#F0FDF4" color="#166534" />
              <StatCard title="Total Students" val={schools.reduce((s,x)=>s+x.students,0)} icon="👥" bg="#F0F9FF" color="#0369A1" />
              <StatCard title="Expired Licenses" val={schools.filter(s => s.status === 'expired').length} icon="⚠️" bg="#FEF2F2" color="#991B1B" />
              <StatCard title="Growth Rate" val="+12.4%" icon="📈" bg="#F5F3FF" color="#5B21B6" />
            </div>

            <div className="sg" style={{ gridTemplateColumns: '2fr 1fr', gap: 25 }}>
              <div className="panel">
                <div className="panel-hdr"><h3>📈 Platform Revenue Growth</h3></div>
                <div className="panel-body" style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={M} stopOpacity={0.3}/><stop offset="95%" stopColor={M} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="rev" stroke={M} strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel">
                <div className="panel-hdr"><h3>🔔 Network Activity</h3></div>
                <div className="panel-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div className="activity-item"><strong>New Signup:</strong> Bright Future Academy joined.</div>
                    <div className="activity-item"><strong>Payment:</strong> St. Peters Academy renewed Premium.</div>
                    <div className="activity-item"><strong>Alert:</strong> St. Marys nearing data limit.</div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 25 }} onClick={() => setTab('broadcast')}>Broadcast Message</button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'schools' && (
          <div className="panel">
            <div className="panel-hdr"><h3>🏫 All Institutional Partitions</h3></div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th>School Identity</th><th>Service Plan</th><th>Learners</th><th>Status</th><th>Net Revenue</th><th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(s => (
                    <tr key={s.id}>
                      <td><div style={{ fontWeight: 800 }}>{s.name}</div><div style={{ fontSize: 10, color: SLATE }}>ID: {s.id}</div></td>
                      <td><span className={`badge ${s.plan === 'Premium' ? 'bg-gold' : 'bg-blue'}`}>{s.plan.toUpperCase()}</span></td>
                      <td><strong>{s.students}</strong></td>
                      <td><span className={`badge ${s.status === 'active' ? 'bg-green' : 'bg-red'}`}>{s.status.toUpperCase()}</span></td>
                      <td style={{ fontWeight: 900, color: EMERALD }}>KES {s.revenue.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => { localStorage.setItem('paav_impersonate_id', s.id); window.location.href = '/dashboard'; }}>Login</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => { setEditSchool(s); setShowConfig(true); }}>Config</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="sg sg2">
            <div className="panel">
              <div className="panel-hdr"><h3>🏢 Platform Branding</h3></div>
              <div className="panel-body">
                <div className="field"><label>Platform Name</label><input value={globalConfig.platformName} onChange={e => setGlobalConfig({...globalConfig, platformName: e.target.value})} /></div>
                <div className="field"><label>Platform Motto</label><input value={globalConfig.platformMotto} onChange={e => setGlobalConfig({...globalConfig, platformMotto: e.target.value})} /></div>
                <button className="btn btn-primary" onClick={saveGlobalConfig} disabled={saving}>Save Branding</button>
              </div>
            </div>
            <div className="panel">
              <div className="panel-hdr"><h3>📱 SMS Gateway (Africa&apos;s Talking)</h3></div>
              <div className="panel-body">
                <div className="field"><label>API Key</label><input type="password" value={globalConfig.smsGateway.apiKey} onChange={e => setGlobalConfig({...globalConfig, smsGateway: {...globalConfig.smsGateway, apiKey: e.target.value}})} /></div>
                <div className="field-row">
                  <div className="field"><label>Username</label><input value={globalConfig.smsGateway.username} onChange={e => setGlobalConfig({...globalConfig, smsGateway: {...globalConfig.smsGateway, username: e.target.value}})} /></div>
                  <div className="field"><label>Sender ID</label><input value={globalConfig.smsGateway.senderId} onChange={e => setGlobalConfig({...globalConfig, smsGateway: {...globalConfig.smsGateway, senderId: e.target.value}})} /></div>
                </div>
                <button className="btn btn-teal" onClick={saveGlobalConfig} disabled={saving}>Update SMS Gateway</button>
              </div>
            </div>
            <div className="panel">
              <div className="panel-hdr"><h3>💰 Default Pricing (KES)</h3></div>
              <div className="panel-body">
                <div className="field-row">
                  <div className="field"><label>Basic Plan</label><input type="number" value={globalConfig.pricing.basic} onChange={e => setGlobalConfig({...globalConfig, pricing: {...globalConfig.pricing, basic: e.target.value}})} /></div>
                  <div className="field"><label>Premium Plan</label><input type="number" value={globalConfig.pricing.premium} onChange={e => setGlobalConfig({...globalConfig, pricing: {...globalConfig.pricing, premium: e.target.value}})} /></div>
                </div>
                <button className="btn btn-primary" onClick={saveGlobalConfig} disabled={saving}>Save Pricing</button>
              </div>
            </div>
            <div className="panel" style={{ border: '2px dashed #EF4444' }}>
              <div className="panel-hdr"><h3 style={{ color: '#EF4444' }}>🚨 Danger Zone</h3></div>
              <div className="panel-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>Maintenance Mode</strong><p style={{ margin: 0, fontSize: 11, color: SLATE }}>Disable all school logins globally</p></div>
                  <input type="checkbox" checked={globalConfig.maintenanceMode} onChange={e => setGlobalConfig({...globalConfig, maintenanceMode: e.target.checked})} />
                </div>
                <button className="btn btn-danger" style={{ width: '100%', marginTop: 20 }} onClick={saveGlobalConfig}>Apply Maintenance State</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'broadcast' && (
          <div className="panel" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="panel-hdr"><h3>🚀 Global Network Broadcast</h3></div>
            <div className="panel-body">
              <div className="field">
                <label>Announcement Message</label>
                <textarea rows={4} value={announcement.message} onChange={e => setAnnouncement({...announcement, message: e.target.value})} placeholder="Message for all school administrators..." />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Priority</label>
                  <select value={announcement.priority} onChange={e => setAnnouncement({...announcement, priority: e.target.value})}>
                    <option value="normal">Normal (Blue)</option>
                    <option value="high">High (Yellow)</option>
                    <option value="critical">Critical (Red)</option>
                  </select>
                </div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 30 }}>
                  <input type="checkbox" checked={announcement.active} onChange={e => setAnnouncement({...announcement, active: e.target.checked})} />
                  <label style={{ margin: 0 }}>Active</label>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: 15 }} onClick={saveBroadcast} disabled={saving}>Push to All Dashboards</button>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="panel">
            <div className="panel-hdr"><h3>🕵️ Global Security Audit</h3></div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th>Timestamp</th><th>Institutional Tenant</th><th>User</th><th>Action Type</th><th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover-row"><td>Today, 10:45 AM</td><td>st-peters</td><td>mutimba.junior</td><td><span className="badge bg-blue">IMPERSONATE</span></td><td>Login as Admin for St. Peters</td></tr>
                  <tr className="hover-row"><td>Today, 09:20 AM</td><td>bright-future</td><td>admin</td><td><span className="badge bg-green">LOGIN</span></td><td>Standard Dashboard Access</td></tr>
                  <tr className="hover-row"><td>Yesterday, 04:30 PM</td><td>platform-master</td><td>mutimba.junior</td><td><span className="badge bg-amber">CONFIG</span></td><td>Updated Global SMS Gateway</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showConfig && editSchool && (
        <div className="modal-overlay open"><div className="modal" style={{ maxWidth: 400 }}><div className="modal-hdr"><h3>⚙️ Billing Config: {editSchool.name}</h3><button className="modal-close" onClick={() => setShowConfig(false)}>✕</button></div><div className="modal-body"><div className="field"><label>Service Plan</label><select value={editSchool.plan} onChange={e => setEditSchool({...editSchool, plan: e.target.value})}><option value="trial">Trial</option><option value="Basic">Basic</option><option value="Premium">Premium</option></select></div><div className="field-row"><div className="field"><label>Amount (KES)</label><input type="number" value={editSchool.amount} onChange={e => setEditSchool({...editSchool, amount: e.target.value})} /></div><div className="field"><label>Billing Cycle</label><select value={editSchool.cycle} onChange={e => setEditSchool({...editSchool, cycle: e.target.value})}><option value="termly">Termly</option><option value="annual">Annual</option></select></div></div><div className="field"><label>Status</label><select value={editSchool.status} onChange={e => setEditSchool({...editSchool, status: e.target.value})}><option value="active">Active</option><option value="expired">Expired</option><option value="suspended">Suspended</option></select></div></div><div className="modal-ftr"><button className="btn btn-ghost" onClick={() => setShowConfig(false)}>Cancel</button><button className="btn btn-primary" onClick={saveConfig} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</button></div></div></div>
      )}

      <style jsx>{`
        .activity-item { padding: 12px; background: #fff; border-radius: 8px; font-size: 13px; border-left: 3px solid ${M}; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .tabs { background: #E2E8F0; padding: 5px; border-radius: 15px; }
        .hover-row:hover { background: #F1F5F9; }
      `}</style>
    </div>
  );
}

function TabBtn({ icon, label, on, onClick }) {
  return (
    <button onClick={onClick} style={{ 
      flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: on ? '#fff' : 'transparent',
      color: on ? NAVY : SLATE, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '0.2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: on ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span> {label}
    </button>
  );
}

function StatCard({ title, val, icon, bg, color }) {
  return (
    <div className="panel" style={{ textAlign: 'center', borderBottom: `4px solid ${color}`, background: bg }}>
      <div style={{ fontSize: 32, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: NAVY }}>{val}</div>
      <div style={{ fontSize: 11, color: SLATE, fontWeight: 700, textTransform: 'uppercase' }}>{title}</div>
    </div>
  );
}
