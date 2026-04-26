'use client';
'use client';
/**
 * app/merit-list/page.js — Merit List (Top Learners, CBC-based)
 *
 * Ranks learners by total CBE points per grade.
 * Features:
 *   • Filter by grade, term, assessment
 *   • Gold/Silver/Bronze medals for top 3
 *   • Export / print class list (landscape)
 *   • Navigation to individual learner profile
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { buildMeritList, ALL_GRADES, maxPts, DEFAULT_SUBJECTS, gInfo } from '@/lib/cbe';

const ASSESS_LABELS = { op1:'Opener Exam', mt1:'Mid-Term Exam', et1:'End-Term Exam' };

const TERMS      = ['T1','T2','T3'];
const ASSESSMENTS = [
  { key: 'op1', label: 'Opener'   },
  { key: 'mt1', label: 'Mid-Term' },
  { key: 'et1', label: 'End-Term' },
];

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function MeritListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [marks,    setMarks]    = useState({});
  const [gradCfg,  setGradCfg]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  const [grade,  setGrade]  = useState('GRADE 7');
  const [term,   setTerm]   = useState('T1');
  const [assess, setAssess] = useState('mt1');

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth    = await authRes.json();
    if (!auth.ok) { router.push('/'); return; }
        setUser(auth.user);
    // Note: grade filter is set by user selection only

    const dbRes = await fetch('/api/db', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: [
        { type: 'get', key: 'paav6_learners' },
        { type: 'get', key: 'paav6_marks'    },
        { type: 'get', key: 'paav8_grad'     },
      ]}),
    });
    const db = await dbRes.json();
    setLearners(db.results[0]?.value || []);
    setMarks(   db.results[1]?.value || {});
    setGradCfg( db.results[2]?.value || null);
    setLoading(false);
  }, [router, setGrade]);

  useEffect(() => { load(); }, [load]);

  /* ── Build ranked list (memoized so dropdowns trigger re-render) ── */
  const ranked = useMemo(() => loading ? [] : buildMeritList(learners, marks, grade, term, assess, gradCfg), [learners, marks, grade, term, assess, gradCfg, loading]);
  const subjects = DEFAULT_SUBJECTS[grade] || [];
  const max = maxPts(grade, subjects);

  if (loading || !user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading merit list…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🏆 Merit List</h2>
          <p>CBC top performers — ranked by total points · <span style={{fontWeight:700,color:'#8B1A1A'}}>{ASSESS_LABELS[assess]}</span></p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm no-print" onClick={() => {
            document.body.classList.add('print-landscape');
            window.print();
            setTimeout(() => document.body.classList.remove('print-landscape'), 1000);
          }}>🖨️ Print Landscape</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 160 }}>
            <label>Grade</label>
            <select value={grade} onChange={e => setGrade(e.target.value)}>
              {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)}>
              {TERMS.map(t => <option key={t} value={t}>Term {t.replace('T','')}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Assessment</label>
            <select value={assess} onChange={e => setAssess(e.target.value)}>
              {ASSESSMENTS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', fontSize: 12,
            color: 'var(--muted)', paddingBottom: 2 }}>
            {ranked.length} learner{ranked.length !== 1 ? 's' : ''} ranked
          </div>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="panel">
          <div className="panel-body" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
            No marks entered for {grade} — {term} — {assess} yet.
          </div>
        </div>
      ) : (
        <>
          {/* ── Top 3 podium ── */}
          {ranked.length >= 1 && (
            <div className="sg sg3" style={{ marginBottom: 18 }}>
              {ranked.slice(0, 3).map(l => {
                const overallPct = max ? Math.round((l.totalPts/max)*100) : 0;
                const overallInfo = max ? gInfo(overallPct, grade) : null;
                return (
                  <div key={l.adm} className={`stat-card merit-rank-${l.rank}`}>
                    <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
                      <div style={{ fontSize: 32, marginBottom: 4 }}>{MEDALS[l.rank] || '🏅'}</div>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15,
                        color: 'var(--navy)' }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Adm: {l.adm}</div>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 28, fontWeight: 900,
                        color: l.rank === 1 ? '#B45309' : l.rank === 2 ? '#475569' : '#C2410C' }}>
                        {l.totalPts}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>out of {max} pts</div>
                      <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
                        <span className="badge bg-blue">{overallPct}%</span>
                        {overallInfo && (
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:800,
                            background:overallInfo.bg, color:overallInfo.c }}>{overallInfo.lv}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Full ranked table ── */}
          <div className="panel">
            <div className="panel-hdr">
              <h3>📋 Full Rankings — {grade} · Term {term.replace('T','')} · {ASSESSMENTS.find(a=>a.key===assess)?.label} ({ASSESS_LABELS[assess]})</h3>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Adm</th>
                    <th>Name</th>
                    {subjects.map(s => (
                      <th key={s} style={{ textAlign: 'center', fontSize: 9 }} title={s}>
                        {s.length > 6 ? s.slice(0,6)+'…' : s}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', color:'#8B1A1A' }}>Total Marks</th>
                    <th style={{ textAlign: 'center', color:'#8B1A1A' }}>Total Pts</th>
                    <th style={{ textAlign: 'center', color:'#8B1A1A' }}>/ {max}</th>
                    <th style={{ textAlign: 'center', color:'#8B1A1A' }}>%</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map(l => (
                    <tr key={l.adm}
                      className={l.rank <= 3 ? `merit-rank-${l.rank}` : ''}
                      style={{ transition: 'background .15s' }}>
                      <td>
                        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14,
                          color: l.rank === 1 ? '#B45309' : l.rank === 2 ? '#475569'
                               : l.rank === 3 ? '#C2410C' : 'var(--navy)' }}>
                          {MEDALS[l.rank] || `#${l.rank}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 11.5 }}>{l.adm}</td>
                      <td style={{ fontWeight: 600 }}>{l.name}</td>
                      {l.detail.map(d => (
                        <td key={d.subj} style={{ textAlign: 'center', padding: '3px 2px' }}>
                          {d.score !== null ? (
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                              <span style={{ fontWeight:800, fontSize:12.5 }}>
                                {d.score} <span style={{ padding:'1px 5px', borderRadius:10, fontSize:9.5, fontWeight:900, background:d.bg||'#eee', color:d.c||'#333', marginLeft:2 }}>{d.lv}</span>
                              </span>
                            </div>
                          ) : '—'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#059669' }}>
                        {l.detail.reduce((s,d)=>s+(d.score||0),0)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 14,
                        color: 'var(--navy)' }}>
                        {l.totalPts}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
                        {max}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700,
                        color: l.totalPts/max >= 0.5 ? 'var(--green)' : 'var(--red)' }}>
                        {Math.round((l.totalPts/max)*100)}%
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => router.push(`/learners/${l.adm}`)}>
                          👁
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
