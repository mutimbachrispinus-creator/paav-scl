'use client';
/**
 * app/grades/report-card/[id]/page.js — Premium A4 CBC Report Card
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DEFAULT_SUBJECTS, gInfo, maxPts, promotionStatus,
  JSS_SCALE, PRIMARY_SCALE, isJSSGrade,
} from '@/lib/cbe';

const ASSESSMENTS = [
  { key: 'op1', label: 'Opener'   },
  { key: 'mt1', label: 'Mid-Term' },
  { key: 'et1', label: 'End-Term' },
];
const TERMS = ['T1','T2','T3'];

export default function ReportCardPage() {
  const router = useRouter();
  const { id: admNo } = useParams();

  const [learner, setLearner] = useState(null);
  const [marks,   setMarks]   = useState({});
  const [feeCfg,  setFeeCfg]  = useState({});
  const [gradCfg, setGradCfg] = useState(null);
  const [school,  setSchool]  = useState({ name: 'PAAV-GITOMBO COMMUNITY SCHOOL', motto: '"More Than Academics!"', tel: '0758 922 915', location: 'Gitombo, Embu County, Kenya' });
  const [term,    setTerm]    = useState('T1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const authRes = await fetch('/api/auth');
      const auth    = await authRes.json();
      if (!auth.ok) { router.push('/'); return; }

      const dbRes = await fetch('/api/db', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requests: [
          { type: 'get', key: 'paav6_learners' },
          { type: 'get', key: 'paav6_marks'    },
          { type: 'get', key: 'paav6_feecfg'   },
          { type: 'get', key: 'paav8_grad'     },
        ]}),
      });
      const db = await dbRes.json();

      const allLearners = db.results[0]?.value || [];
      const found = allLearners.find(l => l.adm === admNo);
      if (!found) { router.push('/learners'); return; }

      setLearner(found);
      setMarks(  db.results[1]?.value || {});
      setFeeCfg( db.results[2]?.value || {});
      setGradCfg(db.results[3]?.value || null);
      setLoading(false);
    }
    load();
  }, [admNo, router]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading report card…</div>;
  if (!learner) return null;

  const subjects  = DEFAULT_SUBJECTS[learner.grade] || [];
  const scale     = isJSSGrade(learner.grade) ? JSS_SCALE : PRIMARY_SCALE;
  const annualFee = feeCfg[learner.grade]?.annual || 5000;
  const paid      = (learner.t1||0)+(learner.t2||0)+(learner.t3||0);
  const balance   = annualFee - paid;

  const rows = subjects.map(subj => {
    const cells = ASSESSMENTS.map(a => {
      const k1  = `${term}:${learner.grade}|${subj}|${a.key}`;
      const k0  = `${learner.grade}|${subj}|${a.key}`;
      const sc  = marks[k1]?.[admNo] ?? marks[k0]?.[admNo];
      const inf = sc !== undefined ? gInfo(Number(sc), learner.grade, gradCfg) : null;
      return { score: sc, inf };
    });
    return { subj, cells };
  });

  const etRows   = rows.map(r => r.cells[2]);
  const entered  = etRows.filter(c => c.score !== undefined);
  const totalPts = entered.reduce((s, c) => s + (c.inf?.pts||0), 0);
  const maxTotal = maxPts(learner.grade, subjects);
  const promoSt  = promotionStatus(totalPts, maxTotal);
  const pct      = maxTotal ? Math.round((totalPts/maxTotal)*100) : 0;

  const promoColor = promoSt === 'promote' ? '#059669' : promoSt === 'review' ? '#D97706' : '#DC2626';
  const promoText  = promoSt === 'promote' ? '✅ PROMOTED' : promoSt === 'review' ? '⚠ UNDER REVIEW' : '❌ RETAIN';

  const dateStr = new Date().toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' });

  return (
    <>
      {/* ── Controls bar (hidden on print) ── */}
      <div className="no-print" style={{ padding: '14px 22px', background: 'linear-gradient(135deg,#1e293b,#0f172a)',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
          📄 Report Card — {learner.name}
        </span>
        <select value={term} onChange={e => setTerm(e.target.value)}
          style={{ padding: '7px 14px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.1)',
            color: '#fff', cursor: 'pointer', outline: 'none' }}>
          {TERMS.map(t => <option key={t} value={t} style={{ color: '#1e293b' }}>Term {t.replace('T','')}</option>)}
        </select>
        <button onClick={() => router.push(`/learners/${admNo}`)}
          className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
          ← Profile
        </button>
        <button onClick={() => window.print()} className="btn btn-gold btn-sm" style={{ marginLeft: 'auto' }}>
          🖨️ Print / PDF
        </button>
      </div>

      {/* ── A4 wrapper (screen only) ── */}
      <div style={{ background: '#e8edf3', padding: '32px 0 48px', minHeight: '100vh' }} className="no-print-bg">

        {/* ══ A4 Card ══ */}
        <div className="rc-a4" style={{
          boxShadow: '0 8px 40px rgba(0,0,0,.18)',
          border: '1px solid #e2e8f0',
        }}>

          {/* Watermark */}
          <div style={{ position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%) rotate(-25deg)',
            fontSize: 140, fontWeight: 900, color: 'rgba(139,26,26,0.035)',
            pointerEvents: 'none', zIndex: 0, userSelect: 'none',
            fontFamily: 'Sora,sans-serif', letterSpacing: 8 }}>PAAV</div>

          {/* ── HEADER ── */}
          <div className="rc-hdr" style={{ position: 'relative', zIndex: 1 }}>
            <div className="rc-hdr-logo">🏫</div>
            <div className="rc-hdr-center">
              <div className="rc-school">{school.name}</div>
              <div className="rc-hdr-sub">{school.location} &nbsp;·&nbsp; Tel: {school.tel}</div>
              <div>
                <span className="rc-badge">
                  ACADEMIC PROGRESS REPORT &nbsp;·&nbsp; TERM {term.replace('T','')} &nbsp;·&nbsp; {new Date().getFullYear()}
                </span>
              </div>
              <div className="rc-motto">{school.motto}</div>
            </div>
            <div className="rc-hdr-stamp">
              <div style={{ fontWeight: 700, fontSize: 9, color: '#8B1A1A', textTransform: 'uppercase', letterSpacing: .5 }}>Date Issued</div>
              <div style={{ fontWeight: 600 }}>{dateStr}</div>
              <div style={{ marginTop: 4, padding: '3px 8px', background: '#FDF2F2', borderRadius: 6,
                border: '1px solid #FECACA', fontSize: 8.5, color: '#8B1A1A', fontWeight: 700 }}>
                OFFICIAL COPY
              </div>
            </div>
          </div>

          {/* ── LEARNER INFO ── */}
          <div className="rc-learner-info" style={{ position: 'relative', zIndex: 1 }}>
            {[
              ['Name',             learner.name ],
              ['Admission No.',    learner.adm  ],
              ['Grade',            learner.grade],
              ['Sex',              learner.sex || '—'],
              ['Stream',           learner.stream || '—'],
              ['Class Teacher',    learner.teacher || '—'],
              ['Parent/Guardian',  learner.parent || '—'],
              ['Phone',            learner.phone || '—'],
            ].map(([label, val]) => (
              <div key={label} className="rc-info-row">
                <span className="rc-info-label">{label}</span>
                <strong style={{ fontSize: 10, color: '#1e293b' }}>{val}</strong>
              </div>
            ))}
          </div>

          {/* ── MARKS TABLE ── */}
          <table className="rc-subj-table" style={{ position: 'relative', zIndex: 1 }}>
            <thead>
              <tr>
                <th>Learning Area / Subject</th>
                <th>Opener<br/><span style={{fontWeight:400,fontSize:7.5,opacity:.8}}>(Score)</span></th>
                <th>Mid-Term<br/><span style={{fontWeight:400,fontSize:7.5,opacity:.8}}>(Score)</span></th>
                <th>End-Term<br/><span style={{fontWeight:400,fontSize:7.5,opacity:.8}}>(Score)</span></th>
                <th>Grade<br/><span style={{fontWeight:400,fontSize:7.5,opacity:.8}}>(Level)</span></th>
                <th>Pts</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ subj, cells }) => {
                const etCell = cells[2];
                return (
                  <tr key={subj}>
                    <td>{subj}</td>
                    {cells.map((c, ci) => (
                      <td key={ci} style={{ textAlign: 'center', fontWeight: 700 }}>
                        {c.score !== undefined ? (
                          <span>{c.score}
                            {c.inf && (
                              <span style={{ display:'inline-block', marginLeft:3, padding:'1px 5px',
                                borderRadius:8, fontSize:8.5, fontWeight:900,
                                background:c.inf.bg, color:c.inf.c }}>
                                {c.inf.lv}
                              </span>
                            )}
                          </span>
                        ) : <span style={{color:'#cbd5e1'}}>—</span>}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      {etCell.inf ? (
                        <span style={{ fontWeight: 900, color: etCell.inf.c,
                          background: etCell.inf.bg, padding: '2px 8px',
                          borderRadius: 10, fontSize: 9, display:'inline-block' }}>
                          {etCell.inf.lv}
                        </span>
                      ) : <span style={{color:'#cbd5e1'}}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900,
                      color: etCell.inf ? etCell.inf.c : '#cbd5e1', fontSize: 12 }}>
                      {etCell.inf ? etCell.inf.pts : '—'}
                    </td>
                    <td style={{ fontSize: 9, color: '#64748b' }}>
                      {etCell.inf ? etCell.inf.desc.split(' — ')[0] : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* Total row */}
              {entered.length > 0 && (
                <tr className="rc-total-row">
                  <td colSpan={4} style={{ paddingLeft: 12 }}>
                    TOTAL POINTS &nbsp;·&nbsp; <span style={{fontWeight:500,fontSize:9,opacity:.7}}>({entered.length} of {subjects.length} subjects entered)</span>
                  </td>
                  <td style={{ textAlign:'center' }}>—</td>
                  <td style={{ textAlign: 'center', fontSize: 14 }}>
                    {totalPts}<span style={{fontSize:9,opacity:.7,fontWeight:500}}>/{maxTotal}</span>
                  </td>
                  <td style={{ fontSize: 10, fontWeight:700 }}>{pct}%</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── CBC SCALE LEGEND ── */}
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, textTransform:'uppercase', color:'#94a3b8',
              marginBottom: 5, letterSpacing: .6 }}>CBC Grading Scale:</div>
            <div className="rc-scale-legend">
              {scale.map((s, i) => {
                const nextMin = scale[i-1]?.min ?? 100;
                const upper   = i === 0 ? 100 : nextMin - 1;
                return (
                  <span key={s.lv} className="rc-scale-pip"
                    style={{ background: s.bg, color: s.c, borderColor: s.c+'40' }}>
                    {s.lv}: {s.min}–{upper} ({s.pts}pts)
                  </span>
                );
              })}
            </div>
          </div>

          {/* ── STATUS BOXES ── */}
          <div className="rc-status-grid" style={{ position:'relative', zIndex:1 }}>
            <div className="rc-status-box" style={{ borderColor: promoColor+'44', background: promoColor+'0a' }}>
              <div className="rc-status-label">Promotion Recommendation</div>
              <div className="rc-status-value" style={{ color: promoColor }}>{promoText}</div>
              <div style={{ marginTop:4, fontSize:9, color:'#64748b' }}>
                Score: {totalPts}/{maxTotal} pts &nbsp;({pct}%)
              </div>
            </div>
            <div className="rc-status-box" style={{
              borderColor: balance<=0 ? '#05966944':'#DC262644',
              background:   balance<=0 ? '#05966906':'#DC262606',
            }}>
              <div className="rc-status-label">Fee Balance — {new Date().getFullYear()}</div>
              <div className="rc-status-value" style={{ color: balance<=0 ? '#059669':'#DC2626' }}>
                {balance<=0 ? '✅ CLEARED' : `KSH ${balance.toLocaleString()} OWING`}
              </div>
              <div style={{ marginTop:4, fontSize:9, color:'#64748b' }}>
                Annual: KSH {annualFee.toLocaleString()} &nbsp;·&nbsp; Paid: KSH {paid.toLocaleString()}
              </div>
            </div>
          </div>

          {/* ── SIGNATURES ── */}
          <div className="rc-sigs" style={{ position:'relative', zIndex:1 }}>
            {['Class Teacher','Head Teacher','Parent / Guardian'].map(role => (
              <div key={role} className="rc-sig-box">
                <div className="rc-sig-line" />
                <div className="rc-sig-label">{role}</div>
              </div>
            ))}
          </div>

          {/* ── FOOTER ── */}
          <div className="rc-footer" style={{ position:'relative', zIndex:1 }}>
            <div>
              <strong>{school.name}</strong>
            </div>
            <div style={{ color:'#8B1A1A', fontStyle:'italic' }}>{school.motto}</div>
            <div>Generated: {dateStr} &nbsp;·&nbsp; PAAV School Portal</div>
          </div>
        </div>
      </div>
    </>
  );
}
