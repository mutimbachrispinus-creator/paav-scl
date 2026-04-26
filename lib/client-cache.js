'use client';
/**
 * lib/client-cache.js — Client-side session & DB cache
 *
 * Eliminates redundant /api/auth and /api/db round-trips by caching
 * results in sessionStorage. Auth: 5 min TTL. DB keys: 30 s TTL.
 *
 * Usage:
 *   import { getCachedUser, getCachedDB, invalidateUser } from '@/lib/client-cache';
 *   const user = await getCachedUser();
 *   const learners = await getCachedDB('paav6_learners');
 */

const USER_TTL  = 5 * 60 * 1000;   // 5 minutes
const DB_TTL    = 30 * 1000;        // 30 seconds
const PREFIX    = 'paav_cache_';

function store(key, value) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() }));
  } catch {}
}

function read(key, ttl) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw);
    if (Date.now() - t > ttl) { sessionStorage.removeItem(PREFIX + key); return null; }
    return v;
  } catch { return null; }
}

/** Get current user — from cache or /api/auth */
export async function getCachedUser() {
  const cached = read('user', USER_TTL);
  if (cached) return cached;
  const res = await fetch('/api/auth');
  const data = await res.json();
  if (data.ok && data.user) {
    store('user', data.user);
    return data.user;
  }
  return null;
}

/** Invalidate user cache (call on logout or role change) */
export function invalidateUser() {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(PREFIX + 'user'); } catch {}
}

/**
 * Get a DB value — from cache or /api/db
 * @param {string} key  — e.g. 'paav6_learners'
 * @param {number} ttl  — override default 30 s
 */
export async function getCachedDB(key, ttl = DB_TTL) {
  const cached = read('db_' + key, ttl);
  if (cached !== null) return cached;
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'get', key }] }),
  });
  const data = await res.json();
  const value = data.results?.[0]?.value ?? null;
  store('db_' + key, value);
  return value;
}

/**
 * Fetch multiple DB keys in one request — partial caching.
 * Returns object { key: value }
 */
export async function getCachedDBMulti(keys, ttl = DB_TTL) {
  const result = {};
  const toFetch = [];
  for (const key of keys) {
    const cached = read('db_' + key, ttl);
    if (cached !== null) result[key] = cached;
    else toFetch.push(key);
  }
  if (toFetch.length === 0) return result;

  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: toFetch.map(k => ({ type: 'get', key: k })) }),
  });
  const data = await res.json();
  toFetch.forEach((key, i) => {
    const value = data.results?.[i]?.value ?? null;
    result[key] = value;
    store('db_' + key, value);
  });
  return result;
}

/** Invalidate a cached DB key (call after write) */
export function invalidateDB(key) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(PREFIX + 'db_' + key); } catch {}
}

/** Invalidate ALL cached DB keys */
export function invalidateAllDB() {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(PREFIX + 'db_'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {}
}
