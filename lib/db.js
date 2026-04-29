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
let _schemaPromise = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.TURSO_URL;
  const token = process.env.TURSO_TOKEN;

  if (!url) {
    console.error('[DB] Missing TURSO_URL');
    throw new Error('Database configuration error: TURSO_URL is missing.');
  }

  // Local file doesn't strictly need a token in the latest libsql, but we check for it if it's a remote URL
  if (!url.startsWith('file:') && !token) {
    console.error('[DB] Missing TURSO_TOKEN for remote DB');
    throw new Error('Database configuration error: TURSO_TOKEN is missing for remote connection.');
  }

  try {
    _client = createClient({ url, authToken: token });
    return _client;
  } catch (e) {
    console.error('[DB] Failed to create client:', e);
    throw new Error('Failed to initialize database client: ' + e.message);
  }
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
  if (_schemaPromise) return _schemaPromise;

  _schemaPromise = (async () => {
    try {
      const db = getClient();
      console.log('[DB] Ensuring schema...');
    // KV table
    `CREATE TABLE IF NOT EXISTS kv (
      key        TEXT    PRIMARY KEY,
      value      TEXT    NOT NULL DEFAULT '""',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )`,
    // Learners table
    `CREATE TABLE IF NOT EXISTS learners (
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
      parentEmail TEXT,
      addr TEXT,
      t1 REAL DEFAULT 0,
      t2 REAL DEFAULT 0,
      t3 REAL DEFAULT 0,
      arrears REAL DEFAULT 0,
      avatar TEXT
    )`,
    // Staff table
    `CREATE TABLE IF NOT EXISTS staff (
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
    )`,
    // Paylog table
    `CREATE TABLE IF NOT EXISTS paylog (
      id TEXT PRIMARY KEY,
      date TEXT,
      adm TEXT,
      name TEXT,
      grade TEXT,
      term TEXT,
      amount REAL,
      method TEXT,
      ref TEXT,
      by TEXT,
      status TEXT DEFAULT 'approved'
    )`,
    // Marks table
    `CREATE TABLE IF NOT EXISTS marks (
      grade_subj_assess TEXT,
      adm TEXT,
      score REAL,
      PRIMARY KEY(grade_subj_assess, adm)
    )`,
    // Attendance table
    `CREATE TABLE IF NOT EXISTS attendance (
      grade_date_adm TEXT PRIMARY KEY,
      status TEXT NOT NULL
    )`,
    // Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      msg_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`,
    // Staff requests table
    `CREATE TABLE IF NOT EXISTS staff_requests (
      id INTEGER PRIMARY KEY,
      userId TEXT NOT NULL,
      req_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`,
    // Presence table
    `CREATE TABLE IF NOT EXISTS presence (
      id_date TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      prec_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`,
    // Duties table
    `CREATE TABLE IF NOT EXISTS duties (
      id TEXT PRIMARY KEY,
      duty_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`
  ], 'write');

  // Alterations (only run if needed to migrate older DBs)
  // These are now part of the main CREATE TABLE statements for new setups.
  // We keep them here briefly for compatibility but wrapped to be fast.
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  const hasTable = (name) => tables.rows.some(r => r.name === name);
  
  // Minimal migrations for existing tables
  if (hasTable('learners')) {
    try { await db.execute('ALTER TABLE learners ADD COLUMN arrears REAL DEFAULT 0;'); } catch(e){}
    try { await db.execute('ALTER TABLE learners ADD COLUMN parentEmail TEXT;'); } catch(e){}
    try { await db.execute('ALTER TABLE learners ADD COLUMN avatar TEXT;'); } catch(e){}
  }
  if (hasTable('staff')) {
    try { await db.execute('ALTER TABLE staff ADD COLUMN avatar TEXT;'); } catch(e){}
  }
  if (hasTable('paylog')) {
    try { await db.execute('ALTER TABLE paylog ADD COLUMN status TEXT DEFAULT "approved";'); } catch(e){}
  }

    _schemaOk = true;
    _schemaPromise = null;
    console.log('[DB] Schema verified');
  } catch (e) {
    _schemaPromise = null;
    console.error('[DB] Schema initialization failed:', e);
    throw e;
  }
})();

  return _schemaPromise;
}

/**
 * Run a SELECT and return all rows as plain objects.
 * @param {string} sql
 * @param {any[]}  args
 */
