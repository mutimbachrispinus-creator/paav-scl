'use client';
import { getLocalTimestamps, invalidateDB, fetchWithRetry, prefetchKeys } from './client-cache';
import { PAAV_KEYS } from './db';
import { getOutbox, clearOutbox } from './idb';

/**
 * lib/sync-engine.js — Background sync engine
 * 
 * Polling strategy:
 *   1. Get server timestamps for all keys.
 *   2. Compare with local timestamps.
 *   3. If server > local, invalidate the local cache and dispatch event.
 */

let _timer = null;
let _retryCount = 0;
const BASE_INTERVAL = 10000; // 10 seconds
const IDLE_INTERVAL = 60000; // 60 seconds (when tab is hidden)

export function initSyncEngine() {
  if (typeof window === 'undefined') return;
  if (_timer) return;

  console.log('[SyncEngine] Initialized');
  scheduleNextSync();

  // Handle visibility changes immediately
  document.addEventListener('visibilitychange', () => {
    console.log(`[SyncEngine] Visibility changed: ${document.visibilityState}`);
    scheduleNextSync(); // Re-schedule with appropriate interval
  });
}

function scheduleNextSync() {
  if (_timer) clearTimeout(_timer);
  
  const isHidden = document.visibilityState === 'hidden';
  let interval = isHidden ? IDLE_INTERVAL : BASE_INTERVAL;

  // Add exponential backoff if retrying after failure
  if (_retryCount > 0) {
    const backoff = Math.min(300000, Math.pow(2, _retryCount) * 1000); // Max 5 mins
    interval += backoff;
    console.warn(`[SyncEngine] Retrying in ${interval/1000}s (Attempt ${_retryCount})`);
  }

  _timer = setTimeout(sync, interval);
}

async function flushOutbox() {
  const actions = await getOutbox();
  if (actions.length === 0) return;

  console.log(`[SyncEngine] Flushing ${actions.length} offline actions...`);
  let successCount = 0;

  for (const action of actions) {
    try {
      const res = await fetch(action.url, {
        method: action.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...action.headers },
        body: JSON.stringify(action.body)
      });
      if (res.ok) successCount++;
    } catch (e) {
      console.warn('[SyncEngine] Failed to flush action:', e.message);
    }
  }

  if (successCount > 0) {
    await clearOutbox();
    console.log(`[SyncEngine] Successfully flushed ${successCount} actions.`);
  }
}

export async function sync() {
  try {
    // 0. Flush offline outbox first
    await flushOutbox();

    const local = getLocalTimestamps(PAAV_KEYS);
    
    const res = await fetchWithRetry('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'timestamps', keys: PAAV_KEYS }] }),
      timeout: 8000
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
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
      prefetchKeys(changed);
      window.dispatchEvent(new CustomEvent('paav:sync', { detail: { changed } }));
    }

    _retryCount = 0; // Reset on success
  } catch (e) {
    console.error('[SyncEngine] Sync failed:', e.message);
    _retryCount++;
  } finally {
    scheduleNextSync();
  }
}

export function stopSyncEngine() {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
}
