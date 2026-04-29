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
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { useProfile } from '@/app/PortalShell';

const TERMS      = ['T1','T2','T3'];

const ASSESSMENTS = [
  { key: 'op1', label: '📝 Opener'   },
  { key: 'mt1', label: '📖 Mid-Term' },
  { key: 'et1', label: '📋 End-Term' },
];

export default function GradesPage() {
  const router = useRouter();
  const { playSuccessSound } = useProfile();
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
  
  const [dirtyMarks, setDirtyMarks] = useState([]); // Array of { gsa, adm, score }

  /* ── Load data ── */
  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti([
          'paav6_learners',
          'paav6_marks',
          'paav_marks_locked',
          'paav8_grad',
          'paav8_subj'
        ])
      ]);

      if (!u) { router.push('/'); return; }
      if (!['admin', 'teacher', 'senior_teacher', 'jss_teacher'].includes(u.role)) {
        router.push('/dashboard'); return;
      }
      setUser(u);
      if (u.grade && !grade) setGrade(u.grade);

      setLearners(db.paav6_learners || []);
      setMarks(   db.paav6_marks    || {});
      setLocked(  db.paav_marks_locked || {});
      setGradCfg( db.paav8_grad     || null);
      setSubjCfg( db.paav8_subj     || {});
    } catch (e) {
      console.error('Grades load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router, grade]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e) => {
      const changed = e.detail?.changed || [];
      if (changed.includes('paav6_marks') || changed.includes('paav_marks_locked')) {
        load();
      }
    };
    window.addEventListener('paav:sync', handler);
    return () => window.removeEventListener('paav:sync', handler);
  }, [load]);

  /* ── Derived ── */
  const classLearners = learners.filter(l => l.grade === grade)
    .sort((a, b) => a.name.localeCompare(b.name));
  const subjects      = (subjCfg[grade] && subjCfg[grade].length > 0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade] || []);
  const lockKey       = `${term}:${grade}:${assess}`;
  const isLocked      = !!locked[lockKey];

  /* ── Score change ── */
  function setScore(admNo, subj, value) {
    if (isLocked && user?.role !== 'admin') return;
    const gsa = `${term}:${grade}|${subj}|${assess}`;
    const score = value === '' ? undefined : Number(value);
    
    // Update local state for immediate UI feedback
    setMarks(prev => ({
      ...prev,
      [gsa]: { ...(prev[gsa] || {}), [admNo]: score },
    }));

    // Track as dirty for atomic sync
    setDirtyMarks(prev => {
      const filtered = prev.filter(m => !(m.gsa === gsa && m.adm === admNo));
      return [...filtered, { gsa, adm: admNo, score }];
    });
  }

  function getScore(admNo, subj) {
    const key = `${term}:${grade}|${subj}|${assess}`;
    return marks[key]?.[admNo];
  }

  /* ── Auto-save (Sync immediately) ── */
  useEffect(() => {
    if (loading || saving || dirtyMarks.length === 0) return;
    const timer = setTimeout(() => {
      save(true); 
    }, 1500);
    return () => clearTimeout(timer);
  }, [dirtyMarks]);

  /* ── Save ── */
  async function save(isAuto = false) {
    if (isLocked && user?.role !== 'admin') {
      if (!isAuto) setAlert({ msg: 'Marks are locked. Only admin can edit.', type: 'err' });
      return;
    }
    
    const marksToSync = [...dirtyMarks];
    if (marksToSync.length === 0 && isAuto) return;

    if (!isAuto) setSaving(true);
    
    let nextLocked = locked;
    const reqs = [];
    
    if (marksToSync.length > 0) {
      reqs.push({ type: 'updateMarksBulk', marks: marksToSync });
    }
    
    // Auto-lock for non-admins (only on manual save or first entry)
    if (!isAuto && user?.role !== 'admin' && !isLocked) {
      nextLocked = { ...locked, [lockKey]: true };
      reqs.push({ type: 'set', key: 'paav_marks_locked', value: nextLocked });
    }

    if (reqs.length === 0) {
      if (!isAuto) setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/db', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requests: reqs }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Clear dirty marks that were successfully synced
      setDirtyMarks(prev => prev.filter(m => !marksToSync.includes(m)));

      if (!isAuto) {
        playSuccessSound();
        if (user?.role !== 'admin' && !isLocked) setLocked(nextLocked);

        setAlert({ msg: '✅ Marks saved!', type: 'ok' });
        setTimeout(() => setAlert({ msg: '', type: '' }), 3000);
      }
    } catch (e) {
      console.error(e);
      if (!isAuto) setAlert({ msg: '❌ Save failed: ' + e.message, type: 'err' });
    } finally {
      if (!isAuto) setSaving(false);
    }
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

  if (loading || !user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading marks…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2>📊 Marks Entry</h2>
          {saving && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, animation: 'pulse 1.5s infinite' }}>☁️ Syncing...</span>}
          {!saving && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, opacity: 0.7 }}>✅ Synced</span>}
        </div>
        <p>CBC competency-based grading — {grade}</p>
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
          <div className="panel-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', background: '#f8fafc', borderTop: '1.5px solid var(--border)', borderRadius: '0 0 12px 12px' }}>
            <button className="btn btn-primary" onClick={() => save()} disabled={saving} style={{ padding: '10px 24px', fontSize: 14 }}>
              {saving ? '⏳ Saving…' : '💾 Save All Marks Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
