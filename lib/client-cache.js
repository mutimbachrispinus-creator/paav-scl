'use client';
/**
 * lib/client-cache.js — Client-side session & DB cache
 *
 * Strategy: stale-while-revalidate.
 *   • On first visit: fetch, store, return.
 *   • On subsequent visits: return cached immediately, then refresh in background.
 *   • TTLs: user=5 min, DB=60 s (increased from 30 s).
 */

const USER_TTL = 5 * 60 * 1000;   // 5 minutes
const DB_TTL   = 5 * 60 * 1000;   // 5 minutes (increased from 60s)
const PREFIX   = 'paav_cache_';

function store(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() }));
  } catch {}
}

function read(key, ttl) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw);
    // stale-while-revalidate: always return the value, but mark if it's past TTL
    const isStale = Date.now() - t > ttl;
    return { stale: isStale, value: v };
  } catch { return null; }
}


/** Get current user — from cache (instant) or /api/auth (fresh) */
export async function getCachedUser() {
  const cached = read('user', USER_TTL);
  if (cached && !cached.stale) return cached.value;

  // Return stale immediately, refresh in background
  const promise = fetch('/api/auth', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.user) {
        store('user', data.user);
        return data.user;
      }
      return null;
    })
    .catch(() => null);

  if (cached?.value) {
    promise.catch(() => {}); // fire-and-forget background refresh
    return cached.value;     // return stale instantly
  }
  return promise; // no cache at all — must wait
}

/** Invalidate user cache (call on logout or role change) */
export function invalidateUser() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(PREFIX + 'user'); } catch {}
}

/**
 * Get a DB value — from cache (instant) or /api/db (fresh).
 * Uses stale-while-revalidate: returns cached value immediately,
 * fetches fresh in background.
 */
export async function getCachedDB(key, ttl = DB_TTL) {
  const cached = read('db_' + key, ttl);
  if (cached && !cached.stale) return cached.value;

  const promise = fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'get', key }] }),
  })
    .then(r => r.json())
    .then(data => {
      const value = data.results?.[0]?.value ?? null;
      store('db_' + key, value);
      return value;
    })
    .catch(() => cached?.value ?? null);

  if (cached?.value !== undefined) {
    return cached.value; // return stale instantly
  }
  return promise;
}

/**
 * Fetch multiple DB keys in one request — partial caching with SWR.
 * Returns {key: value} immediately from cache, fetches missing/stale in background.
 */
export async function getCachedDBMulti(keys, ttl = DB_TTL) {
  const result = {};
  const staleKeys = [];
  const missingKeys = [];

  for (const key of keys) {
    const cached = read('db_' + key, ttl);
    if (!cached) {
      missingKeys.push(key);
    } else {
      result[key] = cached.value;
      if (cached.stale) staleKeys.push(key);
    }
  }

  // Keys with no cache at all — must fetch synchronously
  const fetchKeys = [...missingKeys, ...staleKeys];

  if (fetchKeys.length === 0) return result;

  const fetchPromise = fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: fetchKeys.map(k => ({ type: 'get', key: k })) }),
  })
    .then(r => r.json())
    .then(data => {
      const fresh = {};
      fetchKeys.forEach((key, i) => {
        const value = data.results?.[i]?.value ?? null;
        fresh[key] = value;
        store('db_' + key, value);
      });
      return fresh;
    })
    .catch(() => ({}));

  if (missingKeys.length > 0) {
    // Wait only for truly missing keys
    const fresh = await fetchPromise;
    return { ...result, ...fresh };
  }

  // All keys had stale cache — return stale instantly, refresh in background
  fetchPromise.catch(() => {});
  return result;
}

/** Invalidate a cached DB key (call after write) */
export function invalidateDB(key) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(PREFIX + 'db_' + key); } catch {}
}

/** Invalidate ALL cached DB keys */
export function invalidateAllDB() {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX + 'db_'))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

/** Warm up the cache for common keys — call this early (e.g. from layout) */
export function prefetchKeys(keys) {
  if (typeof window === 'undefined') return;
  const missing = keys.filter(k => !localStorage.getItem(PREFIX + 'db_' + k));

  if (missing.length === 0) return;
  fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: missing.map(k => ({ type: 'get', key: k })) }),
  })
    .then(r => r.json())
    .then(data => {
      missing.forEach((key, i) => {
        const value = data.results?.[i]?.value ?? null;
        store('db_' + key, value);
      });
    })
    .catch(() => {});
}
