'use client';
import { getLocalTimestamps, invalidateDB, fetchWithRetry, prefetchKeys } from './client-cache';
import { PAAV_KEYS } from './db';

/**
 * lib/sync-engine.js — Background sync engine
 * 
 * Polling strategy:
 *   1. Get server timestamps for all keys.
 *   2. Compare with local timestamps.
 *   3. If server > local, invalidate the local cache and dispatch event.
 */

let _timer = null;
const INTERVAL = 10000; // 10 seconds

export function initSyncEngine() {
  if (typeof window === 'undefined') return;
  if (_timer) return;

  console.log('[SyncEngine] Initialized');
  _timer = setInterval(sync, INTERVAL);
  // Initial sync after a short delay
  setTimeout(sync, 1000);
}

export async function sync() {
  try {
    const local = getLocalTimestamps(PAAV_KEYS);
    
    const res = await fetchWithRetry('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'timestamps', keys: PAAV_KEYS }] }),
      timeout: 5000
    });
    
    if (!res.ok) return;
    const data = await res.json();
    const server = data.results?.[0]?.timestamps || {};
    
    const changed = [];
    for (const key of PAAV_KEYS) {
      if (server[key] && server[key] > (local[key] || 0)) {
        console.log(`[SyncEngine] Key stale: ${key} (Server: ${server[key]}, Local: ${local[key]})`);
        invalidateDB(key);
        changed.push(key);
      }
    }
    
    if (changed.length > 0) {
      // Proactively fetch changed keys to warm up cache
      prefetchKeys(changed);
      window.dispatchEvent(new CustomEvent('paav:sync', { detail: { changed } }));
    }
  } catch (e) {
    console.error('[SyncEngine] Error:', e);
  }
}

export function stopSyncEngine() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}