export async function query(sql, args = []) {
  await ensureSchema();
  const db = getClient();
  const cleanArgs = args.map(a => a === undefined ? null : a);
  try {
    const result = await db.execute({ sql, args: cleanArgs });
    return result.rows;
  } catch (e) {
    console.error(`[DB] Query Error: ${sql}`, e);
    throw e;
  }
}

/**
 * Run an INSERT / UPDATE / DELETE.
 * @param {string} sql
 * @param {any[]}  args
 */
export async function execute(sql, args = []) {
  await ensureSchema();
  const db = getClient();
  const cleanArgs = args.map(a => a === undefined ? null : a);
  try {
    return await db.execute({ sql, args: cleanArgs });
  } catch (e) {
    console.error(`[DB] Execute Error: ${sql}`, e);
    throw e;
  }
}

/**
 * Run a batch of statements atomically (used by /api/db for pipeline).
 * @param {{ sql: string, args: any[] }[]} statements
 */
export async function batch(statements) {
  await ensureSchema();
  const db = getClient();
  const cleanStmts = statements.map(s => ({
    sql: s.sql,
    args: s.args ? s.args.map(a => a === undefined ? null : a) : []
  }));
  try {
    return await db.batch(cleanStmts, 'write');
  } catch (e) {
    console.error(`[DB] Batch Error`, e);
    throw e;
  }
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

  if (key === 'paav_student_attendance') {
    const rows = await query('SELECT * FROM attendance');
    const result = {};
    rows.forEach(r => { result[r.grade_date_adm] = r.status; });
    return result;
  }

  if (key === 'paav6_msgs') {
    const rows = await query('SELECT msg_json FROM messages ORDER BY updated_at DESC');
    return rows.map(r => JSON.parse(r.msg_json));
  }

  if (key === 'paav_staff_reqs') {
    const rows = await query('SELECT req_json FROM staff_requests ORDER BY updated_at DESC');
    return rows.map(r => JSON.parse(r.req_json));
  }

  if (key === 'paav_presence') {
    const rows = await query('SELECT prec_json FROM presence ORDER BY updated_at DESC');
    return rows.map(r => JSON.parse(r.prec_json));
  }

  if (key === 'paav_duties') {
    const rows = await query('SELECT duty_json FROM duties ORDER BY updated_at DESC');
    return rows.map(r => JSON.parse(r.duty_json));
  }

  const rows = await query('SELECT value FROM kv WHERE key = ?', [key]);
  if (!rows.length) return defaultValue;
  try { return JSON.parse(rows[0].value); } catch { return defaultValue; }
}

/**
 * Internal helper to get value AND updatedAt
 */
export async function kvGetWithMeta(key) {
  await ensureSchema();
  const rows = await query('SELECT updated_at FROM kv WHERE key = ?', [key]);
  const updatedAt = rows.length ? rows[0].updated_at : 0;
  const value = await kvGet(key);
  return { value, updatedAt };
}

/**
 * Update a learner's details, with cascading updates if the admission number changes.
 */
