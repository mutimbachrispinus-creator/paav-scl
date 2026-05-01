'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser } from '@/lib/client-cache';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const M = '#2563EB', GOLD = '#D4AF37', NAVY = '#0F172A', EMERALD = '#10B981';

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || (u.tenantId !== 'platform-master' && u.role !== 'super-admin')) { 
      router.push('/login'); return; 
    }

    try {
      const res = await fetch('/api/saas/stats');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      console.error('Failed to load saas stats:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

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
          <h1 style={{ margin: 0, fontSize: 28 }}>👑 EduVantage Super-Admin Command</h1>
          <p style={{ color: '#94A3B8', margin: '5px 0 0 0' }}>Global oversight of the EduVantage Platform Network</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase' }}>Total Monthly Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FCD34D' }}>KES {(data?.totalRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="sg sg4" style={{ marginBottom: 30 }}>
        <StatCard title="Active Schools" val={data?.activeSchools || 0} icon="🏫" bg="#F0FDF4" color="#166534" />
        <StatCard title="Total Students" val={schools.reduce((s,x)=>s+x.students,0)} icon="👥" bg="#F0F9FF" color="#0369A1" />
        <StatCard title="Expired Licenses" val={schools.filter(s => s.status === 'expired').length} icon="⚠️" bg="#FEF2F2" color="#991B1B" />
        <StatCard title="Churn Rate" val="0.0%" icon="📉" bg="#F5F3FF" color="#5B21B6" />
      </div>

      <div className="sg" style={{ gridTemplateColumns: '2fr 1fr', gap: 25 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>📈 Platform Revenue Growth</h3></div>
          <div className="panel-body" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={M} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={M} stopOpacity={0}/>
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
              <div className="activity-item"><strong>Payment:</strong> EduVantage Gitombo renewed Premium.</div>
              <div className="activity-item"><strong>Alert:</strong> St. Marys nearing data limit.</div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 25 }}>Broadcast Message to All Schools</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 25 }}>
        <div className="panel-hdr"><h3>🏫 School Directory & Subscription Management</h3></div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th>School Name</th>
                <th>Plan</th>
                <th>Students</th>
                <th>Status</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong><br/><span style={{ fontSize: 10, color: 'var(--muted)' }}>Last Sync: {s.lastSync}</span></td>
                  <td><span className={`badge ${s.plan === 'Premium' ? 'bg-gold' : 'bg-blue'}`}>{s.plan}</span></td>
                  <td>{s.students}</td>
                  <td><span className={`badge ${s.status === 'Active' ? 'bg-green' : 'bg-red'}`}>{s.status}</span></td>
                  <td style={{ fontWeight: 800 }}>KSH {s.revenue.toLocaleString()}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost">Impersonate</button>
                    <button className="btn btn-sm btn-ghost" style={{ marginLeft: 5 }}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .activity-item { padding: 12px; background: #F8FAFC; border-radius: 8px; font-size: 13px; border-left: 3px solid ${M}; }
        @media (max-width: 800px) {
          .sg { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, val, icon, bg, color }) {
  return (
    <div className="panel" style={{ textAlign: 'center', borderBottom: `4px solid ${color}` }}>
      <div style={{ fontSize: 32, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: NAVY }}>{val}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{title}</div>
    </div>
  );
}
