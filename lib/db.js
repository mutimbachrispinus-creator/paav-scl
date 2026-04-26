/**
 * lib/db.js — Turso (libSQL) connection
 *
 * Environment variables (set in Vercel dashboard, never in code):
 *   TURSO_URL    e.g. libsql://paav-gitombo-<org>.turso.io
 *   TURSO_TOKEN  your Turso auth token
 *
 * Usage:
 *   import { query, execute } from '@/lib/db'
 *   const rows = await query('SELECT value FROM kv WHERE key = ?', ['paav6_learners'])
 */

import { createClient } from '@libsql/client';

export async function kvUpdateStaffAvatar(id, avatar) {
  await ensureSchema();
  await execute('UPDATE staff SET avatar = ? WHERE id = ?', [avatar, id]);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_staff']);
}

export async function kvUpdateStaffProfile(id, name, phone, avatar) {
  await ensureSchema();
  await execute('UPDATE staff SET name = ?, phone = ?, avatar = ? WHERE id = ?', [name, phone, avatar, id]);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_staff']);
}

export async function kvUpdateLearnerAvatar(adm, avatar) {
  await ensureSchema();
  await execute('UPDATE learners SET avatar = ? WHERE adm = ?', [avatar, adm]);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_learners']);
}

let _client = null;

function getClient() {
  if (_client) return _client;
  if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
    throw new Error('Missing TURSO_URL or TURSO_TOKEN environment variables');
  }
  _client = createClient({
    url:       process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  });
  return _client;
}

/**
 * Auto-create the key-value table on first use.
 * The portal stores all data as JSON blobs keyed by a string.
 *
 * Schema:
 *   kv(key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)
 */
let _schemaOk = false;
export async function ensureSchema() {
  if (_schemaOk) return;
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key        TEXT    PRIMARY KEY,
      value      TEXT    NOT NULL DEFAULT '""',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS learners (
      adm TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT,
      sex TEXT,
      age INTEGER,
      dob TEXT,
      stream TEXT,
      teacher TEXT,
      parent TEXT,
      phone TEXT,
      addr TEXT,
      t1 REAL DEFAULT 0,
      t2 REAL DEFAULT 0,
      t3 REAL DEFAULT 0,
      avatar TEXT
    )
  `);

  try { await db.execute('ALTER TABLE learners ADD COLUMN avatar TEXT;'); } catch (e) {}


  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      password TEXT,
      status TEXT,
      childAdm TEXT,
      grade TEXT,
      teachingAreas TEXT,
      secQ TEXT,
      secA TEXT,
      email TEXT,
      createdAt TEXT,
      avatar TEXT
    )
  `);

  try { await db.execute('ALTER TABLE staff ADD COLUMN avatar TEXT;'); } catch (e) {}

  await db.execute(`
    CREATE TABLE IF NOT EXISTS paylog (
      id TEXT PRIMARY KEY,
      date TEXT,
      adm TEXT,
      name TEXT,
      grade TEXT,
      term TEXT,
      amount REAL,
      method TEXT,
      ref TEXT,
      by TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS marks (
      grade_subj_assess TEXT,
      adm TEXT,
      score REAL,
      PRIMARY KEY(grade_subj_assess, adm)
    )
  `);
  _schemaOk = true;
}

/**
 * Run a SELECT and return all rows as plain objects.
 * @param {string} sql
 * @param {any[]}  args
 */
export async function query(sql, args = []) {
  const db = getClient();
  const cleanArgs = args.map(a => a === undefined ? null : a);
  const result = await db.execute({ sql, args: cleanArgs });
  return result.rows;
}

/**
 * Run an INSERT / UPDATE / DELETE.
 * @param {string} sql
 * @param {any[]}  args
 */
export async function execute(sql, args = []) {
  const db = getClient();
  const cleanArgs = args.map(a => a === undefined ? null : a);
  return db.execute({ sql, args: cleanArgs });
}

/**
 * Run a batch of statements atomically (used by /api/db for pipeline).
 * @param {{ sql: string, args: any[] }[]} statements
 */
export async function batch(statements) {
  const db = getClient();
  const cleanStmts = statements.map(s => ({
    sql: s.sql,
    args: s.args ? s.args.map(a => a === undefined ? null : a) : []
  }));
  return db.batch(cleanStmts, 'write');
}

/* ─── Convenience wrappers (matching the original _cloudSv / _cloudLd API) ─── */

/**
 * Load a JSON value by key.  Returns parsed value or defaultValue.
 */