export async function kvUpdateLearner(oldAdm, details) {
  await ensureSchema();
  const newAdm = details.adm;
  const stmts = [];

  // 1. Update learners table
  stmts.push({
    sql: `UPDATE learners SET 
            adm = ?, name = ?, grade = ?, sex = ?, age = ?, dob = ?, 
            stream = ?, teacher = ?, parent = ?, phone = ?, 
            parentEmail = ?, addr = ?, avatar = ?
          WHERE adm = ?`,
    args: [
      newAdm, details.name, details.grade, details.sex, details.age, details.dob,
      details.stream, details.teacher, details.parent, details.phone,
      details.parentEmail, details.addr, details.avatar || null,
      oldAdm
    ]
  });

  // 2. Cascade Admission Number change if necessary
  if (oldAdm !== newAdm) {
    // Marks
    stmts.push({ sql: 'UPDATE marks SET adm = ? WHERE adm = ?', args: [newAdm, oldAdm] });
    // Paylog
    stmts.push({ sql: 'UPDATE paylog SET adm = ? WHERE adm = ?', args: [newAdm, oldAdm] });
    // Staff (childAdm link)
    stmts.push({ sql: 'UPDATE staff SET childAdm = ? WHERE childAdm = ?', args: [newAdm, oldAdm] });
    
    // Attendance (grade_date_adm PK needs string manipulation)
    const attRows = await query('SELECT grade_date_adm, status FROM attendance WHERE grade_date_adm LIKE ?', [`%|${oldAdm}`]);
    for (const row of attRows) {
      const parts = row.grade_date_adm.split('|');
      if (parts[parts.length - 1] === oldAdm) {
        parts[parts.length - 1] = newAdm;
        const newGda = parts.join('|');
        stmts.push({ sql: 'DELETE FROM attendance WHERE grade_date_adm = ?', args: [row.grade_date_adm] });
        stmts.push({ sql: 'INSERT INTO attendance (grade_date_adm, status) VALUES (?, ?)', args: [newGda, row.status] });
      }
    }
  }

  await batch(stmts);
  
  // Touch kv timestamps
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_learners']);
  if (oldAdm !== newAdm) {
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_marks']);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_paylog']);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_staff']);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_student_attendance']);
  }
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
        sql: `INSERT INTO learners (adm, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [l.adm, l.name, l.grade, l.sex, l.age, l.dob, l.stream, l.teacher, l.parent, l.phone, l.parentEmail || null, l.addr, l.t1, l.t2, l.t3, l.arrears || 0, l.avatar || null]
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
    const stmts = [];
    for (const [gsa, admObj] of Object.entries(value)) {
      for (const [adm, score] of Object.entries(admObj)) {
        if (score !== null && score !== undefined && score !== '') {
          stmts.push({
            sql: `INSERT INTO marks (grade_subj_assess, adm, score) VALUES (?, ?, ?)
                  ON CONFLICT(grade_subj_assess, adm) DO UPDATE SET score = excluded.score`,
            args: [gsa, adm, Number(score)]
          });
        }
      }
    }
    if (stmts.length) await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav_student_attendance') {
    const stmts = [];
    for (const [gda, status] of Object.entries(value)) {
      stmts.push({
        sql: `INSERT INTO attendance (grade_date_adm, status) VALUES (?, ?)
              ON CONFLICT(grade_date_adm) DO UPDATE SET status = excluded.status`,
        args: [gda, status]
      });
    }
    if (stmts.length) await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav6_msgs') {
    const stmts = [ { sql: 'DELETE FROM messages', args: [] } ];
    for (const m of value) {
      stmts.push({
        sql: 'INSERT INTO messages (id, msg_json) VALUES (?, ?)',
        args: [m.id, JSON.stringify(m)]
      });
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav_staff_reqs') {
    const stmts = [ { sql: 'DELETE FROM staff_requests', args: [] } ];
    for (const r of value) {
      stmts.push({
        sql: 'INSERT INTO staff_requests (id, userId, req_json) VALUES (?, ?, ?)',
        args: [r.id, r.userId, JSON.stringify(r)]
      });
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav_presence') {
    const stmts = [ { sql: 'DELETE FROM presence', args: [] } ];
    for (const p of value) {
      stmts.push({
        sql: 'INSERT INTO presence (id_date, userId, prec_json) VALUES (?, ?, ?)',
        args: [`${p.id}|${p.date}`, p.id, JSON.stringify(p)]
      });
    }
    await batch(stmts);
    await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, [key]);
    return;
  }

  if (key === 'paav_duties') {
    const stmts = [ { sql: 'DELETE FROM duties', args: [] } ];
    for (const d of value) {
      stmts.push({
        sql: 'INSERT INTO duties (id, duty_json) VALUES (?, ?)',
        args: [d.id, JSON.stringify(d)]
      });
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
 * Update multiple marks atomically without wiping the entire table.
 * @param {{ gsa: string, adm: string, score: number }[]} marksList
 */
export async function kvUpdateMarksBulk(marksList) {
  if (!marksList || !marksList.length) return;
  await ensureSchema();
  
  const stmts = [];
  for (const m of marksList) {
    if (m.score === null || m.score === undefined || m.score === '') {
      stmts.push({
        sql: 'DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ?',
        args: [m.gsa, m.adm]
      });
    } else {
      stmts.push({
        sql: `INSERT INTO marks (grade_subj_assess, adm, score) VALUES (?, ?, ?)
              ON CONFLICT(grade_subj_assess, adm) DO UPDATE SET score = excluded.score`,
        args: [m.gsa, m.adm, Number(m.score)]
      });
    }
  }
  
  await batch(stmts);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_marks']);
}

/**
 * Update multiple attendance entries atomically.
 * @param {Object} attMap { "GRADE 1|2026-04-29|101": "P", ... }
 */
export async function kvUpdateAttendanceBulk(attMap) {
  if (!attMap || !Object.keys(attMap).length) return;
  await ensureSchema();
  const stmts = Object.entries(attMap).map(([gda, status]) => ({
    sql: `INSERT INTO attendance (grade_date_adm, status) VALUES (?, ?)
          ON CONFLICT(grade_date_adm) DO UPDATE SET status = excluded.status`,
    args: [gda, status]
  }));
  await batch(stmts);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_student_attendance']);
}

/**
 * Add or update a message atomically.
 */
export async function kvUpsertMessage(msg) {
  if (!msg || !msg.id) return;
  await ensureSchema();
  await execute(
    `INSERT INTO messages (id, msg_json, updated_at) VALUES (?, ?, strftime('%s','now'))
     ON CONFLICT(id) DO UPDATE SET msg_json = excluded.msg_json, updated_at = excluded.updated_at`,
    [msg.id, JSON.stringify(msg)]
  );
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_msgs']);
}

/**
 * Add a new staff request atomically.
 */
export async function kvSubmitStaffRequest(req) {
  if (!req || !req.id) return;
  await ensureSchema();
  await execute(
    `INSERT INTO staff_requests (id, userId, req_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))`,
    [req.id, req.userId, JSON.stringify(req)]
  );
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_staff_reqs']);
}

/**
 * Log staff presence (login/logout) atomically.
 */
export async function kvLogPresence(userId, date, record) {
  await ensureSchema();
  await execute(
    `INSERT INTO presence (id_date, userId, prec_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id_date) DO UPDATE SET prec_json = excluded.prec_json, updated_at = excluded.updated_at`,
    [`${userId}|${date}`, userId, JSON.stringify(record)]
  );
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_presence']);
}

/**
 * Add or update a duty assignment atomically.
 */
export async function kvUpsertDuty(duty) {
  if (!duty || !duty.id) return;
  await ensureSchema();
  await execute(
    `INSERT INTO duties (id, duty_json, updated_at) VALUES (?, ?, strftime('%s','now'))
     ON CONFLICT(id) DO UPDATE SET duty_json = excluded.duty_json, updated_at = excluded.updated_at`,
    [duty.id, JSON.stringify(duty)]
  );
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_duties']);
}

/**
 * Delete a duty assignment atomically.
 */
export async function kvDeleteDuty(id) {
  await ensureSchema();
  await execute('DELETE FROM duties WHERE id = ?', [id]);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_duties']);
}

/**
 * Update staff request status atomically.
 */
export async function kvUpdateStaffRequestStatus(id, status) {
  await ensureSchema();
  const rows = await query('SELECT req_json FROM staff_requests WHERE id = ?', [id]);
  if (!rows.length) return;
  const req = JSON.parse(rows[0].req_json);
  req.status = status;
  await execute(
    `UPDATE staff_requests SET req_json = ?, updated_at = strftime('%s','now') WHERE id = ?`,
    [JSON.stringify(req), id]
  );
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_staff_reqs']);
}

/**
 * Record a payment for a learner and update their balance.
 */
export async function kvRecordPayment({ adm, term, amount, method, ref, by, status = 'approved' }) {
  await ensureSchema();
  const termCol = String(term).toLowerCase(); // t1, t2, t3
  if (!['t1', 't2', 't3'].includes(termCol)) throw new Error('Invalid term');

  // 1. Fetch learner and fee config to calculate spillover
  const learners = await kvGet('paav6_learners') || [];
  const l = learners.find(x => x.adm === adm);
  const feeCfg = await kvGet('paav6_feecfg') || {};
  
  if (status === 'approved' && l) {
    const gradeCfg = feeCfg[l.grade] || { term1: 0, term2: 0, term3: 0 };
    const termLimits = {
      t1: gradeCfg.term1 || (gradeCfg.annual ? Math.floor(gradeCfg.annual / 3) : 0),
      t2: gradeCfg.term2 || (gradeCfg.annual ? Math.floor(gradeCfg.annual / 3) : 0),
      t3: gradeCfg.term3 || (gradeCfg.annual ? Math.floor(gradeCfg.annual / 3) : 0),
    };

    let remaining = Number(amount);
    const updates = { t1: l.t1 || 0, t2: l.t2 || 0, t3: l.t3 || 0, arrears: l.arrears || 0 };

    // 1. First, reduce accumulated arrears
    if (updates.arrears > 0) {
      const payToArrears = Math.min(remaining, updates.arrears);
      updates.arrears -= payToArrears;
      remaining -= payToArrears;
    }

    // 2. Then, fill current year terms
    const termsToFill = ['t1', 't2', 't3'].slice(['t1', 't2', 't3'].indexOf(termCol));

    for (const t of termsToFill) {
      if (remaining <= 0) break;
      const limit = termLimits[t];
      const current = updates[t];
      
      if (limit > 0 && current < limit) {
        const space = limit - current;
        const add = Math.min(remaining, space);
        updates[t] += add;
        remaining -= add;
      } else if (limit === 0 || current >= limit) {
        // If no limit set or already full, move to next term
        if (t === 't3') {
          updates[t] += remaining;
          remaining = 0;
        }
      }
    }
    
    if (remaining > 0) updates.t3 += remaining;

    await execute(
      `UPDATE learners SET t1 = ?, t2 = ?, t3 = ?, arrears = ? WHERE adm = ?`,
      [updates.t1, updates.t2, updates.t3, updates.arrears, adm]
    );
  }

  // 2. Add to paylog table
  const pId = 'p' + Date.now();
  const pDate = new Date().toLocaleDateString('en-KE');
  const pName = l?.name || 'Unknown';
  const pGrade = l?.grade || 'Unknown';
  const pTerm = term.toUpperCase();
  const pAmount = Number(amount);
  const pBy = by || 'System';

  await execute(
    `INSERT INTO paylog (id, date, adm, name, grade, term, amount, method, ref, by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [pId, pDate, adm, pName, pGrade, pTerm, pAmount, method, ref, pBy, status]
  );
  
  // touch kv timestamps
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_paylog']);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_learners']);
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
 * Get Turso database storage usage.
 */
