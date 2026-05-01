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
import { kvGet, kvSet, ensureSchema, query } from '@/lib/db';
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
  await ensureSchema();

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
  const tenantId = request.headers.get('x-tenant-id') || 'paav-gitombo';

  const rows = await query('SELECT * FROM staff WHERE LOWER(username) = ? AND tenant_id = ?', [username.toLowerCase().trim(), tenantId]);
  const user = rows[0];

  if (!user) return err('Account not found (Check your username)');
  if (user.status === 'inactive') return err('Your account is deactivated. Contact admin.');

  // Strictly verify against hashed passwords (Legacy or PBKDF2)
  const match = await verifyPassword(password, user.password);

  if (!match) return err('Incorrect password (Check your credentials)');

  // Prefetch common dashboard data to include in login response
  const [ann, msgs, hero, feecfg, learners] = await Promise.all([
    kvGet('paav_announcement'),
    kvGet('paav6_msgs'),
    kvGet('paav7_hero_img'),
    kvGet('paav6_feecfg'),
    kvGet('paav6_learners')
  ]);

  const response = NextResponse.json({
    ok: true,
    user: publicUser(user),
    redirect: user.tenant_id === 'platform-master' ? '/super-admin' : (user.role === 'parent' ? '/parent-home' : '/dashboard'),
    initialData: {
      db_paav_announcement: ann,
      db_paav6_msgs: msgs,
      db_paav7_hero_img: hero,
      db_paav6_feecfg: feecfg,
      db_paav6_learners: learners
    }
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
async function handleRegister({ role, name, phone, password, childAdm, teachingLevels, secQ, secA }, request) {
  if (!role || !name || !phone || !password) {
    return err('role, name, phone and password are required');
  }
  if (password.length < 6) return err('Password must be at least 6 characters');

  const tenantId = request.headers.get('x-tenant-id') || 'paav-gitombo';
  const { query, execute } = await import('@/lib/db');

  // Generate unique username: firstname.lastname.rand
  const base = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 15);
  const rand = Math.floor(100 + Math.random() * 899);
  const username = `${base}.${rand}`;

  // Check if username taken in this school
  const existing = await query('SELECT id FROM staff WHERE username = ? AND tenant_id = ?', [username, tenantId]);
  if (existing.length) return err(`Username ${username} is taken in this school. Try again.`);

  // Parents must link to valid learner(s)
  let childAdmString = '';
  if (role === 'parent') {
    if (!childAdm) return err('Admission number is required for parent registration');
    const adms = String(childAdm).split(',').map(s => s.trim()).filter(Boolean);
    const learnersRes = await query('SELECT adm FROM learners WHERE tenant_id = ?', [tenantId]);
    const learners = learnersRes.map(l => l.adm);
    for (const adm of adms) {
      if (!learners.includes(adm)) return err(`Learner with admission number ${adm} not found`);
    }
    childAdmString = adms.join(',');
  }

  const id = 'u' + Date.now();
  const hashedPw = await hashPassword(password);
  const status = role === 'parent' ? 'active' : 'pending';

  await execute(
    `INSERT INTO staff (id, tenant_id, name, username, role, phone, password, status, child_adm, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, name.toUpperCase(), username, role, phone, hashedPw, status, childAdmString, new Date().toISOString()]
  );

  return NextResponse.json({ ok: true, username, status });
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
    const [ann, msgs, hero, feecfg, learners] = await Promise.all([
      kvGet('paav_announcement'),
      kvGet('paav6_msgs'),
      kvGet('paav7_hero_img'),
      kvGet('paav6_feecfg'),
      kvGet('paav6_learners')
    ]);

    return NextResponse.json({
      ok: true,
      user: publicUser(user),
      initialData: {
        db_paav_announcement: ann,
        db_paav6_msgs: msgs,
        db_paav7_hero_img: hero,
        db_paav6_feecfg: feecfg,
        db_paav6_learners: learners
      }
    });
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
  if (newPassword.length < 8)    return err('Password must be at least 8 characters');

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
async function handleEditUser({ id, name, role, grade, phone, status, password, avatar }, request) {
  const session = await getSession();
  if (!session) return err('Unauthorised', 401);
  
  // Only admins can edit others; users can edit themselves
  if (session.role !== 'admin' && session.id !== id) {
    return err('Forbidden: You can only edit your own profile', 403);
  }

  // Certain fields are Admin-only
  if (session.role !== 'admin') {
    if (role || status || grade !== undefined) {
      return err('Forbidden: Only administrators can change roles, status, or grades', 403);
    }
  }

  const { query, kvUpdateStaffProfile } = await import('@/lib/db');
  const rows = await query('SELECT * FROM staff WHERE id = ?', [id]);
  const existing = rows[0];
  if (!existing) return err('User not found');

  const finalName = name ? name.toUpperCase() : existing.name;
  const finalPhone = phone || existing.phone;
  const finalAvatar = avatar !== undefined ? avatar : existing.avatar;
  
  let hashedPassword = null;
  if (password && password.length >= 6) {
    hashedPassword = await hashPassword(password);
  }

  // Update directly in the relational table (which handleEditUser was NOT doing correctly before)
  // And touch the KV timestamp to invalidate client cache
  await kvUpdateStaffProfile(id, finalName, finalPhone, finalAvatar, hashedPassword);

  // If Admin is updating other fields (role, status, grade)
  if (session.role === 'admin' && (role || status || grade !== undefined)) {
    const finalRole = role || existing.role;
    const finalStatus = status || existing.status;
    const finalGrade = grade !== undefined ? grade : existing.grade;
    const { execute } = await import('@/lib/db');
    await execute('UPDATE staff SET role = ?, status = ?, grade = ? WHERE id = ?', [finalRole, finalStatus, finalGrade, id]);
  }

  return NextResponse.json({ ok: true });
}

/* ─── Utilities ─────────────────────────────────────────────────────────── */
function publicUser(u) {
  const { password, secA, ...safe } = u;  // never send password or secret answer
  return { ...safe, emoji: ROLE_EMOJI[u.role] || '👤', color: ROLE_COLOR[u.role] };
}
