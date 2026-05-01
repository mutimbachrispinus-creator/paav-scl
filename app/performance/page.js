'use client';
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES, gInfo, DEFAULT_SUBJECTS, buildMeritList, getMark } from '@/lib/cbe';

const M = '#8B1A1A', M2 = '#6B1212', ML = '#FDF2F2', MB = '#F5E6E6';
const ASSESS_LABELS = { op1: 'Opener', mt1: 'Mid-Term', et1: 'End-Term' };
const LV_COLORS = {
  EE1:{ bg:'#D1FAE5', c:'#065F46' }, EE2:{ bg:'#A7F3D0', c:'#059669' },
  ME1:{ bg:'#BFDBFE', c:'#1D4ED8' }, ME2:{ bg:'#DBEAFE', c:'#2563EB' },
  AE1:{ bg:'#FDE68A', c:'#B45309' }, AE2:{ bg:'#FEF3C7', c:'#92400E' },
  BE1:{ bg:'#FEE2E2', c:'#DC2626' }, BE2:{ bg:'#FCA5A5', c:'#991B1B' },
  EE:{ bg:'#D1FAE5', c:'#065F46' }, ME:{ bg:'#BFDBFE', c:'#1D4ED8' },
  AE:{ bg:'#FDE68A', c:'#B45309' }, BE:{ bg:'#FEE2E2', c:'#DC2626' },
};

function LvBadge({ lv }) {
  const s = LV_COLORS[lv] || { bg:'#F1F5F9', c:'#64748B' };
  return <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:800, background:s.bg, color:s.c }}>{lv}</span>;
}

