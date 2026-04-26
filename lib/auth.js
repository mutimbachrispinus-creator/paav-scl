/**
 * lib/auth.js — Role-based access helpers
 *
 * The portal supports five roles:
 *   admin   → full access (all pages)
 *   teacher → learners, marks, attendance, reports, salary view, inbox
 *   staff   → fees (read), duties, reports, inbox
 *   parent  → my-child home, report card, fee statement
 *   member  → dashboard only (legacy)
 *
 * Session is stored in a signed HttpOnly cookie called `paav_session`.
 * On the client side, the current user object (CU) is kept in
 * sessionStorage so the SPA can read it without an API round-trip.
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'paav-gitombo-jwt-secret-change-in-prod'
);
const ALGORITHM = 'HS256';
const SESSION_COOKIE = 'paav_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/* ─── Role definitions ──────────────────────────────────────────────────── */

export const ROLES = {
  ADMIN:   'admin',
  TEACHER: 'teacher',
  STAFF:   'staff',
  PARENT:  'parent',
  MEMBER:  'member',
};

/** Pages each role may access (matches ALL_NAV in the original HTML) */
export const ROLE_PAGES = {
  admin:   ['dashboard','learners','grades','attendance','fees','staff',
            'salary','duty','streams','reports','templates','smslog',
            'audit','settings','merit-list','classes'],
  teacher: ['dashboard','learners','grades','attendance','duty',
            'reports','staff-inbox','merit-list','classes'],
  staff:   ['dashboard','duty','reports','staff-inbox'],
  parent:  ['parent-home','parent-marks','fees'],
  member:  ['dashboard'],
};

export function canAccess(role, page) {
  const allowed = ROLE_PAGES[role] || [];
  return allowed.some(p => page.startsWith(p));
}

/* ─── JWT helpers ───────────────────────────────────────────────────────── */

/**
 * Create a signed JWT for a user object.
 * Stored server-side in an HttpOnly cookie.
 */
export async function createSessionToken(user) {
  return new SignJWT({
    id:       user.id,
    username: user.username,
    name:     user.name,
    role:     user.role,
    grade:    user.grade     || '',
    childAdm: user.childAdm  || '',
    teachingAreas: user.teachingAreas || [],
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(SECRET);
}

/**
 * Verify and decode a session JWT.
 * Returns the payload or null on failure.
 */
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

/* ─── Cookie helpers (server components & route handlers) ───────────────── */

/** Read and verify the session from the request cookie store. */
export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Write the session cookie after login. */
export async function setSessionCookie(user, response) {
  const token = await createSessionToken(user);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  });
  return token;
}

/** Clear the session cookie on logout. */
export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  });
}

/* ─── Auth guard (for use in Server Components / layouts) ───────────────── */

/**
 * Call from a layout or page Server Component.
 * Redirects to / if no valid session (or if role is not allowed).
 *
 * @param {string|string[]} allowedRoles  — pass '*' to allow any role
 */
export async function requireAuth(allowedRoles = '*') {
  const { redirect } = await import('next/navigation');
  const session = await getSession();
  if (!session) redirect('/');
  if (allowedRoles !== '*') {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(session.role)) redirect('/dashboard');
  }
  return session;
}

/* ─── Password utilities ────────────────────────────────────────────────── */

/**
 * Simple hash using the Web Crypto API (available in Edge & Node ≥ 18).
 * For a production school portal consider bcrypt via a Node.js-only route.
 */
export async function hashPassword(plain) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(plain + process.env.PASS_SALT || 'paav-salt')
  );
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export async function verifyPassword(plain, hash) {
  return (await hashPassword(plain)) === hash;
}

/* ─── Role display helpers ──────────────────────────────────────────────── */

export const ROLE_EMOJI = {
  admin:   '🛡️',
  teacher: '📚',
  staff:   '👔',
  parent:  '👨‍👩‍👧',
  member:  '👤',
};

export const ROLE_COLOR = {
  admin:   '#8B1A1A',
  teacher: '#059669',
  staff:   '#0D9488',
  parent:  '#7C3AED',
  member:  '#64748B',
};

export function roleLabel(role) {
  return (role || '').charAt(0).toUpperCase() + (role || '').slice(1);
}