export async function getStorageUsage() {
  const db = getClient();
  const resCount = await db.execute('PRAGMA page_count');
  const resSize = await db.execute('PRAGMA page_size');
  const count = Number(resCount.rows[0][0]);
  const size = Number(resSize.rows[0][0]);
  const totalBytes = count * size;
  const limitBytes = 9 * 1024 * 1024 * 1024; // 9GB Turso Free Tier
  return {
    totalBytes,
    limitBytes,
    percent: (totalBytes / limitBytes) * 100
  };
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
  'paav6_grading','paav8_grad','paav_cgrad_v83','paav7_activity_log',
];

export async function logAction(user, action, details) {
  const oldLogs = await kvGet('paav7_activity_log', []) || [];
  const newLog = {
    id: 'log_' + Date.now(),
    userId: user?.id || 'guest',
    userName: user?.name || 'Guest/System',
    userRole: user?.role || 'none',
    action,
    details,
    timestamp: new Date().toISOString()
  };
  const logs = [newLog, ...oldLogs].slice(0, 1000);
  await kvSet('paav7_activity_log', logs);
}

/**
 * Bulk add learners safely without overwriting the entire table.
 */
export async function kvBulkAddLearners(learners) {
  if (!learners || !learners.length) return;
  await ensureSchema();
  
  const stmts = learners.map(l => ({
    sql: `INSERT INTO learners (adm, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(adm) DO UPDATE SET 
            name = excluded.name, grade = excluded.grade, sex = excluded.sex, 
            age = excluded.age, dob = excluded.dob, stream = excluded.stream,
            parent = excluded.parent, phone = excluded.phone`,
    args: [
      l.adm, l.name.toUpperCase(), l.grade, l.sex, l.age || '', l.dob || null, 
      l.stream || '', l.teacher || '', l.parent || '', l.phone || '', 
      l.parentEmail || null, l.addr || '', l.t1 || 0, l.t2 || 0, l.t3 || 0, 
      l.arrears || 0, l.avatar || null
    ]
  }));
  
  await batch(stmts);
  await execute(`INSERT INTO kv (key, updated_at) VALUES (?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_learners']);
}
