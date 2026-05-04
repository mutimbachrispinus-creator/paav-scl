'use client';
/**
 * components/MeritList.js — Ranked CBC scores display
 *
 * Presentational component used by app/merit-list/page.js
 * and the dashboard summary widget.
 *
 * Props:
 *   ranked     output of buildMeritList() from lib/cbe.js
 *   grade      e.g. 'GRADE 7'
 *   term       'T1' | 'T2' | 'T3'
 *   assessLabel e.g. 'Mid-Term'
 *   subjects   string[]
 *   maxTotal   number
 *   compact    boolean — hide subject columns (for summary widget)
 *   onView     (admNo) => void — navigate to learner profile
 */

const MEDALS  = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_BG = {
  1: { bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '#D97706' },
  2: { bg: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', border: '#94A3B8' },
  3: { bg: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', border: '#F97316' },
};

export default function MeritList({
  ranked      = [],
  grade       = '',
  term        = 'T1',
  assessLabel = 'Mid-Term',
  subjects    = [],
  maxTotal    = 0,
  compact     = false,
  onView,
}) {
  if (!ranked.length) {
    return (
      <div style={{
        padding: '28px', textAlign: 'center',
        color: 'var(--muted)', fontSize: 12.5,
        background: '#F8FAFF', borderRadius: 12,
      }}>
        No marks entered yet for {grade} — Term {term.replace('T','')} — {assessLabel}
      </div>
    );
  }

  return (
    <div>
      {/* -- Top 3 podium (hidden in compact mode) -- */}
      {!compact && ranked.length >= 1 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(ranked.length, 3)}, 1fr)`,
          gap: 12, marginBottom: 18,
        }}>
          {ranked.slice(0, 3).map(l => {
            const rb = RANK_BG[l.rank] || {};
            return (
              <div key={l.adm} style={{
                background: rb.bg || '#F8FAFF',
                borderRadius: 16, padding: '18px 14px',
                border: `3px solid ${rb.border || 'var(--border)'}`,
                textAlign: 'center', cursor: onView ? 'pointer' : 'default',
              }}
                onClick={() => onView?.(l.adm)}>
                <div style={{ fontSize: 34, marginBottom: 6 }}>{MEDALS[l.rank] || '🏅'}</div>
                <div style={{
                  fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14,
                  color: 'var(--navy)', marginBottom: 2,
                }}>
                  {l.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                  Adm: {l.adm}
                </div>
                <div style={{
                  fontFamily: 'Sora,sans-serif', fontSize: 28, fontWeight: 900,
                  color: l.rank === 1 ? '#B45309'
                       : l.rank === 2 ? '#475569' : '#C2410C',
                }}>
                  {l.totalPts}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  / {maxTotal} pts
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    background: '#DBEAFE', color: '#1D4ED8',
                    fontSize: 10, fontWeight: 700, padding: '2px 9px',
                    borderRadius: 20,
                  }}>
                    {Math.round((l.totalPts / maxTotal) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- Full table -- */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={TH}>Rank</th>
              <th style={TH}>Adm</th>
              <th style={TH}>Name</th>
              {!compact && subjects.map(s => (
                <th key={s} style={{ ...TH, minWidth: 52, fontSize: 9 }} title={s}>
                  {s.length > 5 ? s.slice(0, 5) + '…' : s}
                </th>
              ))}
              <th style={{ ...TH, textAlign: 'center' }}>Total</th>
              <th style={{ ...TH, textAlign: 'center' }}>%</th>
              {onView && <th style={TH}></th>}
            </tr>
          </thead>
          <tbody>
            {ranked.map(l => {
              const rankColor =
                l.rank === 1 ? '#B45309'
                : l.rank === 2 ? '#475569'
                : l.rank === 3 ? '#C2410C'
                : 'var(--navy)';
              const pct = maxTotal > 0 ? Math.round((l.totalPts / maxTotal) * 100) : 0;
              return (
                <tr key={l.adm}
                  style={{
                    background: l.rank <= 3
                      ? (RANK_BG[l.rank]?.bg || 'transparent')
                      : 'transparent',
                    borderLeft: l.rank <= 3
                      ? `4px solid ${RANK_BG[l.rank]?.border}`
                      : 'none',
                  }}>
                  <td style={TD}>
                    <span style={{
                      fontFamily: 'Sora,sans-serif', fontWeight: 800,
                      fontSize: 15, color: rankColor,
                    }}>
                      {MEDALS[l.rank] || `#${l.rank}`}
                    </span>
                  </td>
                  <td style={{ ...TD, fontWeight: 700, fontSize: 11.5 }}>{l.adm}</td>
                  <td style={{ ...TD, fontWeight: 600 }}>{l.name}</td>

                  {!compact && l.detail.map(d => (
                    <td key={d.subj} style={{ ...TD, textAlign: 'center' }}>
                      {d.score !== null ? (
                        <span style={{
                          background: d.bg, color: d.c,
                          fontWeight: 700, fontSize: 9,
                          padding: '1px 5px', borderRadius: 4,
                          display: 'inline-block',
                        }}>
                          {d.lv}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>—</span>
                      )}
                    </td>
                  ))}

                  <td style={{ ...TD, textAlign: 'center', fontWeight: 800,
                    fontSize: 14, color: 'var(--navy)' }}>
                    {l.totalPts}
                  </td>
                  <td style={{
                    ...TD, textAlign: 'center', fontWeight: 700,
                    color: pct >= 50 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {pct}%
                  </td>
                  {onView && (
                    <td style={TD}>
                      <button
                        onClick={() => onView(l.adm)}
                        style={{
                          padding: '4px 10px', border: '1.5px solid var(--border)',
                          borderRadius: 6, background: 'none', cursor: 'pointer',
                          fontSize: 12, color: 'var(--muted)',
                        }}>
                        👁
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TH = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.6px',
  color: '#64748B',
  background: 'linear-gradient(180deg,#F8FAFC,#F1F5F9)',
  borderBottom: '2px solid #E4EAF8',
  whiteSpace: 'nowrap',
};

const TD = {
  padding: '9px 12px',
  borderBottom: '1px solid #F1F5F9',
  verticalAlign: 'middle',
};
