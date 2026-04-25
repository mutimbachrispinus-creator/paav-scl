'use client';
/**
 * app/grades/report-card/[id]/page.js — A4 printable CBC report card
 *
 * Renders the school report card for a single learner,
 * matching the rc-a4 layout from index-122.html.
 * Supports:
 *   • All three terms in one view (term selector)
 *   • All three assessments (Opener, Mid-Term, End-Term)
 *   • CBC grade levels + points per subject
 *   • Promotion recommendation
 *   • Print to PDF (window.print)
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
  const [school,  setSchool]  = useState({ name: 'PAAV-GITOMBO COMMUNITY SCHOOL', motto: '"More Than Academics!"' });
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

  /* ── Build rows: one per subject, 3 assessment columns ── */
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

  /* ── End-term totals (use et1 for overall) ── */
  const etRows   = rows.map(r => r.cells[2]);
  const entered  = etRows.filter(c => c.score !== undefined);
  const totalPts = entered.reduce((s, c) => s + (c.inf?.pts||0), 0);
  const maxTotal = maxPts(learner.grade, subjects);
  const promoSt  = promotionStatus(totalPts, maxTotal);

  return (
    <>
      {/* ── Controls (hidden on print) ── */}
      <div className="no-print" style={{ padding: '16px 22px', background: 'var(--navy)',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
          Report Card — {learner.name}
        </span>
        <select value={term} onChange={e => setTerm(e.target.value)}
          style={{ padding: '7px 11px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 700 }}>
          {TERMS.map(t => <option key={t} value={t}>Term {t.replace('T','')}</option>)}
        </select>
        <button onClick={() => router.push(`/learners/${admNo}`)}
          className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
          ← Profile
        </button>
        <button onClick={() => window.print()}
          className="btn btn-gold btn-sm">
          🖨️ Print / PDF
        </button>
      </div>

      {/* ── A4 Report Card ── */}
      <div style={{ background: '#F0F4FF', padding: '24px 0', minHeight: '100vh' }}>
        <div className="rc-a4">
          {/* Header */}
          <div className="rc-hdr">
            <div className="rc-school">🏫 {school.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0' }}>
              PAAV-Gitombo, Embu County, Kenya &nbsp;|&nbsp; Tel: 0758 922 915
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 700,
              color: 'var(--maroon)', margin: '6px 0 2px' }}>
              ACADEMIC PROGRESS REPORT — TERM {term.replace('T','')} · {new Date().getFullYear()}
            </div>
            <div className="rc-motto">{school.motto}</div>
          </div>

          {/* Learner info grid */}
          <div className="rc-learner-info">
            {[
              ['Name',    learner.name ],
              ['Adm No', learner.adm  ],
              ['Grade',  learner.grade],
              ['Sex',    learner.sex  ],
              ['Stream', learner.stream || '—'],
              ['Class Teacher', learner.teacher || '—'],
              ['Parent/Guardian', learner.parent || '—'],
              ['Phone', learner.phone || '—'],
            ].map(([label, val]) => (
              <div key={label} className="rc-info-row">
                <span className="rc-info-label">{label}</span>
                <strong style={{ fontSize: 11, color: 'var(--navy)' }}>{val}</strong>
              </div>
            ))}
          </div>

          {/* Subject marks table */}
          <table className="rc-subj-table">
            <thead>
              <tr>
                <th>Learning Area / Subject</th>
                <th style={{ textAlign: 'center' }}>Opener<br />(Score)</th>
                <th style={{ textAlign: 'center' }}>Mid-Term<br />(Score)</th>
                <th style={{ textAlign: 'center' }}>End-Term<br />(Score)</th>
                <th style={{ textAlign: 'center' }}>Level</th>
                <th style={{ textAlign: 'center' }}>Points</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ subj, cells }) => {
                const etCell = cells[2];
                return (
                  <tr key={subj}>
                    <td style={{ fontWeight: 600 }}>{subj}</td>
                    {cells.map((c, ci) => (
                      <td key={ci} style={{ textAlign: 'center', fontWeight: 700 }}>
                        {c.score !== undefined ? c.score : '—'}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      {etCell.inf ? (
                        <span style={{ fontWeight: 800, color: etCell.inf.c,
                          background: etCell.inf.bg, padding: '1px 6px', borderRadius: 4,
                          fontSize: 9.5 }}>
                          {etCell.inf.lv}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800,
                      color: etCell.inf ? etCell.inf.c : 'var(--muted)' }}>
                      {etCell.inf ? etCell.inf.pts : '—'}
                    </td>
                    <td style={{ fontSize: 9, color: 'var(--muted)' }}>
                      {etCell.inf ? etCell.inf.desc.split(' — ')[0] : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* Total row */}
              {entered.length > 0 && (
                <tr className="rc-total-row">
                  <td colSpan="5" style={{ paddingLeft: 12 }}>
                    TOTAL POINTS ({entered.length}/{subjects.length} subjects)
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 15 }}>
                    {totalPts} / {maxTotal}
                  </td>
                  <td style={{ fontSize: 10 }}>
                    {Math.round((totalPts/maxTotal)*100)}%
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* CBC grade scale legend */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 4, letterSpacing: '.5px' }}>
              CBC Grading Scale:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {scale.map(s => (
                <span key={s.lv} style={{ background: s.bg, color: s.c, fontWeight: 700,
                  fontSize: 9, padding: '2px 7px', borderRadius: 4, border: `1px solid ${s.bg}` }}>
                  {s.lv}: {s.min}–{(scale[scale.indexOf(s)-1]?.min-1) || 100} ({s.pts}pts)
                </span>
              ))}
            </div>
          </div>

          {/* Promotion recommendation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: '10px 12px', background: '#F8FAFF', borderRadius: 8,
              border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--muted)', marginBottom: 3 }}>Recommendation</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: 
                promoSt === 'promote' ? 'var(--green)'
                : promoSt === 'review' ? 'var(--amber)'
                : 'var(--red)' }}>
                {promoSt === 'promote' ? '✅ PROMOTED'
                 : promoSt === 'review' ? '⚠ UNDER REVIEW'
                 : '❌ RETAIN'}
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: '#F8FAFF', borderRadius: 8,
              border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--muted)', marginBottom: 3 }}>Fee Balance</div>
              <div style={{ fontWeight: 800, fontSize: 13,
                color: balance <= 0 ? 'var(--green)' : 'var(--red)' }}>
                {balance <= 0 ? '✅ CLEARED' : `KSH ${balance.toLocaleString()} OWING`}
              </div>
            </div>
          </div>

          {/* Signature lines */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20,
            marginBottom: 12, marginTop: 18 }}>
            {['Class Teacher','Head Teacher','Parent / Guardian'].map(role => (
              <div key={role} style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #ccc', marginBottom: 4, height: 30 }} />
                <div style={{ fontSize: 9, color: 'var(--muted)' }}>{role}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="rc-footer">
            <div>
              <strong>{school.name}</strong> &nbsp;|&nbsp; {school.motto}
            </div>
            <div style={{ marginTop: 3 }}>
              Generated on {new Date().toLocaleDateString('en-KE', {
                day:'numeric', month:'long', year:'numeric'
              })} &nbsp;|&nbsp; PAAV School Portal
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
