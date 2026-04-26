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
           <img src="data:image/jpeg;base64,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6Y/BvV9X95N8rDTAUh9A6oO/nV6pTJwync3JI0uJNze3z6Xv7pTK2eN2eNxGlhY6jxHivlvszU66vXuOymOiUAsgeUjt/NVFntv3TBXG+L9bmlqXv77+Kr6U/HhcDCHvbdwtYf0m36X6m6YkrJXAsB009xf9bK1vWN+RcJlxdkqDshIbbsfSqr7pS/cIdxloClMAtunzsB1q9Urhw6nMhkc25uDfpY8unT8LpX1uXLlblt630Py6L5X2lKeUYpSlCEpSlCEpSlCEpSlCEpSlCErC7pGZuurKIdwRzs7AgHwdqzSqOfbIdyQGpjHMEm49jUGvpfrUTYybWIdY8/BTKKp+ruL7bgj0KqrU9FfublvY6fDthO/v2rs9BtV4XclHmc2AH0rqg22DbmvSgxUtJJ3O3f+9fVPyEXZMUshLSkghXvS46mSGIsmFrCwPhovPJKOKoqO0iFrG58TfT+S67XClxHpa5T/ADpec5keXjauS7ZBeurV0dTu/GTsg+NqV8XJkC7twkRylkpIUr9VcbSRU8bYxpa5IPhuT6XSZInU0zpHeF7HxsB7m6XG5QbPId9Zsc76SAr9fivlttrdrtrURH4m999vO9fdwtV2Wfi229pMfcA+CnzVwp2GlhmkdUBvIenly+ScnmkhiZTh1hc3I8fM9OoSvteqU+o6UpShCUpShCUpShC6pURiUwY0lnmR2I9v9K7KUrsAex5YdwSOmg3C6L7t80pSlIuUr7SlKEJSlKEJSlKEJSlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISlKUISv//Z" alt="PAAV Logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '50%', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }} />
        </div>
        <div className="auth-h">PAAV-GITOMBO<br/><span style={{ color: '#F4A460' }}>Community School</span></div>
        <div className="auth-tagline">P.O BOX 4091-00100 Nairobi · 0758 922 915 · <span style={{ color: 'rgba(255,255,255,0.65)' }}>paavgitomboschool@gmail.com</span></div>
        
        <div className="auth-pills">
          <div className="auth-pill"><div className="auth-pill-i">📝</div>CBC marks entry per subject — Senior/JSS 72pts · Primary 4pts/subject</div>
          <div className="auth-pill"><div className="auth-pill-i">💰</div>Configurable fee structure — admin sets termly amounts</div>
          <div className="auth-pill"><div className="auth-pill-i">👨‍👩‍👧</div>Parent portal — child's fees, grades & school messages</div>
          <div className="auth-pill"><div className="auth-pill-i">💬</div>Direct messaging between staff and parents</div>
        </div>

        <div className="auth-announcement" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 40, backdropFilter: 'blur(10px)' }}>
           <h4 style={{ color: '#FCD34D', fontSize: 10, textTransform: 'uppercase', marginBottom: 5, letterSpacing: 1.2 }}>📢 Latest Announcement</h4>
           <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 1.6 }}>{announcement}</p>
        </div>

        <div className="auth-stats">
          <div className="auth-stat"><div className="auth-stat-n">{stats.learners || '—'}</div><div className="auth-stat-l">Learners</div></div>
          <div className="auth-stat"><div className="auth-stat-n">{stats.classes || '—'}</div><div className="auth-stat-l">Classes</div></div>
          <div className="auth-stat"><div className="auth-stat-n">{new Date().getFullYear()}</div><div className="auth-stat-l">Academic Year</div></div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Card) ── */}
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <img src="data:image/jpeg;base64,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" alt="PAAV Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: '50%', boxShadow: '0 4px 16px rgba(139,26,26,0.2)' }} />
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
                     <label>Child's Admission Number</label>
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
