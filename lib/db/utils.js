/**
 * lib/db/utils.js - Legacy database utility functions
 */

import { createClient } from '@libsql/client/web';

export const PAAV_KEYS = [
  'paav6_learners',
  'paav6_staff',
  'paav6_marks',
  'paav6_paylog',
  'paav6_msgs',
  'paav_staff_reqs',
  'paav_presence',
  'paav_duties',
  'paav6_feecfg',
  'paav_paybill_accounts',
  'paav_sms_config',
  'paav6_grading',
  'paav_student_attendance',
  'paav6_subjects',
  'paav6_timetable',
  'paav6_streams'
];

let _client = null;
let _schemaPromise = null;

export function getClient() {
  if (_client) return _client;
  
  let url = process.env.TURSO_URL || 'https://dummy-db.turso.io';
  if (url.startsWith('file:')) {
    url = 'https://dummy-db.turso.io';
  }
  const token = process.env.TURSO_TOKEN;

  // Validate URL format roughly
  if (!url.startsWith('libsql://') && !url.startsWith('https://')) {
     // If we are in build and it's not set, we use the dummy
     if (process.env.NEXT_PHASE === 'phase-production-build') {
        _client = createClient({ url: 'https://dummy-db.turso.io' });
        return _client;
     }
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
 */
let _schemaOk = false;
let _schemaCheckDone = false; 

export async function ensureSchema() {
  if (_schemaOk && _schemaCheckDone) return;
  if (_schemaPromise) return _schemaPromise;

  _schemaPromise = (async () => {
    try {
      const db = getClient();
      console.log('[DB] Ensuring schema...');
      
      const stmts = [
        `CREATE TABLE IF NOT EXISTS kv (
          key        TEXT,
          tenant_id  TEXT NOT NULL DEFAULT 'platform-master',
          value      TEXT NOT NULL DEFAULT '""',
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          PRIMARY KEY(key, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS learners (
          adm TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
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
          avatar TEXT,
          bloodGroup TEXT,
          allergies TEXT,
          medicalCondition TEXT,
          emergencyContact TEXT,
          PRIMARY KEY(adm, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS staff (
          id TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          name TEXT NOT NULL,
          username TEXT NOT NULL,
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
          avatar TEXT,
          PRIMARY KEY(id, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS paylog (
          id TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          date TEXT,
          adm TEXT,
          name TEXT,
          grade TEXT,
          term TEXT,
          amount REAL,
          method TEXT,
          ref TEXT,
          by TEXT,
          status TEXT DEFAULT 'approved',
          PRIMARY KEY(id, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS marks (
          grade_subj_assess TEXT,
          adm TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          score REAL,
          PRIMARY KEY(grade_subj_assess, adm, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS attendance (
          grade_date_adm TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          status TEXT NOT NULL,
          PRIMARY KEY(grade_date_adm, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          msg_json TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s','now')),
          PRIMARY KEY(id, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS staff_requests (
          id INTEGER,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          userId TEXT NOT NULL,
          req_json TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s','now')),
          PRIMARY KEY(id, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS presence (
          id_date TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          userId TEXT NOT NULL,
          prec_json TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s','now')),
          PRIMARY KEY(id_date, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS duties (
          id TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          duty_json TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s','now')),
          PRIMARY KEY(id, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS files (
          id TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'platform-master',
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          createdAt TEXT,
          PRIMARY KEY(id, tenant_id)
        )`,
        `CREATE TABLE IF NOT EXISTS subscriptions (
          tenant_id TEXT PRIMARY KEY,
          plan TEXT DEFAULT 'basic',
          status TEXT DEFAULT 'active',
          amount REAL DEFAULT 0,
          cycle TEXT DEFAULT 'annual',
          expires_at TEXT,
          updated_at INTEGER DEFAULT (strftime('%s','now'))
        )`,
        `CREATE INDEX IF NOT EXISTS idx_kv_tenant ON kv(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_learners_tenant ON learners(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_paylog_tenant ON paylog(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_marks_tenant ON marks(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_staff_requests_tenant ON staff_requests(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_presence_tenant ON presence(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_duties_tenant ON duties(tenant_id)`
      ];

      const schemaBatch = stmts.map(sql => ({ sql, args: [] }));
      try {
        await db.batch(schemaBatch, 'write');
      } catch (err) {
        // Silently fail if dummy
      }
  
      _schemaOk = true;
      _schemaCheckDone = true;
      _schemaPromise = null;
      console.log('[DB] Schema verified');
    } catch (e) {
      _schemaPromise = null;
      console.error('[DB] Schema initialization failed:', e);
    }
  })();

  return _schemaPromise;
}

export async function query(sql, args = []) {
  try {
    await ensureSchema();
    const db = getClient();
    const cleanArgs = args.map(a => a === undefined ? null : a);
    const result = await db.execute({ sql, args: cleanArgs });
    return result.rows || [];
  } catch (e) {
    if (sql.trim().toUpperCase().startsWith('SELECT')) return [];
    throw e;
  }
}

export async function execute(sql, args = []) {
  await ensureSchema();
  const db = getClient();
  const cleanArgs = args.map(a => a === undefined ? null : a);
  return await db.execute({ sql, args: cleanArgs });
}

export async function batch(statements) {
  await ensureSchema();
  const db = getClient();
  const cleanStmts = statements.map(s => ({
    sql: s.sql,
    args: s.args ? s.args.map(a => a === undefined ? null : a) : []
  }));
  return await db.batch(cleanStmts, 'write');
}

export async function kvGet(key, defaultValue = null, tenantId = 'platform-master') {
  await ensureSchema();

  if (key === 'paav6_learners') {
    const relational = await query('SELECT * FROM learners WHERE tenant_id = ?', [tenantId]);
    if (relational.length > 50) return relational;
    const kvRows = await query('SELECT value FROM kv WHERE key = ? AND tenant_id = ?', ['paav6_learners', tenantId]);
    let kvData = [];
    if (kvRows.length > 0) {
      try { kvData = JSON.parse(kvRows[0].value); } catch { kvData = []; }
    }
    if (kvData.length === 0) return relational;
    const merged = [...relational];
    const adms = new Set(relational.map(l => l.adm));
    for (const l of kvData) {
      if (!adms.has(l.adm)) {
        merged.push(l);
        adms.add(l.adm);
      }
    }
    return merged;
  }

  if (key === 'paav6_staff') {
    const rows = await query('SELECT * FROM staff WHERE tenant_id = ?', [tenantId]);
    if (!rows.length) return defaultValue || [];
    return rows.map(r => ({
      ...r,
      teachingAreas: r.teachingAreas ? JSON.parse(r.teachingAreas) : []
    }));
  }

  if (key === 'paav6_paylog') {
    const rows = await query('SELECT * FROM paylog WHERE tenant_id = ?', [tenantId]);
    if (!rows.length) return defaultValue || [];
    return rows;
  }

  if (key === 'paav6_marks') {
    const rows = await query('SELECT * FROM marks WHERE tenant_id = ?', [tenantId]);
    const result = {};
    for (const r of rows) {
      if (!result[r.grade_subj_assess]) result[r.grade_subj_assess] = {};
      result[r.grade_subj_assess][r.adm] = r.score;
    }
    return result;
  }

  if (key === 'paav_student_attendance') {
    const rows = await query('SELECT * FROM attendance WHERE tenant_id = ?', [tenantId]);
    const result = {};
    rows.forEach(r => { result[r.grade_date_adm] = r.status; });
    return result;
  }

  if (key === 'paav6_msgs') {
    const rows = await query('SELECT msg_json FROM messages WHERE tenant_id = ? ORDER BY updated_at DESC', [tenantId]);
    return rows.map(r => JSON.parse(r.msg_json));
  }

  if (key === 'paav_staff_reqs') {
    const rows = await query('SELECT req_json FROM staff_requests WHERE tenant_id = ? ORDER BY updated_at DESC', [tenantId]);
    return rows.map(r => JSON.parse(r.req_json));
  }

  if (key === 'paav_presence') {
    const rows = await query('SELECT prec_json FROM presence WHERE tenant_id = ? ORDER BY updated_at DESC', [tenantId]);
    return rows.map(r => JSON.parse(r.prec_json));
  }

  if (key === 'paav_duties') {
    const rows = await query('SELECT duty_json FROM duties WHERE tenant_id = ? ORDER BY updated_at DESC', [tenantId]);
    return rows.map(r => JSON.parse(r.duty_json));
  }

  const rows = await query('SELECT value FROM kv WHERE key = ? AND tenant_id = ?', [key, tenantId]);
  if (!rows.length) return defaultValue;
  try { return JSON.parse(rows[0].value); } catch { return defaultValue; }
}

export async function kvGetWithMeta(key, tenantId = 'platform-master') {
  const [value, rows] = await Promise.all([
    kvGet(key, null, tenantId),
    query('SELECT updated_at FROM kv WHERE key = ? AND tenant_id = ?', [key, tenantId])
  ]);
  const updatedAt = rows.length ? rows[0].updated_at : 0;
  return { value, updatedAt };
}

export async function kvUpdateLearner(oldAdm, details, tenantId = 'platform-master') {
  await ensureSchema();
  const newAdm = details.adm;
  const stmts = [];
  stmts.push({
    sql: `UPDATE learners SET 
            adm = ?, name = ?, grade = ?, sex = ?, age = ?, dob = ?, 
            stream = ?, teacher = ?, parent = ?, phone = ?, 
            parentEmail = ?, addr = ?, avatar = ?,
            bloodGroup = ?, allergies = ?, medicalCondition = ?, emergencyContact = ?
          WHERE adm = ? AND tenant_id = ?`,
    args: [
      newAdm, details.name, details.grade, details.sex, details.age, details.dob,
      details.stream, details.teacher, details.parent, details.phone,
      details.parentEmail, details.addr, details.avatar || null,
      details.bloodGroup || null, details.allergies || null, details.medicalCondition || null, details.emergencyContact || null,
      oldAdm, tenantId
    ]
  });
  if (oldAdm !== newAdm) {
    stmts.push({ sql: 'UPDATE marks SET adm = ? WHERE adm = ? AND tenant_id = ?', args: [newAdm, oldAdm, tenantId] });
    stmts.push({ sql: 'UPDATE paylog SET adm = ? WHERE adm = ? AND tenant_id = ?', args: [newAdm, oldAdm, tenantId] });
    stmts.push({ sql: 'UPDATE staff SET childAdm = ? WHERE childAdm = ? AND tenant_id = ?', args: [newAdm, oldAdm, tenantId] });
    const attRows = await query('SELECT grade_date_adm, status FROM attendance WHERE grade_date_adm LIKE ? AND tenant_id = ?', [`%|${oldAdm}`, tenantId]);
    for (const row of attRows) {
      const parts = row.grade_date_adm.split('|');
      if (parts[parts.length - 1] === oldAdm) {
        parts[parts.length - 1] = newAdm;
        const newGda = parts.join('|');
        stmts.push({ sql: 'DELETE FROM attendance WHERE grade_date_adm = ? AND tenant_id = ?', args: [row.grade_date_adm, tenantId] });
        stmts.push({ sql: 'INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)', args: [newGda, tenantId, row.status] });
      }
    }
  }
  await batch(stmts);
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_learners', tenantId]);
}

export async function kvSet(key, value, tenantId = 'platform-master') {
  await ensureSchema();
  if (key === 'paav6_learners') {
    const stmts = value.map(l => ({
      sql: `INSERT INTO learners (adm, tenant_id, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(adm, tenant_id) DO UPDATE SET name=excluded.name, grade=excluded.grade, sex=excluded.sex, age=excluded.age, dob=excluded.dob, stream=excluded.stream, teacher=excluded.teacher, parent=excluded.parent, phone=excluded.phone, parentEmail=excluded.parentEmail, addr=excluded.addr, t1=excluded.t1, t2=excluded.t2, t3=excluded.t3, arrears=excluded.arrears, avatar=excluded.avatar`,
      args: [l.adm, tenantId, l.name, l.grade, l.sex, l.age, l.dob, l.stream, l.teacher, l.parent, l.phone, l.parentEmail || null, l.addr, l.t1, l.t2, l.t3, l.arrears || 0, l.avatar || null]
    }));
    if (stmts.length) await batch(stmts);
    await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, [key, tenantId]);
    return;
  }
  const json = JSON.stringify(value);
  await execute(`INSERT INTO kv (key, tenant_id, value, updated_at) VALUES (?, ?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, [key, tenantId, json]);
}

export async function kvUpdateMark(grade_subj_assess, adm, score, tenantId = 'platform-master') {
  if (score === null || score === undefined || score === '') {
    await execute('DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ? AND tenant_id = ?', [grade_subj_assess, adm, tenantId]);
  } else {
    await execute(`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?) ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`, [grade_subj_assess, adm, tenantId, Number(score)]);
  }
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_marks', tenantId]);
}

export async function kvUpdateMarksBulk(marksList, tenantId = 'platform-master') {
  if (!marksList?.length) return;
  await ensureSchema();
  const stmts = marksList.map(m => (m.score === null || m.score === undefined || m.score === '') ? { sql: 'DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ? AND tenant_id = ?', args: [m.gsa, m.adm, tenantId] } : { sql: `INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?) ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`, args: [m.gsa, m.adm, tenantId, Number(m.score)] });
  await batch(stmts);
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_marks', tenantId]);
}

export async function kvUpdateAttendanceBulk(attMap, tenantId = 'platform-master') {
  if (!attMap || !Object.keys(attMap).length) return;
  await ensureSchema();
  const stmts = Object.entries(attMap).map(([gda, status]) => ({ sql: `INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?) ON CONFLICT(grade_date_adm, tenant_id) DO UPDATE SET status = excluded.status`, args: [gda, tenantId, status] }));
  await batch(stmts);
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_student_attendance', tenantId]);
}

export async function kvUpsertMessage(msg, tenantId = 'platform-master') {
  if (!msg?.id) return;
  await ensureSchema();
  await execute(`INSERT INTO kv (key, tenant_id, value, updated_at) VALUES (?, ?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, ['paav6_msgs', tenantId, JSON.stringify(msg)]);
}

