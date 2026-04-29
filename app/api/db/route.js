/**
 * app/api/db/route.js — Turso KV proxy
 *
 * Drop-in replacement for the window._cloudSv / _cloudLd / _cloudRm calls
 * that originally ran through /api/turso in the single-HTML prototype.
 *
 * The client sends POST requests with a `requests` array (pipeline):
 *   { requests: [ { type, key, value?, keys? } ] }
 *
 * Supported types:
 *   get          → read one key
 *   set          → write one key
 *   delete       → remove one key
 *   timestamps   → return updated_at for a list of keys (smart-poll)
 *   getAll       → read multiple keys at once
 *
 * TURSO_URL and TURSO_TOKEN are server-only env vars — never exposed to the browser.
 */

import { NextResponse } from 'next/server';
import { kvGet, kvSet, kvDelete, kvTimestamps } from '@/lib/db';
import { getSession } from '@/lib/auth';

/* ─── Auth check ────────────────────────────────────────────────────────── */
async function authenticate(request) {
  // Allow requests that carry a valid session cookie
  const session = await getSession();
  if (session) return session;

  // Fallback: accept requests from the same origin (e.g. the SPA running in /public)
  const origin = request.headers.get('origin') || '';
  const host   = request.headers.get('host')   || '';
  if (origin.includes(host)) return { role: 'system' };

  return null;
}

