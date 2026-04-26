'use client';
/**
 * app/page.js — Faithfully Restored Legacy Login Page (v122 Styles)
 * 
 * Restores:
 *   • Authentic v122 CSS styling and layout
 *   • Left panel with school crest, tagline, feature pills, and dynamic stats
 *   • Right panel with Login/Register toggle and role-based registration
 *   • Selection of role BEFORE registration (as requested)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login'); // login | register | forgot
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  
  // Dynamic stats
  const [stats, setStats] = useState({ learners: 0, classes: 0 });
  const [announcement, setAnnouncement] = useState('Welcome to the official PAAV-Gitombo Community School portal. Quality education for every child.');

  // Form states
  const [form, setForm] = useState({
    username: '', password: '', 
    name: '', phone: '', role: 'teacher', childAdm: '', adminCode: ''
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, dbRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ type: 'get', key: 'paav7_announcement' }] })
          })
        ]);
        const s = await statsRes.json();
        setStats(s);
        const db = await dbRes.json();
        if (db.results[0]?.value) setAnnouncement(db.results[0].value);
      } catch (e) {}
    }
    loadStats();
  }, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAction(e) {
    if (e) e.preventDefault();
    setBusy(true); setErr(''); setOkMsg('');

    try {
      if (tab === 'register' && form.role === 'admin' && form.adminCode !== 'PAAV2024') {
        throw new Error('Invalid administrator registration code');
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: tab, 
          ...form 
        })
      });
      const data = await res.json();
      
      if (data.ok) {
        if (tab === 'login') {
          router.push('/dashboard');
        } else {
          setOkMsg(`✅ Registered! Your username is: ${data.username}. Please login.`);
          setTab('login');
          setForm(f => ({ ...f, username: data.username, password: '' }));
        }
      } else {
        setErr(data.error || 'Operation failed');
      }
    } catch (e) {
      setErr(e.message || 'Connection error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="auth">
      <div className="auth-bg" />
      
      {/* ── LEFT PANEL (Branding & Stats) ── */}
      <div className="auth-left">
        <div className="auth-logo">
           <img src="/logo.png" alt="PAAV Gitombo Logo" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,.4)', display:'block', margin:'0 auto' }} />
        </div>
        <div className="auth-h">PAAV-GITOMBO<br/><span style={{ color: '#F4A460' }}>Community School</span></div>
        <div className="auth-tagline">P.O BOX 4091-00100 Nairobi · 0758 922 915 · <span style={{ color: 'rgba(255,255,255,0.65)' }}>paavgitomboschool@gmail.com</span></div>
        
        <div className="auth-pills">
          <div className="auth-pill"><div className="auth-pill-i">📝</div>CBC marks entry per subject — Senior/JSS 72pts · Primary 4pts/subject</div>
          <div className="auth-pill"><div className="auth-pill-i">💰</div>Configurable fee structure — admin sets termly amounts</div>
          <div className="auth-pill"><div className="auth-pill-i">👨‍👩‍👧</div>Parent portal — child&apos;s fees, grades & school messages</div>
          <div className="auth-pill"><div className="auth-pill-i">💬</div>Direct messaging between staff and parents</div>
        </div>

        <div className="auth-announcement" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 40, backdropFilter: 'blur(10px)' }}>
           <h4 style={{ color: '#FCD34D', fontSize: 10, textTransform: 'uppercase', marginBottom: 5, letterSpacing: 1.2 }}>📢 Latest Announcement</h4>
           <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 1.6 }}>{announcement}</p>
        </div>

        <div className="auth-stats">
          <div className="auth-stat"><div className="auth-stat-n">{stats.learners || '—'}</div><div className="auth-stat-l">Learners</div></div>
          <div className="auth-stat"><div className="auth-stat-n">{stats.classes || '—'}</div><div className="auth-stat-l">Grades Active</div></div>
          <div className="auth-stat"><div className="auth-stat-n">{new Date().getFullYear()}</div><div className="auth-stat-l">Academic Year</div></div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Card) ── */}
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <img src="/logo.png" alt="PAAV Gitombo Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: '50%', boxShadow: '0 4px 16px rgba(139,26,26,0.2)' }} />
          </div>
          <div className="auth-card-title">{tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Join the Portal' : 'Reset Password'}</div>
          <div className="auth-card-sub">{tab === 'login' ? 'Sign in to access the school portal' : tab === 'register' ? 'Create your professional account' : 'Enter your details to recover access'}</div>
          
          <div className="auth-sw-row">
            <button className={`auth-sw ${tab === 'login' ? 'on' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`auth-sw ${tab === 'register' ? 'on' : ''}`} onClick={() => setTab('register')}>Register</button>
          </div>

          <form onSubmit={handleAction}>
            {tab === 'register' && (
              <>
                <div className="field">
                  <label>I am a…</label>
                  <select value={form.role} onChange={e => F('role', e.target.value)}>
                    <option value="teacher">Primary Teacher</option>
                    <option value="jss_teacher">JSS Teacher</option>
                    <option value="parent">Parent / Guardian</option>
                    <option value="staff">Non-Teaching Staff</option>
                    <option value="admin">Administrator (Requires Code)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Full Name</label>
                  <input required value={form.name} onChange={e => F('name', e.target.value.toUpperCase())} placeholder="e.g. JOHN DOE" />
                </div>

                <div className="field">
                  <label>Phone Number</label>
                  <input required value={form.phone} onChange={e => F('phone', e.target.value)} placeholder="07XXXXXXXX" />
                </div>

                {form.role === 'parent' && (
                   <div className="field">
                     <label>Child&apos;s Admission Number</label>
                     <input required value={form.childAdm} onChange={e => F('childAdm', e.target.value)} placeholder="e.g. ADM001" />
                   </div>
                )}

                {form.role === 'admin' && (
                   <div className="field">
                     <label>Administrator Code</label>
                     <input required type="password" value={form.adminCode} onChange={e => F('adminCode', e.target.value)} placeholder="Enter secret code" />
                   </div>
                )}
              </>
            )}

            {tab === 'login' && (
              <div className="field">
                <label>Username</label>
                <input required value={form.username} onChange={e => F('username', e.target.value.toLowerCase())} placeholder="your.username" />
              </div>
            )}

            <div className="field">
              <label>Password</label>
              <input required type="password" value={form.password} onChange={e => F('password', e.target.value)} placeholder="••••••••" />
            </div>

            {err && <div className="alert alert-err show">{err}</div>}
            {okMsg && <div className="alert alert-ok show">{okMsg}</div>}

            <button type="submit" className="btn btn-primary" disabled={busy} style={{ marginTop: 10, background: 'linear-gradient(135deg,#8B1A1A,#6B1212)' }}>
              {busy ? 'Processing...' : tab === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
            </button>
          </form>

          {tab === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 15 }}>
              <button className="btn-link" onClick={() => setTab('forgot')}>🔑 Forgot your password?</button>
            </div>
          )}

          <div className="note-box" style={{ marginTop: 18, background: 'linear-gradient(135deg,#FDF2F2,#F5E6E6)', borderLeft: '3px solid #8B1A1A' }}>
            <strong style={{ color: '#8B1A1A' }}>{tab === 'register' ? 'Registration Note:' : 'First time?'}</strong> {tab === 'register' ? 'Staff accounts require administrator approval before login.' : 'Contact your school administrator to receive your login credentials via SMS.'}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Format: <em>firstname.lastname</em> &nbsp;|&nbsp; Support: 0758 922 915</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        #auth { min-height: 100vh; display: flex; align-items: stretch; background: linear-gradient(135deg,#050F1C 0%,#0D1F3C 40%,#152D4F 100%); }
        .auth-bg { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
        .auth-bg::before { content: ''; position: absolute; top: 10%; left: 10%; width: 320px; height: 320px; background: radial-gradient(circle,rgba(139,26,26,.25),transparent 70%); border-radius: 50%; }
        .auth-bg::after { content: ''; position: absolute; bottom: 15%; right: 8%; width: 420px; height: 420px; background: radial-gradient(circle,rgba(217,119,6,.18),transparent 70%); border-radius: 50%; }
        
        .auth-left { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 64px; position: relative; z-index: 1; }
        .auth-logo { width: 90px; height: 90px; margin-bottom: 28px; display: flex; align-items: center; justify-content: center; }
        .auth-h { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 10px; }
        .auth-tagline { font-size: 14px; color: rgba(255,255,255,.45); margin-bottom: 44px; }
        
        .auth-pills { display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px; }
        .auth-pill { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px 15px; color: rgba(255,255,255,.7); font-size: 12.5px; }
        .auth-pill-i { width: 30px; height: 30px; background: rgba(250,211,77,.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        
        .auth-stats { display: flex; gap: 36px; margin-top: 20px; }
        .auth-stat-n { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #FCD34D; }
        .auth-stat-l { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,.3); margin-top: 2px; }
        
        .auth-right { width: 500px; display: flex; align-items: center; justify-content: center; padding: 32px 36px; background: rgba(255,255,255,.97); }
        .auth-card { width: 100%; max-width: 400px; }
        .auth-card-title { font-family: 'Sora', sans-serif; font-size: 23px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
        .auth-card-sub { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
        
        .auth-sw-row { display: flex; background: #F1F5F9; border-radius: 12px; padding: 4px; gap: 3px; margin-bottom: 22px; }
        .auth-sw { flex: 1; padding: 9px; border: none; border-radius: 9px; font-size: 11.5px; font-weight: 700; cursor: pointer; background: none; color: var(--muted); transition: all .2s; text-transform: uppercase; letter-spacing: .4px; }
        .auth-sw.on { background: #8B1A1A; color: #fff; box-shadow: 0 2px 8px rgba(139,26,26,.3); }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: var(--muted); margin-bottom: 5px; }
        .field input, .field select { width: 100%; border: 2px solid var(--border); border-radius: 10px; padding: 10px 13px; font-size: 13px; background: #FAFBFF; outline: none; transition: all .15s; }
        .field input:focus, .field select:focus { border-color: var(--blue); background: #fff; box-shadow: 0 0 0 4px rgba(37,99,235,.08); }

        .note-box { padding: 13px 15px; border-radius: 10px; font-size: 12px; color: var(--muted); line-height: 1.6; }
        
        @media(max-width: 900px) {
          .auth-left { display: none; }
          .auth-right { width: 100%; min-height: 100vh; background: #fff; }
        }
      `}</style>
    </div>
  );
}
