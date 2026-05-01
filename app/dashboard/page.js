'use client';
/**
 * app/dashboard/page.js — Role-based home dashboard
 * Updated with Blue Super Admin Theme and Management Features.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fmtK } from '@/lib/cbe';
import { getCachedUser, getCachedDBMulti, prefetchKeys } from '@/lib/client-cache';
import { ALL_NAV } from '@/lib/navigation';
import { PRE, LOWER, UPPER, JSS, SENIOR } from '@/lib/cbe';
import { useProfile } from '@/app/PortalShell';

const ALL_GRADE_GROUPS = [
  { label: 'Pre-School', color: '#0D9488', grades: PRE },
  { label: 'Lower Pri',  color: '#059669', grades: LOWER },
  { label: 'Upper Pri',  color: '#2563EB', grades: UPPER },
  { label: 'JSS',        color: '#7C3AED', grades: JSS },
  { label: 'Senior',     color: '#B91C1C', grades: SENIOR },
];

export default function DashboardPage() {
  const router = useRouter();
  const { openProfile, playSuccessSound } = useProfile();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [paylog,   setPaylog]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [feeCfg,   setFeeCfg]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [heroUrl,  setHeroUrl]  = useState('');
  const [profile,  setProfile]  = useState({ name: 'EduVantage Portal', motto: 'Innovation in Education' });
  const [subscription, setSubscription] = useState(null);

  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti([
          'paav6_learners',
          'paav6_paylog',
          'paav6_msgs',
          'paav6_feecfg',
          'paav7_hero_img',
          'paav_school_profile'
        ])
      ]);

      if (!u) { router.push('/login'); return; }
      setUser(u);
      
      if (db.paav_school_profile) setProfile(db.paav_school_profile);
      setLearners(db.paav6_learners || []);
      setPaylog(  db.paav6_paylog   || []);
      setMessages(db.paav6_msgs     || []);
      setFeeCfg(  db.paav6_feecfg   || {});
      if (db.paav7_hero_img) setHeroUrl(db.paav7_hero_img);

      // Check subscription
      const subRes = await fetch(`/api/saas/subscription?tenant=${u.tenantId}`);
      if (subRes.ok) setSubscription(await subRes.json());

    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);
  
  function getAnnualFee(grade) { return feeCfg[grade]?.annual || 5000; }
  function getBal(l) { return getAnnualFee(l.grade) + (l.arrears || 0) - (l.t1 || 0) - (l.t2 || 0) - (l.t3 || 0); }

  const totalPaid = learners.reduce((s, l) => s + (l.t1||0) + (l.t2||0) + (l.t3||0), 0);
  const totalAccumulated = learners.reduce((s, l) => s + (l.arrears || 0), 0);
  const totalExp  = learners.reduce((s, l) => s + getAnnualFee(l.grade), 0) + totalAccumulated;
  const cleared   = learners.filter(l => getBal(l) <= 0).length;
  const unread    = messages.filter(m => m.to === 'ALL' || m.to === 'ALL_STAFF').length;
  const collectionPct = totalExp ? Math.round((totalPaid / totalExp) * 100) : 0;

  if (loading || !user) return <LoadingSkeleton />;

  const isSuper = user.role === 'super-admin';
  const themePrimary = isSuper ? '#1E40AF' : (profile.theme?.primary || '#2563EB');

  return (
    <div className="page on" id="pg-dashboard">
      <style jsx global>{`
        :root { --primary: ${themePrimary}; }
      `}</style>

      {/* ── Subscription Alert ── */}
      {subscription?.status === 'trial' && user.role === 'admin' && (
        <div className="alert alert-warning" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Trial Period:</strong> Your free trial expires in {Math.ceil((new Date(subscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24))} days.
          </div>
          <Link href="/settings?tab=billing" className="btn btn-sm btn-solid" style={{ width: 'auto' }}>Subscribe Now</Link>
        </div>
      )}

      {/* ── Hero Banner (Hidden for Super Admin) ── */}
      {!isSuper && (
        <div className="hero-banner" style={{ marginBottom: 22 }}>
          {heroUrl && <img src={heroUrl} alt="School Hero" />}
          <div className="hero-banner-overlay" />
          <div className="hero-banner-content">
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800 }}>{profile.name}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 3 }}>{profile.motto}</div>
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div 
            style={{ width: 80, height: 80, borderRadius: '50%', background: user.color || '#2563EB', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: `3px solid ${themePrimary}33` }}
            onClick={openProfile}
          >
            {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.emoji || '👤')}
          </div>
          <div>
            <h2>Jambo, {user.name}!</h2>
            <p>{isSuper ? 'EduVantage Platform Command Center' : `Welcome to the ${profile.name} dashboard.`}</p>
          </div>
        </div>
      </div>

      {/* ── SUPER ADMIN VIEW ── */}
      {isSuper ? (
        <SuperAdminDashboard />
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-hdr" style={{ background: `linear-gradient(135deg, ${themePrimary}, #1E3A8A)` }}>
              <h3 style={{ color: '#fff' }}>⚡ Quick Access</h3>
            </div>
            <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
              {ALL_NAV.filter(n => n.roles.includes(user.role)).map(t => (
                <Link key={t.key} href={t.key === 'classes' ? '/classes' : `/${t.key}`} className="quick-access-btn">
                  <span className="qa-icon">{t.icon}</span> {t.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="sg sg4">
            <StatCard icon="🎓" bg="#EFF6FF" value={learners.length} label="Learners" onClick={() => router.push('/learners')} />
            {user.role === 'admin' && (
              <>
                <StatCard icon="💰" bg="#ECFDF5" value={fmtK(totalPaid)} label="Collected" sub={`${collectionPct}% Rate`} subBg="#ECFDF5" subColor="#059669" onClick={() => router.push('/fees')} />
                <StatCard icon="✅" bg="#F5F3FF" value={cleared} label="Cleared" sub={`${learners.length - cleared} pending`} subBg="#FEF3C7" subColor="#D97706" onClick={() => router.push('/learners')} />
              </>
            )}
            <StatCard icon="💬" bg="#EFF6FF" value={unread} label="Messages" onClick={() => router.push('/dashboard?tab=messages')} />
          </div>

          <div className="sg sg2">
            {user.role === 'admin' && (
              <div className="panel">
                <div className="panel-hdr"><h3>📚 Enrolment</h3></div>
                <div className="panel-body">
                  {[...PRE, ...LOWER, ...UPPER, ...JSS, ...SENIOR].map(grade => {
                    const count = learners.filter(l => l.grade === grade).length;
                    const pct   = Math.min(100, count * 8);
                    return (
                      <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, fontSize: 11.5 }}>
                        <div style={{ width: 78, color: 'var(--muted)', flexShrink: 0, fontSize: 10 }}>{grade}</div>
                        <div style={{ flex: 1, background: '#EEF2FF', borderRadius: 4, height: 17, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', background: '#2563EB', borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 7px' }}>
                            <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {user.role === 'admin' && (
              <div className="panel">
                <div className="panel-hdr"><h3>💰 Fee Collection</h3></div>
                <div className="panel-body">
                  {ALL_GRADE_GROUPS.map(({ label, color, grades }) => {
                    const paid = learners.filter(l => grades.includes(l.grade)).reduce((s, l) => s + (l.t1||0) + (l.t2||0) + (l.t3||0), 0);
                    const exp  = learners.filter(l => grades.includes(l.grade)).reduce((s, l) => s + getAnnualFee(l.grade), 0);
                    const pct  = exp ? Math.round((paid / exp) * 100) : 0;
                    return (
                      <div key={label} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ fontWeight: 600 }}>{label}</span>
                          <span style={{ color: 'var(--muted)' }}>{fmtK(paid)} / {fmtK(exp)}</span>
                        </div>
                        <div style={{ height: 9, background: '#EEF2FF', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [globalConfig, setGlobalConfig] = useState({ paymentMethods: [] });
  const [newMethod, setNewMethod] = useState('');

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/saas/schools').then(r => r.json()),
      fetch('/api/saas/global-config').then(r => r.json())
    ]).then(([d, c]) => {
      setData(d);
      setGlobalConfig(c);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveConfig(newConfig) {
    await fetch('/api/saas/global-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    setGlobalConfig(newConfig);
  }

  function addMethod() {
    if (!newMethod) return;
    const next = { ...globalConfig, paymentMethods: [...globalConfig.paymentMethods, newMethod] };
    saveConfig(next);
    setNewMethod('');
  }

  function removeMethod(m) {
    const next = { ...globalConfig, paymentMethods: globalConfig.paymentMethods.filter(x => x !== m) };
    saveConfig(next);
  }

  async function deleteSchool(tenantId) {
    if (!confirm(`Are you sure you want to PERMANENTLY remove ${tenantId}? This cannot be undone.`)) return;
    const res = await fetch(`/api/saas/schools/delete?tenant=${tenantId}`, { method: 'DELETE' });
    if (res.ok) load();
    else alert('Failed to delete school');
  }

  if (!data) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <div className="sa-dashboard">
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-hdr" style={{ background: '#1E40AF' }}>
          <h3 style={{ color: '#fff' }}>⚡ Master Quick Access</h3>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
          {ALL_NAV.filter(n => n.roles.includes('super-admin')).map(t => (
            <Link key={t.key} href={t.key === 'classes' ? '/classes' : `/${t.key}`} className="quick-access-btn">
              <span className="qa-icon">{t.icon}</span> {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="sg sg3" style={{ marginBottom: 24 }}>
        <StatCard icon="🏫" bg="#DBEAFE" value={data.stats.totalSchools} label="Schools Onboarded" />
        <StatCard icon="👥" bg="#DCFCE7" value={data.stats.totalStudents} label="Global Students" />
        <StatCard icon="💎" bg="#FEF3C7" value={data.stats.activeSchools} label="Premium Schools" />
      </div>

      <div className="sg sg2" style={{ marginBottom: 24 }}>
        {/* Global Payment Methods */}
        <div className="panel">
          <div className="panel-hdr" style={{ background: '#059669' }}>
            <h3 style={{ color: '#fff' }}>💳 Global Payment Methods</h3>
          </div>
          <div className="panel-body">
             <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                <input className="input" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }} placeholder="e.g. Bank Transfer" value={newMethod} onChange={e => setNewMethod(e.target.value)} />
                <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={addMethod}>Add</button>
             </div>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {globalConfig.paymentMethods.map(m => (
                  <div key={m} className="badge bg-blue" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m} <span style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeMethod(m)}>✕</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Pricing Configuration */}
        <div className="panel">
          <div className="panel-hdr" style={{ background: '#2563EB' }}>
            <h3 style={{ color: '#fff' }}>💰 Platform Pricing (KES)</h3>
          </div>
          <div className="panel-body">
             <div className="field-row">
               <div className="field">
                 <label>Termly Rate</label>
                 <input type="number" className="input" value={globalConfig.pricing?.termly || ''} onChange={e => saveConfig({...globalConfig, pricing: {...globalConfig.pricing, termly: parseInt(e.target.value)}})} />
               </div>
               <div className="field">
                 <label>Yearly Rate</label>
                 <input type="number" className="input" value={globalConfig.pricing?.yearly || ''} onChange={e => saveConfig({...globalConfig, pricing: {...globalConfig.pricing, yearly: parseInt(e.target.value)}})} />
               </div>
             </div>
             <p style={{ fontSize: 11, color: '#64748B', marginTop: 10 }}>Note: These rates are shown to schools during signup and in their billing settings.</p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-hdr" style={{ background: '#1E40AF' }}>
          <h3 style={{ color: '#fff' }}>📞 Master Support Escalation</h3>
        </div>
        <div className="panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <div style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF' }}>+254 792 656 579</div>
             <div style={{ fontSize: 12, color: '#64748B' }}>Direct line for Super Admin institutional support.</div>
           </div>
           <div style={{ textAlign: 'right' }}>
             <div style={{ fontWeight: 700 }}>portal@eduvantage.app</div>
             <div style={{ fontSize: 11, color: '#64748B' }}>Official Platform Support Email</div>
           </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr" style={{ background: '#0F172A' }}>
          <h3 style={{ color: '#fff' }}>🚀 Institutional Network</h3>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>School Name</th>
                <th>Students</th>
                <th>Admin Contact</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.schools.map(s => (
                <tr key={s.tenantId}>
                  <td style={{ fontFamily: 'monospace' }}>{s.tenantId}</td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.studentCount}</td>
                  <td style={{ fontSize: 12 }}>{s.adminContact}</td>
                  <td><span className={`badge ${s.status === 'active' ? 'bg-green' : 'bg-red'}`}>{s.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-ghost" style={{ color: '#DC2626' }} onClick={() => deleteSchool(s.tenantId)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, value, label, sub, subBg, subColor, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="sc-inner">
        <div className="sc-icon" style={{ background: bg }}>{icon}</div>
        <div>
          <div className="sc-n">{value}</div>
          <div className="sc-l">{label}</div>
          {sub && <div className="sc-sub" style={{ background: subBg, color: subColor }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page on">
      <div className="skeleton" style={{ height: 140, borderRadius: 12, marginBottom: 22 }} />
      <div className="sg sg4">
        {[1,2,3,4].map(i => <div key={i} className="stat-card skeleton" style={{ height: 90 }} />)}
      </div>
    </div>
  );
}
