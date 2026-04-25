'use client';
/**
 * app/grades/page.js — CBC Marks Entry & Grading
 *
 * Features:
 *   • Select grade, term, assessment type
 *   • Inline marks entry table (score → auto-computes CBC level + points)
 *   • Lock/unlock marks per assessment (admin only)
 *   • Save marks to Turso via /api/db
 *   • Print / PDF class marks
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ALL_GRADES, DEFAULT_SUBJECTS, gInfo, maxPts,
  JSS_SCALE, PRIMARY_SCALE, isJSSGrade,
} from '@/lib/cbe';
import { usePersistedState } from '@/components/TabState';

const TERMS      = ['T1','T2','T3'];
const ASSESSMENTS = [
  { key: 'op1', label: '📝 Opener'   },
  { key: 'mt1', label: '📖 Mid-Term' },
  { key: 'et1', label: '📋 End-Term' },
];

export default function GradesPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [learners, setLearners] = useState([]);
  const [marks,    setMarks]    = useState({});
  const [locked,   setLocked]   = useState({});
  const [subjCfg,  setSubjCfg]  = useState({});
  const [gradCfg,  setGradCfg]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [alert,    setAlert]    = useState({ msg: '', type: '' });

  const [grade,  setGrade]  = usePersistedState('paav_grades_grade',  'GRADE 7');
  const [term,   setTerm]   = usePersistedState('paav_grades_term',   'T1');
  const [assess, setAssess] = usePersistedState('paav_grades_assess', 'mt1');

  /* ── Load data ── */
  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth    = await authRes.json();
    if (!auth.ok) { router.push('/'); return; }
    if (!['admin','teacher'].includes(auth.user?.role)) {
      router.push('/dashboard'); return;
    }
    setUser(auth.user);
    if (auth.user.grade) setGrade(auth.user.grade);

    const dbRes = await fetch('/api/db', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: [
        { type: 'get', key: 'paav6_learners'  },
        { type: 'get', key: 'paav6_marks'     },
        { type: 'get', key: 'paav_marks_locked' },
        { type: 'get', key: 'paav8_grad'      },
        { type: 'get', key: 'paav8_subj'      },
      ]}),
    });
    const db = await dbRes.json();
    setLearners(db.results[0]?.value || []);
    setMarks(   db.results[1]?.value || {});
    setLocked(  db.results[2]?.value || {});
    setGradCfg( db.results[3]?.value || null);
    setSubjCfg( db.results[4]?.value || {});
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  /* ── Derived ── */
  const classLearners = learners.filter(l => l.grade === grade)
    .sort((a, b) => a.name.localeCompare(b.name));
  const subjects      = (subjCfg[grade] && subjCfg[grade].length > 0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade] || []);
  const lockKey       = `${term}:${grade}:${assess}`;
  const isLocked      = !!locked[lockKey];

  /* ── Score change ── */
  function setScore(admNo, subj, value) {
    if (isLocked && user?.role !== 'admin') return;
    const key = `${term}:${grade}|${subj}|${assess}`;
    setMarks(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [admNo]: value === '' ? undefined : Number(value) },
    }));
  }

  function getScore(admNo, subj) {
    const key = `${term}:${grade}|${subj}|${assess}`;
    return marks[key]?.[admNo];
  }

  /* ── Save ── */
  async function save() {
    if (isLocked && user?.role !== 'admin') {
      setAlert({ msg: 'Marks are locked. Only admin can edit.', type: 'err' });
      return;
    }
    setSaving(true);
    await fetch('/api/db', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: [
        { type: 'set', key: 'paav6_marks', value: marks },
      ]}),
    });
    setSaving(false);
    setAlert({ msg: '✅ Marks saved!', type: 'ok' });
    setTimeout(() => setAlert({ msg: '', type: '' }), 3000);
  }

  /* ── Lock toggle (admin only) ── */
  async function toggleLock() {
    const next = { ...locked, [lockKey]: !isLocked };
    setLocked(next);
    await fetch('/api/db', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: [
        { type: 'set', key: 'paav_marks_locked', value: next },
      ]}),
    });
  }

  /* ── Grade scale pills ── */
  const scale = isJSSGrade(grade) ? JSS_SCALE : PRIMARY_SCALE;

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading marks…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📊 Marks Entry</h2>
          <p>CBC competency-based grading — {grade}</p>
        </div>
        <div className="page-hdr-acts">
          {user?.role === 'admin' && (
            <button
              className={`btn btn-sm ${isLocked ? 'btn-success' : 'btn-danger'}`}
              onClick={toggleLock}>
              {isLocked ? '🔓 Unlock Marks' : '🔒 Lock Marks'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>
            🖨️ Print
          </button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? '⏳ Saving…' : '💾 Save Marks'}
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      {alert.msg && (
        <div className={`alert show alert-${alert.type}`} style={{ display: 'flex', marginBottom: 14 }}>
          {alert.msg}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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

          {isLocked && (
            <div style={{ padding: '8px 14px',
              background: user?.role === 'admin' ? '#ECFDF5' : '#FEF2F2',
              borderRadius: 8, fontSize: 12,
              color: user?.role === 'admin' ? 'var(--green)' : 'var(--red)',
              fontWeight: 700,
              border: `1.5px solid ${user?.role === 'admin' ? '#A7F3D0' : '#FECACA'}`,
              display: 'flex', alignItems: 'center', gap: 6 }}>
              {user?.role === 'admin'
                ? '🔓 Locked — Admin override active (your edits will save)'
                : '🔒 Marks locked — contact admin to unlock'}
            </div>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {classLearners.length} learner{classLearners.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Grade scale bar */}
        <div className="grading-scale-bar">
          <span className="gs-label">CBC Scale:</span>
          {scale.map(s => (
            <span key={s.lv} className="grade-item-pill"
              style={{ background: s.bg, color: s.c }}>
              {s.lv} ({s.min}+ → {s.pts}pts)
            </span>
          ))}
        </div>
      </div>

      {/* ── Marks table ── */}
      {classLearners.length === 0 ? (
        <div className="panel">
          <div className="panel-body" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
            No learners enrolled in {grade}.{' '}
            <button className="btn-link" onClick={() => router.push('/learners')}>
              Add learners →
            </button>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 32 }}>#</th>
                  <th style={{ minWidth: 60 }}>Adm</th>
                  <th style={{ minWidth: 140 }}>Name</th>
                  {subjects.map(s => (
                    <th key={s} style={{ minWidth: 68, textAlign: 'center', fontSize: 9 }}
                      title={s}>
                      {s.length > 8 ? s.slice(0, 8) + '…' : s}
                    </th>
                  ))}
                  <th style={{ minWidth: 60, textAlign: 'center' }}>Pts</th>
                  <th style={{ minWidth: 52, textAlign: 'center' }}>Max</th>
                  <th style={{ minWidth: 52, textAlign: 'center' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {classLearners.map((l, i) => {
                  let totalPts  = 0;
                  let entered   = 0;
                  const maxTotal = maxPts(grade, subjects);

                  return (
                    <tr key={l.adm}>
                      <td style={{ color: 'var(--muted)', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, fontSize: 11.5 }}>{l.adm}</td>
                      <td style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{l.name}</td>

                      {subjects.map(subj => {
                        const sc  = getScore(l.adm, subj);
                        const inf = sc !== undefined ? gInfo(Number(sc), grade, gradCfg) : null;
                        if (inf) { totalPts += inf.pts; entered++; }
                        return (
                          <td key={subj} style={{ padding: '4px 5px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column',
                              alignItems: 'center', gap: 2 }}>
                              <input
                                type="number"
                                min="0" max="100"
                                value={sc ?? ''}
                                onChange={e => setScore(l.adm, subj, e.target.value)}
                                disabled={isLocked && user?.role !== 'admin'}
                                title={isLocked && user?.role === 'admin' ? 'Admin override — you can edit' : ''}
                                style={{
                                  width: 48, textAlign: 'center',
                                  border: `1.5px solid ${
                                    isLocked && user?.role === 'admin' ? '#059669'  // green = admin override
                                    : inf ? inf.c
                                    : 'var(--border)'
                                  }`,
                                  borderRadius: 6, padding: '3px 4px', fontSize: 11.5, outline: 'none',
                                  background: isLocked && user?.role !== 'admin'
                                    ? '#F1F5F9'                          // grey = locked for teacher
                                    : isLocked ? '#ECFDF5'              // light green = admin override
                                    : '#fff',
                                  cursor: isLocked && user?.role !== 'admin' ? 'not-allowed' : 'text',
                                }}
                              />
                              {inf && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: inf.c,
                                  background: inf.bg, borderRadius: 4, padding: '1px 5px' }}>
                                  {inf.lv}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 13,
                        color: entered > 0 ? 'var(--navy)' : 'var(--muted)' }}>
                        {entered > 0 ? totalPts : '—'}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
                        {maxTotal}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 11.5,
                        color: entered > 0
                          ? totalPts / maxTotal >= 0.5 ? 'var(--green)' : 'var(--red)'
                          : 'var(--muted)' }}>
                        {entered > 0 ? Math.round((totalPts / maxTotal) * 100) + '%' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