export async function kvGet(key, defaultValue = null) {
  await ensureSchema();

  if (key === 'paav6_learners') {
    const rows = await query('SELECT * FROM learners');
    if (!rows.length) return defaultValue || [];
    return rows;
  }

  if (key === 'paav6_staff') {
    const rows = await query('SELECT * FROM staff');
    if (!rows.length) return defaultValue || [];
    return rows.map(r => ({
      ...r,
      teachingAreas: r.teachingAreas ? JSON.parse(r.teachingAreas) : []
    }));
  }

  if (key === 'paav6_paylog') {
    const rows = await query('SELECT * FROM paylog');
    if (!rows.length) return defaultValue || [];
    return rows;
  }

  if (key === 'paav6_marks') {
    const rows = await query('SELECT * FROM marks');
    const result = {};
    for (const r of rows) {
      if (!result[r.grade_subj_assess]) result[r.grade_subj_assess] = {};
      result[r.grade_subj_assess][r.adm] = r.score;
    }
    return result;
  }

  const rows = await query('SELECT value FROM kv WHERE key = ?', [key]);
  if (!rows.length) return defaultValue;
  try { return JSON.parse(rows[0].value); } catch { return defaultValue; }
}

/**
 * Save a JSON-serialisable value by key.
 */
export async function kvSet(key, value) {
  await ensureSchema();

  if (key === 'paav6_learners') {
    const stmts = [ { sql: 'DELETE FROM learners', args: [] } ];
    for (const l of value) {
      stmts.push({
        sql: `INSERT INTO learners (adm, name, grade, sex, age, dob, stream, teacher, parent, phone, addr, t1, t2, t3, avatar) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [l.adm, l.name, l.grade, l.sex, l.age, l.dob, l.stream, l.teacher, l.parent, l.phone, l.addr, l.t1, l.t2, l.t3, l.avatar || null]
      });
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav6_staff') {
    const stmts = [ { sql: 'DELETE FROM staff', args: [] } ];
    for (const s of value) {
      stmts.push({
        sql: `INSERT INTO staff (id, name, username, role, phone, password, status, childAdm, grade, teachingAreas, secQ, secA, email, createdAt, avatar)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [s.id, s.name, s.username, s.role, s.phone, s.password, s.status, s.childAdm, s.grade, JSON.stringify(s.teachingAreas || []), s.secQ, s.secA, s.email, s.createdAt, s.avatar || null]
      });
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav6_paylog') {
    const stmts = [ { sql: 'DELETE FROM paylog', args: [] } ];
    for (const p of value) {
      stmts.push({
        sql: `INSERT INTO paylog (id, date, adm, name, grade, term, amount, method, ref, by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [p.id, p.date, p.adm, p.name, p.grade, p.term, p.amount, p.method, p.ref, p.by]
      });
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav6_marks') {
    const stmts = [ { sql: 'DELETE FROM marks', args: [] } ];
    for (const [gsa, admObj] of Object.entries(value)) {
      for (const [adm, score] of Object.entries(admObj)) {
        if (score !== null && score !== undefined && score !== '') {
          stmts.push({
            sql: `INSERT INTO marks (grade_subj_assess, adm, score) VALUES (?, ?, ?)`,
            args: [gsa, adm, Number(score)]
          });
        }
      }
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  const json = JSON.stringify(value);
  await execute(
    `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, strftime('%s','now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, json]
  );
}

/**
 * Surgically update a single mark entry.
 */
export async function kvUpdateMark(grade_subj_assess, adm, score) {
  if (score === null || score === undefined || score === '') {
    await execute('DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ?', [grade_subj_assess, adm]);
  } else {
    await execute(
      `INSERT INTO marks (grade_subj_assess, adm, score) VALUES (?, ?, ?)
       ON CONFLICT(grade_subj_assess, adm) DO UPDATE SET score = excluded.score`,
      [grade_subj_assess, adm, Number(score)]
    );
  }
  // also touch kv so cache knows something changed
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_marks']);
}

/**
 * Delete a key.
 */
export async function kvDelete(key) {
  await ensureSchema();
  await execute('DELETE FROM kv WHERE key = ?', [key]);
}

/**
 * Return all keys and their updated_at timestamps (used for smart poll).
 */
export async function kvTimestamps(keys) {
  await ensureSchema();
  if (!keys || !keys.length) return [];
  const placeholders = keys.map(() => '?').join(',');
  return query(
    `SELECT key, updated_at FROM kv WHERE key IN (${placeholders})`,
    keys
  );
}

/**
 * The complete list of keys the portal syncs, matching PAAV_KEYS in the HTML.
 */
export const PAAV_KEYS = [
  'paav6_learners','paav6_staff','paav6_fees','paav6_marks','paav6_feecfg',
  'paav6_timetable','paav6_attendance','paav_announcement','paav_paybill',
  'paav_payname','paav_acc_fmt','paav_pay_methods',
  'paav_marks_locked','paav_tt22','paav_tt_permission_v22',
  'paav_teacher_assignments','paav_teacher_codes_v22','paav8_subj',
  'paav_sms_sound','cu','paav_remember_user',
  'paav6_paylog','paav7_sms','paav7_audit','paav7_salary','paav7_duties',
  'paav7_streams','paav8_att','paav6_msgs','paav6_reports',
  'paav6_grading','paav8_grad','paav_cgrad_v83',
];
