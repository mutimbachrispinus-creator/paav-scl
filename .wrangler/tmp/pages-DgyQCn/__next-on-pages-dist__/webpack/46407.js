var y={},Ta=(ra,sa,ia)=>(y.__chunk_46407=(Ea,w,D)=>{"use strict";D.d(w,{KU:()=>f,K_:()=>E,M3:()=>O,XI:()=>Y,bL:()=>G,cM:()=>J,execute:()=>s,kvBulkAddLearners:()=>$,kvDeleteDuty:()=>V,kvGetWithMeta:()=>x,kvLogPresence:()=>b,kvRecordPayment:()=>H,kvSubmitStaffRequest:()=>j,kvUpdateAttendanceBulk:()=>q,kvUpdateLearner:()=>F,kvUpdateMark:()=>X,kvUpdateMarksBulk:()=>P,kvUpdateStaffAvatar:()=>k,kvUpdateStaffProfile:()=>h,kvUpdateStaffRequestStatus:()=>W,kvUpsertDuty:()=>B,kvUpsertMessage:()=>M,logAction:()=>K,or:()=>U,query:()=>T,vA:()=>_});var C=D(17430);async function k(a,n,d="platform-master"){await E(),await s("UPDATE staff SET avatar = ? WHERE id = ? AND tenant_id = ?",[n,a,d]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_staff",d])}async function h(a,n,d,r,e=null,t="platform-master"){await E(),e?await s("UPDATE staff SET name = ?, phone = ?, avatar = ?, password = ? WHERE id = ? AND tenant_id = ?",[n,d,r,e,a,t]):await s("UPDATE staff SET name = ?, phone = ?, avatar = ? WHERE id = ? AND tenant_id = ?",[n,d,r,a,t]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_staff",t])}let S=null,L=null;function f(){if(S)return S;let a=process.env.TURSO_URL,n=process.env.TURSO_TOKEN;if(!a)throw console.error("[DB] Missing TURSO_URL. Ensure it is set in .env.local or production environment."),Error("Database configuration error: TURSO_URL is missing.");if(!a.startsWith("libsql://")&&!a.startsWith("https://")&&!a.startsWith("file:"))throw Error(`Database configuration error: Invalid TURSO_URL format "${a}". Must start with libsql://, https://, or file:`);if(!a.startsWith("file:")&&!n)throw console.error("[DB] Missing TURSO_TOKEN for remote DB"),Error("Database configuration error: TURSO_TOKEN is missing for remote connection.");try{return S=(0,C.UU)({url:a,authToken:n})}catch(d){throw console.error("[DB] Failed to create client:",d),Error("Failed to initialize database client: "+d.message)}}let g=!1,R=!1;async function E(){if(!g||!R)return L||(L=(async()=>{try{let a=f();console.log("[DB] Ensuring schema...");let n=[`CREATE TABLE IF NOT EXISTS kv (
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
        )`].map(e=>({sql:e,args:[]}));try{await a.batch(n,"write"),console.log("[DB] Core tables created/verified")}catch(e){console.error("[DB] Batch schema creation error:",e.message)}let d=(await a.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")).rows||[],r=e=>d.some(t=>t.name===e);for(let[e,t]of Object.entries({kv:"key, tenant_id",learners:"adm, tenant_id",staff:"id, tenant_id",paylog:"id, tenant_id",marks:"grade_subj_assess, adm, tenant_id",attendance:"grade_date_adm, tenant_id",messages:"id, tenant_id",staff_requests:"id, tenant_id",presence:"id_date, tenant_id",duties:"id, tenant_id",files:"id, tenant_id"}))if(r(e))try{await a.execute(`ALTER TABLE ${e} ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'platform-master';`)}catch{}if(r("learners")){let e=d.find(t=>t.name==="learners")?.sql||"";if(!e.includes("arrears"))try{await a.execute("ALTER TABLE learners ADD COLUMN arrears REAL DEFAULT 0;")}catch{}if(!e.includes("parentEmail"))try{await a.execute("ALTER TABLE learners ADD COLUMN parentEmail TEXT;")}catch{}if(!e.includes("avatar"))try{await a.execute("ALTER TABLE learners ADD COLUMN avatar TEXT;")}catch{}if(!e.includes("bloodGroup"))try{await a.execute("ALTER TABLE learners ADD COLUMN bloodGroup TEXT;")}catch{}if(!e.includes("allergies"))try{await a.execute("ALTER TABLE learners ADD COLUMN allergies TEXT;")}catch{}if(!e.includes("medicalCondition"))try{await a.execute("ALTER TABLE learners ADD COLUMN medicalCondition TEXT;")}catch{}if(!e.includes("emergencyContact"))try{await a.execute("ALTER TABLE learners ADD COLUMN emergencyContact TEXT;")}catch{}}if(r("staff")&&!(d.find(e=>e.name==="staff")?.sql||"").includes("avatar"))try{await a.execute("ALTER TABLE staff ADD COLUMN avatar TEXT;")}catch{}if(r("paylog")&&!(d.find(e=>e.name==="paylog")?.sql||"").includes("status"))try{await a.execute('ALTER TABLE paylog ADD COLUMN status TEXT DEFAULT "approved";')}catch{}if(r("subscriptions")){let e=d.find(t=>t.name==="subscriptions")?.sql||"";if(e&&!e.includes("amount"))try{await a.execute("ALTER TABLE subscriptions ADD COLUMN amount REAL DEFAULT 0;")}catch{}if(e&&!e.includes("cycle"))try{await a.execute('ALTER TABLE subscriptions ADD COLUMN cycle TEXT DEFAULT "annual";')}catch{}}for(let e of(console.log("[DB] Creating indices..."),["CREATE INDEX IF NOT EXISTS idx_kv_tenant ON kv(tenant_id)","CREATE INDEX IF NOT EXISTS idx_learners_tenant ON learners(tenant_id)","CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id)","CREATE INDEX IF NOT EXISTS idx_paylog_tenant ON paylog(tenant_id)","CREATE INDEX IF NOT EXISTS idx_marks_tenant ON marks(tenant_id)","CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id)","CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id)","CREATE INDEX IF NOT EXISTS idx_staff_requests_tenant ON staff_requests(tenant_id)","CREATE INDEX IF NOT EXISTS idx_presence_tenant ON presence(tenant_id)","CREATE INDEX IF NOT EXISTS idx_duties_tenant ON duties(tenant_id)"]))try{await a.execute(e)}catch(t){console.warn(`[DB] Index creation skipped or failed: ${e.split(" ").pop()}`,t.message)}g=!0,R=!0,L=null,console.log("[DB] Schema verified")}catch(a){throw L=null,console.error("[DB] Schema initialization failed:",a),a}})())}async function T(a,n=[]){try{await E();let d=f(),r=n.map(e=>e===void 0?null:e);return(await d.execute({sql:a,args:r})).rows||[]}catch(d){if(console.error(`[DB] Query Error: ${a}`,d),a.trim().toUpperCase().startsWith("SELECT"))return[];throw d}}async function s(a,n=[]){await E();let d=f(),r=n.map(e=>e===void 0?null:e);try{return await d.execute({sql:a,args:r})}catch(e){throw console.error(`[DB] Execute Error: ${a}`,e),e}}async function _(a){await E();let n=f(),d=a.map(r=>({sql:r.sql,args:r.args?r.args.map(e=>e===void 0?null:e):[]}));try{return await n.batch(d,"write")}catch(r){throw console.error("[DB] Batch Error",r),r}}async function O(a,n=null,d="platform-master"){if(await E(),a==="paav6_learners"){let e=await T("SELECT * FROM learners WHERE tenant_id = ?",[d]);if(e.length>50)return e;let t=await T("SELECT value FROM kv WHERE key = ? AND tenant_id = ?",["paav6_learners",d]),i=[];if(t.length>0)try{i=JSON.parse(t[0].value)}catch{i=[]}if(i.length===0)return e;let u=[...e],m=new Set(e.map(l=>l.adm));for(let l of i)m.has(l.adm)||(u.push(l),m.add(l.adm));return u}if(a==="paav6_staff"){let e=await T("SELECT * FROM staff WHERE tenant_id = ?",[d]);return e.length?e.map(t=>({...t,teachingAreas:t.teachingAreas?JSON.parse(t.teachingAreas):[]})):n||[]}if(a==="paav6_paylog"){let e=await T("SELECT * FROM paylog WHERE tenant_id = ?",[d]);return e.length?e:n||[]}if(a==="paav6_marks"){let e=await T("SELECT * FROM marks WHERE tenant_id = ?",[d]),t={};for(let i of e)t[i.grade_subj_assess]||(t[i.grade_subj_assess]={}),t[i.grade_subj_assess][i.adm]=i.score;return t}if(a==="paav_student_attendance"){let e=await T("SELECT * FROM attendance WHERE tenant_id = ?",[d]),t={};return e.forEach(i=>{t[i.grade_date_adm]=i.status}),t}if(a==="paav6_msgs")return(await T("SELECT msg_json FROM messages WHERE tenant_id = ? ORDER BY updated_at DESC",[d])).map(e=>JSON.parse(e.msg_json));if(a==="paav_staff_reqs")return(await T("SELECT req_json FROM staff_requests WHERE tenant_id = ? ORDER BY updated_at DESC",[d])).map(e=>JSON.parse(e.req_json));if(a==="paav_presence")return(await T("SELECT prec_json FROM presence WHERE tenant_id = ? ORDER BY updated_at DESC",[d])).map(e=>JSON.parse(e.prec_json));if(a==="paav_duties")return(await T("SELECT duty_json FROM duties WHERE tenant_id = ? ORDER BY updated_at DESC",[d])).map(e=>JSON.parse(e.duty_json));let r=await T("SELECT value FROM kv WHERE key = ? AND tenant_id = ?",[a,d]);if(!r.length)return n;try{return JSON.parse(r[0].value)}catch{return n}}async function x(a,n="platform-master"){let[d,r]=await Promise.all([O(a,null,n),T("SELECT updated_at FROM kv WHERE key = ? AND tenant_id = ?",[a,n])]);return{value:d,updatedAt:r.length?r[0].updated_at:0}}async function F(a,n,d="platform-master"){await E();let r=n.adm,e=[];if(e.push({sql:`UPDATE learners SET 
            adm = ?, name = ?, grade = ?, sex = ?, age = ?, dob = ?, 
            stream = ?, teacher = ?, parent = ?, phone = ?, 
            parentEmail = ?, addr = ?, avatar = ?,
            bloodGroup = ?, allergies = ?, medicalCondition = ?, emergencyContact = ?
          WHERE adm = ? AND tenant_id = ?`,args:[r,n.name,n.grade,n.sex,n.age,n.dob,n.stream,n.teacher,n.parent,n.phone,n.parentEmail,n.addr,n.avatar||null,n.bloodGroup||null,n.allergies||null,n.medicalCondition||null,n.emergencyContact||null,a,d]}),a!==r)for(let t of(e.push({sql:"UPDATE marks SET adm = ? WHERE adm = ? AND tenant_id = ?",args:[r,a,d]}),e.push({sql:"UPDATE paylog SET adm = ? WHERE adm = ? AND tenant_id = ?",args:[r,a,d]}),e.push({sql:"UPDATE staff SET childAdm = ? WHERE childAdm = ? AND tenant_id = ?",args:[r,a,d]}),await T("SELECT grade_date_adm, status FROM attendance WHERE grade_date_adm LIKE ? AND tenant_id = ?",[`%|${a}`,d]))){let i=t.grade_date_adm.split("|");if(i[i.length-1]===a){i[i.length-1]=r;let u=i.join("|");e.push({sql:"DELETE FROM attendance WHERE grade_date_adm = ? AND tenant_id = ?",args:[t.grade_date_adm,d]}),e.push({sql:"INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)",args:[u,d,t.status]})}}await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_learners",d]),a!==r&&(await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_marks",d]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_paylog",d]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_staff",d]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_student_attendance",d]))}async function U(a,n,d="platform-master"){if(await E(),a==="paav6_learners"){let e=[];for(let t of n)e.push({sql:`INSERT INTO learners (adm, tenant_id, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(adm, tenant_id) DO UPDATE SET 
                name=excluded.name, grade=excluded.grade, sex=excluded.sex, age=excluded.age, dob=excluded.dob,
                stream=excluded.stream, teacher=excluded.teacher, parent=excluded.parent, phone=excluded.phone,
                parentEmail=excluded.parentEmail, addr=excluded.addr, t1=excluded.t1, t2=excluded.t2, t3=excluded.t3,
                arrears=excluded.arrears, avatar=excluded.avatar`,args:[t.adm,d,t.name,t.grade,t.sex,t.age,t.dob,t.stream,t.teacher,t.parent,t.phone,t.parentEmail||null,t.addr,t.t1,t.t2,t.t3,t.arrears||0,t.avatar||null]});e.length&&await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav6_staff"){let e=[];for(let t of n)e.push({sql:`INSERT INTO staff (id, tenant_id, name, username, role, phone, password, status, childAdm, grade, teachingAreas, secQ, secA, email, createdAt, avatar)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id, tenant_id) DO UPDATE SET
                name=excluded.name, username=excluded.username, role=excluded.role, phone=excluded.phone,
                password=excluded.password, status=excluded.status, childAdm=excluded.childAdm, grade=excluded.grade,
                teachingAreas=excluded.teachingAreas, secQ=excluded.secQ, secA=excluded.secA, email=excluded.email,
                avatar=excluded.avatar`,args:[t.id,d,t.name,t.username,t.role,t.phone,t.password,t.status,t.childAdm,t.grade,JSON.stringify(t.teachingAreas||[]),t.secQ,t.secA,t.email,t.createdAt,t.avatar||null]});e.length&&await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav6_paylog"){let e=[{sql:"DELETE FROM paylog WHERE tenant_id = ?",args:[d]}];for(let t of n)e.push({sql:`INSERT INTO paylog (id, tenant_id, date, adm, name, grade, term, amount, method, ref, by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,args:[t.id,d,t.date,t.adm,t.name,t.grade,t.term,t.amount,t.method,t.ref,t.by]});await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav6_marks"){let e=[];for(let[t,i]of Object.entries(n))for(let[u,m]of Object.entries(i))m!=null&&m!==""&&e.push({sql:`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?)
                  ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`,args:[t,u,d,Number(m)]});e.length&&await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav_student_attendance"){let e=[];for(let[t,i]of Object.entries(n))e.push({sql:`INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)
              ON CONFLICT(grade_date_adm, tenant_id) DO UPDATE SET status = excluded.status`,args:[t,d,i]});e.length&&await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav6_msgs"){let e=[{sql:"DELETE FROM messages WHERE tenant_id = ?",args:[d]}];for(let t of n)e.push({sql:"INSERT INTO messages (id, tenant_id, msg_json) VALUES (?, ?, ?)",args:[t.id,d,JSON.stringify(t)]});await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav_staff_reqs"){let e=[{sql:"DELETE FROM staff_requests WHERE tenant_id = ?",args:[d]}];for(let t of n)e.push({sql:"INSERT INTO staff_requests (id, tenant_id, userId, req_json) VALUES (?, ?, ?, ?)",args:[t.id,d,t.userId,JSON.stringify(t)]});await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav_presence"){let e=[{sql:"DELETE FROM presence WHERE tenant_id = ?",args:[d]}];for(let t of n)e.push({sql:"INSERT INTO presence (id_date, tenant_id, userId, prec_json) VALUES (?, ?, ?, ?)",args:[`${t.id}|${t.date}`,d,t.id,JSON.stringify(t)]});await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}if(a==="paav_duties"){let e=[{sql:"DELETE FROM duties WHERE tenant_id = ?",args:[d]}];for(let t of n)e.push({sql:"INSERT INTO duties (id, tenant_id, duty_json) VALUES (?, ?, ?)",args:[t.id,d,JSON.stringify(t)]});await _(e),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",[a,d]);return}let r=JSON.stringify(n);await s(`INSERT INTO kv (key, tenant_id, value, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,[a,d,r])}async function X(a,n,d,r="platform-master"){d==null||d===""?await s("DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ? AND tenant_id = ?",[a,n,r]):await s(`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?)
       ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`,[a,n,r,Number(d)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_marks",r])}async function P(a,n="platform-master"){if(!a||!a.length)return;await E();let d=[];for(let r of a)r.score===null||r.score===void 0||r.score===""?d.push({sql:"DELETE FROM marks WHERE grade_subj_assess = ? AND adm = ? AND tenant_id = ?",args:[r.gsa,r.adm,n]}):d.push({sql:`INSERT INTO marks (grade_subj_assess, adm, tenant_id, score) VALUES (?, ?, ?, ?)
              ON CONFLICT(grade_subj_assess, adm, tenant_id) DO UPDATE SET score = excluded.score`,args:[r.gsa,r.adm,n,Number(r.score)]});await _(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_marks",n])}async function q(a,n="platform-master"){if(!a||!Object.keys(a).length)return;await E();let d=Object.entries(a).map(([r,e])=>({sql:`INSERT INTO attendance (grade_date_adm, tenant_id, status) VALUES (?, ?, ?)
          ON CONFLICT(grade_date_adm, tenant_id) DO UPDATE SET status = excluded.status`,args:[r,n,e]}));await _(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_student_attendance",n])}async function M(a,n="platform-master"){a&&a.id&&(await E(),await s(`INSERT INTO messages (id, tenant_id, msg_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id, tenant_id) DO UPDATE SET msg_json = excluded.msg_json, updated_at = excluded.updated_at`,[a.id,n,JSON.stringify(a)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_msgs",n]))}async function j(a,n="platform-master"){a&&a.id&&(await E(),await s("INSERT INTO staff_requests (id, tenant_id, userId, req_json, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))",[a.id,n,a.userId,JSON.stringify(a)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_staff_reqs",n]))}async function b(a,n,d,r="platform-master"){await E(),await s(`INSERT INTO presence (id_date, tenant_id, userId, prec_json, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id_date, tenant_id) DO UPDATE SET prec_json = excluded.prec_json, updated_at = excluded.updated_at`,[`${a}|${n}`,r,a,JSON.stringify(d)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_presence",r])}async function B(a,n="platform-master"){a&&a.id&&(await E(),await s(`INSERT INTO duties (id, tenant_id, duty_json, updated_at) VALUES (?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id, tenant_id) DO UPDATE SET duty_json = excluded.duty_json, updated_at = excluded.updated_at`,[a.id,n,JSON.stringify(a)]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_duties",n]))}async function V(a,n="platform-master"){await E(),await s("DELETE FROM duties WHERE id = ? AND tenant_id = ?",[a,n]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_duties",n])}async function W(a,n,d="platform-master"){await E();let r=await T("SELECT req_json FROM staff_requests WHERE id = ? AND tenant_id = ?",[a,d]);if(!r.length)return;let e=JSON.parse(r[0].req_json);e.status=n,await s("UPDATE staff_requests SET req_json = ?, updated_at = strftime('%s','now') WHERE id = ? AND tenant_id = ?",[JSON.stringify(e),a,d]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav_staff_reqs",d])}async function H({adm:a,term:n,amount:d,method:r,ref:e,by:t,status:i="approved"},u="platform-master"){await E();let m=String(n).toLowerCase();if(!["t1","t2","t3"].includes(m))throw Error("Invalid term");let l=(await O("paav6_learners",[],u)||[]).find(o=>o.adm===a),Q=await O("paav6_feecfg",{},u)||{};if(i==="approved"&&l){let o=Q[l.grade]||{term1:0,term2:0,term3:0},na={t1:o.term1||(o.annual?Math.floor(o.annual/3):0),t2:o.term2||(o.annual?Math.floor(o.annual/3):0),t3:o.term3||(o.annual?Math.floor(o.annual/3):0)},c=Number(d),p={t1:l.t1||0,t2:l.t2||0,t3:l.t3||0,arrears:l.arrears||0};if(p.arrears>0){let N=Math.min(c,p.arrears);p.arrears-=N,c-=N}for(let N of["t1","t2","t3"].slice(["t1","t2","t3"].indexOf(m))){if(c<=0)break;let A=na[N],I=p[N];if(A>0&&I<A){let v=Math.min(c,A-I);p[N]+=v,c-=v}else(A===0||I>=A)&&N==="t3"&&(p[N]+=c,c=0)}c>0&&(p.t3+=c),await s("UPDATE learners SET t1 = ?, t2 = ?, t3 = ?, arrears = ? WHERE adm = ? AND tenant_id = ?",[p.t1,p.t2,p.t3,p.arrears,a,u])}let z="p"+Date.now(),Z=new Date().toLocaleDateString("en-KE"),aa=l?.name||"Unknown",ea=l?.grade||"Unknown",ta=n.toUpperCase(),da=Number(d);await s(`INSERT INTO paylog (id, tenant_id, date, adm, name, grade, term, amount, method, ref, by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[z,u,Z,a,aa,ea,ta,da,r,e,t||"System",i]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_paylog",u]),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_learners",u])}async function Y(a,n="platform-master"){await E(),await s("DELETE FROM kv WHERE key = ? AND tenant_id = ?",[a,n])}async function G(a,n="platform-master"){if(await E(),!a||!a.length)return[];let d=a.map(()=>"?").join(",");return T(`SELECT key, updated_at FROM kv WHERE key IN (${d}) AND tenant_id = ?`,[...a,n])}let J=["paav6_learners","paav6_staff","paav6_fees","paav6_marks","paav6_feecfg","paav6_timetable","paav6_attendance","paav_announcement","paav_paybill","paav_payname","paav_acc_fmt","paav_pay_methods","paav_marks_locked","paav_tt22","paav_tt_permission_v22","paav_teacher_assignments","paav_teacher_codes_v22","paav8_subj","paav_sms_sound","cu","paav_remember_user","paav6_paylog","paav7_sms","paav7_audit","paav7_salary","paav7_duties","paav7_streams","paav8_att","paav6_msgs","paav6_reports","paav6_grading","paav8_grad","paav_cgrad_v83","paav7_activity_log"];async function K(a,n,d){(a.tenant_id==="platform-master"||a.tenantId==="platform-master")&&a.role;let r=a?.tenantId||a?.tenant_id||"platform-master",e=await O("paav7_activity_log",[],r)||[],t=[{id:"log_"+Date.now(),userId:a?.id||"guest",userName:a?.name||"Guest/System",userRole:a?.role||"none",action:n,details:d,timestamp:new Date().toISOString()},...e].slice(0,1e3);await U("paav7_activity_log",t,r)}async function $(a,n="platform-master"){if(!a||!a.length)return;await E();let d=a.map(r=>({sql:`INSERT INTO learners (adm, tenant_id, name, grade, sex, age, dob, stream, teacher, parent, phone, parentEmail, addr, t1, t2, t3, arrears, avatar, bloodGroup, allergies, medicalCondition, emergencyContact) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(adm, tenant_id) DO UPDATE SET 
            name = excluded.name, grade = excluded.grade, sex = excluded.sex, 
            age = excluded.age, dob = excluded.dob, stream = excluded.stream,
            parent = excluded.parent, phone = excluded.phone,
            bloodGroup = excluded.bloodGroup, allergies = excluded.allergies,
            medicalCondition = excluded.medicalCondition, emergencyContact = excluded.emergencyContact`,args:[r.adm,n,r.name.toUpperCase(),r.grade,r.sex,r.age||"",r.dob||null,r.stream||"",r.teacher||"",r.parent||"",r.phone||"",r.parentEmail||null,r.addr||"",r.t1||0,r.t2||0,r.t3||0,r.arrears||0,r.avatar||null,r.bloodGroup||null,r.allergies||null,r.medicalCondition||null,r.emergencyContact||null]}));await _(d),await s("INSERT INTO kv (key, tenant_id, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key, tenant_id) DO UPDATE SET updated_at = excluded.updated_at",["paav6_learners",n])}},y);export{Ta as __getNamedExports};
