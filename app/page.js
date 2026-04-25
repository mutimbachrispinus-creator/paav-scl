'use client';
/**
 * app/page.js — Login page (root route)
 *
 * Renders the two-panel auth screen from the original index-122.html:
 *   Left panel  → school branding, stats, features
 *   Right panel → Sign In / Register / Forgot tabs
 *
 * On successful login the user is redirected to /dashboard (admin/teacher/staff)
 * or /dashboard#parent-home (parent).
 *
 * Google Sign-In is supported when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/* ─── Feature pill data (matches auth-pills in HTML) ────────────────────── */
const FEATURES = [
  { icon: '🎓', text: 'CBC Marks Entry & Report Cards' },
  { icon: '💰', text: 'Fee Tracking & M-Pesa Receipts' },
  { icon: '📱', text: 'SMS Alerts via Africa\'s Talking' },
  { icon: '📊', text: 'Merit Lists & Attendance Register' },
];

/* ─── School stats ───────────────────────────────────────────────────────── */
const STATS = [
  { n: '500+', l: 'Learners' },
  { n: '3',   l: 'Terms' },
  { n: 'CBC', l: 'Curriculum' },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab,  setTab]  = useState('login');   // 'login' | 'register' | 'forgot'
  const [busy, setBusy] = useState(false);
  const [msg,  setMsg]  = useState({ text: '', type: '' });

  // ── Login state
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [remember,  setRemember]  = useState(false);

  // ── Register state
  const [regRole,   setRegRole]   = useState('parent');
  const [regName,   setRegName]   = useState('');
  const [regPhone,  setRegPhone]  = useState('');
  const [regPass,   setRegPass]   = useState('');
  const [regAdm,    setRegAdm]    = useState('');
  const [regSecQ,   setRegSecQ]   = useState('');
  const [regSecA,   setRegSecA]   = useState('');

  // ── Forgot state
  const [fgUser, setFgUser] = useState('');
  const [fgSecA, setFgSecA] = useState('');
  const [fgNewPw, setFgNewPw] = useState('');
  const [fgSecQ, setFgSecQ] = useState('');
  const [fgStep, setFgStep] = useState(1);  // 1: enter username | 2: verify | 3: new password

  useEffect(() => {
    // ── If already logged in, go straight to dashboard ──
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.user) {
          // Return user to where they were before (or role default)
          let dest;
          try { dest = localStorage.getItem('paav_last_path'); } catch {}
          if (!dest || dest === '/') {
            dest = data.user.role === 'parent' ? '/dashboard?tab=parent-home' : '/dashboard';
          }
          router.replace(dest);
        }
      })
      .catch(() => {});

    // Pre-fill remembered username
    const saved = localStorage.getItem('paav_remember_user');
    if (saved) { setUsername(saved); setRemember(true); }
  }, []); // eslint-disable-line

  /* ── Helpers ── */
  function flash(text, type = 'err') { setMsg({ text, type }); }
  function clearMsg() { setMsg({ text: '', type: '' }); }

  async function apiPost(action, payload) {
    const res = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, ...payload }),
    });
    return res.json();
  }

  /* ── Login ── */
  async function handleLogin(e) {
    e?.preventDefault();
    clearMsg();
    if (!username.trim() || !password) { flash('Enter username and password'); return; }
    setBusy(true);
    const data = await apiPost('login', { username: username.trim(), password });
    setBusy(false);
    if (!data.ok) { flash(data.error || 'Login failed'); return; }

    if (remember) localStorage.setItem('paav_remember_user', username.trim());
    else          localStorage.removeItem('paav_remember_user');

    router.push(data.user?.role === 'parent' ? '/dashboard?tab=parent-home' : '/dashboard');
  }

  /* ── Google Sign-In ── */
  async function handleGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) { flash('Google Sign-In is not configured'); return; }

    // Load Google Identity Services script
    await loadGISScript();

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback:  async ({ credential }) => {
        setBusy(true);
        const data = await apiPost('google', { idToken: credential });
        setBusy(false);
        if (!data.ok) { flash(data.error || 'Google sign-in failed'); return; }
        router.push(data.user?.role === 'parent' ? '/dashboard?tab=parent-home' : '/dashboard');
      },
    });
    window.google.accounts.id.prompt();
  }

  /* ── Register ── */
  async function handleRegister(e) {
    e?.preventDefault();
    clearMsg();
    if (!regName || !regPhone || !regPass) { flash('Fill all required fields'); return; }
    setBusy(true);
    const data = await apiPost('register', {
      role: regRole, name: regName, phone: regPhone,
      password: regPass, childAdm: regAdm,
      secQ: regSecQ, secA: regSecA,
    });
    setBusy(false);
    if (!data.ok) { flash(data.error || 'Registration failed'); return; }
    flash(
      regRole === 'parent'
        ? `✅ Registered! Your username is "${data.username}". You can sign in now.`
        : `✅ Registered as "${data.username}". Wait for admin to activate your account.`,
      'ok'
    );
  }

  /* ── Forgot password ── */
  async function handleForgotStep1(e) {
    e?.preventDefault();
    if (!fgUser.trim()) { flash('Enter your username'); return; }
    setBusy(true);
    const data = await apiPost('forgot', { username: fgUser.trim() });
    setBusy(false);
    if (!data.ok) { flash(data.error || 'User not found'); return; }
    setFgSecQ(data.secQ || '');
    setFgStep(data.secQ ? 2 : 3);
  }

  async function handleForgotStep2(e) {
    e?.preventDefault();
    if (!fgSecA.trim()) { flash('Enter your security answer'); return; }
    setBusy(true);
    const data = await apiPost('forgot', { username: fgUser.trim(), secQ: fgSecQ, secA: fgSecA });
    setBusy(false);
    if (!data.ok || !data.eligible) { flash('Security answer incorrect'); return; }
    setFgStep(3);
  }

  async function handleForgotStep3(e) {
    e?.preventDefault();
    if (!fgNewPw || fgNewPw.length < 6) { flash('Password must be at least 6 characters'); return; }
    setBusy(true);
    const data = await apiPost('resetpw', { username: fgUser.trim(), newPassword: fgNewPw, secA: fgSecA });
    setBusy(false);
    if (!data.ok) { flash(data.error || 'Reset failed'); return; }
    flash('✅ Password reset! You can now sign in.', 'ok');
    setTimeout(() => setTab('login'), 2000);
  }

  /* ── Render ── */
  return (
    <div id="auth" style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch',
      background: 'linear-gradient(135deg,#050F1C 0%,#0D1F3C 40%,#152D4F 100%)' }}>

      {/* ── Left panel ── */}
      <div className="auth-left" style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px', position: 'relative', zIndex: 1 }}>
        <div className="auth-bg" />
        <div className="auth-logo" style={{ width: 90, height: 90, marginBottom: 28 }}>
          <div style={{ width: 90, height: 90, background: 'rgba(255,255,255,.12)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, border: '2px solid rgba(255,255,255,.2)' }}>🏫</div>
        </div>

        <h1 className="auth-h">
          PAAV-GITOMBO<br />
          <span>Community School</span>
        </h1>
        <p className="auth-tagline">&quot;More Than Academics!&quot; — Powered by the PAAV Portal v122</p>

        <div className="auth-pills">
          {FEATURES.map((f, i) => (
            <div key={i} className="auth-pill">
              <div className="auth-pill-i">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>

        <div className="auth-stats">
          {STATS.map((s, i) => (
            <div key={i}>
              <div className="auth-stat-n">{s.n}</div>
              <div className="auth-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (auth card) ── */}
      <div className="auth-right" style={{ width: 500, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '32px 36px', background: 'rgba(255,255,255,.97)' }}>
        <div className="auth-card" style={{ width: '100%' }}>
          <div className="auth-card-title">Welcome Back</div>
          <div className="auth-card-sub">Sign in to access the school portal</div>

          {/* ── Tab switcher ── */}
          <div className="auth-sw-row">
            {['login','register','forgot'].map(t => (
              <button key={t}
                className={`auth-sw${tab === t ? ' on' : ''}`}
                onClick={() => { setTab(t); clearMsg(); }}>
                {t === 'login' ? 'Sign In' : t === 'register' ? 'Register' : 'Forgot'}
              </button>
            ))}
          </div>

          {/* ── Alert ── */}
          {msg.text && (
            <div className={`alert show alert-${msg.type === 'ok' ? 'ok' : 'err'}`}
              style={{ display: 'flex' }}>
              {msg.text}
            </div>
          )}

          {/* ─────── LOGIN tab ─────── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  type="text" placeholder="Your username" autoComplete="username" />
              </div>
              <div className="field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    type={showPw ? 'text' : 'password'} placeholder="Your password"
                    autoComplete="current-password"
                    style={{ paddingRight: 40, width: '100%' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                      color: 'var(--muted)', zIndex: 2 }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                margin: '6px 0 10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  fontSize: 12.5, color: 'var(--muted)', userSelect: 'none' }}>
                  <input type="checkbox" checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#8B1A1A', cursor: 'pointer' }} />
                  Remember me
                </label>
              </div>

              <button type="submit" disabled={busy}
                className="btn btn-primary"
                style={{ marginTop: 2, background: 'linear-gradient(135deg,#8B1A1A,#6B1212)',
                  opacity: busy ? 0.7 : 1 }}>
                {busy ? '⏳ Signing in…' : '🔐 Sign In'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <button type="button" onClick={handleGoogle} disabled={busy}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '11px 16px', background: '#fff', border: '2px solid var(--border)',
                  borderRadius: 'var(--r2)', fontSize: 13, fontWeight: 700, color: '#3C4043',
                  cursor: 'pointer' }}>
                <GoogleIcon />
                Continue with Google
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button type="button" className="btn-link"
                  onClick={() => { setTab('forgot'); clearMsg(); }}>
                  🔑 Forgot your password?
                </button>
              </div>

              <div className="note-box"
                style={{ marginTop: 14, background: 'linear-gradient(135deg,#FDF2F2,#F5E6E6)',
                  borderLeft: '3px solid #8B1A1A' }}>
                <strong style={{ color: '#8B1A1A' }}>First time?</strong> Contact your school
                administrator to receive your login credentials via SMS.<br />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Format: <em>firstname.lastname</em> &nbsp;|&nbsp; Phone: 0758 922 915
                </span>
              </div>
            </form>
          )}

          {/* ─────── REGISTER tab ─────── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="field">
                <label>I am a…</label>
                <select value={regRole} onChange={e => setRegRole(e.target.value)}>
                  <option value="parent">Parent / Guardian</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Support Staff</option>
                </select>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Full Name *</label>
                  <input value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. JANE WANJIKU KAMAU" />
                </div>
                <div className="field">
                  <label>Phone *</label>
                  <input value={regPhone} onChange={e => setRegPhone(e.target.value)}
                    type="tel" placeholder="07XXXXXXXX" />
                </div>
              </div>
              {regRole === 'parent' && (
                <div className="field">
                  <label>Child&apos;s Admission Number *</label>
                  <input value={regAdm} onChange={e => setRegAdm(e.target.value)}
                    placeholder="e.g. 101" />
                </div>
              )}
              <div className="field">
                <label>Password * (min 6 chars)</label>
                <input value={regPass} onChange={e => setRegPass(e.target.value)}
                  type="password" placeholder="Choose a password" />
              </div>
              <div className="field">
                <label>Security Question (optional)</label>
                <select value={regSecQ} onChange={e => setRegSecQ(e.target.value)}>
                  <option value="">None</option>
                  <option>What is your favourite colour?</option>
                  <option>What is your mother&apos;s maiden name?</option>
                  <option>Name of your primary school?</option>
                  <option>Name of your first pet?</option>
                </select>
              </div>
              {regSecQ && (
                <div className="field">
                  <label>Security Answer</label>
                  <input value={regSecA} onChange={e => setRegSecA(e.target.value)}
                    placeholder="Your answer" />
                </div>
              )}
              <button type="submit" disabled={busy} className="btn btn-primary"
                style={{ marginTop: 4, background: 'linear-gradient(135deg,#8B1A1A,#6B1212)',
                  opacity: busy ? 0.7 : 1 }}>
                {busy ? '⏳ Registering…' : '✅ Create Account'}
              </button>
            </form>
          )}

          {/* ─────── FORGOT tab ─────── */}
          {tab === 'forgot' && (
            <div>
              {fgStep === 1 && (
                <form onSubmit={handleForgotStep1}>
                  <div className="field">
                    <label>Your Username</label>
                    <input value={fgUser} onChange={e => setFgUser(e.target.value)}
                      placeholder="firstname.lastname" />
                  </div>
                  <button type="submit" disabled={busy} className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)',
                      opacity: busy ? 0.7 : 1 }}>
                    {busy ? '⏳ Checking…' : '🔍 Find Account'}
                  </button>
                </form>
              )}
              {fgStep === 2 && (
                <form onSubmit={handleForgotStep2}>
                  <div className="note-box" style={{ marginBottom: 14 }}>
                    <strong>Security Question:</strong> {fgSecQ}
                  </div>
                  <div className="field">
                    <label>Your Answer</label>
                    <input value={fgSecA} onChange={e => setFgSecA(e.target.value)}
                      placeholder="Type your answer" />
                  </div>
                  <button type="submit" disabled={busy} className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)',
                      opacity: busy ? 0.7 : 1 }}>
                    {busy ? '⏳ Verifying…' : '✅ Verify'}
                  </button>
                </form>
              )}
              {fgStep === 3 && (
                <form onSubmit={handleForgotStep3}>
                  <div className="note-box" style={{ marginBottom: 14 }}>
                    Verified! Set a new password for <strong>{fgUser}</strong>.
                  </div>
                  <div className="field">
                    <label>New Password</label>
                    <input value={fgNewPw} onChange={e => setFgNewPw(e.target.value)}
                      type="password" placeholder="Min 6 characters" />
                  </div>
                  <button type="submit" disabled={busy} className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)',
                      opacity: busy ? 0.7 : 1 }}>
                    {busy ? '⏳ Saving…' : '🔐 Reset Password'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Google SVG icon ────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.46-8.71l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function loadGISScript() {
  return new Promise(resolve => {
    if (window.google?.accounts) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    document.head.appendChild(s);
  });
}
