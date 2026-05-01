'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCachedUser, getCachedDBMulti, prefetchKeys } from '@/lib/client-cache';
import { ALL_NAV } from '@/lib/navigation';
import { PRE, LOWER, UPPER, JSS, SENIOR, getAnnualFee } from '@/lib/school-config';

const ALL_GRADE_GROUPS = [
  { label: 'Pre-School', color: '#8B5CF6', grades: PRE },
  { label: 'Lower Primary', color: '#10B981', grades: LOWER },
  { label: 'Upper Primary', color: '#3B82F6', grades: UPPER },
  { label: 'Junior School', color: '#F59E0B', grades: JSS },
  { label: 'Senior School', color: '#EF4444', grades: SENIOR },
];

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '80vh' }} />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [themePrimary, setThemePrimary] = useState('#1E293B');

  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti([
          'paav6_learners', 
          'paav6_msgs', 
          'paav_theme'
        ])
      ]);

      if (!u) { router.push('/login'); return; }
      setUser(u);
      
      if (db.paav_theme) setThemePrimary(db.paav_theme.primary || '#1E293B');

      const l = db.paav6_learners || [];
      setLearners(l);

      const m = db.paav6_msgs || [];
      setUnread(m.filter(x => !x.read && x.to === u.username).length);
      
      // Warm up other common keys
      prefetchKeys(['paav_school_profile', 'paav_hero_img', 'paav6_fin_config']);

    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="skeleton" style={{ height: '80vh' }} />;
  if (!user) return null;

  const isSuper = user.tenantId === 'platform-master' && user.role === 'super-admin';
  const totalPaid = learners.reduce((s, l) => s + (l.t1||0) + (l.t2||0) + (l.t3||0), 0);
  const totalExp  = learners.reduce((s, l) => s + getAnnualFee(l.grade), 0);
  const collectionPct = totalExp ? Math.round((totalPaid / totalExp) * 100) : 0;
  const cleared   = learners.filter(l => ((l.t1||0) + (l.t2||0) + (l.t3||0)) >= getAnnualFee(l.grade)).length;

  const fmtK = (v) => v >= 1000 ? (v/1000).toFixed(1)+'k' : v;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>Welcome, {user.name}</h2>
          <p>{isSuper ? 'EduVantage Platform Oversight' : 'Here is your institutional overview for today.'}</p>
        </div>
        <div className="page-hdr-acts">
           <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh Data</button>
        </div>
      </div>

      {/* ── Super Admin Oversight Info ── */}
      {isSuper && (
        <div className="panel" style={{ marginBottom: 18, background: '#FEF9C3', border: '1px solid #FDE047' }}>
          <div className="panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ fontSize: 13, fontWeight: 700, color: '#854D0E' }}>👑 You are in Platform Oversight Mode. Access the Command Center for global metrics.</div>
             <Link href="/super-admin" className="btn btn-primary btn-sm">Enter Command Center</Link>
          </div>
        </div>
      )}

      {!isSuper && (
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

      <style jsx>{`
        .quick-access-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 15px 10px; background: #F8FAFC; border-radius: 12px; text-decoration: none; color: var(--navy); font-size: 11px; font-weight: 700; transition: 0.2s; border: 1.5px solid #E2E8F0; text-align: center; }
        .quick-access-btn:hover { background: #EEF2FF; border-color: #2563EB; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.1); }
        .qa-icon { font-size: 24px; }
      `}</style>
    </div>
  );
}

function SuperAdminRedirect() {
  const router = useRouter();
  useEffect(() => { router.push('/super-admin'); }, [router]);
  return null;
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
