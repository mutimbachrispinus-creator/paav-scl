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

    const results = await Promise.all(requests.map(req => handleRequest(req)));
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

    const value = await kvGet(key);
    return NextResponse.json({ key, value });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── Request dispatcher ────────────────────────────────────────────────── */
async function handleRequest(req) {
  switch (req.type) {
    /* ── Read one key ── */
    case 'get': {
      const value = await kvGet(req.key, null);
      return { type: 'get', key: req.key, value };
    }

    /* ── Write one key ── */
    case 'set': {
      if (req.key === undefined || req.value === undefined) {
        return { type: 'set', error: 'key and value are required' };
      }
      await kvSet(req.key, req.value);
      return { type: 'set', key: req.key, ok: true };
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
        data[k] = await kvGet(k);
      }));
      return { type: 'getAll', data };
    }

    default:
      return { error: `Unknown request type: ${req.type}` };
  }
}