export async function kvUpdateStaffAvatar(id, avatar, tenantId = 'platform-master') {
  await ensureSchema();
  await execute('UPDATE staff SET avatar = ? WHERE id = ? AND tenant_id = ?', [avatar, id, tenantId]);
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_staff', tenantId]);
}

export async function kvUpdateStaffProfile(id, name, phone, avatar, password = null, tenantId = 'platform-master') {
  await ensureSchema();
  if (password) {
    await execute('UPDATE staff SET name = ?, phone = ?, avatar = ?, password = ? WHERE id = ? AND tenant_id = ?', [name, phone, avatar, password, id, tenantId]);
  } else {
    await execute('UPDATE staff SET name = ?, phone = ?, avatar = ? WHERE id = ? AND tenant_id = ?', [name, phone, avatar, id, tenantId]);
  }
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_staff', tenantId]);
}

/**
 * Record a payment (legacy wrapper).
 */
export async function kvRecordPayment(payment, tenantId = 'platform-master') {
  await ensureSchema();
  const id = payment.id || `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  await execute(
    `INSERT INTO paylog (id, tenant_id, date, adm, name, grade, term, amount, method, ref, by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, tenantId, payment.date || new Date().toISOString().split('T')[0],
      payment.adm, payment.name || 'Unknown', payment.grade || 'N/A',
      payment.term || 'T1', payment.amount, payment.method, payment.ref,
      payment.by || 'Manual', payment.status || 'approved'
    ]
  );
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_paylog', tenantId]);
  return id;
}

