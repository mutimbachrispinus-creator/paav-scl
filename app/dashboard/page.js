'use client';
/**
 * app/dashboard/page.js — Role-based home dashboard
 *
 * Renders different content based on the current user's role:
 *   admin/teacher/staff → stat cards, enrolment bars, fee collection bars, recent payments
 *   parent              → redirected to /dashboard?tab=parent-home (handled by layout)
 *
 * Data is loaded from /api/db (Turso KV) on mount.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fmtK } from '@/lib/cbe';
import { PRE, LOWER, UPPER, JSS, SENIOR } from '@/lib/cbe';

const ALL_GRADE_GROUPS = [
  { label: 'Pre-School', color: '#0D9488', grades: PRE },
  { label: 'Lower Pri',  color: '#059669', grades: LOWER },
  { label: 'Upper Pri',  color: '#2563EB', grades: UPPER },
  { label: 'JSS',        color: '#7C3AED', grades: JSS },
  { label: 'Senior',     color: '#B91C1C', grades: SENIOR },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [learners, setLearners] = useState([]);
  const [paylog,   setPaylog]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [feeCfg,   setFeeCfg]   = useState({});
  const [loading,  setLoading]  = useState(true);

  /* ── Load current user + data ── */
  const load = useCallback(async () => {
    try {
      // Get session
      const authRes = await fetch('/api/auth');
      const auth    = await authRes.json();
      if (!auth.ok || !auth.user) { router.push('/'); return; }
      setUser(auth.user);

      // Parent → redirect to parent home
      if (auth.user.role === 'parent') {
        router.push('/dashboard?tab=parent-home');
        return;
      }

      // Load data
      const dbRes = await fetch('/api/db', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          requests: [
            { type: 'get', key: 'paav6_learners' },
            { type: 'get', key: 'paav6_paylog'   },
            { type: 'get', key: 'paav6_msgs'      },
            { type: 'get', key: 'paav6_feecfg'   },
          ],
        }),
      });
      const db = await dbRes.json();

      setLearners(db.results[0]?.value || []);
      setPaylog(  db.results[1]?.value || []);
      setMessages(db.results[2]?.value || []);
      setFeeCfg(  db.results[3]?.value || {});
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  /* ── Derived stats ── */
  function getAnnualFee(grade) {
    return feeCfg[grade]?.annual || 5000;
  }
  function getBal(l) {
    return getAnnualFee(l.grade) - (l.t1 || 0) - (l.t2 || 0) - (l.t3 || 0);
  }

  const totalPaid = learners.reduce((s, l) => s + (l.t1||0) + (l.t2||0) + (l.t3||0), 0);
  const totalExp  = learners.reduce((s, l) => s + getAnnualFee(l.grade), 0);
  const cleared   = learners.filter(l => getBal(l) <= 0).length;
  const unread    = messages.filter(m =>
    m.to === 'ALL' || m.to === 'ALL_STAFF'
  ).length;
  const collectionPct = totalExp ? Math.round((totalPaid / totalExp) * 100) : 0;

  /* ── Render ── */
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="page on" id="pg-dashboard">
      <div className="page-hdr">
        <div>
          <h2>📊 Dashboard</h2>
          <p>PAAV Gitombo Community School — Overview</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ── Teacher banner ── */}
      {user?.role === 'teacher' && user.grade && (
        <div style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)', borderRadius: 'var(--r)',
          padding: '16px 20px', marginBottom: 18, color: '#fff', display: 'flex', gap: 14,
          alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28 }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 800 }}>
              Your Class: {user.grade}
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
              {learners.filter(l => l.grade === user.grade).length} learners enrolled
            </div>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="sg sg4">
        <StatCard icon="🎓" bg="#EFF6FF" value={learners.length} label="Total Learners" />
        <StatCard icon="💰" bg="#ECFDF5" value={fmtK(totalPaid)} label="Fees Collected"
          sub={`${collectionPct}% of target`} subBg="#ECFDF5" subColor="var(--green)" />
        <StatCard icon="✅" bg="#F5F3FF" value={cleared} label="Fully Cleared"
          sub={`${learners.length - cleared} with balance`} subBg="#FEF3C7" subColor="var(--amber)" />
        <StatCard icon="💬" bg="#EFF6FF" value={unread} label="New Messages"
          onClick={() => router.push('/dashboard?tab=messages')} />
      </div>

      {/* ── Charts row ── */}
      <div className="sg sg2">
        {/* Enrolment bars */}
        <div className="panel">
          <div className="panel-hdr"><h3>📚 Enrolment</h3></div>
          <div className="panel-body">
            {[...PRE, ...LOWER, ...UPPER, ...JSS, ...SENIOR].map(grade => {
              const count = learners.filter(l => l.grade === grade).length;
              const pct   = Math.min(100, count * 8);
              const col   = SENIOR.includes(grade) ? '#B91C1C'
                          : JSS.includes(grade)    ? '#7C3AED'
                          : UPPER.includes(grade)  ? '#2563EB'
                          : LOWER.includes(grade)  ? '#059669' : '#0D9488';
              return (
                <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 9,
                  marginBottom: 6, fontSize: 11.5 }}>
                  <div style={{ width: 78, color: 'var(--muted)', flexShrink: 0, fontSize: 10 }}>
                    {grade.replace('KINDERGARTEN','KG')}
                  </div>
                  <div style={{ flex: 1, background: '#EEF2FF', borderRadius: 4, height: 17, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', background: col,
                      borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 7px' }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fee collection bars */}
        <div className="panel">
          <div className="panel-hdr"><h3>💰 Fee Collection</h3></div>
          <div className="panel-body">
            {ALL_GRADE_GROUPS.map(({ label, color, grades }) => {
              const paid = learners.filter(l => grades.includes(l.grade))
                .reduce((s, l) => s + (l.t1||0) + (l.t2||0) + (l.t3||0), 0);
              const exp  = learners.filter(l => grades.includes(l.grade))
                .reduce((s, l) => s + getAnnualFee(l.grade), 0);
              const pct  = exp ? Math.round((paid / exp) * 100) : 0;
              return (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ color: 'var(--muted)' }}>{fmtK(paid)} / {fmtK(exp)}</span>
                  </div>
                  <div style={{ height: 9, background: '#EEF2FF', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5 }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>{pct}%</div>
                </div>
              );
            })}
            <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 12, textAlign: 'center',
              marginTop: 6 }}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 28, fontWeight: 800,
                color: 'var(--navy)' }}>{collectionPct}%</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700,
                textTransform: 'uppercase' }}>Overall Collection Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent payments ── */}
      <div className="panel">
        <div className="panel-hdr">
          <h3>📥 Recent Payments</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/fees')}>
            All Fees
          </button>
        </div>
        <div className="panel-body">
          {paylog.slice(-5).reverse().map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, background: 'var(--green-bg)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0 }}>💰</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                  {p.name}
                  <span className="badge bg-blue" style={{ fontSize: 10, marginLeft: 6 }}>
                    {p.term?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {p.method} · {p.date}
                </div>
              </div>
              <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: 12.5 }}>
                {fmtK(p.amount)}
              </div>
            </div>
          ))}
          {paylog.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>No payments yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function StatCard({ icon, bg, value, label, sub, subBg, subColor, onClick }) {
  return (
    <div className="stat-card" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="sc-inner">
        <div className="sc-icon" style={{ background: bg }}>{icon}</div>
        <div>
          <div className="sc-n">{value}</div>
          <div className="sc-l">{label}</div>
          {sub && (
            <div className="sc-sub" style={{ background: subBg, color: subColor }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page on">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="stat-card"
            style={{ height: 90, background: '#F1F5F9', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );
}
