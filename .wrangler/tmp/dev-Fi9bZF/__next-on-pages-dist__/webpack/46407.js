var v={},Ta=(ra,sa,ia)=>(v.__chunk_46407=(Ea,y,D)=>{"use strict";D.d(y,{KU:()=>O,K_:()=>E,M3:()=>f,XI:()=>Y,bL:()=>K,cM:()=>$,execute:()=>s,kvBulkAddLearners:()=>J,kvDeleteDuty:()=>V,kvGetWithMeta:()=>x,kvLogPresence:()=>b,kvRecordPayment:()=>H,kvSubmitStaffRequest:()=>j,kvUpdateAttendanceBulk:()=>P,kvUpdateLearner:()=>F,kvUpdateMark:()=>X,kvUpdateMarksBulk:()=>M,kvUpdateStaffAvatar:()=>k,kvUpdateStaffProfile:()=>h,kvUpdateStaffRequestStatus:()=>W,kvUpsertDuty:()=>B,kvUpsertMessage:()=>q,logAction:()=>G,or:()=>U,query:()=>_,vA:()=>l});var C=D(17430);async function k(a,r,e="platform-master"){await E(),await s("UPDATE staff SET avatar = ? WHERE id = ? AND tenant_id = ?",[r,a,e]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_staff",e])}async function h(a,r,e,t,d=null,n="platform-master"){await E(),d?await s("UPDATE staff SET name = ?, phone = ?, avatar = ?, password = ? WHERE id = ? AND tenant_id = ?",[r,e,t,d,a,n]):await s("UPDATE staff SET name = ?, phone = ?, avatar = ? WHERE id = ? AND tenant_id = ?",[r,e,t,a,n]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_staff",n])}let S=null,L=null;function O(){if(S)return S;let a=process.env.TURSO_URL,r=process.env.TURSO_TOKEN;if(!a)throw console.error("[DB] Missing TURSO_URL. Ensure it is set in .env.local or production environment."),Error("Database configuration error: TURSO_URL is missing.");if(!a.startsWith("libsql://")&&!a.startsWith("https://")&&!a.startsWith("file:"))throw Error(`Database configuration error: Invalid TURSO_URL format "${a}". Must start with libsql://, https://, or file:`);if(!a.startsWith("file:")&&!r)throw console.error("[DB] Missing TURSO_TOKEN for remote DB"),Error("Database configuration error: TURSO_TOKEN is missing for remote connection.");try{return S=(0,C.UU)({url:a,authToken:r})}catch(e){throw console.error("[DB] Failed to create client:",e),Error("Failed to initialize database client: "+e.message)}}let R=!1,g=!1;async function E(){if(!R||!g)return L||(L=(async()=>{try{let a=O();console.log("[DB] Ensuring schema..."),await a.batch([`CREATE TABLE IF NOT EXISTS kv (
      key        TEXT,
      tenant_id  TEXT NOT NULL DEFAULT 'platform-master',
      value      TEXT NOT NULL DEFAULT '""',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      PRIMARY KEY(key, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS learners (
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
    )`,`CREATE TABLE IF NOT EXISTS staff (
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
    )`,`CREATE TABLE IF NOT EXISTS paylog (
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
    )`,`CREATE TABLE IF NOT EXISTS marks (
      grade_subj_assess TEXT,
      adm TEXT,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      score REAL,
      PRIMARY KEY(grade_subj_assess, adm, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS attendance (
      grade_date_adm TEXT,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      status TEXT NOT NULL,
      PRIMARY KEY(grade_date_adm, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS messages (
      id TEXT,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      msg_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY(id, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS staff_requests (
      id INTEGER,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      userId TEXT NOT NULL,
      req_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY(id, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS presence (
      id_date TEXT,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      userId TEXT NOT NULL,
      prec_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY(id_date, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS duties (
      id TEXT,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      duty_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY(id, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS files (
      id TEXT,
      tenant_id TEXT NOT NULL DEFAULT 'platform-master',
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT,
      PRIMARY KEY(id, tenant_id)
    )`,`CREATE TABLE IF NOT EXISTS subscriptions (
      tenant_id TEXT PRIMARY KEY,
      plan TEXT DEFAULT 'basic',
      status TEXT DEFAULT 'active',
      amount REAL DEFAULT 0,
      cycle TEXT DEFAULT 'annual',
      expires_at TEXT,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`,"CREATE INDEX IF NOT EXISTS idx_kv_tenant ON kv(tenant_id)","CREATE INDEX IF NOT EXISTS idx_learners_tenant ON learners(tenant_id)","CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id)","CREATE INDEX IF NOT EXISTS idx_paylog_tenant ON paylog(tenant_id)","CREATE INDEX IF NOT EXISTS idx_marks_tenant ON marks(tenant_id)","CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id)","CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id)","CREATE INDEX IF NOT EXISTS idx_staff_requests_tenant ON staff_requests(tenant_id)","CREATE INDEX IF NOT EXISTS idx_presence_tenant ON presence(tenant_id)","CREATE INDEX IF NOT EXISTS idx_duties_tenant ON duties(tenant_id)"],"write");let r=await a.execute("SELECT name, sql FROM sqlite_master WHERE type='table'"),e=t=>r.rows.some(d=>d.name===t);for(let[t,d]of Object.entries({kv:"key, tenant_id",learners:"adm, tenant_id",staff:"id, tenant_id",paylog:"id, tenant_id",marks:"grade_subj_assess, adm, tenant_id",attendance:"grade_date_adm, tenant_id",messages:"id, tenant_id",staff_requests:"id, tenant_id",presence:"id_date, tenant_id",duties:"id, tenant_id",files:"id, tenant_id"}))if(e(t)){try{await a.execute(`ALTER TABLE ${t} ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'platform-master';`)}catch{}let n=r.rows.find(i=>i.name===t);if(n&&!n.sql.includes(`PRIMARY KEY(${d})`)){console.log(`[DB] Migrating table ${t} to compound primary key (${d})...`);let i=n.sql;try{let T=i.replace(/PRIMARY KEY\s*\([^)]+\)/gi,"").replace(/\s+PRIMARY KEY/gi,"").trim();T=(T=T.replace(/,\s*\)$/,")").replace(/\)$/,`, PRIMARY KEY(${d}))`)).replace(/,\s*,/g,","),await a.batch([`ALTER TABLE ${t} RENAME TO ${t}_old`,T,`INSERT INTO ${t} SELECT * FROM ${t}_old`,`DROP TABLE ${t}_old`],"write"),console.log(`[DB] Table ${t} migrated successfully.`)}catch(T){console.error(`[DB] Migration failed for ${t}:`,T)}}}if(e("learners")){try{await a.execute("ALTER TABLE learners ADD COLUMN arrears REAL DEFAULT 0;")}catch{}try{await a.execute("ALTER TABLE learners ADD COLUMN parentEmail TEXT;")}catch{}try{await a.execute("ALTER TABLE learners ADD COLUMN avatar TEXT;")}catch{}try{await a.execute("ALTER TABLE learners ADD COLUMN bloodGroup TEXT;")}catch{}try{await a.execute("ALTER TABLE learners ADD COLUMN allergies TEXT;")}catch{}try{await a.execute("ALTER TABLE learners ADD COLUMN medicalCondition TEXT;")}catch{}try{await a.execute("ALTER TABLE learners ADD COLUMN emergencyContact TEXT;")}catch{}}if(e("staff"))try{await a.execute("ALTER TABLE staff ADD COLUMN avatar TEXT;")}catch{}if(e("paylog"))try{await a.execute('ALTER TABLE paylog ADD COLUMN status TEXT DEFAULT "approved";')}catch{}if(e("subscriptions")){try{await a.execute("ALTER TABLE subscriptions ADD COLUMN amount REAL DEFAULT 0;")}catch{}try{await a.execute('ALTER TABLE subscriptions ADD COLUMN cycle TEXT DEFAULT "annual";')}catch{}}R=!0,g=!0,L=null,console.log("[DB] Schema verified")}catch(a){throw L=null,console.error("[DB] Schema initialization failed:",a),a}})())}async function _(a,r=[]){await E();let e=O(),t=r.map(d=>d===void 0?null:d);try{return(await e.execute({sql:a,args:t})).rows}catch(d){throw console.error(`[DB] Query Error: ${a}`,d),d}}async function s(a,r=[]){await E();let e=O(),t=r.map(d=>d===void 0?null:d);try{return await e.execute({sql:a,args:t})}catch(d){throw console.error(`[DB] Execute Error: ${a}`,d),d}}async function l(a){await E();let r=O(),e=a.map(t=>({sql:t.sql,args:t.args?t.args.map(d=>d===void 0?null:d):[]}));try{return await r.batch(e,"write")}catch(t){throw console.error("[DB] Batch Error",t),t}}async function f(a,r=null,e="platform-master"){if(await E(),a==="paav6_learners"){let d=await _("SELECT * FROM learners WHERE tenant_id = ?",[e]);if(d.length>50)return d;let n=await _("SELECT value FROM kv WHERE key = ? AND tenant_id = ?",["paav6_learners",e]),i=[];if(n.length>0)try{i=JSON.parse(n[0].value)}catch{i=[]}if(i.length===0)return d;let T=[...d],m=new Set(d.map(u=>u.adm));for(let u of i)m.has(u.adm)||(T.push(u),m.add(u.adm));return T}if(a==="paav6_staff"){let d=await _("SELECT * FROM staff WHERE tenant_id = ?",[e]);return d.length?d.map(n=>({...n,teachingAreas:n.teachingAreas?JSON.parse(n.teachingAreas):[]})):r||[]}if(a==="paav6_paylog"){let d=await _("SELECT * FROM paylog WHERE tenant_id = ?",[e]);return d.length?d:r||[]}if(a==="paav6_marks"){let d=await _("SELECT * FROM marks WHERE tenant_id = ?",[e]),n={};for(let i of d)n[i.grade_subj_assess]||(n[i.grade_subj_assess]={}),n[i.grade_subj_assess][i.adm]=i.score;return n}if(a==="paav_student_attendance"){let d=await _("SELECT * FROM attendance WHERE tenant_id = ?",[e]),n={};return d.forEach(i=>{n[i.grade_date_adm]=i.status}),n}if(a==="paav6_msgs")return(await _("SELECT msg_json FROM messages WHERE tenant_id = ? ORDER BY updated_at DESC",[e])).map(d=>JSON.parse(d.msg_json));if(a==="paav_staff_reqs")return(await _("SELECT req_json FROM staff_requests WHERE tenant_id = ? ORDER BY updated_at DESC",[e])).map(d=>JSON.parse(d.req_json));if(a==="paav_presence")return(await _("SELECT prec_json FROM presence WHERE tenant_id = ? ORDER BY updated_at DESC",[e])).map(d=>JSON.parse(d.prec_json));if(a==="paav_duties")return(await _("SELECT duty_json FROM duties WHERE tenant_id = ? ORDER BY updated_at DESC",[e])).map(d=>JSON.parse(d.duty_json));let t=await _("SELECT value FROM kv WHERE key = ? AND tenant_id = ?",[a,e]);if(!t.length)return r;try{return JSON.parse(t[0].value)}catch{return r}}async function x(a,r="platform-master"){let[e,t]=await Promise.all([f(a,null,r),_("SELECT updated_at FROM kv WHERE key = ? AND tenant_id = ?",[a,r])]);return{value:e,updatedAt:t.length?t[0].updated_at:0}}async function F(a,r,e="platform-master"){await E();let t=r.adm,d=[];if(d.push({sql:`UPDATE learners SET 
            adm = ?, name = ?, grade = ?, sex = ?, age = ?, dob = ?, 
            stream = ?, teacher = ?, parent = ?, phone = ?, 
            parentEmail = ?, addr = ?, avatar = ?,
            bloodGroup = ?, allergies = ?, medicalCondition = ?, emergencyContact = ?
          WHERE adm = ? AND tenant_id = ?`,args:[t,r.name,r.grade,r.sex,r.age,r.dob,r.stream,r.teacher,r.parent,r.phone,r.parentEmail,r.addr,r.avatar||null,r.bloodGroup||null,r.allergies||null,r.medicalCondition||null,r.emergencyContact||null,a,e]}),a!==t)for(let n of(d.push({sql:"UPDATE marks SET adm = ? WHERE adm = ? AND tenant_id = ?",args:[t,a,e]}),d.push({sql:"UPDATE paylog SET adm = ? WHERE adm = ? AND tenant_id = ?",args:[t,a,e]}),d.push({sql:"UPDATE staff SET childAdm = ? WHERE childAdm = ? AND tenant_id = ?",args:[t,a,e]}),await _("SELECT grade_date_adm, status FROM attendance WHERE grade_date_adm LIKE ? AND tenant_id = ?",[`%|${a}`,e]))){let i=n.grade_date_adm.split("|");if(i[i.length-1]===a){i[i.length-1]=t;let T=i.join("|");d.push({sql:"DELETE FROM attendance WHERE grade_date_adm = ? AND tenant_id = ?",args:[n.grade_date_adm,e]}),d.push({sql:"INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)",args:[T,e,n.status]})}}await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_learners",e]),a!==t&&(await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_marks",e]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_paylog",e]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_staff",e]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_student_attendance",e]))}async function U(a,r,e="platform-master"){if(await E(),a==="paav6_learners"){let d=[];for(let n of r)d.push({sql:`INSERT INTO learners (adm, tenant_id, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(adm, tenant_id) DO UPDATE SET 
                name=excluded.name, grade=excluded.grade, sex=excluded.sex, age=excluded.age, dob=excluded.dob,
                stream=excluded.stream, teacher=excluded.teacher, parent=excluded.parent, phone=excluded.phone,
                parentEmail=excluded.parentEmail, addr=excluded.addr, t1=excluded.t1, t2=excluded.t2, t3=excluded.t3,
                arrears=excluded.arrears, avatar=excluded.avatar`,args:[n.adm,e,n.name,n.grade,n.sex,n.age,n.dob,n.stream,n.teacher,n.parent,n.phone,n.parentEmail||null,n.addr,n.t1,n.t2,n.t3,n.arrears||0,n.avatar||null]});d.length&&await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav6_staff"){let d=[];for(let n of r)d.push({sql:`INSERT INTO staff (id, tenant_id, name, username, role, phone, password, status, childAdm, grade, teachingAreas, secQ, secA, email, createdAt, avatar)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id, tenant_id) DO UPDATE SET
                name=excluded.name, username=excluded.username, role=excluded.role, phone=excluded.phone,
                password=excluded.password, status=excluded.status, childAdm=excluded.childAdm, grade=excluded.grade,
                teachingAreas=excluded.teachingAreas, secQ=excluded.secQ, secA=excluded.secA, email=excluded.email,
                avatar=excluded.avatar`,args:[n.id,e,n.name,n.username,n.role,n.phone,n.password,n.status,n.childAdm,n.grade,JSON.stringify(n.teachingAreas||[]),n.secQ,n.secA,n.email,n.createdAt,n.avatar||null]});d.length&&await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav6_paylog"){let d=[{sql:"DELETE FROM paylog WHERE tenant_id = ?",args:[e]}];for(let n of r)d.push({sql:`INSERT INTO paylog (id, tenant_id, date, adm, name, grade, term, amount, method, ref, by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,args:[n.id,e,n.date,n.adm,n.name,n.grade,n.term,n.amount,n.method,n.ref,n.by]});await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav6_marks"){let d=[];for(let[n,i]of Object.entries(r))for(let[T,m]of Object.entries(i))m!=null&&m!==""&&d.push({sql:`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?)
                  ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`,args:[n,T,e,Number(m)]});d.length&&await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav_student_attendance"){let d=[];for(let[n,i]of Object.entries(r))d.push({sql:`INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)
              ON CONFLICT(grade_date_adm, tenant_id) DO UPDATE SET status = excluded.status`,args:[n,e,i]});d.length&&await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav6_msgs"){let d=[{sql:"DELETE FROM messages WHERE tenant_id = ?",args:[e]}];for(let n of r)d.push({sql:"INSERT INTO messages (id, tenant_id, msg_json) VALUES (?, ?, ?)",args:[n.id,e,JSON.stringify(n)]});await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav_staff_reqs"){let d=[{sql:"DELETE FROM staff_requests WHERE tenant_id = ?",args:[e]}];for(let n of r)d.push({sql:"INSERT INTO staff_requests (id, tenant_id, userId, req_json) VALUES (?, ?, ?, ?)",args:[n.id,e,n.userId,JSON.stringify(n)]});await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav_presence"){let d=[{sql:"DELETE FROM presence WHERE tenant_id = ?",args:[e]}];for(let n of r)d.push({sql:"INSERT INTO presence (id_date, tenant_id, userId, prec_json) VALUES (?, ?, ?, ?)",args:[`${n.id}|${n.date}`,e,n.id,JSON.stringify(n)]});await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}if(a==="paav_duties"){let d=[{sql:"DELETE FROM duties WHERE tenant_id = ?",args:[e]}];for(let n of r)d.push({sql:"INSERT INTO duties (id, tenant_id, duty_json) VALUES (?, ?, ?)",args:[n.id,e,JSON.stringify(n)]});await l(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,e]);return}let t=JSON.stringify(r);await s(`INSERT INTO kv (key, tenant_id, value, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,[a,e,t])}async function X(a,r,e,t="platform-master"){e==null||e===""?await s("DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ? AND tenant_id = ?",[a,r,t]):await s(`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?)
       ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`,[a,r,t,Number(e)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_marks",t])}async function M(a,r="platform-master"){if(!a||!a.length)return;await E();let e=[];for(let t of a)t.score===null||t.score===void 0||t.score===""?e.push({sql:"DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ? AND tenant_id = ?",args:[t.gsa,t.adm,r]}):e.push({sql:`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?)
              ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`,args:[t.gsa,t.adm,r,Number(t.score)]});await l(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_marks",r])}async function P(a,r="platform-master"){if(!a||!Object.keys(a).length)return;await E();let e=Object.entries(a).map(([t,d])=>({sql:`INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)
          ON CONFLICT(grade_date_adm, tenant_id) DO UPDATE SET status = excluded.status`,args:[t,r,d]}));await l(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_student_attendance",r])}async function q(a,r="platform-master"){a&&a.id&&(await E(),await s(`INSERT INTO messages (id, tenant_id, msg_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id, tenant_id) DO UPDATE SET msg_json = excluded.msg_json, updated_at = excluded.updated_at`,[a.id,r,JSON.stringify(a)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_msgs",r]))}async function j(a,r="platform-master"){a&&a.id&&(await E(),await s("INSERT INTO staff_requests (id, tenant_id, userId, req_json, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))",[a.id,r,a.userId,JSON.stringify(a)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_staff_reqs",r]))}async function b(a,r,e,t="platform-master"){await E(),await s(`INSERT INTO presence (id_date, tenant_id, userId, prec_json, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id_date, tenant_id) DO UPDATE SET prec_json = excluded.prec_json, updated_at = excluded.updated_at`,[`${a}|${r}`,t,a,JSON.stringify(e)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_presence",t])}async function B(a,r="platform-master"){a&&a.id&&(await E(),await s(`INSERT INTO duties (id, tenant_id, duty_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id, tenant_id) DO UPDATE SET duty_json = excluded.duty_json, updated_at = excluded.updated_at`,[a.id,r,JSON.stringify(a)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_duties",r]))}async function V(a,r="platform-master"){await E(),await s("DELETE FROM duties WHERE id = ? AND tenant_id = ?",[a,r]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_duties",r])}async function W(a,r,e="platform-master"){await E();let t=await _("SELECT req_json FROM staff_requests WHERE id = ? AND tenant_id = ?",[a,e]);if(!t.length)return;let d=JSON.parse(t[0].req_json);d.status=r,await s("UPDATE staff_requests SET req_json = ?, updated_at = strftime('%s','now') WHERE id = ? AND tenant_id = ?",[JSON.stringify(d),a,e]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_staff_reqs",e])}async function H({adm:a,term:r,amount:e,method:t,ref:d,by:n,status:i="approved"},T="platform-master"){await E();let m=String(r).toLowerCase();if(!["t1","t2","t3"].includes(m))throw Error("Invalid term");let u=(await f("paav6_learners",[],T)||[]).find(o=>o.adm===a),Q=await f("paav6_feecfg",{},T)||{};if(i==="approved"&&u){let o=Q[u.grade]||{term1:0,term2:0,term3:0},na={t1:o.term1||(o.annual?Math.floor(o.annual/3):0),t2:o.term2||(o.annual?Math.floor(o.annual/3):0),t3:o.term3||(o.annual?Math.floor(o.annual/3):0)},N=Number(e),p={t1:u.t1||0,t2:u.t2||0,t3:u.t3||0,arrears:u.arrears||0};if(p.arrears>0){let c=Math.min(N,p.arrears);p.arrears-=c,N-=c}for(let c of["t1","t2","t3"].slice(["t1","t2","t3"].indexOf(m))){if(N<=0)break;let A=na[c],I=p[c];if(A>0&&I<A){let w=Math.min(N,A-I);p[c]+=w,N-=w}else(A===0||I>=A)&&c==="t3"&&(p[c]+=N,N=0)}N>0&&(p.t3+=N),await s("UPDATE learners SET t1 = ?, t2 = ?, t3 = ?, arrears = ? WHERE adm = ? AND tenant_id = ?",[p.t1,p.t2,p.t3,p.arrears,a,T])}let z="p"+Date.now(),Z=new Date().toLocaleDateString("en-KE"),aa=u?.name||"Unknown",ta=u?.grade||"Unknown",ea=r.toUpperCase(),da=Number(e);await s(`INSERT INTO paylog (id, tenant_id, date, adm, name, grade, term, amount, method, ref, by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[z,T,Z,a,aa,ta,ea,da,t,d,n||"System",i]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_paylog",T]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_learners",T])}async function Y(a,r="platform-master"){await E(),await s("DELETE FROM kv WHERE key = ? AND tenant_id = ?",[a,r])}async function K(a,r="platform-master"){if(await E(),!a||!a.length)return[];let e=a.map(()=>"?").join(",");return _(`SELECT key, updated_at FROM kv WHERE key IN (${e}) AND tenant_id = ?`,[...a,r])}let $=["paav6_learners","paav6_staff","paav6_fees","paav6_marks","paav6_feecfg","paav6_timetable","paav6_attendance","paav_announcement","paav_paybill","paav_payname","paav_acc_fmt","paav_pay_methods","paav_marks_locked","paav_tt22","paav_tt_permission_v22","paav_teacher_assignments","paav_teacher_codes_v22","paav8_subj","paav_sms_sound","cu","paav_remember_user","paav6_paylog","paav7_sms","paav7_audit","paav7_salary","paav7_duties","paav7_streams","paav8_att","paav6_msgs","paav6_reports","paav6_grading","paav8_grad","paav_cgrad_v83","paav7_activity_log"];async function G(a,r,e){(a.tenant_id==="platform-master"||a.tenantId==="platform-master")&&a.role;let t=a?.tenantId||a?.tenant_id||"platform-master",d=await f("paav7_activity_log",[],t)||[],n=[{id:"log_"+Date.now(),userId:a?.id||"guest",userName:a?.name||"Guest/System",userRole:a?.role||"none",action:r,details:e,timestamp:new Date().toISOString()},...d].slice(0,1e3);await U("paav7_activity_log",n,t)}async function J(a,r="platform-master"){if(!a||!a.length)return;await E();let e=a.map(t=>({sql:`INSERT INTO learners (adm, tenant_id, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar, bloodGroup, allergies, medicalCondition, emergencyContact) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(adm, tenant_id) DO UPDATE SET 
            name = excluded.name, grade = excluded.grade, sex = excluded.sex, 
            age = excluded.age, dob = excluded.dob, stream = excluded.stream,
            parent = excluded.parent, phone = excluded.phone,
            bloodGroup = excluded.bloodGroup, allergies = excluded.allergies,
            medicalCondition = excluded.medicalCondition, emergencyContact = excluded.emergencyContact`,args:[t.adm,r,t.name.toUpperCase(),t.grade,t.sex,t.age||"",t.dob||null,t.stream||"",t.teacher||"",t.parent||"",t.phone||"",t.parentEmail||null,t.addr||"",t.t1||0,t.t2||0,t.t3||0,t.arrears||0,t.avatar||null,t.bloodGroup||null,t.allergies||null,t.medicalCondition||null,t.emergencyContact||null]}));await l(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_learners",r])}},v);export{Ta as __getNamedExports};