export async function kvUpdateLearnerAvatar(adm, avatar, tenantId = 'platform-master') {
  await ensureSchema();
  await execute('UPDATE learners SET avatar = ? WHERE adm = ? AND tenant_id = ?', [avatar, adm, tenantId]);
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav6_learners', tenantId]);
}

/**
 * Delete a KV entry.
 */
export async function kvDelete(key, tenantId = 'platform-master') {
  await ensureSchema();
  await execute('DELETE FROM kv WHERE key = ? AND tenant_id = ?', [key, tenantId]);
}

/**
 * Get all KV timestamps for syncing.
 */
export async function kvTimestamps(tenantId = 'platform-master') {
  await ensureSchema();
  const rows = await query('SELECT key, updated_at FROM kv WHERE tenant_id = ?', [tenantId]);
  const result = {};
  rows.forEach(r => { result[r.key] = r.updated_at; });
  return result;
}

/**
 * Log staff presence (login/logout) atomically.
 */
export async function kvLogPresence(userId, date, record, tenantId = 'platform-master') {
  await ensureSchema();
  await execute(
    `INSERT INTO presence (id_date, tenant_id, userId, prec_json, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id_date, tenant_id) DO UPDATE SET prec_json = excluded.prec_json, updated_at = excluded.updated_at`,
    [`${userId}|${date}`, tenantId, userId, JSON.stringify(record)]
  );
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_presence', tenantId]);
}

/**
 * Add or update a duty assignment atomically.
 */
export async function kvUpsertDuty(duty, tenantId = 'platform-master') {
  if (!duty?.id) return;
  await ensureSchema();
  await execute(
    `INSERT INTO duties (id, tenant_id, duty_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id, tenant_id) DO UPDATE SET duty_json = excluded.duty_json, updated_at = excluded.updated_at`,
    [duty.id, tenantId, JSON.stringify(duty)]
  );
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_duties', tenantId]);
}

/**
 * Add a new staff request atomically.
 */
export async function kvSubmitStaffRequest(req, tenantId = 'platform-master') {
  if (!req?.id) return;
  await ensureSchema();
  await execute(
    `INSERT INTO staff_requests (id, tenant_id, userId, req_json, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))`,
    [req.id, tenantId, req.userId, JSON.stringify(req)]
  );
  await execute(`INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at`, ['paav_staff_reqs', tenantId]);
}
