/**
 * app/api/auth/route.js — Authentication endpoints
 *
 * POST /api/auth   { action, ...payload }
 *
 * Actions:
 *   login     { username, password, remember }  → sets session cookie
 *   logout    {}                                → clears session cookie
 *   register  { role, name, phone, password, childAdm? }
 *   google    { idToken }                       → Google Sign-In
 *   whoami    {}                                → returns current session
 *   forgot    { username, secQ, secA }          → password reset eligibility
 *   resetpw   { username, newPassword, token }
 */

import { NextResponse } from 'next/server';
import {
  verifyPassword, hashPassword,
  setSessionCookie, clearSessionCookie, getSession,
  ROLE_EMOJI, ROLE_COLOR,
} from '@/lib/auth';
import { kvGet, kvSet } from '@/lib/db';
import { sendCredentialsSMS } from '@/lib/sms-client';

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function ok(data, response) {
  return NextResponse.json({ ok: true, ...data }, { status: 200, ...response });
}
function err(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

async function getStaffList() {
  return (await kvGet('paav6_staff')) || [];
}

/* ─── Router ────────────────────────────────────────────────────────────── */
export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body'); }

  const { action } = body;

  try {
    switch (action) {
      case 'login':    return handleLogin(body, request);
      case 'logout':   return handleLogout(request);
      case 'register': return handleRegister(body, request);
      case 'edit_user': return handleEditUser(body, request);
      case 'google':   return handleGoogle(body, request);
      case 'whoami':   return handleWhoami(request);
      case 'forgot':   return handleForgot(body);
      case 'resetpw':  return handleResetPw(body);
      default:         return err(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error('[api/auth] Server Error:', e);
    return err(e.message || 'Internal Server Error', 500);
  }
}

export async function GET(request) {
  const response = await handleWhoami(request);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

/* ─── login ─────────────────────────────────────────────────────────────── */
async function handleLogin({ username, password }, request) {
  if (!username || !password) return err('Username and password are required');

  const { query } = await import('@/lib/db');
  const rows = await query('SELECT * FROM staff WHERE LOWER(username) = ?', [username.toLowerCase().trim()]);
  const user = rows[0];

  if (!user) return err('Invalid username or password');
  if (user.status === 'inactive') return err('Your account is deactivated. Contact admin.');

  // Support both plain-text passwords (legacy) and hashed passwords
  const match =
    user.password === password ||                          // legacy plain
    await verifyPassword(password, user.password);         // hashed

  if (!match) return err('Invalid username or password');

  const response = NextResponse.json({
    ok: true,
    user: publicUser(user),
  });

  await setSessionCookie(user, response);
  return response;
}

/* ─── logout ────────────────────────────────────────────────────────────── */
async function handleLogout() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}

/* ─── register ──────────────────────────────────────────────────────────── */
async function handleRegister({ role, name, phone, password, childAdm, teachingLevels, secQ, secA }) {
  if (!role || !name || !phone || !password) {
    return err('role, name, phone and password are required');
  }
  if (password.length < 6) return err('Password must be at least 6 characters');

  const staff = await getStaffList();

  // Generate username: firstname.lastname
  const username = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('.')
    .slice(0, 30);

  if (staff.find(s => s.username === username)) {
    return err(`Username "${username}" is already taken`);
  }

  // Parents must link to valid learner(s)
  let childAdmString = '';
  if (role === 'parent') {
    if (!childAdm) return err('Admission number is required for parent registration');
    
    const adms = String(childAdm).split(',').map(s => s.trim()).filter(Boolean);
    if (!adms.length) return err('Invalid admission number format');

    const learners = (await kvGet('paav6_learners')) || [];
    for (const adm of adms) {
      const learner = learners.find(l => l.adm === adm);
      if (!learner) return err(`Learner with admission number ${adm} not found`);
    }
    childAdmString = adms.join(',');
  }

  const newUser = {
    id:       'u' + Date.now(),
    name:     name.toUpperCase(),
    role,
    phone,
    username,
    password: await hashPassword(password),
    status:   role === 'parent' ? 'active' : 'pending',  // parents auto-active
    childAdm: childAdmString,
    grade:    '',
    teachingAreas: teachingLevels || [],
    secQ: secQ || '',
    secA: secA || '',
    createdAt: new Date().toISOString(),
  };

  staff.push(newUser);
  await kvSet('paav6_staff', staff);

  return NextResponse.json({ ok: true, username, status: newUser.status });
}

/* ─── Google Sign-In ────────────────────────────────────────────────────── */
async function handleGoogle({ idToken }, request) {
  if (!idToken) return err('idToken is required');

  // Verify the Google ID token
  const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
  try {
    const tokenRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    if (!tokenRes.ok) return err('Invalid Google token');
    const payload = await tokenRes.json();

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return err('Token audience mismatch');
    }

    const email = payload.email;
    const staff = await getStaffList();
    const user  = staff.find(s => s.email?.toLowerCase() === email?.toLowerCase());

    if (!user) {
      return err(`No portal account found for ${email}. Contact admin.`);
    }
    if (user.status === 'inactive') return err('Account deactivated');

    const response = NextResponse.json({ ok: true, user: publicUser(user) });
    await setSessionCookie(user, response);
    
    // Log activity
    const { logAction } = await import('@/lib/db');
    await logAction(user, 'Login', `Logged in from ${request.headers.get('user-agent') || 'unknown'}`);

    return response;

  } catch (e) {
    return err('Google sign-in failed: ' + e.message, 500);
  }
}

/* ─── whoami ────────────────────────────────────────────────────────────── */
async function handleWhoami() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, user: null }, { status: 401 });

  // Fetch fresh user data from DB to include avatar, color, etc.
  const { query } = await import('@/lib/db');
  const rows = await query('SELECT * FROM staff WHERE id = ?', [session.id]);
  const user = rows[0];
  
  if (user) {
    return NextResponse.json({ ok: true, user: publicUser(user) });
  }

  // Fallback if not found in staff (e.g. parent/learner logic)
  if (session.role === 'parent') {
    const learners = (await kvGet('paav6_learners')) || [];
    const learner = learners.find(l => l.adm === session.username); // parents use child adm as username usually
    if (learner) return NextResponse.json({ ok: true, user: { ...session, avatar: learner.avatar, emoji: ROLE_EMOJI.parent, color: ROLE_COLOR.parent } });
  }

  return NextResponse.json({ ok: true, user: session });
}

