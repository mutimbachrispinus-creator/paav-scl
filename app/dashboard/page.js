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

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fmtK } from '@/lib/cbe';
import { getCachedUser, getCachedDBMulti, invalidateDB, prefetchKeys } from '@/lib/client-cache';
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
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('paav_cache_user');
      if (raw) {
        const { v } = JSON.parse(raw);
        return v;
      }
    } catch {}
    return null;
  });

  const [learners, setLearners] = useState([]);
  const [paylog,   setPaylog]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [feeCfg,   setFeeCfg]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);
  const [heroUrl,  setHeroUrl]  = useState('');
  const heroFileRef = useRef(null);

  /* ── Load current user + data ── */
  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti([
          'paav6_learners',
          'paav6_paylog',
          'paav6_msgs',
          'paav6_feecfg',
          'paav7_hero_img'
        ])
      ]);

      if (!u) { router.push('/'); return; }
      setUser(u);
      if (u.role === 'parent') { 
        router.replace('/parent-home'); 
        return; 
      }

      setLearners(db.paav6_learners || []);
      setPaylog(  db.paav6_paylog   || []);
      setMessages(db.paav6_msgs     || []);
      setFeeCfg(  db.paav6_feecfg   || {});
      if (db.paav7_hero_img) setHeroUrl(db.paav7_hero_img);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);
  
  useEffect(() => {
    const handler = (e) => {
      const changed = e.detail?.changed || [];
      if (changed.some(k => ['paav6_paylog', 'paav6_learners', 'paav6_msgs'].includes(k))) {
        load();
      }
    };
    window.addEventListener('paav:sync', handler);
    return () => window.removeEventListener('paav:sync', handler);
  }, [load]);


  /* ── Derived stats ── */
  function getAnnualFee(grade) {
    return feeCfg[grade]?.annual || 5000;
  }
  function getBal(l) {
    return getAnnualFee(l.grade) + (l.arrears || 0) - (l.t1 || 0) - (l.t2 || 0) - (l.t3 || 0);
  }

  const totalPaid = learners.reduce((s, l) => s + (l.t1||0) + (l.t2||0) + (l.t3||0), 0);
  const totalAccumulated = learners.reduce((s, l) => s + (l.arrears || 0), 0);
  const totalExp  = learners.reduce((s, l) => s + getAnnualFee(l.grade), 0) + totalAccumulated;
  const cleared   = learners.filter(l => getBal(l) <= 0).length;
  const unread    = messages.filter(m =>
    m.to === 'ALL' || m.to === 'ALL_STAFF'
  ).length;
  const collectionPct = totalExp ? Math.round((totalPaid / totalExp) * 100) : 0;

  /* ── Render ── */
  const picRef = useRef(null);
  function triggerPhotoPick() { if (picRef.current) picRef.current.click(); }
  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
        else       { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        try {
          const res = await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ requests:[{ type:'updateStaffAvatar', id: user.id, avatar: dataUrl }] }) });
          const out = await res.json();
          if (!res.ok) throw new Error(out.error || 'API request failed');
          if (out.results?.[0]?.error) throw new Error(out.results[0].error);
          playSuccessSound();
          setUser(u=>({...u, avatar:dataUrl}));

        } catch(err) { alert('Upload failed: ' + err.message); } finally { setBusy(false); }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function uploadHero(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1200;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
        else       { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL('image/jpeg', 0.8);
        setHeroUrl(b64);
        try {
          await fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_hero_img', value: b64 }] })
          });
          playSuccessSound();
        } catch {}

      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (loading || !user || user.role === 'parent') return (
    <div className="page on" id="pg-dashboard">
      <div className="skeleton" style={{ height: 140, borderRadius: 12, marginBottom: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="stat-card" style={{ height: 88 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', padding:'0 16px', height:'100%' }}>
              <div className="skeleton" style={{ width:44, height:44, borderRadius:12, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div className="skeleton" style={{ height:18, marginBottom:8, width:'55%' }} />
                <div className="skeleton" style={{ height:12, width:'75%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[1,2].map(i => <div key={i} className="skeleton" style={{ height:220, borderRadius:12 }} />)}
      </div>
    </div>
  );


  return (
    <div className="page on" id="pg-dashboard">
      {/* ── Hero Banner ── */}
      <div className="hero-banner" style={{ marginBottom: 22 }}>
        {heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt="School Hero" />
        )}
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800 }}>
            PAAV Gitombo Community School
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 3 }}>More Than Academics!</div>
        </div>
        {user?.role === 'admin' && (
          <>
            <input ref={heroFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadHero} />
            <button className="hero-upload-btn no-print" onClick={() => heroFileRef.current?.click()}>
              🖼️ {heroUrl ? 'Change Hero Photo' : 'Upload Hero Photo'}
            </button>
          </>
        )}
      </div>

      <div className="page-hdr">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div 
            style={{ width: 80, height: 80, borderRadius: '50%', background: user.color || '#2563EB', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '3px solid rgba(139,26,26,0.2)', transition: 'transform .2s' }}
            onClick={openProfile}
            title="Click to view your profile"
          >
            <input ref={picRef} type="file" accept="image/*" capture="user" style={{display:'none'}} onChange={handlePhotoPick} />
            {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.emoji || '👤')}
          </div>
          <div>
            <h2>Jambo, {user.name}!</h2>
            <p>Welcome to your school portal command center.</p>
          </div>
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

      {/* ── Quick Access Panel — ALL role-based tabs ── */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-hdr" style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)' }}>
          <h3 style={{ color: '#fff' }}>⚡ Quick Access</h3>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
          {(() => {
            const navTabs = ALL_NAV.filter(n => n.roles.includes(user?.role || 'member'));
            return navTabs.map(t => {
              const href = t.key === 'classes' ? '/classes' : `/${t.key}`;
              return (
                <Link 
                  key={t.key} 
                  href={href} 
                  className="quick-access-btn"
                  onMouseEnter={() => t.prefetch && prefetchKeys(t.prefetch)}
                >
                  <span className="qa-icon">{t.icon}</span>
                  {t.label}
                </Link>
              );
            });
          })()}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="sg sg4">
        <StatCard icon="🎓" bg="#EFF6FF" value={learners.length} label="Total Learners" 
          onMouseEnter={() => prefetchKeys(['paav6_learners'])}
          onClick={() => router.push('/learners')} 
        />
        {user?.role === 'admin' && (
          <StatCard icon="💰" bg="#ECFDF5" value={fmtK(totalPaid)} label="Fees Collected"
            sub={`${collectionPct}% of target`} subBg="#ECFDF5" subColor="var(--green)" 
            onMouseEnter={() => prefetchKeys(['paav6_paylog', 'paav6_feecfg'])}
            onClick={() => router.push('/fees')}
          />
        )}
        {user?.role === 'admin' && (
          <StatCard icon="✅" bg="#F5F3FF" value={cleared} label="Fully Cleared"
            sub={`${learners.length - cleared} with balance`} subBg="#FEF3C7" subColor="var(--amber)" 
            onMouseEnter={() => prefetchKeys(['paav6_learners'])}
            onClick={() => router.push('/learners')}
          />
        )}
        <StatCard icon="💬" bg="#EFF6FF" value={unread} label="New Messages"
          onMouseEnter={() => prefetchKeys(['paav6_msgs'])}
          onClick={() => router.push('/dashboard?tab=messages')} 
        />
      </div>

      {/* ── Charts row ── */}
      <div className="sg sg2">
        {/* Enrolment bars */}
        {user?.role === 'admin' && (
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
        )}

        {user?.role === "admin" && (
        <div className="panel">
          {/* Fee collection bars */}
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
        )}
      </div>

      {user?.role === "admin" && (
      <div className="panel">
        {/* ── Recent payments ── */}
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
      )}
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
