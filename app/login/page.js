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
    name: 'EduVantage Console', 
    tagline: 'Global Education SaaS Network',
    logo: '/eduvantage-logo.png'
  });
  const [heroImg, setHeroImg] = useState('');
  const [theme, setTheme] = useState({ primary: '#4F46E5', secondary: '#D4AF37' });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/saas/config?tenant=${tenantId}`);
        const data = await res.json();
        if (data.profile) {
          setProfile({
            name: data.profile.name || 'School Portal',
            tagline: data.profile.motto || 'Community School',
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
        const sRes = await fetch(`/api/stats?tenant=${tenantId}`);
        const s = await sRes.json();
        setStats(s);

      } catch (e) {
        console.error('Config load error:', e);
      }
    }
    loadConfig();
  }, [tenantId]);

  const [form, setForm] = useState({
    username: '', password: '', 
    name: '', phone: '', role: 'teacher', childAdm: '', adminCode: '',
    teachingLevels: []
  });

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAction(e) {
    if (e) e.preventDefault();
    setBusy(true); setErr(''); setOkMsg('');

    try {
      if (tab === 'register' && form.role === 'admin' && form.adminCode !== 'EDU2026') {
        throw new Error('Invalid administrator registration code');
      }

      if (tab === 'register') {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setExpectedOtp(generatedOtp);
        setTab('otp');
        setOkMsg(`OTP sent to ${form.phone}. (For testing, your code is: ${generatedOtp})`);
        setBusy(false);
        return;
      }
      
      const actionPayload = tab === 'otp' ? 'register' : tab;

      const res = await fetchWithRetry('/api/auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId 
        },
        body: JSON.stringify({ action: actionPayload, ...form }),
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
          <div className="auth-stat"><div className="auth-stat-n">{stats.learners || '—'}</div><div className="auth-stat-l">Learners</div></div>
          <div className="auth-stat"><div className="auth-stat-n">{stats.classes || '—'}</div><div className="auth-stat-l">Grades Active</div></div>
          <div className="auth-stat"><div className="auth-stat-n">{new Date().getFullYear()}</div><div className="auth-stat-l">Academic Year</div></div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <img src={profile.logo || "/eduvantage-logo.png"} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: '50%', boxShadow: `0 4px 16px ${theme?.primary || '#4F46E5'}33` }} />
          </div>
          <div className="auth-card-title">{tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Join the EduVantage Network' : 'Security Check'}</div>
          <div className="auth-card-sub">{tab === 'login' ? 'Sign in to access your dashboard' : tab === 'register' ? 'Create your institutional account' : 'Verify your identity'}</div>
          
          <div className="auth-sw-row">
            <button className={`auth-sw ${tab === 'login' ? 'on' : ''}`} onClick={() => setTab('login')} style={tab === 'login' ? { background: 'var(--primary)', boxShadow: `0 2px 8px ${theme?.primary}4D` } : {}}>Sign In</button>
            <button className={`auth-sw ${tab === 'register' ? 'on' : ''}`} onClick={() => setTab('register')} style={tab === 'register' ? { background: 'var(--primary)', boxShadow: `0 2px 8px ${theme?.primary}4D` } : {}}>Register</button>
          </div>

          <form onSubmit={handleAction}>
            {tab === 'login' && (
              <div className="field">
                <label>Username</label>
                <input required value={form.username} onChange={e => F('username', e.target.value.toLowerCase())} placeholder="your.username" />
              </div>
            )}
            
            <div className="field" style={{ position: 'relative' }}>
              <label>Password</label>
              <input required type={showPass ? "text" : "password"} value={form.password} onChange={e => F('password', e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: 28, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
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
        
        .auth-right { width: 480px; background: #fff; position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; }
        .auth-card { width: 100%; max-width: 360px; padding: 20px; }
        .auth-card-title { font-size: 24px; font-weight: 800; text-align: center; color: #1E293B; margin-bottom: 8px; }
        .auth-card-sub { font-size: 13px; text-align: center; color: #64748B; margin-bottom: 32px; }
        
        .auth-sw-row { display: flex; background: #F1F5F9; padding: 4px; border-radius: 12px; margin-bottom: 24px; }
        .auth-sw { flex: 1; border: none; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; color: #64748B; background: transparent; transition: all 0.2s; }
        .auth-sw.on { color: #fff; }
        
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .field input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1.5px solid #E2E8F0; font-size: 14px; outline: none; transition: all 0.2s; box-sizing: border-box; }
        .field input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        
        .btn { width: 100%; padding: 14px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; color: #fff; transition: all 0.2s; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .alert { padding: 12px; border-radius: 10px; font-size: 12.5px; font-weight: 600; margin-bottom: 20px; display: none; }
        .alert.show { display: block; }
        .alert-err { background: #FEF2F2; color: #DC2626; border: 1px solid #FEE2E2; }
        .alert-ok { background: #F0FDF4; color: #16A34A; border: 1px solid #DCFCE7; }

        @media(max-width: 900px) {
          .auth-left { display: none; }
          .auth-right { width: 100%; background: #fff; }
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
