'use client';
/**
 * components/ReportCard.js — PDF-ready A4 report card layout component
 *
 * Pure presentational component — receives all data as props.
 * Used by app/grades/report-card/[id]/page.js and the bulk-print flow.
 *
 * Props:
 *   learner    { name, adm, grade, sex, age, dob, stream, teacher, parent, phone }
 *   rows       [{ subj, cells: [{ score, inf }] }]   one row per subject
 *   term       'T1' | 'T2' | 'T3'
 *   year       e.g. 2026
 *   feeBal     number (balance in KSH; ≤0 = cleared)
 *   scale      JSS_SCALE or PRIMARY_SCALE array
 *   school     { name, motto }
 *   promoSt    'promote' | 'review' | 'retain'
 */

import { ASSESSMENTS } from './ReportCard.constants';

export default function ReportCard({
  learner,
  rows      = [],
  term      = 'T1',
  year      = new Date().getFullYear(),
  feeBal    = 0,
  scale     = [],
  school    = { name: 'SCHOOL PORTAL', motto: 'Quality Education' },
  promoSt   = 'review',
}) {
  /* -- End-term totals -- */
  const etCells  = rows.map(r => r.cells[2]);
  const entered  = etCells.filter(c => c.score !== undefined);
  const totalPts = entered.reduce((s, c) => s + (c.inf?.pts || 0), 0);
  const maxPts   = rows.length * (scale.length === 8 ? 8 : 4);

  return (
    <div className="rc-a4">
      {/* -- Header -- */}
      <div className="rc-hdr">
        <div className="rc-school">🏫 {school.name}</div>
        <div style={{ fontSize: 11, color: '#64748B', margin: '2px 0' }}>
          {school.address || 'Smart School Management'} &nbsp;|&nbsp; {school.phone || 'Digital Education'}
        </div>
        <div style={{
          fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 700,
          color: '#8B1A1A', margin: '6px 0 2px',
        }}>
          ACADEMIC PROGRESS REPORT — TERM {term.replace('T','')} · {year}
        </div>
        <div className="rc-motto">{school.motto}</div>
      </div>

      {/* -- Learner info -- */}
      <div className="rc-learner-info">
        {[
          ['Name',            learner.name          ],
          ['Adm No.',         learner.adm           ],
          ['Grade',           learner.grade         ],
          ['Sex',             learner.sex           ],
          ['Stream',          learner.stream || '—' ],
          ['Class Teacher',   learner.teacher || '—'],
          ['Parent/Guardian', learner.parent || '—' ],
          ['Phone',           learner.phone  || '—' ],
        ].map(([label, val]) => (
          <div key={label} className="rc-info-row">
            <span className="rc-info-label">{label}</span>
            <strong style={{ fontSize: 11, color: '#0F172A' }}>{val}</strong>
          </div>
        ))}
      </div>

      {/* -- Subject table -- */}
      <table className="rc-subj-table">
        <thead>
          <tr>
            <th>Learning Area / Subject</th>
            <th style={{ textAlign: 'center' }}>Opener</th>
            <th style={{ textAlign: 'center' }}>Mid-Term</th>
            <th style={{ textAlign: 'center' }}>End-Term</th>
            <th style={{ textAlign: 'center' }}>Level</th>
            <th style={{ textAlign: 'center' }}>Pts</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ subj, cells }) => {
            const et = cells[2];
            return (
              <tr key={subj}>
                <td style={{ fontWeight: 600 }}>{subj}</td>
                {cells.map((c, ci) => (
                  <td key={ci} style={{ textAlign: 'center', fontWeight: 700 }}>
                    {c.score !== undefined ? c.score : '—'}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                  {et.inf ? (
                    <span style={{
                      fontWeight: 800, color: et.inf.c, background: et.inf.bg,
                      padding: '1px 6px', borderRadius: 4, fontSize: 9.5,
                    }}>
                      {et.inf.lv}
                    </span>
                  ) : '—'}
                </td>
                <td style={{
                  textAlign: 'center', fontWeight: 800,
                  color: et.inf ? et.inf.c : '#94A3B8',
                }}>
                  {et.inf ? et.inf.pts : '—'}
                </td>
                <td style={{ fontSize: 9, color: '#94A3B8' }}>
                  {et.inf ? et.inf.desc.split(' — ')[0] : '—'}
                </td>
              </tr>
            );
          })}

          {/* Total row */}
          {entered.length > 0 && (
            <tr className="rc-total-row">
              <td colSpan="5" style={{ paddingLeft: 12 }}>
                TOTAL POINTS ({entered.length}/{rows.length} subjects)
              </td>
              <td style={{ textAlign: 'center', fontSize: 14 }}>
                {totalPts} / {maxPts}
              </td>
              <td style={{ fontSize: 10 }}>
                {Math.round((totalPts / maxPts) * 100)}%
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* -- Grade scale legend -- */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          color: '#94A3B8', marginBottom: 4, letterSpacing: '.5px',
        }}>
          CBC Grading Scale:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {scale.map(s => (
            <span key={s.lv} style={{
              background: s.bg, color: s.c, fontWeight: 700,
              fontSize: 9, padding: '2px 7px', borderRadius: 4,
            }}>
              {s.lv}: {s.min}+ ({s.pts}pts)
            </span>
          ))}
        </div>
      </div>

      {/* -- Summary boxes -- */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12,
      }}>
        <SummaryBox
          label="Recommendation"
          value={
            promoSt === 'promote' ? '✅ PROMOTED'
            : promoSt === 'review' ? '⚠ UNDER REVIEW'
            : '❌ RETAIN'
          }
          color={
            promoSt === 'promote' ? '#059669'
            : promoSt === 'review' ? '#D97706'
            : '#DC2626'
          }
        />
        <SummaryBox
          label="Fee Balance"
          value={feeBal <= 0 ? '✅ CLEARED' : `KSH ${feeBal.toLocaleString()} OWING`}
          color={feeBal <= 0 ? '#059669' : '#DC2626'}
        />
      </div>

      {/* -- Signature lines -- */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 20, marginBottom: 12, marginTop: 16,
      }}>
        {['Class Teacher', 'Head Teacher', 'Parent / Guardian'].map(role => (
          <div key={role} style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #ccc', marginBottom: 4, height: 28 }} />
            <div style={{ fontSize: 9, color: '#94A3B8' }}>{role}</div>
          </div>
        ))}
      </div>

      {/* -- Footer -- */}
      <div className="rc-footer">
        <div><strong>{school.name}</strong> &nbsp;|&nbsp; {school.motto}</div>
        <div style={{ marginTop: 3 }}>
          Generated {new Date().toLocaleDateString('en-KE', {
            day: 'numeric', month: 'long', year: 'numeric',
          })} &nbsp;|&nbsp; PAAV Portal
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div style={{
      padding: '10px 12px', background: '#F8FAFF',
      borderRadius: 8, border: '1.5px solid #E4EAF8',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        color: '#94A3B8', marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 13, color }}>
        {value}
      </div>
    </div>
  );
}
