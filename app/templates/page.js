'use client';
/**
 * app/templates/page.js — Templates & Printables Hub
 *
 * Implements:
 *   • Merit Lists (by grade/stream)
 *   • Report Cards (batch printable)
 *   • Class Lists
 *   • Fee Receipts
 *   • Student IDs
 *
 * All templates include the school logo and are optimized for printing.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { ALL_GRADES, gInfo, DEFAULT_SUBJECTS, maxPts, calcLearnerReportData, getMark } from '@/lib/cbe';

const LOGO = "data:image/jpeg;base64,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_NAV_";

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('merit');
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [marks, setMarks] = useState({});
  const [subjCfg, setSubjCfg] = useState({});
  const [fees, setFees] = useState([]);
  const [att, setAtt] = useState({});
  const [feeCfg, setFeeCfg] = useState({});
  const [gradCfg, setGradCfg] = useState(null);
  const [grade, setGrade] = useState('GRADE 7');
  const [term, setTerm] = useState('T1');
  const [assess, setAssess] = useState('et1');
  const [selLearner, setSelLearner] = useState('');
  const [regType, setRegType] = useState('monthly');

  useEffect(() => {
    async function load() {
      try {
        const auth = await getCachedUser();
        if (!auth) { router.push('/'); return; }
        setUser(auth);
        
        const db = await getCachedDBMulti([
          'paav6_learners', 'paav6_marks', 'paav8_subj', 'paav6_fees', 'paav8_grad', 'paav6_paylog', 'paav6_feecfg', 'paav_student_attendance'
        ]);
        
        setLearners(db.paav6_learners || []);
        setMarks(db.paav6_marks || {});
        setSubjCfg(db.paav8_subj || {});
        setGradCfg(db.paav8_grad || null);
        setFeeCfg(db.paav6_feecfg || {});
        
        const feeList = db.paav6_fees || [];
        const paylogList = db.paav6_paylog || [];
        setFees([...feeList, ...paylogList]);
        setAtt(db.paav_student_attendance || {});
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const filteredLearners = useMemo(() => {
    let list = learners.filter(l => l.grade === grade);
    if (selLearner) list = list.filter(l => l.adm === selLearner);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [learners, grade, selLearner]);

  const allGradeLearners = useMemo(() =>
    learners.filter(l => l.grade === grade).sort((a,b) => a.name.localeCompare(b.name)),
  [learners, grade]);

  const subjects = useMemo(() =>
    (subjCfg[grade] && subjCfg[grade].length > 0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade] || []),
  [subjCfg, grade]);

  function triggerPrint(landscape) {
    const style = document.createElement('style');
    style.innerHTML = landscape ? '@page { size: A4 landscape; margin: 8mm; }' : '@page { size: A4 portrait; margin: 8mm; }';
    document.head.appendChild(style);
    
    if (landscape) document.body.classList.add('print-landscape');
    else document.body.classList.remove('print-landscape');
    
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-landscape');
      style.remove();
    }, 150);
  }

  function printGrade() {
    setSelLearner('');
    const landscape = tab === 'merit' || tab === 'class' || tab === 'balance' || tab === 'register';
    triggerPrint(landscape);
  }
  function printLearner() {
    if (!selLearner) { alert('Please select a learner first'); return; }
    const landscape = tab === 'merit' || tab === 'class' || tab === 'balance' || tab === 'register';
    triggerPrint(landscape);
  }

  const TABS = [
    { id: 'merit',   label: '🏆 Merit List' },
    { id: 'report',  label: '📋 Report Cards' },
    { id: 'class',   label: '🏫 Class List' },
    { id: 'balance', label: '📊 Fee Balance List' },
    { id: 'receipt', label: '💰 Fee Receipts' },
    { id: 'id',      label: '🆔 Student IDs' },
    { id: 'register',label: '📅 Attendance Register' },
  ];

  if (loading || !user) return <div className="page on"><p style={{padding:40,color:'var(--muted)'}}>Loading templates…</p></div>;

  return (
    <div className="page on" id="pg-templates">
      <div className="page-hdr no-print">
        <div>
          <h2>📄 Report Templates</h2>
          <p>Printable assets — {grade} · Term {term.replace('T','')}</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm" onClick={printLearner}>🖨️ Print Learner</button>
          <button className="btn btn-primary btn-sm" onClick={printGrade}>🖨️ Print Whole Grade</button>
        </div>
      </div>

      <div className="tabs no-print" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`tab-btn ${tab === t.id ? 'on' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel no-print" style={{ marginBottom: 16 }}>
        <div className="panel-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Grade</label>
            <select value={grade} onChange={e => { setGrade(e.target.value); setSelLearner(''); }}>
              {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)}>
              <option value="T1">Term 1</option>
              <option value="T2">Term 2</option>
              <option value="T3">Term 3</option>
            </select>
          </div>
          {tab === 'merit' && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Assessment</label>
              <select value={assess} onChange={e => setAssess(e.target.value)}>
                <option value="op1">Opener</option>
                <option value="mt1">Mid-Term</option>
                <option value="et1">End-Term</option>
              </select>
            </div>
          )}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Learner</label>
            <select value={selLearner} onChange={e => setSelLearner(e.target.value)}>
              <option value="">— ALL ({allGradeLearners.length}) —</option>
              {allGradeLearners.map(l => <option key={l.adm} value={l.adm}>{l.name} ({l.adm})</option>)}
            </select>
          </div>
          {tab === 'register' && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Period</label>
              <select value={regType} onChange={e => setRegType(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="termly">Termly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
            <button className="btn btn-ghost btn-sm" onClick={printLearner}>🖨️ By Learner</button>
            <button className="btn btn-gold btn-sm" onClick={printGrade}>🖨️ By Grade</button>
          </div>
        </div>
      </div>

      {/* Instant tab switching — all tabs rendered, only active is shown */}
      <div className="print-container">
        <div style={{ display: tab === 'merit'   ? 'block' : 'none' }}>
          <MeritListTemplate learners={filteredLearners} subjects={subjects} marks={marks} grade={grade} term={term} assess={assess} gradCfg={gradCfg} />
        </div>
        <div style={{ display: tab === 'report'  ? 'block' : 'none' }}>
          <ReportCardTemplate learners={filteredLearners} subjects={subjects} marks={marks} grade={grade} term={term} gradCfg={gradCfg} />
        </div>
        <div style={{ display: tab === 'class'   ? 'block' : 'none' }}>
          <ClassListTemplate learners={filteredLearners} grade={grade} />
        </div>
        <div style={{ display: tab === 'balance' ? 'block' : 'none' }}>
          <FeeBalanceListTemplate learners={filteredLearners} fees={fees} grade={grade} feeCfg={feeCfg} />
        </div>
        <div style={{ display: tab === 'receipt' ? 'block' : 'none' }}>
          <ReceiptTemplate learners={filteredLearners} fees={fees} grade={grade} selLearner={selLearner} feeCfg={feeCfg} />
        </div>
        <div style={{ display: tab === 'id'      ? 'block' : 'none' }}>
          <IDCardTemplate learners={filteredLearners} grade={grade} />
        </div>
        <div style={{ display: tab === 'register'? 'block' : 'none' }}>
          <AttendanceRegisterTemplate learners={filteredLearners} grade={grade} type={regType} att={att} />
        </div>
      </div>
    </div>
  );
}

