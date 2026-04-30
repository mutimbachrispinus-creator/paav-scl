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

/** In-flight requests map to prevent duplicate fetches */
const pendingRequests = new Map();

/**
 * Robust fetch with retry logic and timeout
 */
export async function fetchWithRetry(resource, options = {}, retries = 2) {
  const { timeout = 10000 } = options;
  let lastError;

  for (let i = 0; i < retries + 1; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      if (i > 0) console.log(`[Cache] Retrying fetch to ${resource} (attempt ${i})...`);
      const response = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      
      // If it's a 4xx error, don't retry, just return the response so caller can read error body
      if (response.status >= 400 && response.status < 500) return response;
      
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return response;
    } catch (error) {
      clearTimeout(id);
      lastError = error;
      if (error.name === 'AbortError') {
        console.warn(`[Cache] Fetch to ${resource} timed out after ${timeout}ms.`);
      } else {
        console.warn(`[Cache] Fetch to ${resource} failed:`, error.message);
      }
      // Wait a bit before retrying
      if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError;
}

function store(key, value, serverTs = 0) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now(), s: serverTs }));
  } catch {}
}

function read(key, ttl) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { v, t, s } = JSON.parse(raw);
    // stale-while-revalidate: always return the value, but mark if it's past TTL
    const isStale = Date.now() - t > ttl;
    return { stale: isStale, value: v, serverTs: s || 0 };
  } catch { return null; }
}


/** Get current user — from cache (instant) or /api/auth (fresh) */
export async function getCachedUser() {
  const cached = read('user', USER_TTL);
  if (cached && !cached.stale) return cached.value;

  // Return stale immediately, refresh in background
  const promise = fetchWithRetry('/api/auth', { cache: 'no-store', timeout: 5000 })
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.user) {
        store('user', data.user);
        if (data.initialData) hydrateCache(data.initialData);
        return data.user;
      }
      return null;
    })
    .catch(e => {
      console.warn('[Cache] getCachedUser background refresh failed:', e.message);
      return null;
    });

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

  const promise = fetchWithRetry('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'get', key }] }),
    timeout: 7000
  })
    .then(r => r.json())
    .then(data => {
      const value = data.results?.[0]?.value ?? null;
      const serverTs = data.results?.[0]?.updatedAt ?? 0;
      store('db_' + key, value, serverTs);
      return value;
    })
    .catch(e => {
      console.warn(`[Cache] getCachedDB background refresh failed for ${key}:`, e.message);
      return cached?.value ?? null;
    });

  if (cached?.value !== undefined) {
    return cached.value; // return stale instantly
  }

  // Check for pending request
  if (pendingRequests.has('db_' + key)) {
    return pendingRequests.get('db_' + key);
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

  const fetchPromise = fetchWithRetry('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: fetchKeys.map(k => ({ type: 'get', key: k })) }),
    timeout: 10000
  })
    .then(r => r.json())
    .then(data => {
      const fresh = {};
      fetchKeys.forEach((key, i) => {
        const value = data.results?.[i]?.value ?? null;
        const serverTs = data.results?.[i]?.updatedAt ?? 0;
        fresh[key] = value;
        store('db_' + key, value, serverTs);
      });
      return fresh;
    })
    .catch(e => {
      console.warn('[Cache] getCachedDBMulti background refresh failed:', e.message);
      return {};
    })
    .finally(() => {
      fetchKeys.forEach(k => pendingRequests.delete('db_' + k));
    });

  // Register pending requests
  fetchKeys.forEach(k => pendingRequests.set('db_' + k, fetchPromise));

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

/** Clear EVERYTHING in the cache (user + all DB keys) */
export function clearAllCache() {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

let prefetchQueue = new Set();
let prefetchTimer = null;

/** Warm up the cache for common keys — call this early (e.g. from layout) */
export function prefetchKeys(keys) {
  if (typeof window === 'undefined') return;
  
  const missing = keys.filter(k => !localStorage.getItem(PREFIX + 'db_' + k));
  if (missing.length === 0) return;

  missing.forEach(k => prefetchQueue.add(k));

  if (prefetchTimer) return;

  prefetchTimer = setTimeout(async () => {
    const currentQueue = Array.from(prefetchQueue);
    prefetchQueue = new Set();
    prefetchTimer = null;

    if (currentQueue.length === 0) return;

    // Filter out keys already being fetched
    const keysToFetch = currentQueue.filter(k => !pendingRequests.has('db_' + k));
    if (keysToFetch.length === 0) return;

    const fetchPromise = (async () => {
      try {
        const res = await fetchWithRetry('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: keysToFetch.map(k => ({ type: 'get', key: k })) }),
          timeout: 15000
        });
        const data = await res.json();
        keysToFetch.forEach((key, i) => {
          const value = data.results?.[i]?.value ?? null;
          const serverTs = data.results?.[i]?.updatedAt ?? 0;
          store('db_' + key, value, serverTs);
        });
      } catch (e) {
        console.warn('[Cache] Coalesced prefetch failed:', e.message);
      } finally {
        keysToFetch.forEach(k => pendingRequests.delete('db_' + k));
      }
    })();

    keysToFetch.forEach(k => pendingRequests.set('db_' + k, fetchPromise));
  }, 100); // 100ms window for coalescing
}

/**
 * Manually inject data into cache (e.g. from login response)
 */
export function hydrateCache(data) {
  if (typeof window === 'undefined' || !data) return;
  Object.entries(data).forEach(([key, value]) => {
    // Handle both raw values and {v, s} objects
    if (value && typeof value === 'object' && 'v' in value) {
      store(key, value.v, value.s || 0);
    } else {
      store(key, value, Date.now());
    }
  });
}

/**
 * Return current cache state for multiple keys (for sync engine)
 */
export function getLocalTimestamps(keys) {
  const map = {};
  for (const k of keys) {
    const cached = read('db_' + k, 1000000000);
    map[k] = cached?.serverTs || 0;
  }
  return map;
}
