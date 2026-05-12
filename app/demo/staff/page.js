'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const SCENES = [
  { id:'dashboard',  label:'📊 Revenue Dashboard',       dur:3500 },
  { id:'learners',   label:'👥 Learner Registry',         dur:3000 },
  { id:'payroll',    label:'💼 Payroll Engine',           dur:4000 },
  { id:'exam',       label:'📈 Exam Summary Report',      dur:3500 },
  { id:'settlement', label:'⚡ One-Click Settlement',     dur:3000 },
];

const GRADES = [
  { g:'Grade 1', n:38, pct:78 }, { g:'Grade 2', n:42, pct:65 },
  { g:'Grade 4', n:32, pct:91 }, { g:'Grade 7', n:28, pct:58 },
  { g:'Grade 9', n:45, pct:84 }, { g:'Grade 12', n:22, pct:72 },
];
const STAFF = [
  { name:'J. Kamau',  role:'Teacher', gross:45000, ded:6750  },
  { name:'A. Wanjiru',role:'Teacher', gross:42000, ded:6300  },
  { name:'M. Otieno', role:'Support', gross:25000, ded:3750  },
  { name:'P. Njeri',  role:'Principal',gross:80000,ded:12000 },
];

export default function StaffDemoPage() {
  const [si, setSi]       = useState(0);
  const [prog, setProg]   = useState(0);
  const [playing, setPlaying] = useState(true);

  // Animated state
  const [revCount, setRevCount]   = useState(0);
  const [barWidths, setBarWidths] = useState(GRADES.map(() => 0));
  const [learnerRows, setLearnerRows] = useState(0);
  const [staffRows, setStaffRows]     = useState(0);
  const [disbursed, setDisbursed]     = useState(false);
  const [examBars, setExamBars]       = useState(GRADES.map(() => 0));
  const [settled, setSettled]         = useState(false);

  function reset() {
    setRevCount(0); setBarWidths(GRADES.map(()=>0));
    setLearnerRows(0); setStaffRows(0); setDisbursed(false);
    setExamBars(GRADES.map(()=>0)); setSettled(false);
  }

  useEffect(() => {
    if (!playing) return;
    const dur = SCENES[si].dur;
    const step = 50;
    const increment = (step / dur) * 100;

    const iv = setInterval(() => {
      setProg(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(iv);
          reset();
          setSi(p => (p + 1) % SCENES.length);
          return 0;
        }
        return next;
      });
    }, step);
    return () => clearInterval(iv);
  }, [si, playing]);

  useEffect(() => {
    if (!playing) return;
  useEffect(() => {
    if (si === 0) {
      const target = 3200000;
      setRevCount(Math.floor((prog / 100) * target));
      if (prog > 20) {
        setBarWidths(GRADES.map((g, i) => {
          const delay = i * 10;
          return prog > 20 + delay ? g.pct : 0;
        }));
      }
    }
    if (si === 1) {
      setLearnerRows(Math.floor((prog / 100) * 7));
    }
    if (si === 2) {
      setStaffRows(Math.floor((prog / 100) * (STAFF.length + 1)));
      if (prog > 85) setDisbursed(true);
    }
    if (si === 3) {
      if (prog > 10) {
        setExamBars(GRADES.map((g, i) => {
          const delay = i * 8;
          return prog > 10 + delay ? (55 + (i * 7) % 35) : 0;
        }));
      }
    }
    if (si === 4) {
      if (prog > 40) setSettled(true);
    }
  }, [si, prog]);
  }, [si, playing]);

  function jump(i) { reset(); setProg(0); setSi(i); }

  const SAMPLE_LEARNERS = [
    { adm:'2024001', name:'Alice Mwangi',  grade:'Grade 4', sex:'F' },
    { adm:'2024002', name:'Brian Otieno',  grade:'Grade 4', sex:'M' },
    { adm:'2024003', name:'Carol Njeri',   grade:'Grade 7', sex:'F' },
    { adm:'2023041', name:'David Kamau',   grade:'Grade 9', sex:'M' },
    { adm:'2024099', name:'Eve Wanjiku',   grade:'Grade 1', sex:'F' },
    { adm:'2023012', name:'Frank Ochieng', grade:'Grade 12',sex:'M' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#030712', fontFamily:'Sora, sans-serif', color:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 24px', display:'flex', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <Link href="/demo" style={{ color:'rgba(255,255,255,.4)', fontSize:13, fontWeight:700, textDecoration:'none' }}>← Demo Hub</Link>
        <div style={{ marginLeft:'auto', padding:'4px 14px', borderRadius:99, background:'rgba(139,92,246,.15)', border:'1px solid rgba(139,92,246,.3)', fontSize:12, fontWeight:800, color:'#c4b5fd' }}>🏢 Admin & Staff Demo</div>
      </div>

      <div style={{ flex:1, maxWidth:1060, margin:'0 auto', width:'100%', padding:'28px 24px 40px', display:'flex', flexDirection:'column', gap:24 }}>
        <div className="demo-fup" key={`t${si}`} style={{ textAlign:'center' }}>
          <div style={{ fontSize:'clamp(22px,4vw,38px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:6 }}>{SCENES[si].label}</div>
          <div style={{ color:'rgba(255,255,255,.35)', fontSize:13, fontWeight:600 }}>Scene {si+1} of {SCENES.length} · {playing ? 'auto-playing' : 'paused'}</div>
        </div>

        <div className="demo-canvas-wrap">
          <div className="demo-browser-bar">
            {['#ef4444','#f59e0b','#10b981'].map(c=><div key={c} className="demo-dot" style={{ background:c }} />)}
            <div className="demo-url-bar">app.eduvantage.co.ke/admin — EduVantage Global School · Admin Panel</div>
          </div>

          <div style={{ padding:'22px', minHeight:360 }} key={`s${si}`}>
            {si === 0 && (
              <div className="demo-fup">
                <div style={{ fontSize:13, fontWeight:900, color:'#818cf8', marginBottom:4 }}>EduVantage Global School</div>
                <div style={{ fontSize:11,fontWeight:800,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:16 }}>📊 Revenue Integrity Dashboard</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24 }}>
                  {[
                    { l:'Expected',  v:`KES 4.8M`, c:'#818cf8' },
                    { l:'Collected', v:`KES ${(revCount/1000000).toFixed(1)}M`, c:'#34d399' },
                    { l:'Outstanding',v:'KES 1.6M',c:'#f87171' },
                    { l:'This Month', v:'KES 480K',c:'#fbbf24' },
                  ].map(c=>(
                    <div key={c.l} style={{ padding:'14px',borderRadius:12,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',textAlign:'center' }}>
                      <div style={{ fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',marginBottom:6 }}>{c.l}</div>
                      <div style={{ fontSize:18,fontWeight:900,color:c.c }}>{c.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:10,color:'#64748b',fontWeight:800,textTransform:'uppercase',marginBottom:12 }}>Per-Grade Fee Collection Rate</div>
                {GRADES.map((g,i)=>(
                  <div key={g.g} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:700,marginBottom:4 }}>
                      <span>{g.g}</span>
                      <span style={{ color: g.pct>=80?'#34d399':g.pct>=60?'#fbbf24':'#f87171' }}>{g.pct}%</span>
                    </div>
                    <div style={{ height:7,background:'rgba(255,255,255,.07)',borderRadius:99,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${barWidths[i]}%`,background: g.pct>=80?'#059669':g.pct>=60?'#d97706':'#dc2626',borderRadius:99,transition:'width .8s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {si === 1 && (
              <div className="demo-fup">
                <div style={{ fontSize:11,fontWeight:800,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:16 }}>👥 Learner Registry — 207 enrolled</div>
                <table style={{ borderCollapse:'collapse',width:'100%',fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.1)' }}>
                      {['ADM No.','Full Name','Grade','Sex','Status'].map(h=>(
                        <th key={h} style={{ padding:'7px 10px',textAlign:'left',color:'#64748b',fontWeight:800,fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_LEARNERS.slice(0, learnerRows).map((l,i)=>(
                      <tr key={l.adm} className="demo-slide" style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding:'9px 10px',fontWeight:700,color:'#818cf8' }}>{l.adm}</td>
                        <td style={{ padding:'9px 10px',fontWeight:700 }}>{l.name}</td>
                        <td style={{ padding:'9px 10px',color:'#94a3b8' }}>{l.grade}</td>
                        <td style={{ padding:'9px 10px' }}>{l.sex === 'F' ? '👧 F' : '👦 M'}</td>
                        <td style={{ padding:'9px 10px' }}><span style={{ padding:'2px 8px',borderRadius:8,background:'rgba(16,185,129,.15)',color:'#34d399',fontWeight:800,fontSize:11 }}>Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {si === 2 && (
              <div className="demo-fup">
                <div style={{ fontSize:11,fontWeight:800,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:16 }}>💼 Staff Payroll Dashboard</div>
                <table style={{ borderCollapse:'collapse',width:'100%',fontSize:12,marginBottom:20 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.1)' }}>
                      {['Name','Role','Gross (KES)','Deductions','Net Pay'].map(h=>(
                        <th key={h} style={{ padding:'7px 10px',textAlign:'left',color:'#64748b',fontWeight:800,fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STAFF.slice(0, staffRows).map(s=>(
                      <tr key={s.name} className="demo-slide" style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding:'9px 10px',fontWeight:700 }}>{s.name}</td>
                        <td style={{ padding:'9px 10px',color:'#94a3b8' }}>{s.role}</td>
                        <td style={{ padding:'9px 10px',fontWeight:800,color:'#60a5fa' }}>{s.gross.toLocaleString()}</td>
                        <td style={{ padding:'9px 10px',color:'#f87171' }}>-{s.ded.toLocaleString()}</td>
                        <td style={{ padding:'9px 10px',fontWeight:900,color:'#34d399' }}>{(s.gross-s.ded).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {disbursed
                  ? <div className="demo-pop" style={{ padding:'14px',borderRadius:12,background:'rgba(16,185,129,.1)',border:'1px solid #10b981',textAlign:'center',fontSize:14,fontWeight:900,color:'#34d399' }}>✅ KES 163,200 disbursed via B2C!</div>
                  : staffRows >= STAFF.length && <div className="demo-pulse demo-pop" style={{ padding:'14px',borderRadius:12,background:'rgba(99,102,241,.15)',border:'1px solid #6366f1',textAlign:'center',fontSize:14,fontWeight:900,color:'#a5b4fc' }}>⚡ Disburse All (B2C) — One Click</div>
                }
              </div>
            )}

            {si === 3 && (
              <div className="demo-fup">
                <div style={{ fontSize:11,fontWeight:800,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:16 }}>📈 School-Wide Exam Summary</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20 }}>
                  {[['207','Total Learners','#818cf8'],['72.4%','School Mean','#34d399'],['ME','Mean Level','#fbbf24']].map(([v,l,c])=>(
                    <div key={l} style={{ padding:'14px',borderRadius:12,background:'rgba(255,255,255,.04)',textAlign:'center' }}>
                      <div style={{ fontSize:24,fontWeight:900,color:c }}>{v}</div>
                      <div style={{ fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',marginTop:4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {GRADES.map((g,i)=>(
                  <div key={g.g} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:700,marginBottom:4 }}>
                      <span>{g.g}</span>
                      <span style={{ color:'#60a5fa' }}>{examBars[i]>0?examBars[i].toFixed(1)+'%':'—'}</span>
                    </div>
                    <div style={{ height:8,background:'rgba(255,255,255,.07)',borderRadius:99,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${examBars[i]}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:99,transition:'width .9s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {si === 4 && (
              <div className="demo-fup" style={{ display:'flex',flexDirection:'column',alignItems:'center',paddingTop:20,gap:20 }}>
                <div style={{ fontSize:11,fontWeight:800,color:'#475569',textTransform:'uppercase',letterSpacing:1 }}>⚡ B2C Settlement — May Collection</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,width:'100%' }}>
                  {[
                    { l:'Total Collected', v:'KES 3,200,000', c:'#34d399' },
                    { l:'Net to Disburse', v:'KES 3,187,600', c:'#818cf8' },
                  ].map(r=>(
                    <div key={r.l} style={{ padding:'14px',borderRadius:12,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)' }}>
                      <div style={{ fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',marginBottom:6 }}>{r.l}</div>
                      <div style={{ fontSize:16,fontWeight:900,color:r.c }}>{r.v}</div>
                    </div>
                  ))}
                </div>
                {!settled
                  ? <div className="demo-pulse demo-pop" style={{ padding:'16px 40px',borderRadius:99,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',fontSize:16,fontWeight:900,boxShadow:'0 20px 40px rgba(99,102,241,.4)' }}>⚡ Settle to KCB Bank Now</div>
                  : <div className="demo-pop" style={{ padding:'20px 40px',borderRadius:20,background:'rgba(16,185,129,.1)',border:'2px solid #10b981',textAlign:'center' }}>
                      <div style={{ fontSize:40,marginBottom:8 }}>✅</div>
                      <div style={{ fontSize:18,fontWeight:900,color:'#34d399' }}>KES 3,187,600 Settled!</div>
                    </div>
                }
              </div>
            )}
          </div>

          <div style={{ height:3,background:'rgba(255,255,255,.06)' }}>
            <div style={{ height:'100%',background:'linear-gradient(90deg,#8b5cf6,#6366f1)',width:`${prog}%`,transition:'width .05s linear' }} />
          </div>
        </div>

        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16 }}>
          <button className="demo-btn" onClick={()=>setPlaying(p=>!p)}>{playing?'⏸ Pause':'▶ Play'}</button>
          <div style={{ display:'flex',gap:12 }}>
            {SCENES.map((_,i)=><button key={i} className={`demo-scene-dot ${i===si?'active':''}`} onClick={()=>jump(i)} />)}
          </div>
          <button className="demo-btn" onClick={()=>jump(0)}>↺ Replay</button>
        </div>

        <div style={{ textAlign:'center', marginTop:8 }}>
          <Link href="/saas/signup" style={{ display:'inline-block',background:'linear-gradient(135deg,#8b5cf6,#6366f1)',color:'#fff',padding:'13px 40px',borderRadius:99,fontWeight:800,fontSize:15,textDecoration:'none',boxShadow:'0 16px 40px rgba(139,92,246,.4)' }}>Onboard My School →</Link>
        </div>
      </div>
    </div>
  );
}