/* ─── forgot password ───────────────────────────────────────────────────── */
async function handleForgot({ username, secQ, secA }) {
  if (!username) return err('Username is required');
  const { query } = await import('@/lib/db');
  const rows = await query('SELECT * FROM staff WHERE LOWER(username) = ?', [username.toLowerCase()]);
  const user = rows[0];
  if (!user) return err('User not found');

  if (secQ && secA) {
    // Verify security Q&A
    const match = user.secQ === secQ && user.secA?.toLowerCase() === secA?.toLowerCase();
    return NextResponse.json({ ok: match, eligible: match });
  }

  // Just return what security question they set
  return NextResponse.json({ ok: true, secQ: user.secQ || null, hasPhone: !!user.phone });
}

/* ─── reset password ────────────────────────────────────────────────────── */
async function handleResetPw({ username, newPassword, secA }) {
  if (!username || !newPassword) return err('username and newPassword are required');
  if (newPassword.length < 6)    return err('Password must be at least 6 characters');

  const staff = await getStaffList();
  const idx   = staff.findIndex(s => s.username?.toLowerCase() === username.toLowerCase());
  if (idx === -1) return err('User not found');

  const user = staff[idx];
  if (secA && user.secA?.toLowerCase() !== secA.toLowerCase()) {
    return err('Security answer is incorrect');
  }

  staff[idx].password = await hashPassword(newPassword);
  await kvSet('paav6_staff', staff);
  return NextResponse.json({ ok: true });
}

/* ─── Admin edit user ───────────────────────────────────────────────────── */
async function handleEditUser({ id, name, role, grade, phone, status, password }, request) {
  // Must be called by an admin session
  const session = await getSession();
  if (!session || session.role !== 'admin') return err('Admin only', 403);

  const staff = await getStaffList();
  const idx   = staff.findIndex(s => s.id === id);
  if (idx === -1) return err('User not found');

  if (name)   staff[idx].name   = name.toUpperCase();
  if (role)   staff[idx].role   = role;
  if (grade !== undefined) staff[idx].grade  = grade;
  if (phone)  staff[idx].phone  = phone;
  if (status) staff[idx].status = status;

  // Admin force-reset password — no old password required
  if (password && password.length >= 6) {
    staff[idx].password = await hashPassword(password);
  }

  await kvSet('paav6_staff', staff);
  return NextResponse.json({ ok: true, user: publicUser(staff[idx]) });
}

/* ─── Utilities ─────────────────────────────────────────────────────────── */
function publicUser(u) {
  const { password, secA, ...safe } = u;  // never send password or secret answer
  return { ...safe, emoji: ROLE_EMOJI[u.role] || '👤', color: ROLE_COLOR[u.role] };
}