export default function PerformancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [marks, setMarks] = useState({});
  const [gradCfg, setGradCfg] = useState(null);
  const [subjCfg, setSubjCfg] = useState({});
  const [term, setTerm] = useState('T1');
  const [assess, setAssess] = useState('et1');
  const [grade, setGrade] = useState('GRADE 7');
  const [tab, setTab] = useState('class');

  useEffect(() => {
    async function load() {
      try {
        const [ar, dr] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ requests:[
              {type:'get',key:'paav6_learners'},{type:'get',key:'paav6_marks'},
              {type:'get',key:'paav8_subj'},{type:'get',key:'paav8_grad'},
            ]})
          })
        ]);
        const auth = await ar.json();
        if (!auth.ok) { router.push('/'); return; }
        const db = await dr.json();
        setLearners(db.results[0]?.value||[]);
        setMarks(db.results[1]?.value||{});
        setSubjCfg(db.results[2]?.value||{});
        setGradCfg(db.results[3]?.value||null);
      } catch(e){ console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [router]);

  const subjects = useMemo(() =>
    (subjCfg[grade]?.length>0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade]||[]),
  [subjCfg,grade]);

  const gradeData = useMemo(() => {
    const gl = learners.filter(l=>l.grade===grade);
    return gl.map(l => {
      let totalPts=0, totalScore=0, count=0;
      const detail = subjects.map(s => {
        const score = getMark(marks, term, grade, s, assess, l.adm);
        if (score !== null) {
          const info = gInfo(score, grade, gradCfg);
          totalPts += info.pts;
          totalScore += score;
          count++;
          return { s, score, lv: info.lv, ...info };
        }
        return { s, score: null, lv: '—' };
      });
      return {...l,totalPts,totalScore,count,avgScore:count?Math.round(totalScore/count):0,detail};
    }).filter(l=>l.count>0).sort((a,b)=>b.totalPts-a.totalPts).map((l,i)=>({...l,rank:i+1}));
  },[learners,marks,grade,term,assess,subjects,gradCfg]);

  // Most improved: compare two assessments
  const improved = useMemo(() => {
    if (assess==='op1') return [];
    const prev = assess==='mt1'?'op1':'mt1';
    const gl = learners.filter(l=>l.grade===grade);
    return gl.map(l => {
      let cur=0,old=0,cc=0,oc=0;
      subjects.forEach(s => {
        const cs = getMark(marks, term, grade, s, assess, l.adm);
        const os = getMark(marks, term, grade, s, prev, l.adm);
        if (cs !== null) { cur += cs; cc++; }
        if (os !== null) { old += os; oc++; }
      });
      const curAvg=cc?Math.round(cur/cc):0, oldAvg=oc?Math.round(old/oc):0;
      return {...l,curAvg,oldAvg,diff:curAvg-oldAvg};
    }).filter(l=>l.curAvg>0).sort((a,b)=>b.diff-a.diff).slice(0,5);
  },[learners,marks,grade,term,assess,subjects]);

  // Level distribution
  const levelDist = useMemo(() => {
    const dist={};
    gradeData.forEach(l=>l.detail.forEach(d=>{
      if(d.lv&&d.lv!=='—') dist[d.lv]=(dist[d.lv]||0)+1;
    }));
    return dist;
  },[gradeData]);

  // Subject stats
  const subjectStats = useMemo(() => subjects.map(s=>{
    let tot=0,cnt=0;
    learners.filter(l => l.grade === grade).forEach(l => {
      const sc = getMark(marks, term, grade, s, assess, l.adm);
      if (sc !== null) { tot += sc; cnt++; }
    });
    const avg=cnt?Math.round(tot/cnt):0;
    const info=avg?gInfo(avg,grade,gradCfg):{lv:'—'};
    return {name:s,avg,count:cnt,lv:info.lv};
  }).sort((a,b)=>b.avg-a.avg),[learners,marks,grade,term,assess,subjects,gradCfg]);

  // School-wide comparison
  const schoolStats = useMemo(() => ALL_GRADES.map(g=>{
    const gl=learners.filter(l=>l.grade===g);
    const subs=(subjCfg[g]?.length>0)?subjCfg[g]:(DEFAULT_SUBJECTS[g]||[]);
    let tot=0,cnt=0;
    gl.forEach(l => subs.forEach(s => {
      const sc = getMark(marks, term, g, s, assess, l.adm);
      if (sc !== null) { tot += sc; cnt++; }
    }));
    return {grade:g,count:gl.length,avg:cnt?Math.round(tot/cnt):0,entries:cnt};
  }),[learners,marks,subjCfg,term,assess]);

  if (loading) return <div className="page on" style={{padding:60,textAlign:'center',color:'var(--muted)'}}>📊 Loading analytics…</div>;

  const TABS=[
    {id:'class',label:'🏆 Class Detail'},
    {id:'subjects',label:'📚 Subjects'},
    {id:'improved',label:'📈 Most Improved'},
    {id:'school',label:'🏫 School-Wide'},
    {id:'levels',label:'📊 Level Dist.'},
    {id:'trends',label:'📈 Long-Term Trends'},
  ];

  return (
    <div className="page on">
      {/* Header */}
      <div className="page-hdr" style={{borderBottom:`3px solid ${MB}`,paddingBottom:16,marginBottom:20}}>
        <div>
          <h2 style={{color:M}}>📈 Performance Analytics</h2>
          <p style={{color:'var(--muted)'}}>Deep academic insights — {grade} · {ASSESS_LABELS[assess]} · Term {term.replace('T','')}</p>
        </div>
        <div className="page-hdr-acts">
          <select value={grade} onChange={e=>setGrade(e.target.value)} style={{borderRadius:8,padding:'7px 10px',border:`2px solid ${MB}`,fontSize:12,outline:'none',color:M,fontWeight:700}}>
            {ALL_GRADES.map(g=><option key={g}>{g}</option>)}
          </select>
          <select value={term} onChange={e=>setTerm(e.target.value)} style={{borderRadius:8,padding:'7px 10px',border:`2px solid ${MB}`,fontSize:12,outline:'none'}}>
            <option value="T1">Term 1</option><option value="T2">Term 2</option><option value="T3">Term 3</option>
          </select>
          <select value={assess} onChange={e=>setAssess(e.target.value)} style={{borderRadius:8,padding:'7px 10px',border:`2px solid ${MB}`,fontSize:12,outline:'none'}}>
            <option value="op1">Opener</option><option value="mt1">Mid-Term</option><option value="et1">End-Term</option>
          </select>
          <button className="btn btn-ghost btn-sm no-print" onClick={()=>window.print()}>🖨️ Print</button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="sg sg4" style={{marginBottom:20}}>
        {[
          {icon:'🎓',label:'In Class',val:learners.filter(l=>l.grade===grade).length,bg:'#EFF6FF'},
          {icon:'📝',label:'With Marks',val:gradeData.length,bg:ML},
          {icon:'📊',label:'Class Avg',val:`${gradeData.length?Math.round(gradeData.reduce((s,l)=>s+l.avgScore,0)/gradeData.length):0}%`,bg:'#ECFDF5'},
          {icon:'🥇',label:'Top Score',val:gradeData[0]?`${gradeData[0].avgScore}%`:'—',bg:'#FFFBEB'},
        ].map(c=>(
          <div key={c.label} className="stat-card" style={{borderTop:`4px solid ${M}`}}>
            <div className="sc-inner">
              <div className="sc-icon" style={{background:c.bg,fontSize:22}}>{c.icon}</div>
              <div><div className="sc-n" style={{color:M}}>{c.val}</div><div className="sc-l">{c.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:20,background:MB,borderRadius:10,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' on':''}`}
            style={tab===t.id?{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff',boxShadow:`0 2px 10px rgba(139,26,26,.3)`}:{}}
            onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* CLASS DETAIL TAB */}
      {tab==='class' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>🏆 {grade} — {ASSESS_LABELS[assess]} Rankings ({gradeData.length} learners)</h3>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead style={{background:ML}}>
                <tr>
                  <th style={{color:M}}>Rank</th><th style={{color:M}}>Adm</th><th style={{color:M}}>Name</th>
                  {subjects.map(s=><th key={s} style={{textAlign:'center',fontSize:9,color:M}} title={s}>{s.slice(0,6)}…</th>)}
                  <th style={{textAlign:'center',color:M}}>Total Pts</th>
                  <th style={{textAlign:'center',color:M}}>Avg %</th>
                  <th style={{textAlign:'center',color:M}}>Level</th>
                </tr>
              </thead>
              <tbody>
                {gradeData.map(l=>{
                  const overallInfo = l.avgScore ? gInfo(l.avgScore,grade,gradCfg) : {lv:'—'};
                  return (
                    <tr key={l.adm} style={l.rank<=3?{background:l.rank===1?'#FFFBEB':l.rank===2?'#F8FAFC':'#FFF7F0'}:{}}>
                      <td style={{fontWeight:800,fontSize:15,color:l.rank===1?'#D97706':l.rank===2?'#475569':l.rank===3?'#C2410C':'var(--navy)'}}>
                        {l.rank===1?'🥇':l.rank===2?'🥈':l.rank===3?'🥉':`#${l.rank}`}
                      </td>
                      <td style={{fontFamily:'monospace',fontSize:11}}>{l.adm}</td>
                      <td style={{fontWeight:600}}>{l.name}</td>
                      {l.detail.map(d=>(
                        <td key={d.s} style={{textAlign:'center',padding:'4px 2px'}}>
                          {d.score!==null?(
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                              <span style={{fontWeight:700,fontSize:12}}>{d.score}</span>
                              <LvBadge lv={d.lv} />
                            </div>
                          ):'—'}
                        </td>
                      ))}
                      <td style={{textAlign:'center',fontWeight:800,fontSize:15,color:M}}>{l.totalPts}</td>
                      <td style={{textAlign:'center',fontWeight:700,color:l.avgScore>=50?'#059669':'#DC2626'}}>{l.avgScore}%</td>
                      <td style={{textAlign:'center'}}><LvBadge lv={overallInfo.lv} /></td>
                    </tr>
                  );
                })}
                {gradeData.length===0&&<tr><td colSpan={subjects.length+7} style={{textAlign:'center',padding:30,color:'var(--muted)'}}>No marks entered yet for {grade} — {ASSESS_LABELS[assess]}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBJECT TAB */}
      {tab==='subjects' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>📚 {grade} Subject Performance — {ASSESS_LABELS[assess]}</h3>
          </div>
          <div className="panel-body">
            {subjectStats.map((s,i)=>{
              const pct = s.avg;
              const barColor = pct>=70?'#059669':pct>=50?'#2563EB':pct>=30?'#D97706':'#DC2626';
              return (
                <div key={s.name} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{background:ML,color:M,fontWeight:800,fontSize:11,padding:'2px 8px',borderRadius:20}}>#{i+1}</span>
                      <span style={{fontWeight:700,fontSize:13}}>{s.name}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,color:'var(--muted)'}}>{s.count} learners</span>
                      <LvBadge lv={s.lv} />
                      <span style={{fontWeight:800,fontSize:14,color:barColor}}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{height:12,background:'#F1F5F9',borderRadius:6,overflow:'hidden'}}>
                    <div style={{width:`${Math.max(pct,2)}%`,height:'100%',background:`linear-gradient(90deg,${barColor},${barColor}cc)`,borderRadius:6,transition:'width .5s ease'}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MOST IMPROVED TAB */}
      {tab==='improved' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>📈 Most Improved — {grade} ({ASSESS_LABELS[assess]} vs previous)</h3>
          </div>
          <div className="panel-body">
            {improved.length===0?(
              <div style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
                {assess==='op1'?'Select Mid-Term or End-Term to see improvement':'No comparison data available'}
              </div>
            ):(
              improved.map((l,i)=>(
                <div key={l.adm} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${MB}`}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:i===0?'#FEF3C7':ML,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                    {i===0?'🚀':i===1?'⬆️':'📈'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{l.name}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>{l.adm} · {l.grade}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'var(--muted)'}}>Before: {l.oldAvg}% → Now: {l.curAvg}%</div>
                    <div style={{fontWeight:900,fontSize:16,color:l.diff>0?'#059669':'#DC2626'}}>
                      {l.diff>0?'+':''}{l.diff}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SCHOOL-WIDE TAB */}
      {tab==='school' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>🏫 School-Wide Comparison — {ASSESS_LABELS[assess]}</h3>
          </div>
          <div className="panel-body">
            {schoolStats.map(g=>{
              const barColor = g.avg>=70?'#059669':g.avg>=50?'#2563EB':g.avg>=30?'#D97706':'#DC2626';
              const info = g.avg ? gInfo(g.avg,g.grade,gradCfg) : {lv:'—'};
              return (
                <div key={g.grade} onClick={()=>setGrade(g.grade)} style={{cursor:'pointer',marginBottom:12,padding:'8px 10px',borderRadius:10,background:g.grade===grade?ML:'#FAFBFF',border:`1.5px solid ${g.grade===grade?M:MB}`,transition:'all .2s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <span style={{fontWeight:700,fontSize:12,color:g.grade===grade?M:'var(--navy)'}}>{g.grade}</span>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{fontSize:10,color:'var(--muted)'}}>{g.count} learners · {g.entries} entries</span>
                      <LvBadge lv={info.lv} />
                      <span style={{fontWeight:800,color:barColor}}>{g.avg}%</span>
                    </div>
                  </div>
                  <div style={{height:8,background:'#F1F5F9',borderRadius:4,overflow:'hidden'}}>
                    <div style={{width:`${Math.max(g.avg,1)}%`,height:'100%',background:barColor,borderRadius:4}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL DISTRIBUTION TAB */}
      {tab==='levels' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>📊 Level Distribution — {grade} · {ASSESS_LABELS[assess]}</h3>
          </div>
          <div className="panel-body">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
              {Object.entries(levelDist).sort((a,b)=>b[1]-a[1]).map(([lv,cnt])=>{
                const s=LV_COLORS[lv]||{bg:'#F1F5F9',c:'#64748B'};
                const pct=gradeData.length*subjects.length?Math.round(cnt/(gradeData.length*subjects.length)*100):0;
                return (
                  <div key={lv} style={{padding:'14px 16px',borderRadius:12,background:s.bg,border:`2px solid ${s.c}22`,textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:900,color:s.c}}>{lv}</div>
                    <div style={{fontSize:28,fontWeight:900,color:s.c,lineHeight:1.1}}>{cnt}</div>
                    <div style={{fontSize:10,color:s.c,opacity:.8}}>entries · {pct}%</div>
                    <div style={{marginTop:6,height:4,background:`${s.c}22`,borderRadius:2,overflow:'hidden'}}>
                      <div style={{width:`${pct}%`,height:'100%',background:s.c,borderRadius:2}} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(levelDist).length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--muted)'}}>No marks data available</div>}
            </div>
          </div>
        </div>
      )}
      {/* TRENDS TAB */}
      {tab==='trends' && (
        <div className="panel" style={{border:`1.5px solid ${MB}`}}>
          <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},${M2})`,color:'#fff'}}>
            <h3 style={{color:'#fff'}}>📈 {grade} Performance Trends (Termly Comparison)</h3>
          </div>
          <div className="panel-body">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:20}}>
              {['T1','T2','T3'].map(t => {
                const termAvg = (assessKey) => {
                  let tot=0, cnt=0;
                  learners.filter(l => l.grade === grade).forEach(l => {
                    subjects.forEach(s => {
                      const sc = getMark(marks, t, grade, s, assessKey, l.adm);
                      if (sc !== null) { tot += sc; cnt++; }
                    });
                  });
                  return cnt ? Math.round(tot/cnt) : 0;
                };

                const op = termAvg('op1');
                const mt = termAvg('mt1');
                const et = termAvg('et1');

                return (
                  <div key={t} className="panel" style={{padding:15, background:'#f8fafc', borderRadius:12}}>
                    <h4 style={{textAlign:'center', marginBottom:15, color:M}}>Term {t.replace('T','')}</h4>
                    <div style={{display:'flex', alignItems:'flex-end', gap:10, height:120, padding:'0 10px'}}>
                      {[
                        {label:'Opener', val:op, color:'#3B82F6'},
                        {label:'Mid', val:mt, color:'#10B981'},
                        {label:'End', val:et, color:'#F59E0B'}
                      ].map(bar => (
                        <div key={bar.label} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                          <div style={{fontSize:12, fontWeight:800, color:bar.color}}>{bar.val}%</div>
                          <div style={{width:'100%', height:`${Math.max(bar.val, 2)}%`, background:bar.color, borderRadius:'4px 4px 0 0'}} />
                          <div style={{fontSize:10, color:'#64748b', textAlign:'center'}}>{bar.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="note-box" style={{marginTop:20, background:ML, color:M, border:`1px solid ${MB}`}}>
              <strong>Zeraki-Style Insight:</strong> {grade} performance is tracked across all terms. Use this trend to identify patterns in academic growth and seasonal performance dips.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
