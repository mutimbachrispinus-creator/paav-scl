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
  { icon: '📝', text: 'CBC marks entry per subject — Senior/JSS 72pts · Primary 4pts/subject' },
  { icon: '💰', text: 'Configurable fee structure — admin sets termly amounts' },
  { icon: '👨‍👩‍👧', text: 'Parent portal — child\'s fees, grades & school messages' },
  { icon: '💬', text: 'Direct messaging between staff and parents' },
];

/* ─── School stats ───────────────────────────────────────────────────────── */
const STATS = [
  { n: '—', l: 'Learners' },
  { n: '—', l: 'Classes' },
  { n: '—', l: 'Year' },
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
  const [regRole,   setRegRole]   = useState('');
  const [regName,   setRegName]   = useState('');
  const [regPhone,  setRegPhone]  = useState('');
  const [regPass,   setRegPass]   = useState('');
  const [regPass2,  setRegPass2]  = useState('');
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
    if (!regRole) { flash('Please select a role'); return; }
    if (!regName || !regPhone || !regPass) { flash('Fill all required fields'); return; }
    if (regPass !== regPass2) { flash('Passwords do not match'); return; }
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
          <img src="data:image/jpeg;base64,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" alt="PAAV Logo" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: '50%', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }} />
        </div>

        <h1 className="auth-h">
          PAAV-GITOMBO<br />
          <span style={{ color: '#F4A460' }}>Community School</span>
        </h1>
        <div className="auth-tagline">
          P.O BOX 4091-00100 Nairobi · 0758 922 915 · <span style={{ color: 'rgba(255,255,255,.65)' }}>paavgitomboschool@gmail.com</span>
        </div>

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
                  <option value="">Select your role</option>
                  <option value="teacher">Teacher / Subject Teacher</option>
                  <option value="senior_teacher">Senior School Teacher (Gr 10–12)</option>
                  <option value="staff">Non-Teaching Staff</option>
                  <option value="parent">Parent / Guardian</option>
                  <option value="admin">Administrator</option>
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
              <div className="field-row">
                <div className="field">
                  <label>Password * (min 6 chars)</label>
                  <input value={regPass} onChange={e => setRegPass(e.target.value)}
                    type="password" placeholder="Choose a password" />
                </div>
                <div className="field">
                  <label>Confirm Password *</label>
                  <input value={regPass2} onChange={e => setRegPass2(e.target.value)}
                    type="password" placeholder="Repeat password" />
                </div>
              </div>
              <div className="field">
                <label>Security Question (for password recovery)</label>
                <select value={regSecQ} onChange={e => setRegSecQ(e.target.value)}>
                  <option value="">Optional — select a question</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What was the name of your first school?</option>
                  <option>What is your favourite colour?</option>
                  <option>What is the name of your hometown?</option>
                  <option>What is your pet's name?</option>
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