export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json();
    const { requests } = body;

    if (!Array.isArray(requests)) {
      return NextResponse.json({ error: 'requests must be an array' }, { status: 400 });
    }

    const results = await Promise.all(requests.map(req => handleRequest(req, auth)));
    return NextResponse.json({ results });

  } catch (err) {
    console.error('[api/db] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── GET (single key shorthand) ────────────────────────────────────────── */
export async function GET(request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

    let value = await kvGet(key);

    // Security: Filter staff requests if not admin
    if (key === 'paav_staff_reqs' && auth.role !== 'admin' && auth.id) {
      if (Array.isArray(value)) {
        value = value.filter(r => r.userId === auth.id);
      }
    }

    return NextResponse.json({ key, value });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── Request dispatcher ────────────────────────────────────────────────── */
async function handleRequest(req, auth) {
  switch (req.type) {
    /* ── Read one key ── */
    case 'get': {
      let value = await kvGet(req.key, null);
      
      // Security: Filter staff requests if not admin
      if (req.key === 'paav_staff_reqs' && auth.role !== 'admin' && auth.id) {
        if (Array.isArray(value)) {
          value = value.filter(r => r.userId === auth.id);
        }
      }
      
      return { type: 'get', key: req.key, value };
    }

    /* ── Write one key ── */
    case 'set': {
      if (req.key === undefined || req.value === undefined) {
        return { type: 'set', error: 'key and value are required' };
      }

      // Security: Only admins can use 'set' for staff requests
      if (req.key === 'paav_staff_reqs' && auth.role !== 'admin') {
        return { type: 'set', error: 'Unauthorized. Use specific request types.' };
      }

      await kvSet(req.key, req.value);
      return { type: 'set', key: req.key, ok: true };
    }

    /* ── Specialized Staff Request Handlers ── */
    case 'submitStaffRequest': {
      if (!req.request) return { type: req.type, error: 'request object is required' };
      const oldReqs = await kvGet('paav_staff_reqs', []);
      const newReq = {
        ...req.request,
        id: Date.now(),
        userId: auth.id,
        userName: auth.name,
        userRole: auth.role,
        status: 'pending',
        date: new Date().toLocaleDateString('en-KE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
      await kvSet('paav_staff_reqs', [...oldReqs, newReq]);
      return { type: req.type, ok: true, request: newReq };
    }

    case 'updateStaffRequestStatus': {
      if (auth.role !== 'admin') return { type: req.type, error: 'Only admins can update status' };
      if (!req.id || !req.status) return { type: req.type, error: 'id and status are required' };
      
      const oldReqs = await kvGet('paav_staff_reqs', []);
      const updated = oldReqs.map(r => r.id === req.id ? { ...r, status: req.status } : r);
      
      await kvSet('paav_staff_reqs', updated);
      return { type: req.type, ok: true };
    }

    /* ── Delete one key ── */
    case 'delete': {
      await kvDelete(req.key);
      return { type: 'delete', key: req.key, ok: true };
    }

    /* ── Timestamps for smart-poll ── */
    case 'timestamps': {
      const keys = Array.isArray(req.keys) ? req.keys : [];
      const rows = await kvTimestamps(keys);
      const map  = {};
      rows.forEach(r => { map[r.key] = r.updated_at; });
      return { type: 'timestamps', timestamps: map };
    }

    /* ── Update Avatar ── */
    case 'updateStaffAvatar': {
      if (!req.id || req.avatar === undefined) return { type: req.type, error: 'id and avatar are required' };
      const { kvUpdateStaffAvatar } = await import('@/lib/db');
      await kvUpdateStaffAvatar(req.id, req.avatar);
      return { type: req.type, id: req.id, ok: true };
    }
    case 'updateStaffProfile': {
      if (!req.id) return { type: req.type, error: 'id is required' };
      const { kvUpdateStaffProfile } = await import('@/lib/db');
      await kvUpdateStaffProfile(req.id, req.name, req.phone, req.avatar);
      return { type: req.type, id: req.id, ok: true };
    }
    case 'updateLearnerAvatar': {
      if (!req.adm || req.avatar === undefined) return { type: req.type, error: 'adm and avatar are required' };
      const { kvUpdateLearnerAvatar } = await import('@/lib/db');
      await kvUpdateLearnerAvatar(req.adm, req.avatar);
      return { type: req.type, adm: req.adm, ok: true };
    }

    case 'updateMark': {
      if (!req.gsa || !req.adm) return { type: req.type, error: 'gsa and adm are required' };
      const { kvUpdateMark } = await import('@/lib/db');
      await kvUpdateMark(req.gsa, req.adm, req.score);
      return { type: req.type, ok: true };
    }

    /* ── Bulk read ── */
    case 'getAll': {
      const keys = Array.isArray(req.keys) ? req.keys : [];
      if (!keys.length) return { type: 'getAll', data: {} };

      const data = {};
      await Promise.all(keys.map(async (k) => {
        let value = await kvGet(k);
        // Security: Filter staff requests if not admin
        if (k === 'paav_staff_reqs' && auth.role !== 'admin' && auth.id) {
          if (Array.isArray(value)) value = value.filter(r => r.userId === auth.id);
        }
        // Security: Hide fees from teachers/staff
        if (!['admin','parent'].includes(auth.role)) {
          if (['paav6_feecfg', 'paav6_paylog'].includes(k)) value = k === 'paav6_paylog' ? [] : {};
          if (k === 'paav6_learners' && Array.isArray(value)) {
            value = value.map(l => ({ ...l, t1: 0, t2: 0, t3: 0, arrears: 0 }));
          }
        }
        data[k] = value;
      }));
      return { type: 'getAll', data };
    }
    
    case 'storageUsage': {
      if (auth.role !== 'admin') return { error: 'Unauthorized' };
      const { getStorageUsage } = await import('@/lib/db');
      const usage = await getStorageUsage();
      return { type: 'storageUsage', usage };
    }

    case 'logActivity': {
      if (!req.activity) return { type: req.type, error: 'activity object is required' };
      const { logAction } = await import('@/lib/db');
      await logAction(auth, req.activity.action, req.activity.details);
      return { type: req.type, ok: true };
    }

    case 'recordPayment': {
      if (!req.payment) return { type: req.type, error: 'payment object is required' };
      const { kvRecordPayment } = await import('@/lib/db');
      await kvRecordPayment(req.payment);
      return { type: req.type, ok: true };
    }

    case 'getDatabaseDump': {
      if (auth.role !== 'admin') return { error: 'Unauthorized' };
      const { query } = await import('@/lib/db');
      const all = await query('SELECT key, value FROM kv');
      const data = {};
      all.forEach(r => {
        try { data[r.key] = JSON.parse(r.value); } catch { data[r.key] = r.value; }
      });
      return { type: req.type, data };
    }

    default:
      return { error: `Unknown request type: ${req.type}` };
  }
}


