'use client';
/**
 * app/page.js — Premium Login Page
 * 
 * Implements:
 *   • Dynamic school population stats
 *   • Admin-editable announcement panel
 *   • Hero background overlay
 *   • Responsive mobile view (hides left panel)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login'); // login | register
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [stats, setStats] = useState({ learners: 0, classes: 0 });
  const [announcement, setAnnouncement] = useState('Welcome to the official PAAV-Gitombo Community School portal. Quality education for every child.');
  const [heroImg, setHeroImg] = useState('');

  const [form, setForm] = useState({
    name: '', username: '', password: '', phone: '', role: 'teacher'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, dbRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/db', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ requests: [
              { type:'get', key:'paav7_announcement' },
              { type:'get', key:'paav7_hero_img' }
            ]})
          })
        ]);
        const s = await statsRes.json();
        setStats(s);
        const db = await dbRes.json();
        if (db.results[0]?.value) setAnnouncement(db.results[0].value);
        if (db.results[1]?.value) setHeroImg(db.results[1].value);
      } catch (e) {}
    }
    loadData();
  }, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab === 'login' ? 'login' : 'register', ...form })
      });
      const data = await res.json();
      if (data.ok) {
        router.push('/dashboard');
      } else {
        setErr(data.error || 'Authentication failed');
      }
    } catch (e) {
      setErr('Connection error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="auth">
      <div className="auth-bg"></div>
      
      {/* Hero / Left Panel — Hidden on small screens */}
      <div className="auth-left" style={heroImg ? { backgroundImage: `linear-gradient(to right, rgba(5,15,28,0.9), rgba(5,15,28,0.4)), url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="auth-logo">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" alt="Logo" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--gold2)' }} />
        </div>
        <h1 className="auth-h">PAAV-GITOMBO <span>PORTAL</span></h1>
        <p className="auth-tagline">Academic excellence and holistic growth since 2012</p>

        <div className="auth-announcement" style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 15, border: '1.5px solid rgba(255,255,255,0.1)', marginBottom: 40, backdropFilter: 'blur(10px)' }}>
           <h4 style={{ color: 'var(--gold2)', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>📢 Latest Announcement</h4>
           <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.5 }}>{announcement}</p>
        </div>

        <div className="auth-stats">
          <div className="auth-stat">
            <div className="auth-stat-n">{stats.learners || '—'}</div>
            <div className="auth-stat-l">Total Learners</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-n">{stats.classes || '—'}</div>
            <div className="auth-stat-l">Grade Streams</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-n">100%</div>
            <div className="auth-stat-l">CBC Compliant</div>
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">{tab === 'login' ? 'Welcome Back' : 'Portal Registration'}</h2>
          <p className="auth-card-sub">{tab === 'login' ? 'Enter your credentials to access the portal' : 'Create an account to join the school portal'}</p>

          <div className="auth-sw-row">
            <button className={`auth-sw ${tab === 'login' ? 'on' : ''}`} onClick={() => setTab('login')}>Login</button>
            <button className={`auth-sw ${tab === 'register' ? 'on' : ''}`} onClick={() => setTab('register')}>Register</button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="field">
                <label>Full Name</label>
                <input required value={form.name} onChange={e => F('name', e.target.value.toUpperCase())} placeholder="e.g. JOHN DOE" />
              </div>
            )}
            <div className="field">
              <label>Username</label>
              <input required value={form.username} onChange={e => F('username', e.target.value.toLowerCase())} placeholder="your_username" />
            </div>
            {tab === 'register' && (
              <div className="field">
                <label>Phone Number</label>
                <input required value={form.phone} onChange={e => F('phone', e.target.value)} placeholder="07XXXXXXXX" />
              </div>
            )}
            <div className="field">
              <label>Password</label>
              <input required type="password" value={form.password} onChange={e => F('password', e.target.value)} placeholder="••••••••" />
            </div>

            {err && <div className="alert alert-err show">{err}</div>}

            <button type="submit" className="btn btn-primary" disabled={busy} style={{ marginTop: 10 }}>
              {busy ? (tab === 'login' ? 'Authenticating...' : 'Registering...') : (tab === 'login' ? 'Sign In →' : 'Create Account')}
            </button>
          </form>

          <div style={{ marginTop: 30, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
            <p>&copy; {new Date().getFullYear()} PAAV-Gitombo Community School</p>
            <p style={{ marginTop: 5 }}>Powered by Advance Agentic Systems</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100%; min-height: 100vh; }
        }
        .auth-stat-n { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; color: var(--gold2); }
        .auth-stat-l { font-size: 10px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-top: 4px; }
        .auth-stats { display: flex; gap: 40px; margin-top: auto; }
      `}</style>
    </div>
  );
}
