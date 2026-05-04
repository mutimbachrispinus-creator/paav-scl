'use client';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
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
import { buildMeritList, fmtK, JSS, SENIOR, gInfo, getCurriculum } from '@/lib/cbe';
import { usePersistedState } from '@/components/TabState';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { useSchoolProfile } from '@/lib/school-profile';
import { useProfile } from '@/app/PortalShell';
import PrintHeader from '@/components/PrintHeader';

const ASSESS_LABELS = { op1:'Opener Exam', mt1:'Mid-Term Exam', et1:'End-Term Exam' };


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
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => setMounted(true), []);

  const [grade,  setGrade]  = usePersistedState('paav_grades_grade',  'GRADE 1');
  const [term,   setTerm]   = useState('T1');
  const [assess, setAssess] = useState('mt1');
  const { profile: ctxProfile } = useProfile() || {};
  const localProfile = useSchoolProfile();
  const school = ctxProfile && Object.keys(ctxProfile).length > 0 ? ctxProfile : localProfile;

  const curr = getCurriculum(school?.curriculum || 'CBC');
  const TERMS = curr.TERMS || [{ id: 'T1', name: 'Term 1' }, { id: 'T2', name: 'Term 2' }, { id: 'T3', name: 'Term 3' }];
  const { ALL_GRADES } = curr;

  useEffect(() => {
    if (!grade && ALL_GRADES.length > 0) {
      setGrade(ALL_GRADES[0]);
    }
  }, [ALL_GRADES, grade, setGrade]);

  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti([
          'paav6_learners',
          'paav6_marks',
          'paav8_grad',
          'paav_school_profile'
        ])
      ]);

      if (!u) { router.push('/'); return; }
      setUser(u);

      setLearners(db.paav6_learners || []);
      setMarks(db.paav6_marks || {});
      setGradCfg(db.paav8_grad || null);
    } catch (e) {
      console.error('Merit list load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  /* ── Build ranked list (memoized so dropdowns trigger re-render) ── */
  const ranked = useMemo(() => loading ? [] : buildMeritList(learners, marks, grade, term, assess, gradCfg, school?.curriculum || 'CBC'), [learners, marks, grade, term, assess, gradCfg, loading, school?.curriculum]);
  const subjects = curr.DEFAULT_SUBJECTS[grade] || [];
  const max = curr.maxPts(grade, subjects);

  const colStats = useMemo(() => {
    return subjects.map(s => {
      let sum = 0;
      let count = 0;
      ranked.forEach(l => {
        const detail = l.detail.find(d => d.subj === s);
        if (detail && detail.score !== null) {
          sum += detail.score;
          count++;
        }
      });
      const avgScore = count > 0 ? Math.round(sum / count) : null;
      const avgInfo = avgScore !== null ? gInfo(avgScore, grade, gradCfg) : null;
      return { avgScore, avgInfo };
    });
  }, [ranked, subjects, grade, gradCfg]);

  const totalPtsSum = ranked.reduce((acc, l) => acc + l.totalPts, 0);
  const totalAvgPts = ranked.length > 0 ? Math.round(totalPtsSum / ranked.length) : 0;
  const avgPct = ranked.length > 0 && max > 0 ? Math.round((totalAvgPts / max) * 100) : 0;
  const totalMarksSum = ranked.reduce((acc, l) => acc + l.detail.reduce((s,d)=>s+(d.score||0),0), 0);
  const totalAvgMarks = ranked.length > 0 ? Math.round(totalMarksSum / ranked.length) : 0;
  
  const distribution = useMemo(() => {
    const isJSS = JSS.includes(grade) || SENIOR.includes(grade);
    const counts = isJSS 
      ? { EE1:0, EE2:0, ME1:0, ME2:0, AE1:0, AE2:0, BE1:0, BE2:0 }
      : { EE: 0, ME: 0, AE: 0, BE: 0 };

    ranked.forEach(l => {
      const pct = max ? Math.round((l.totalPts/max)*100) : 0;
      const inf = curr.gInfo ? curr.gInfo(pct, grade, gradCfg) : gInfo(pct, grade, gradCfg);
      if (inf && counts[inf.lv] !== undefined) {
        counts[inf.lv]++;
      }
    });
    return counts;
  }, [ranked, max, grade, gradCfg]);


  if (!mounted || loading || !user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading merit list…</div>;

  return (
    <div className="page on">
      <PrintHeader />
      <div className="page-hdr">
        <div>
          <h2>🏆 {school.name} Merit List</h2>
          <p>CBC top performers — ranked by total points · <span style={{fontWeight:700,color:'#8B1A1A'}}>{ASSESS_LABELS[assess]}</span></p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm no-print" onClick={() => {
            const style = document.createElement('style');
            style.innerHTML = '@page { size: A4 landscape; margin: 8mm; }';
            document.head.appendChild(style);
            document.body.classList.add('print-landscape');
            setTimeout(() => {
              window.print();
              document.body.classList.remove('print-landscape');
              style.remove();
            }, 150);
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
              {TERMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                const overallInfo = max ? (curr.gInfo ? curr.gInfo(overallPct, grade) : gInfo(overallPct, grade)) : null;
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
                    <th style={{ textAlign: 'center', padding: '6px 4px' }}>Rank</th>
                    <th style={{ textAlign: 'center', padding: '6px 4px' }}>Adm</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Name</th>
                    {subjects.map(s => (
                      <th key={s} style={{ textAlign: 'center', fontSize: 9, padding: '6px 2px' }} title={s}>
                        {s.length > 6 ? s.slice(0,6)+'…' : s}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', color:'#8B1A1A', padding: '6px 4px' }}>Total Marks</th>
                    <th style={{ textAlign: 'center', color:'#8B1A1A', padding: '6px 4px' }}>Total Pts</th>
                    <th style={{ textAlign: 'center', color:'#8B1A1A', padding: '6px 4px' }}>/ {max}</th>
                    <th style={{ textAlign: 'center', color:'#8B1A1A', padding: '6px 4px' }}>%</th>
                    <th style={{ textAlign: 'center', color:'#0369A1', padding: '6px 4px' }}>VAP</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map(l => (
                    <tr key={l.adm}
                      className={l.rank <= 3 ? `merit-rank-${l.rank}` : ''}
                      style={{ transition: 'background .15s' }}>
                      <td style={{ padding: '4px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14,
                            color: l.rank === 1 ? '#B45309' : l.rank === 2 ? '#475569'
                                 : l.rank === 3 ? '#C2410C' : 'var(--navy)' }}>
                            {MEDALS[l.rank] || `#${l.rank}`}
                          </span>
                          <button className="btn btn-ghost btn-sm no-print" title="View Profile"
                            style={{ padding: '2px 6px', fontSize: 14 }}
                            onClick={() => router.push(`/learners/${l.adm}`)}>
                            👁
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 11.5, padding: '4px' }}>{l.adm}</td>
                      <td style={{ fontWeight: 600, padding: '4px 8px' }}>{l.name}</td>
                      {l.detail.map(d => (
                        <td key={d.subj} style={{ textAlign: 'center', padding: '3px 2px' }}>
                          {d.score !== null ? (
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                              <span style={{ fontWeight:800, fontSize:12.5 }}>{d.score}</span>
                              <span style={{ padding:'1px 5px', borderRadius:10, fontSize:9, fontWeight:900, background:d.bg||'#eee', color:d.c||'#333' }}>
                                {d.lv}
                              </span>
                            </div>
                          ) : '—'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#059669', padding: '4px' }}>
                        {l.detail.reduce((s,d)=>s+(d.score||0),0)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 14,
                        color: 'var(--navy)', padding: '4px' }}>
                        {l.totalPts}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, padding: '4px' }}>
                        {max}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700,
                        color: l.totalPts/max >= 0.5 ? 'var(--green)' : 'var(--red)', padding: '4px' }}>
                        {Math.round((l.totalPts/max)*100)}%
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px' }}>
                        {l.vap !== 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 16, color: l.vap > 0 ? 'var(--green)' : 'var(--red)' }}>
                              {l.vap > 0 ? '↗️' : '↘️'}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 900, color: l.vap > 0 ? 'var(--green)' : 'var(--red)' }}>
                              {l.vap > 0 ? `+${l.vap}` : l.vap}
                            </span>
                          </div>
                        ) : <span style={{ color: 'var(--muted)', fontSize: 10 }}>—</span>}
                      </td>
                      <td></td>
                    </tr>
                  ))}
                  {ranked.length > 0 && (
                    <>
                      <tr style={{ background: '#f9f9f9', borderTop: '2px solid #8B1A1A' }}>
                        <td colSpan={3} style={{ padding: 6, textAlign: 'right', fontWeight: 800 }}>AVERAGE SCORE</td>
                        {colStats.map((stat, i) => (
                          <td key={i} style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>
                            {stat.avgScore !== null ? stat.avgScore : '—'}
                          </td>
                        ))}
                        <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{totalAvgMarks}</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>—</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>—</td>
                        <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{avgPct}%</td>
                        <td></td>
                      </tr>
                      <tr style={{ background: '#f9f9f9' }}>
                        <td colSpan={3} style={{ padding: 6, textAlign: 'right', fontWeight: 800 }}>AVERAGE LEVEL</td>
                        {colStats.map((stat, i) => (
                          <td key={i} style={{ padding: 6, textAlign: 'center' }}>
                            {stat.avgInfo ? <span style={{ color: stat.avgInfo.c, fontWeight: 800, fontSize: 10 }}>{stat.avgInfo.lv}</span> : '—'}
                          </td>
                        ))}
                        <td colSpan={5}></td>
                      </tr>
                      <tr style={{ background: '#f9f9f9' }}>
                        <td colSpan={3} style={{ padding: 6, textAlign: 'right', fontWeight: 800 }}>AVERAGE POINTS</td>
                        {colStats.map((stat, i) => (
                          <td key={i} style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>
                            {stat.avgInfo ? stat.avgInfo.pts : '—'}
                          </td>
                        ))}
                        <td style={{ padding: 6, textAlign: 'center' }}>—</td>
                        <td style={{ padding: 6, textAlign: 'center', fontWeight: 800, color: '#8B1A1A' }}>{totalAvgPts}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── DISTRIBUTION GRAPH (at bottom) ── */}
          <div className="panel" style={{ marginTop: 24, background: 'linear-gradient(to bottom right, #fff, #f8fafc)' }}>
            <div className="panel-body">
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 0.5, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>📊 Class Performance Distribution</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: 40, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, padding: '0 10px' }}>
                  {Object.entries(distribution).map(([lv, count]) => {
                    const maxCount = Math.max(...Object.values(distribution), 1);
                    const barH = (count / maxCount) * 100;
                    const colors = { 
                      EE: '#059669', ME: '#2563EB', AE: '#D97706', BE: '#DC2626',
                      EE1: '#065F46', EE2: '#059669', ME1: '#1D4ED8', ME2: '#2563EB', AE1: '#B45309', AE2: '#92400E', BE1: '#DC2626', BE2: '#991B1B'
                    };
                    return (
                      <div key={lv} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: colors[lv] || '#64748b' }}>{count}</div>
                        <div style={{ width: '100%', height: `${barH}%`, background: colors[lv] || '#cbd5e1', borderRadius: '4px 4px 0 0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>{lv}</div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ borderLeft: '2px solid #f1f5f9', paddingLeft: 30 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>Summary Counts</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                    {Object.entries(distribution).map(([lv, count]) => (
                      <div key={lv} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                        <span style={{ color: '#64748b' }}>{lv}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <style jsx global>{`
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
