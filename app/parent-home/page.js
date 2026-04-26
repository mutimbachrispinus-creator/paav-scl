'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_SUBJECTS, gInfo, fmtK } from '@/lib/cbe';

const M = '#8B1A1A', M2 = '#6B1212', ML = '#FDF2F2', MB = '#F5E6E6';

export default function ParentHome() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]); // multiple children
  const [selAdm, setSelAdm] = useState(null);   // selected child adm
  const [messages, setMessages] = useState([]);
  const [feeCfg, setFeeCfg] = useState({});
  const [marks, setMarks] = useState({});
  const [payInfo, setPayInfo] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('child');
  const [term, setTerm] = useState('T1');
  const [assess, setAssess] = useState('et1');

  const load = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth');
      const auth = await authRes.json();
      if (!auth.ok || !auth.user || auth.user.role !== 'parent') { router.push('/'); return; }
      setUser(auth.user);

      const dbRes = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [
          { type: 'get', key: 'paav6_learners' },
          { type: 'get', key: 'paav6_msgs' },
          { type: 'get', key: 'paav6_feecfg' },
          { type: 'get', key: 'paav6_marks' },
          { type: 'get', key: 'paav_paybill_accounts' },
          { type: 'get', key: 'paav_calendar_events' },
        ]})
      });
      const db = await dbRes.json();
      const learners = db.results[0]?.value || [];
      const msgs = db.results[1]?.value || [];
      const fees = db.results[2]?.value || {};
      const mks = db.results[3]?.value || {};

      // Support multiple children — user.childAdm can be string (comma-separated) or array
      const admList = Array.isArray(auth.user.childAdm)
        ? auth.user.childAdm
        : auth.user.childAdm ? String(auth.user.childAdm).split(',').map(s => s.trim()).filter(Boolean) : [];

      const myKids = learners.filter(l => admList.includes(l.adm));
      setChildren(myKids);
      if (!selAdm && myKids.length > 0) setSelAdm(myKids[0].adm);

      setMessages(msgs);
      setFeeCfg(fees);
      setMarks(mks);
      setEvents(db.results[6]?.value || []);
      setPayInfo({
        accounts: db.results[4]?.value || [],
      });
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }, [router, selAdm]);

  useEffect(() => { load(); }, [load]);

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target.result;
      try {
        const staffRes = await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ requests:[{ type:'get', key:'paav6_staff' }] })
        });
        const sdb = await staffRes.json();
        const staffList = sdb.results[0]?.value||[];
        const idx = staffList.findIndex(s=>s.id===user.id);
        if (idx>=0) { staffList[idx].avatar=dataUrl; }
        else { staffList.push({ id:user.id, avatar:dataUrl }); }
        await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ requests:[{ type:'set', key:'paav6_staff', value:staffList }] })
        });
        setUser(u=>({...u, avatar:dataUrl}));
      } catch(err) { alert('Upload failed: '+err.message); }
    };
    reader.readAsDataURL(file);
  }

  /* ── M-Pesa STK Push ── */
  async function initiateMpesa(account, termLabel) {
    const phone = user.phone || prompt('Enter M-Pesa Phone Number (07xxxxxxxx):');
    if (!phone) return;
    
    const amount = prompt(`Enter amount to pay for ${termLabel}:`, '1000');
    if (!amount || isNaN(amount)) return;

    try {
      const res = await fetch('/api/mpesa/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          amount: Number(amount),
          accountRef: child.adm,
          term: termLabel.replace('Term ', 'T'),
          description: `${child.name} Fees`,
          shortcode: account.shortcode,
          passkey: account.passkey
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ M-Pesa prompt sent to your phone! Please enter your PIN to complete payment.');
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to initiate M-Pesa.'));
      }
    } catch (err) {
      alert('❌ Connection error: ' + err.message);
    }
  }

  if (loading || !user) return <div className="page on" style={{padding:60,textAlign:'center',color:'var(--muted)'}}>Loading…</div>;
  if (!user) return null;

  const child = children.find(c=>c.adm===selAdm) || children[0];

  if (children.length === 0) {
    return (
      <div className="page on">
        <div style={{background:`linear-gradient(135deg,${M},${M2})`,padding:24,borderRadius:12,color:'#fff',marginBottom:22}}>
          <h2>Welcome, {user?.name}</h2>
          <p>No learner linked to your account. Contact school admin.</p>
        </div>
      </div>
    );
  }

  const exp = feeCfg[child?.grade]?.annual || 5000;
  const paid = (child?.t1||0)+(child?.t2||0)+(child?.t3||0);
  const bal = exp - paid;
  const subjs = DEFAULT_SUBJECTS[child?.grade] || [];
  const unr = messages.filter(m=>m.to==='ALL'||m.to==='ALL_PARENTS'||m.to===user.username).filter(m=>!(m.read||[]).includes(user.username)).length;

  const TABS = [
    { id:'child',   label:'👦 My Child',        icon:'👦' },
    { id:'perf',    label:'📊 Performance',      icon:'📊' },
    { id:'fees',    label:'💰 Pay Fees',         icon:'💰' },
    { id:'calendar',label:'📅 Calendar',         icon:'📅' },
    { id:'msgs',    label:`💬 Messages${unr>0?` (${unr})`:''}`, icon:'💬' },
  ];

  const upcomingEvents = events
    .filter(e=>e.date >= new Date().toISOString().split('T')[0])
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,10);

  return (
    <div className="page on" id="pg-parent-home">
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${M},${M2})`,padding:'20px 24px',borderRadius:12,color:'#fff',marginBottom:18,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        {/* Profile photo */}
        <div className="photo-upload-wrapper" onClick={()=>fileRef.current?.click()} title="Click to change photo">
          <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,.2)',border:'2px solid rgba(255,255,255,.4)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,cursor:'pointer'}}>
            {user.avatar ? <img src={user.avatar} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="Profile" /> : '👤'}
          </div>
          <div className="photo-upload-btn">📷</div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" style={{display:'none'}} onChange={uploadPhoto} />
        </div>
        <div style={{flex:1}}>
          <h2 style={{fontSize:20,margin:0}}>Welcome, {user?.name}</h2>
          {children.length > 1 && (
            <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>
              {children.map(c=>(
                <button key={c.adm} onClick={()=>setSelAdm(c.adm)}
                  style={{padding:'3px 10px',borderRadius:20,border:'1.5px solid rgba(255,255,255,.4)',background:selAdm===c.adm?'rgba(255,255,255,.25)':'transparent',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:700}}>
                  {c.name.split(' ')[0]} ({c.grade.replace('GRADE ','G')})
                </button>
              ))}
            </div>
          )}
          {children.length === 1 && (
            <p style={{margin:0,opacity:.9,fontSize:13}}>Monitoring: <strong style={{color:'#FCD34D'}}>{child?.name}</strong> — {child?.grade} · {child?.adm}</p>
          )}
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:10,opacity:.7,marginBottom:2}}>Fee Balance</div>
          <div style={{fontSize:20,fontWeight:900,color:bal<=0?'#86EFAC':'#FCA5A5'}}>{fmtK(bal)}</div>
          <div style={{fontSize:9,opacity:.7}}>{bal<=0?'✅ Cleared':'⚠ Outstanding'}</div>
        </div>
      </div>

      {/* Child selector for multiple children */}
      {children.length > 1 && (
        <div style={{background:ML,borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <span style={{fontWeight:700,fontSize:12,color:M}}>📋 Viewing:</span>
          {children.map(c=>(
            <button key={c.adm} onClick={()=>setSelAdm(c.adm)}
              style={{padding:'5px 14px',borderRadius:20,border:`1.5px solid ${selAdm===c.adm?M:'var(--border)'}`,background:selAdm===c.adm?M:'#fff',color:selAdm===c.adm?'#fff':'var(--navy)',cursor:'pointer',fontSize:12,fontWeight:700,transition:'all .2s'}}>
              {c.name} · {c.grade}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:16,background:MB,borderRadius:10,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' on':''}`}
            style={tab===t.id?{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff',boxShadow:`0 2px 10px rgba(139,26,26,.3)`}:{}}
            onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* MY CHILD TAB */}
      {tab==='child' && (
        <div className="sg sg3">
          <div className="stat-card" style={{borderTop:`4px solid ${M}`}}>
            <div className="sc-inner">
              <div className="sc-icon" style={{background:'#EFF6FF',fontSize:22}}>🎓</div>
              <div><div className="sc-n" style={{color:M}}>{child?.grade}</div><div className="sc-l">Current Grade</div></div>
            </div>
          </div>
          <div className="stat-card" style={{borderTop:`4px solid ${bal<=0?'#059669':M}`}}>
            <div className="sc-inner">
              <div className="sc-icon" style={{background:bal<=0?'#ECFDF5':'#FEF2F2',fontSize:22}}>💰</div>
              <div><div className="sc-n" style={{color:bal<=0?'#059669':M}}>{fmtK(bal)}</div><div className="sc-l">Fee Balance</div></div>
            </div>
          </div>
          <div className="stat-card" style={{borderTop:`4px solid #7C3AED`}}>
            <div className="sc-inner">
              <div className="sc-icon" style={{background:'#F5F3FF',fontSize:22}}>💬</div>
              <div><div className="sc-n" style={{color:'#7C3AED'}}>{unr}</div><div className="sc-l">New Messages</div></div>
            </div>
          </div>
          {/* Child info card */}
          <div className="panel" style={{gridColumn:'1/-1',border:`1.5px solid ${MB}`}}>
            <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
              <h3 style={{color:'#fff'}}>👦 {child?.name} — Profile</h3>
            </div>
            <div className="panel-body">
              {[['Admission No.',child?.adm],['Grade',child?.grade],['Stream',child?.stream||'—'],['Parent/Guardian',child?.parent||user.name],['Phone',child?.phone||'—'],['DOB',child?.dob||'—']].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--muted)',fontWeight:600}}>{l}</span>
                  <span style={{fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {tab==='perf' && (
        <div>
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
            <select value={term} onChange={e=>setTerm(e.target.value)} style={{borderRadius:8,padding:'7px 10px',border:`2px solid ${MB}`,fontSize:12,outline:'none'}}>
              <option value="T1">Term 1</option><option value="T2">Term 2</option><option value="T3">Term 3</option>
            </select>
            <select value={assess} onChange={e=>setAssess(e.target.value)} style={{borderRadius:8,padding:'7px 10px',border:`2px solid ${MB}`,fontSize:12,outline:'none'}}>
              <option value="op1">Opener</option><option value="mt1">Mid-Term</option><option value="et1">End-Term</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {/* Subject List */}
            <div className="panel" style={{border:`1.5px solid ${MB}`}}>
              <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
                <h3 style={{color:'#fff'}}>📊 {child?.name} — {term} Performance</h3>
              </div>
              <div className="panel-body">
                {subjs.map(s => {
                  const key = `${term}:${child?.grade}|${s}|${assess}`;
                  const sc = marks[key]?.[child?.adm];
                  const info = sc!=null ? gInfo(Number(sc),child?.grade) : null;
                  return (
                    <div key={s} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
                      <div style={{flex:1,fontWeight:600,fontSize:13}}>{s}</div>
                      {sc!=null ? (
                        <>
                          <span style={{fontWeight:800,fontSize:16,color:info.c}}>{sc}</span>
                          <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:800,background:info.bg,color:info.c}}>{info.lv}</span>
                        </>
                      ) : <span style={{color:'var(--muted)',fontSize:12}}>—</span>}
                    </div>
                  );
                })}
                {subjs.length===0&&<div style={{color:'var(--muted)',padding:20,textAlign:'center'}}>No subjects found for {child?.grade}</div>}
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="panel" style={{ border: '1.5px solid #BFDBFE' }}>
              <div className="panel-hdr" style={{ background: 'linear-gradient(135deg, #1D4ED8, #1E3A8A)', color: '#fff' }}>
                <h3 style={{ color: '#fff' }}>📈 Performance Analysis</h3>
              </div>
              <div className="panel-body">
                {(() => {
                  const scores = subjs.map(s => {
                    const sc = marks[`${term}:${child?.grade}|${s}|${assess}`]?.[child?.adm];
                    return sc != null ? { s, sc: Number(sc) } : null;
                  }).filter(Boolean);
                  
                  if (!scores.length) return <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Enter marks to see analysis</p>;

                  const avg = Math.round(scores.reduce((a, b) => a + b.sc, 0) / scores.length);
                  const best = scores.reduce((a, b) => a.sc > b.sc ? a : b);
                  const worst = scores.reduce((a, b) => a.sc < b.sc ? a : b);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                      <div style={{ background: '#EFF6FF', padding: 15, borderRadius: 12, textAlign: 'center', border: '1px solid #BFDBFE' }}>
                        <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 800, textTransform: 'uppercase' }}>{term} Average Score</div>
                        <div style={{ fontSize: 42, fontWeight: 900, color: '#1E3A8A' }}>{avg}%</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Based on {scores.length} subjects</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 10, border: '1px solid #A7F3D0' }}>
                          <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>🌟 Strongest</div>
                          <div style={{ fontWeight: 800, fontSize: 13 }}>{best.s}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>{best.sc}%</div>
                        </div>
                        <div style={{ background: '#FFF7ED', padding: 12, borderRadius: 10, border: '1px solid #FED7AA' }}>
                          <div style={{ fontSize: 10, color: '#92400E', fontWeight: 700 }}>🚀 Needs Focus</div>
                          <div style={{ fontWeight: 800, fontSize: 13 }}>{worst.s}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#DC2626' }}>{worst.sc}%</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--muted)', background: '#F8FAFC', padding: 12, borderRadius: 10, fontStyle: 'italic' }}>
                        💡 <strong>Insight:</strong> {child.name.split(' ')[0]} is performing best in <strong>{best.s}</strong>. 
                        Consider providing more support in <strong>{worst.s}</strong> to improve overall performance.
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAY FEES TAB */}
      {tab==='fees' && (
        <div>
          {/* Fee Statement */}
          <div className="panel" style={{border:`1.5px solid ${MB}`,marginBottom:16}}>
            <div className="panel-hdr" style={{background:`linear-gradient(135deg,#047857,#065F46)`,color:'#fff'}}>
              <h3 style={{color:'#fff'}}>💰 Fee Statement — {child?.name}</h3>
            </div>
            <div className="panel-body">
              {[['Term 1',child?.t1||0],['Term 2',child?.t2||0],['Term 3',child?.t3||0]].map(([l,p])=>{
                const due = feeCfg[child?.grade]?.[l.toLowerCase().replace(' ','')]||Math.round(exp/3);
                return (
                  <div key={l} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                      <span style={{fontWeight:600}}>{l}</span><span>{fmtK(p)} paid</span>
                    </div>
                    <div style={{height:8,background:'#EEF2FF',borderRadius:4,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(100,due?Math.round(p/due*100):0)}%`,height:'100%',background:p>=due?'#059669':'#2563EB',borderRadius:4}} />
                    </div>
                  </div>
                );
              })}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'#F8FAFF',borderRadius:8,marginTop:6,fontSize:13}}>
                <span>Annual: <strong>{fmtK(exp)}</strong></span>
                <span style={{color:'#059669'}}>Paid: <strong>{fmtK(paid)}</strong></span>
                <span style={{color:bal>0?M:'#059669'}}>Balance: <strong>{fmtK(bal)}</strong></span>
              </div>
            </div>
          </div>
          {/* Payment instructions and Accounts */}
          <div className="panel" style={{border:`1.5px solid #A7F3D0`}}>
            <div className="panel-hdr" style={{background:'linear-gradient(135deg,#047857,#065F46)',color:'#fff'}}>
              <h3 style={{color:'#fff'}}>💳 How to Pay</h3>
            </div>
            <div className="panel-body">
              {payInfo.accounts?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 15 }}>
                  {payInfo.accounts.map(acc => (
                    <div key={acc.id} style={{ background: '#fff', border: '2px solid #A7F3D0', borderRadius: 12, padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{acc.type}</div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#065F46' }}>{acc.shortcode}</div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{acc.name}</div>
                        </div>
                        <div style={{ background: '#ECFDF5', padding: '4px 8px', borderRadius: 8, fontSize: 10, color: '#059669', fontWeight: 800 }}>M-PESA</div>
                      </div>
                      <div style={{ background: '#F8FAFF', padding: 8, borderRadius: 8, fontSize: 11 }}>
                        Account: <strong>{child?.adm}</strong>
                      </div>
                      <button 
                        className="btn btn-success btn-sm" 
                        style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
                        onClick={() => initiateMpesa(acc, 'Term ' + term.replace('T', ''))}
                      >
                        💚 Pay with STK Push
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{background:'#FEF9C3',border:'1px solid #FDE68A',borderRadius:8,padding:12,fontSize:12,color:'#92400E'}}>
                  ⚠️ Payment details not configured. Contact school admin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR TAB */}
      {tab==='calendar' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>📅 School Calendar</h3>
          </div>
          <div className="panel-body">
            {upcomingEvents.length===0 ? (
              <div style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
                <div style={{fontSize:36,marginBottom:8}}>📅</div>
                No upcoming events. Events are added by school administration.
              </div>
            ) : upcomingEvents.map((ev,i)=>(
              <div key={i} style={{display:'flex',gap:14,padding:'12px 0',borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
                <div style={{minWidth:52,textAlign:'center',background:`${M}15`,border:`1.5px solid ${MB}`,borderRadius:8,padding:'6px 4px'}}>
                  <div style={{fontSize:10,fontWeight:800,color:M,textTransform:'uppercase'}}>{ev.date.split('-')[1] && ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+ev.date.split('-')[1]]}</div>
                  <div style={{fontSize:20,fontWeight:900,color:M,lineHeight:1}}>{ev.date.split('-')[2]}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{ev.title}</div>
                  {ev.desc&&<div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{ev.desc}</div>}
                  <div style={{fontSize:10,color:'var(--muted)',marginTop:3}}>{ev.date}</div>
                </div>
                {ev.type&&<span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:`${M}15`,color:M}}>{ev.type}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {tab==='msgs' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>💬 School Messages</h3>
          </div>
          <div className="panel-body">
            {messages.filter(m=>m.to==='ALL'||m.to==='ALL_PARENTS'||m.to===user.username||m.from===user.username)
              .slice(-20).reverse().map((m,i)=>(
              <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:13,color:M}}>{m.from===user.username?`To: ${m.to}`:`From: ${m.from}`}</span>
                  <span style={{fontSize:11,color:'var(--muted)'}}>{new Date(m.time||Date.now()).toLocaleString()}</span>
                </div>
                <div style={{fontSize:13,color:'#334155'}}>{m.text}</div>
              </div>
            ))}
            {messages.filter(m=>m.to==='ALL'||m.to==='ALL_PARENTS'||m.to===user.username).length===0&&(
              <div style={{color:'var(--muted)',fontSize:12,textAlign:'center',padding:30}}>No messages yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