/* ── SUB-COMPONENTS ── */

function PrintHeader({ title, grade }) {
  return (
    <div style={{ textAlign: 'center', borderBottom: '3px double #8B1A1A', paddingBottom: 12, marginBottom: 16 }}>
      {/* School logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="PAAV Logo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'contain', margin: '0 auto 8px', border: '2px solid #D97706', background: '#fff', padding: 4 }} />
      <h1 style={{ fontFamily: 'Sora', fontSize: 17, fontWeight: 800, color: '#8B1A1A', margin: 0 }}>PAAV-GITOMBO COMMUNITY SCHOOL</h1>
      <p style={{ fontSize: 10, margin: '2px 0', color: '#555' }}>P.O BOX 4091-00100 Nairobi | 0758 922 915 | paavgitomboschool@gmail.com</p>
      <p style={{ fontSize: 10, fontStyle: 'italic', color: '#D97706', fontWeight: 700, margin: '2px 0' }}>✝ More Than Academics!</p>
      <div style={{ background: '#8B1A1A', color: '#fff', display: 'inline-block', padding: '3px 16px', borderRadius: 4, marginTop: 6, fontWeight: 700, fontSize: 12 }}>
        {title} — {grade}
      </div>
    </div>
  );
}

function MeritListTemplate({ learners, subjects, marks, grade, term, assess, gradCfg }) {
  const data = learners.map(l => {
    let total = 0;
    let totalMarks = 0;
    let count = 0;
    subjects.forEach(s => {
      const score = getMark(marks, term, grade, s, assess, l.adm);
      if (score !== null) {
        total += gInfo(score, grade).pts;
        totalMarks += score;
        count++;
      }
    });
    return { ...l, total, totalMarks, count, avg: count > 0 ? (total / (subjects.length * (grade.includes('GRADE 7') || grade.includes('GRADE 8') || grade.includes('GRADE 9') || grade.includes('GRADE 1') ? (grade.includes('GRADE 10')||grade.includes('GRADE 11')||grade.includes('GRADE 12')?8:8) : 4)) * 100).toFixed(1) : 0 };
  }).sort((a, b) => b.total - a.total);

  const colStats = subjects.map(s => {
    let sum = 0;
    let count = 0;
    data.forEach(l => {
      const score = getMark(marks, term, grade, s, assess, l.adm);
      if (score !== null) {
        sum += score;
        count++;
      }
    });
    const avgScore = count > 0 ? Math.round(sum / count) : null;
    const avgInfo = avgScore !== null ? gInfo(avgScore, grade, gradCfg) : null;
    return { avgScore, avgInfo };
  });

  const totalPtsSum = data.reduce((acc, l) => acc + l.total, 0);
  const totalAvgPts = data.length > 0 ? Math.round(totalPtsSum / data.length) : 0;
  const totalMarksSum = data.reduce((acc, l) => acc + l.totalMarks, 0);
  const totalAvgMarks = data.length > 0 ? Math.round(totalMarksSum / data.length) : 0;
  const avgPct = data.length > 0 ? (data.reduce((acc, l) => acc + parseFloat(l.avg), 0) / data.length).toFixed(1) : 0;

  return (
    <div>
      <PrintHeader title="MERIT LIST" grade={grade} />
      <div style={{ textAlign: 'center', marginBottom: 15, fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1 }}>
        TERM {term.replace('T','')} — {assess === 'op1' ? 'OPENER' : assess === 'mt1' ? 'MID-TERM' : 'END-TERM'} EXAMINATION
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>Pos</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>ADM</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Name</th>
            {subjects.map(s => <th key={s} style={{ border: '1px solid #ddd', padding: 8, fontSize: 9, textAlign: 'center' }}>{s.slice(0,5)}</th>)}
            <th style={{ border: '1px solid #ddd', padding: 8, color: '#8B1A1A', textAlign: 'center' }}>Total Marks</th>
            <th style={{ border: '1px solid #ddd', padding: 8, color: '#8B1A1A', textAlign: 'center' }}>Total Pts</th>
            <th style={{ border: '1px solid #ddd', padding: 8, color: '#8B1A1A', textAlign: 'center' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l, i) => (
            <tr key={l.adm}>
              <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>{i + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>{l.adm}</td>
              <td style={{ border: '1px solid #ddd', padding: 6 }}>{l.name}</td>
              {subjects.map(s => {
                const score = marks[`${term}:${grade}|${s}|${assess}`]?.[l.adm];
                const info = score !== undefined ? gInfo(Number(score), grade, gradCfg) : null;
                return (
                  <td key={s} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>
                    {score !== undefined ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{score}</span>
                        <span style={{ fontSize: 9, color: info.c, fontWeight: 800 }}>{info.lv}</span>
                      </div>
                    ) : '—'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 700, color: '#059669' }}>{l.totalMarks}</td>
              <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 800, color: 'var(--navy)' }}>{l.total}</td>
              <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>{l.avg}%</td>
            </tr>
          ))}
          {data.length > 0 && (
            <>
              <tr style={{ background: '#f9f9f9', borderTop: '2px solid #8B1A1A' }}>
                <td colSpan={3} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'right', fontWeight: 800 }}>AVERAGE SCORE</td>
                {colStats.map((stat, i) => (
                  <td key={i} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 700 }}>
                    {stat.avgScore !== null ? stat.avgScore : '—'}
                  </td>
                ))}
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 700 }}>{totalAvgMarks}</td>
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>—</td>
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 700 }}>{avgPct}%</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td colSpan={3} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'right', fontWeight: 800 }}>AVERAGE LEVEL</td>
                {colStats.map((stat, i) => (
                  <td key={i} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>
                    {stat.avgInfo ? <span style={{ color: stat.avgInfo.c, fontWeight: 800, fontSize: 10 }}>{stat.avgInfo.lv}</span> : '—'}
                  </td>
                ))}
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>—</td>
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>—</td>
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>—</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td colSpan={3} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'right', fontWeight: 800 }}>AVERAGE POINTS</td>
                {colStats.map((stat, i) => (
                  <td key={i} style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 700 }}>
                    {stat.avgInfo ? stat.avgInfo.pts : '—'}
                  </td>
                ))}
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>—</td>
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center', fontWeight: 800, color: '#8B1A1A' }}>{totalAvgPts}</td>
                <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>—</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportCardTemplate({ learners, subjects, marks, grade, term, gradCfg }) {
  // Pre-calculate ranks based on average points
  const rankedData = learners.map(l => {
    const report = calcLearnerReportData(marks, l.adm, grade, term, subjects, gradCfg);
    return { ...l, report };
  }).sort((a, b) => b.report.totalAvgPts - a.report.totalAvgPts);

  let r = 1;
  for (let i = 0; i < rankedData.length; i++) {
    if (i > 0 && rankedData[i].report.totalAvgPts < rankedData[i - 1].report.totalAvgPts) r = i + 1;
    rankedData[i].rank = r;
  }

  return (
    <div className="rc-batch">
      {rankedData.map(l => (
        <div key={l.adm} className="rc-page" style={{ background: '#FFFDF9', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle watermark or texture could go here */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: 150, color: 'rgba(139, 26, 26, 0.03)', fontWeight: 900, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0 }}>
            PAAV-GITOMBO
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <PrintHeader title="STUDENT PROGRESS REPORT" grade={grade} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 25, border: '1.5px solid #8B1A1A', padding: 15, borderRadius: 8 }}>
            <div><strong>NAME:</strong> {l.name}</div>
            <div><strong>ADM NO:</strong> {l.adm}</div>
            <div><strong>SEX:</strong> {l.sex || '—'}</div>
            <div><strong>GRADE:</strong> {grade}</div>
            <div><strong>TERM:</strong> {term}</div>
            <div><strong>YEAR:</strong> {new Date().getFullYear()}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 25 }}>
            <thead>
              <tr style={{ background: '#8B1A1A', color: '#fff' }}>
                <th style={{ border: '1px solid #333', padding: 10, textAlign: 'left' }}>Subject</th>
                <th style={{ border: '1px solid #333', padding: 10 }}>Opener</th>
                <th style={{ border: '1px solid #333', padding: 10 }}>Mid-Term</th>
                <th style={{ border: '1px solid #333', padding: 10 }}>End-Term</th>
                <th style={{ border: '1px solid #333', padding: 10 }}>Average</th>
                <th style={{ border: '1px solid #333', padding: 10 }}>Level</th>
                <th style={{ border: '1px solid #333', padding: 10 }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {l.report.subjects.map(s => (
                <tr key={s.subj}>
                  <td style={{ border: '1px solid #333', padding: 8, fontWeight: 600 }}>{s.subj}</td>
                  <td style={{ border: '1px solid #333', padding: 8, textAlign: 'center' }}>{s.op || '—'} <small className={`grade-pill-${s.opLv}`} style={{ display: 'inline-block', fontSize: 8, padding: '1px 4px', borderRadius: 3, marginTop: 1 }}>{s.opLv}</small></td>
                  <td style={{ border: '1px solid #333', padding: 8, textAlign: 'center' }}>{s.mt || '—'} <small className={`grade-pill-${s.mtLv}`} style={{ display: 'inline-block', fontSize: 8, padding: '1px 4px', borderRadius: 3, marginTop: 1 }}>{s.mtLv}</small></td>
                  <td style={{ border: '1px solid #333', padding: 8, textAlign: 'center' }}>{s.et || '—'} <small className={`grade-pill-${s.etLv}`} style={{ display: 'inline-block', fontSize: 8, padding: '1px 4px', borderRadius: 3, marginTop: 1 }}>{s.etLv}</small></td>
                  <td style={{ border: '1px solid #333', padding: 8, textAlign: 'center', background: '#f9f9f9', fontWeight: 700 }}>{s.avg}</td>
                  <td style={{ border: '1px solid #333', padding: 8, textAlign: 'center' }}>
                    <span className={`grade-pill-${s.avgLv}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, display:'inline-block' }}>{s.avgLv}</span>
                  </td>
                  <td style={{ border: '1px solid #333', padding: 8, textAlign: 'center' }}>{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 10 }}>
            <div style={{ border: '1.5px solid #333', padding: 15, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee' }}>SUMMARY</h4>
              <p><strong>Total Points:</strong> {l.report.totalAvgPts} / {maxPts(grade, subjects)}</p>
              <p><strong>Overall Level:</strong> <span style={{ background: '#8B1A1A', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>{l.report.overallInfo.lv}</span></p>
              <p><strong>Class Rank:</strong> {l.rank} out of {learners.length}</p>
              <p><strong>Performance:</strong> {l.report.overallInfo.desc}</p>
            </div>
            <div style={{ border: '1.5px solid #333', padding: 15, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee' }}>EXAM TOTALS (MARKS)</h4>
              <div style={{ fontSize: 11, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                <div>Opener: <strong>{l.report.subjects.reduce((acc, s) => acc + (s.op || 0), 0)}</strong></div>
                <div>Mid-Term: <strong>{l.report.subjects.reduce((acc, s) => acc + (s.mt || 0), 0)}</strong></div>
                <div>End-Term: <strong>{l.report.subjects.reduce((acc, s) => acc + (s.et || 0), 0)}</strong></div>
                <div>Average: <strong>{l.report.subjects.reduce((acc, s) => acc + (s.avg || 0), 0)}</strong></div>
              </div>
              <div style={{ marginTop: 10, borderTop: '1px dotted #ccc', paddingTop: 10 }}>
                <div style={{ fontSize: 11, marginBottom: 5 }}>Class Teacher's Remarks: _________________</div>
                <div style={{ fontSize: 11, marginBottom: 5 }}>Headteacher's Remarks: _________________</div>
                <div style={{ fontSize: 11 }}>Parent's Remarks: ______________________</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: '#666' }}>
            <p>This is an official document of PAAV-GITOMBO COMMUNITY SCHOOL. Any alterations make it invalid.</p>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-around' }}>
              <div>Stamp: [ ________________ ]</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassListTemplate({ learners, grade }) {
  return (
    <div>
      <PrintHeader title="OFFICIAL CLASS LIST" grade={grade} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th style={{ border: '1px solid #ddd', padding: 10 }}>#</th>
            <th style={{ border: '1px solid #ddd', padding: 10 }}>ADM</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'left' }}>Full Name</th>
            <th style={{ border: '1px solid #ddd', padding: 10 }}>Gender</th>
            <th style={{ border: '1px solid #ddd', padding: 10 }}>Parent Phone</th>
          </tr>
        </thead>
        <tbody>
          {learners.map((l, i) => (
            <tr key={l.adm}>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{i + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{l.adm}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{l.name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{l.gender}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{l.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeeBalanceListTemplate({ learners, fees, grade, feeCfg }) {
  const getAnnualFee = g => feeCfg[g]?.annual || 5000;
  
  let totalExpected = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  const data = learners.map(l => {
    const expected = getAnnualFee(l.grade);
    const paid = (l.t1||0) + (l.t2||0) + (l.t3||0);
    const bal = expected - paid;
    
    totalExpected += expected;
    totalPaid += paid;
    totalBalance += bal;
    
    return { ...l, expected, paid, bal };
  });

  return (
    <div>
      <PrintHeader title="FEE BALANCE LIST" grade={grade} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>#</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>ADM</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'left' }}>Full Name</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>Term 1 (Exp/Paid)</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>Term 2 (Exp/Paid)</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>Term 3 (Exp/Paid)</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>Expected Total</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>Paid Total</th>
            <th style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l, i) => (
            <tr key={l.adm}>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{i + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', fontWeight: 600 }}>{l.adm}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, fontWeight: 700 }}>{l.name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', fontSize: 10 }}>
                Exp: {((feeCfg[l.grade]||{}).t1||0).toLocaleString()} / Paid: {(l.t1||0).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', fontSize: 10 }}>
                Exp: {((feeCfg[l.grade]||{}).t2||0).toLocaleString()} / Paid: {(l.t2||0).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', fontSize: 10 }}>
                Exp: {((feeCfg[l.grade]||{}).t3||0).toLocaleString()} / Paid: {(l.t3||0).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', fontWeight: 600 }}>{l.expected.toLocaleString()}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', color: '#059669', fontWeight: 600 }}>{l.paid.toLocaleString()}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', color: l.bal > 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>
                {l.bal.toLocaleString()}
              </td>
            </tr>
          ))}
          <tr style={{ background: '#f9f9f9', fontWeight: 800 }}>
            <td colSpan={3} style={{ border: '1px solid #ddd', padding: 10, textAlign: 'right' }}>TOTAL:</td>
            <td style={{ border: '1px solid #ddd', padding: 10 }}></td>
            <td style={{ border: '1px solid #ddd', padding: 10 }}></td>
            <td style={{ border: '1px solid #ddd', padding: 10 }}></td>
            <td style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center' }}>{totalExpected.toLocaleString()}</td>
            <td style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center', color: '#059669' }}>{totalPaid.toLocaleString()}</td>
            <td style={{ border: '1px solid #ddd', padding: 10, textAlign: 'center', color: totalBalance > 0 ? '#DC2626' : '#059669' }}>
              {totalBalance.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ReceiptTemplate({ learners, fees, grade, selLearner, feeCfg }) {
  const getAnnualFee = g => feeCfg[g]?.annual || 5000;
  
  const targetLearners = learners.filter(l => {
    if (grade && l.grade !== grade) return false;
    if (selLearner && l.adm !== selLearner) return false;
    return true;
  });

  if (targetLearners.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No learners found</div>
        <div style={{ fontSize: 12 }}>
          Check your grade/learner selection.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      {targetLearners.map((l, i) => {
        const annualFee = getAnnualFee(l.grade);
        const lfees = fees.filter(f => f.adm === l.adm).sort((a,b) => new Date(b.date) - new Date(a.date));
        const paid = (l.t1||0) + (l.t2||0) + (l.t3||0);
        const bal = annualFee - paid;

        return (
          <div key={l.adm || i} className="receipt-preview-card" style={{ 
            pageBreakInside: 'avoid', 
            width: '80mm', 
            margin: '0 auto 30px',
            padding: '8mm 4mm',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.4',
            border: '1px solid #ddd',
            background: '#fff'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: '13px' }}>PAAV-GITOMBO</div>
              <div style={{ fontSize: '10px' }}>COMMUNITY SCHOOL</div>
              <div style={{ fontSize: '9px', fontStyle: 'italic' }}>More Than Academics!</div>
              <div style={{ fontSize: '9px', marginTop: 4 }}>P.O BOX 4091-00100 Nairobi</div>
              <div style={{ fontSize: '9px' }}>TEL: 0758 922 915</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: 10, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '12px' }}>OFFICIAL FEE RECEIPT</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div><strong>NAME:</strong> {l.name}</div>
              <div><strong>ADM:</strong> {l.adm}</div>
              <div><strong>GRADE:</strong> {l.grade}</div>
              <div><strong>DATE:</strong> {new Date().toLocaleDateString('en-GB')}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #000', marginBottom: 4 }}>TERMLY PAYMENTS:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span>TERM 1:</span>
                <strong>{(l.t1 || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span>TERM 2:</span>
                <strong>{(l.t2 || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span>TERM 3:</span>
                <strong>{(l.t3 || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid #000', marginBottom: 4 }}>RECENT PAYMENTS:</div>
              {lfees.length > 0 ? lfees.slice(0, 5).map((f, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: 1 }}>
                  <span>{f.date} ({f.method || 'Cash'})</span>
                  <strong>{Number(f.amount || f.amt || 0).toLocaleString()}</strong>
                </div>
              )) : <div style={{ fontSize: '9px', fontStyle: 'italic' }}>No payments</div>}
            </div>

            <div style={{ borderTop: '1px solid #000', paddingTop: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ANNUAL FEE:</span>
                <strong>{annualFee.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>TOTAL PAID:</span>
                <strong>{paid.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: bal > 0 ? '#DC2626' : '#059669', fontSize: '12px', fontWeight: 900, marginTop: 4 }}>
                <span>BALANCE:</span>
                <span>KSH {bal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 15, fontSize: '9px', borderTop: '1px dashed #ccc', paddingTop: 10 }}>
              <div>*** Thank You ***</div>
              <div>Generated: {new Date().toLocaleString()}</div>
            </div>
          </div>
        );

      })}
    </div>
  );
}

function IDCardTemplate({ learners, grade }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
      {learners.map(l => (
        <div key={l.adm} style={{ width: 340, height: 215, border: '1.5px solid #8B1A1A', borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ background: '#8B1A1A', color: '#fff', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="L" style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', padding: 2 }} />
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.5 }}>PAAV-GITOMBO COMMUNITY SCHOOL</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', padding: 10, gap: 12 }}>
            {/* Photo Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 75, height: 85, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {l.avatar ? (
                  <img src={l.avatar} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 30 }}>👤</span>
                )}
              </div>
              <div style={{ background: '#8B1A1A', color: '#fff', fontSize: 8, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>STUDENT</div>
            </div>

            {/* Info Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#8B1A1A', textTransform: 'uppercase', marginBottom: 6, borderBottom: '1px solid #eee' }}>{l.name}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: 9 }}>
                <div><span style={{ color: '#64748B' }}>ADM NO:</span> <strong style={{ color: '#1E293B' }}>{l.adm}</strong></div>
                <div><span style={{ color: '#64748B' }}>GRADE:</span> <strong style={{ color: '#1E293B' }}>{l.grade}</strong></div>
                <div><span style={{ color: '#64748B' }}>SEX:</span> <strong style={{ color: '#1E293B' }}>{l.sex || '—'}</strong></div>
                <div><span style={{ color: '#64748B' }}>D.O.B:</span> <strong style={{ color: '#1E293B' }}>{l.dob || '—'}</strong></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>CONTACT:</span> <strong style={{ color: '#1E293B' }}>{l.phone || '0758 922 915'}</strong></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '4px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 7, color: '#94A3B8', fontStyle: 'italic' }}>✝ More Than Academics!</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#1E293B' }}>PAAV-GITOMBO</div>
              <div style={{ fontSize: 6, color: '#94A3B8' }}>P.O BOX 4091-00100</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceRegisterTemplate({ learners, grade, type, att }) {
  // Helper to generate days for the register
  const getDays = () => {
    const year = new Date().getFullYear();
    const today = new Date();
    
    if (type === 'weekly') {
      const mon = new Date(today);
      mon.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      return [...Array(5)].map((_, i) => {
        const d = new Date(mon); d.setDate(mon.getDate() + i);
        return d.toISOString().split('T')[0];
      });
    }
    
    if (type === 'monthly') {
      const month = today.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      return [...Array(numDays)].map((_, i) => {
        return new Date(year, month, i + 1).toISOString().split('T')[0];
      });
    }

    if (type === 'termly') {
      // 14 weeks summary or select a specific month? 
      // User asked for termly register. We'll show first 31 days or a specific term span
      return [...Array(31)].map((_, i) => {
        const d = new Date(year, 0, i + 6); // Just a sample span for T1
        return d.toISOString().split('T')[0];
      });
    }
    
    // Annually (Show months)
    return ['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => `${year}-${m}`);
  };

  const dayList = getDays();
  const isAnnual = type === 'annually';

  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      <PrintHeader title={`ATTENDANCE REGISTER (${type.toUpperCase()})`} grade={grade} />
      <div style={{ marginBottom: 15, fontSize: 13, display: 'flex', gap: 30, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
        <div><strong>Period:</strong> {isAnnual ? new Date().getFullYear() : new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <div><strong>Teacher:</strong> ____________________</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr style={{ background: '#F1F5F9' }}>
            <th style={{ border: '1px solid #333', padding: '6px 8px', width: 30 }}>#</th>
            <th style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'left', width: 220 }}>Student Name / ADM</th>
            {dayList.map((d, i) => (
              <th key={d} style={{ border: '1px solid #333', padding: 2, width: 25, fontSize: 8 }}>
                {isAnnual ? d.split('-')[1] : d.split('-')[2]}
              </th>
            ))}
            <th style={{ border: '1px solid #333', padding: 4, width: 50 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {/* Dynamic learner rows */}
          {learners.map((l, idx) => {
            let presentCount = 0;
            return (
              <tr key={l.adm}>
                <td style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #333', padding: '6px 8px' }}>
                  <div style={{ fontWeight: 700 }}>{l.name}</div>
                  <div style={{ fontSize: 8, color: '#666' }}>{l.adm}</div>
                </td>
                {dayList.map(d => {
                  const status = att[`${grade}|${d}|${l.adm}`] || '';
                  if (status === 'P' || status === 'L') presentCount++;
                  return (
                    <td key={d} style={{ border: '1px solid #333', padding: 0, height: 32, textAlign: 'center', fontWeight: 800 }}>
                      {status || ''}
                    </td>
                  );
                })}
                <td style={{ border: '1px solid #333', padding: 0, textAlign: 'center', fontWeight: 800 }}>{presentCount}</td>
              </tr>
            );
          })}
          {/* Always add 5 blank rows for manual entries/new students */}
          {[...Array(5)].map((_, idx) => (
            <tr key={`blank-${idx}`}>
              <td style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'center' }}>{learners.length + idx + 1}</td>
              <td style={{ border: '1px solid #333', padding: '6px 8px', height: 32 }}></td>
              {dayList.map(d => (
                <td key={d} style={{ border: '1px solid #333', padding: 0 }}></td>
              ))}
              <td style={{ border: '1px solid #333', padding: 0 }}></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 25, fontSize: 11, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: 15 }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <strong>KEY:</strong>
          <span>[ P ] Present</span>
          <span>[ A ] Absent</span>
          <span>[ L ] Late</span>
          <span>[ E ] Excused</span>
        </div>
        <div>Class Teacher's Signature: __________________________</div>
      </div>
    </div>
  );
}

