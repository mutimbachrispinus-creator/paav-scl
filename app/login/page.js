'use client';
/**
 * app/login/page.js — Faithfully Restored Legacy Login Page (v122 Styles)
 * Updated for EduVantage SaaS Platform.
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { prefetchKeys, clearAllCache, fetchWithRetry, hydrateCache } from '@/lib/client-cache';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Default to empty or neutral if no tenant provided
  const tenantId = searchParams.get('tenant') || 'platform-master';

  const [tab, setTab] = useState('login'); 
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState('');
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  
  const [stats, setStats] = useState({ learners: 0, classes: 0 });
  const [announcement, setAnnouncement] = useState('Welcome to the EduVantage School Network.');
  const [profile, setProfile] = useState({ 
    name: tenantId === 'platform-master' ? 'EduVantage Master Console' : 'EduVantage School', 
    tagline: 'Global Education SaaS Network',
    logo: '/eduvantage-logo.png'
  });
  const [heroImg, setHeroImg] = useState('');
  const [theme, setTheme] = useState({ 
    primary: tenantId === 'platform-master' ? '#1E40AF' : '#2563EB', 
    secondary: '#D4AF37' 
  });

  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');

  useEffect(() => {
    async function loadSchools() {
      try {
        const res = await fetch('/api/saas/schools');
        const data = await res.json();
        if (data.ok) setSchools(data.schools);
      } catch (e) {}
    }
    loadSchools();
  }, []);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/saas/config?tenant=${tenantId}`);
        const data = await res.json();
        if (data.profile) {
          setProfile({
            name: data.profile.name,
            tagline: data.profile.tagline || data.profile.motto || 'Education Portal',
            phone: data.profile.phone,
            email: data.profile.email,
            logo: data.profile.logo || '/eduvantage-logo.png'
          });
        }
        if (data.announcement) setAnnouncement(data.announcement);
        if (data.theme) {
          setTheme(data.theme);
          document.documentElement.style.setProperty('--primary', data.theme.primary);
          document.documentElement.style.setProperty('--secondary', data.theme.secondary);
        }

        // Load stats for this tenant
        const endpoint = tenantId === 'platform-master' ? '/api/saas/stats' : `/api/stats?tenant=${tenantId}`;
        const sRes = await fetch(endpoint);
        const s = await sRes.json();
        if (tenantId === 'platform-master') {
          setStats({ 
            totalSchools: s.totalSchools, 
            activeSchools: s.activeSchools || 0 
          });
        } else {
          setStats(s);
        }

      } catch (e) {
        console.error('Config load error:', e);
      }
    }
    loadConfig();
  }, [tenantId]);

  const [form, setForm] = useState({
    username: '', password: '', 
    name: '', phone: '', role: 'parent', childAdm: '', adminCode: '',
    teachingLevels: []
  });

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAction(e) {
    if (e) e.preventDefault();
    setBusy(true); setErr(''); setOkMsg('');

    try {
      const actionPayload = tab === 'otp' ? 'register' : tab;
      const res = await fetchWithRetry('/api/auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tab === 'register' ? selectedSchool : tenantId 
        },
        body: JSON.stringify({ action: actionPayload, tenantId: selectedSchool, ...form }),
        timeout: 15000
      });

      let data;
      try { data = await res.json(); } catch { throw new Error(`Server error (${res.status})`); }
      
      if (!res.ok) {
        setErr(data.error || `Error: Please check your credentials.`);
        setBusy(false);
        return;
      }
      
      if (data.ok) {
        if (tab === 'login') {
          clearAllCache();
          if (data.initialData) hydrateCache(data.initialData);
          router.push(data.redirect || '/dashboard');
        } else {
          setOkMsg(`✅ Registered! Your username is: ${data.username}. Please login.`);
          setTab('login');
          setForm(f => ({ ...f, username: data.username, password: '' }));
        }
      }
    } catch (e) {
      setErr(e.message || 'An unexpected error occurred');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="auth" style={heroImg ? { background: `linear-gradient(135deg, rgba(5,15,28,0.85) 0%, rgba(13,31,60,0.85) 40%, rgba(21,45,79,0.9) 100%), url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
      <div className="auth-bg" />
      
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-logo">
           <img src={profile.logo || "/eduvantage-logo.png"} alt="Logo" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,.4)', display:'block', margin:'0 auto' }} />
        </div>
        <div className="auth-h">{profile.name}<br/><span style={{ color: 'var(--secondary, #F4A460)' }}>{profile.tagline}</span></div>
        <div className="auth-tagline">Support: +254 792 656 579 · portal@eduvantage.app</div>
        
        <div className="auth-pills">
          <div className="auth-pill"><div className="auth-pill-i">📊</div>Advanced Academic Analytics — Performance tracking for all levels</div>
          <div className="auth-pill"><div className="auth-pill-i">💸</div>Automated Financial Management — Seamless fee collection</div>
          <div className="auth-pill"><div className="auth-pill-i">📲</div>Instant Communication — Reliable Bulk SMS and Parent Portals</div>
          <div className="auth-pill"><div className="auth-pill-i">🏗️</div>Scalable Multi-Tenant Architecture — Isolated, secure databases</div>
        </div>

        <div className="auth-announcement" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 40, backdropFilter: 'blur(10px)' }}>
           <h4 style={{ color: '#FCD34D', fontSize: 10, textTransform: 'uppercase', marginBottom: 5, letterSpacing: 1.2 }}>📢 EDUVANTAGE NETWORK NEWS</h4>
           <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 1.6 }}>Join the growing network of digitally-empowered schools across East Africa. High-performance school management at your fingertips.</p>
        </div>

        <div className="auth-stats">
          {tenantId === 'platform-master' ? (
            <>
              <div className="auth-stat"><div className="auth-stat-n">{stats.totalSchools || '0'}</div><div className="auth-stat-l">Enrolled Schools</div></div>
              <div className="auth-stat"><div className="auth-stat-n">{stats.activeSchools || '0'}</div><div className="auth-stat-l">Active Licenses</div></div>
            </>
          ) : (
            <>
              <div className="auth-stat"><div className="auth-stat-n">{stats.learners || '—'}</div><div className="auth-stat-l">Learners</div></div>
              <div className="auth-stat"><div className="auth-stat-n">{stats.classes || '—'}</div><div className="auth-stat-l">Grades Active</div></div>
            </>
          )}
          <div className="auth-stat"><div className="auth-stat-n">{new Date().getFullYear()}</div><div className="auth-stat-l">Academic Year</div></div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <img src={profile.logo || "/eduvantage-logo.png"} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: '50%', boxShadow: `0 4px 16px ${theme?.primary || '#4F46E5'}33` }} />
          </div>
          <div className="auth-card-title">{tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Parent Registration' : 'Security Check'}</div>
          <div className="auth-card-sub">{tab === 'login' ? 'Sign in to access your dashboard' : tab === 'register' ? 'Join your child’s school portal' : 'Verify your identity'}</div>
          
          <div className="auth-sw-row">
            <button className={`auth-sw ${tab === 'login' ? 'on' : ''}`} onClick={() => setTab('login')} style={tab === 'login' ? { background: 'var(--primary)', boxShadow: `0 2px 8px ${theme?.primary}4D` } : {}}>Sign In</button>
            <button className={`auth-sw ${tab === 'register' ? 'on' : ''}`} onClick={() => setTab('register')} style={tab === 'register' ? { background: 'var(--primary)', boxShadow: `0 2px 8px ${theme?.primary}4D` } : {}}>Parent Register</button>
          </div>

          <form onSubmit={handleAction}>
            {tab === 'login' && (
              <div className="field">
                <label>Username</label>
                <input required value={form.username} onChange={e => F('username', e.target.value.toLowerCase())} placeholder="your.username" />
              </div>
            )}

            {tab === 'register' && (
              <>
                <div className="field">
                  <label>Select School</label>
                  <select required value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 15, background: '#F8FAFC' }}>
                    <option value="">-- Choose School --</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Full Name</label>
                  <input required value={form.name} onChange={e => F('name', e.target.value)} placeholder="Parent Name" />
                </div>
                <div className="field">
                  <label>Learner Admission No.</label>
                  <input required value={form.childAdm} onChange={e => F('childAdm', e.target.value)} placeholder="e.g. 1234" />
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input required value={form.phone} onChange={e => F('phone', e.target.value)} placeholder="07XXXXXXXX" />
                </div>
              </>
            )}
            
            <div className="field" style={{ position: 'relative' }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input required type={showPass ? "text" : "password"} value={form.password} onChange={e => F('password', e.target.value)} placeholder="••••••••" style={{ paddingRight: 45 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {err && <div className="alert alert-err show">{err}</div>}
            {okMsg && <div className="alert alert-ok show">{okMsg}</div>}

            <button type="submit" className="btn btn-primary" disabled={busy} style={{ marginTop: 10, background: `linear-gradient(135deg, var(--primary), var(--primary))` }}>
              {busy ? 'Processing...' : tab === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
            </button>
          </form>
        </div>
      </div>
      <style jsx global>{`
        :root {
          --primary: ${theme?.primary || '#4F46E5'};
          --secondary: ${theme?.secondary || '#D4AF37'};
        }
        #auth { min-height: 100vh; display: flex; align-items: stretch; background: #0F172A; }
        .auth-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.1), transparent); pointer-events: none; }
        .auth-left { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 64px; position: relative; z-index: 1; color: #fff; }
        .auth-h { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; }
        .auth-tagline { font-size: 14px; opacity: 0.6; margin-bottom: 40px; }
        .auth-pills { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
        .auth-pill { display: flex; align-items: center; gap: 12px; font-size: 13.5px; background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
        .auth-pill-i { font-size: 18px; }
        .auth-stats { display: flex; gap: 32px; border-top: 1px solid rgba(255,255,255,0.1); pt: 32px; }
        .auth-stat-n { font-size: 24px; font-weight: 800; color: var(--secondary); }
        .auth-stat-l { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; }
        
        .auth-right { width: 480px; background: #fff; position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; box-shadow: -20px 0 60px rgba(0,0,0,0.1); }
        .auth-card { width: 100%; max-width: 360px; padding: 40px 20px; }
        .auth-card-title { font-size: 28px; font-weight: 800; text-align: center; color: #0F172A; margin-bottom: 8px; letter-spacing: -0.5px; }
        .auth-card-sub { font-size: 14px; text-align: center; color: #64748B; margin-bottom: 32px; line-height: 1.5; }
        
        .auth-sw-row { display: flex; background: #F1F5F9; padding: 5px; border-radius: 14px; margin-bottom: 24px; }
        .auth-sw { flex: 1; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; color: #64748B; background: transparent; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .auth-sw.on { color: #fff; transform: scale(1.02); }
        
        .field { margin-bottom: 24px; }
        .field label { display: block; font-size: 12px; font-weight: 800; color: #1E293B; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .field input { width: 100%; padding: 14px 18px; border-radius: 12px; border: 2px solid #E2E8F0; font-size: 15px; outline: none; transition: all 0.2s; box-sizing: border-box; background: #F8FAFC; }
        .field input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        
        .btn { width: 100%; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; color: #fff; transition: all 0.3s; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .alert { padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-bottom: 24px; display: none; line-height: 1.5; }
        .alert.show { display: block; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .alert-err { background: #FEF2F2; color: #DC2626; border: 1px solid #FEE2E2; }
        .alert-ok { background: #F0FDF4; color: #16A34A; border: 1px solid #DCFCE7; }

        @media(max-width: 900px) {
          .auth-left { display: none; }
          .auth-right { width: 100%; background: #0F172A; }
          .auth-card { background: #fff; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); margin: 20px; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading EduVantage...</div>}>
      <LoginContent />
    </Suspense>
  );
}
