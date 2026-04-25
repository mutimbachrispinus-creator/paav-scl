'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_SUBJECTS, calcLearnerPoints, promotionStatus, ALL_GRADES } from '@/lib/cbe';

export default function PredictorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [marks, setMarks] = useState({});
  const [gradCfg, setGradCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selGrade, setSelGrade] = useState('GRADE 9');
  const [selTerm, setSelTerm] = useState('T1');
  const [selAssess, setSelAssess] = useState('mt1');

  const load = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth');
      const auth = await authRes.json();
      if (!auth.ok || !auth.user || auth.user.role === 'parent') {
        router.push('/');
        return;
      }
      setUser(auth.user);

      const dbRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            { type: 'get', key: 'paav6_learners' },
            { type: 'get', key: 'paav6_marks' },
            { type: 'get', key: 'paav8_grad' }
          ]
        })
      });
      const db = await dbRes.json();
      
      setLearners(db.results[0]?.value || []);
      setMarks(db.results[1]?.value || {});
      setGradCfg(db.results[2]?.value || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="page on" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading predictor...</div>;

  const subjects = DEFAULT_SUBJECTS[selGrade] || [];
  
  // Calculate stats for the selected grade
  const gradeLearners = learners.filter(l => l.grade === selGrade).map(l => {
    const pts = calcLearnerPoints(marks, l.adm, selGrade, selTerm, selAssess, subjects, gradCfg);
    const status = promotionStatus(pts.totalPts, pts.maxTotal);
    return { ...l, ...pts, status };
  }).filter(l => l.enteredCount > 0);

  gradeLearners.sort((a, b) => b.totalPts - a.totalPts);

  const stats = {
    promote: gradeLearners.filter(l => l.status === 'promote').length,
    review: gradeLearners.filter(l => l.status === 'review').length,
    retain: gradeLearners.filter(l => l.status === 'retain').length,
  };

  return (
    <div className="page on" id="pg-predictor">
      <div className="page-hdr">
        <div>
          <h2>🎯 Performance Predictor</h2>
          <p>Forecast learner trajectories based on current CBC points</p>
        </div>
        <div className="page-hdr-acts no-print">
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print Report</button>
        </div>
      </div>

      <div className="panel no-print">
        <div className="panel-body" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label>Grade</label>
            <select value={selGrade} onChange={e => setSelGrade(e.target.value)}>
              {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, minWidth: '120px' }}>
            <label>Term</label>
            <select value={selTerm} onChange={e => setSelTerm(e.target.value)}>
              <option value="T1">Term 1</option>
              <option value="T2">Term 2</option>
              <option value="T3">Term 3</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, minWidth: '120px' }}>
            <label>Assessment</label>
            <select value={selAssess} onChange={e => setSelAssess(e.target.value)}>
              <option value="op1">Opener</option>
              <option value="mt1">Mid-Term</option>
              <option value="et1">End-Term</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sg sg3" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#ECFDF5' }}>📈</div>
            <div>
              <div className="sc-n" style={{ color: 'var(--green)' }}>{stats.promote}</div>
              <div className="sc-l">On Track (Promote)</div>
              <div className="sc-sub" style={{ background: '#ECFDF5', color: 'var(--green)' }}>≥ 50% points</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#FEF3C7' }}>👀</div>
            <div>
              <div className="sc-n" style={{ color: 'var(--amber)' }}>{stats.review}</div>
              <div className="sc-l">Needs Review</div>
              <div className="sc-sub" style={{ background: '#FEF3C7', color: 'var(--amber)' }}>30% - 49% points</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#FEE2E2' }}>⚠</div>
            <div>
              <div className="sc-n" style={{ color: 'var(--red)' }}>{stats.retain}</div>
              <div className="sc-l">Critical (Retain)</div>
              <div className="sc-sub" style={{ background: '#FEE2E2', color: 'var(--red)' }}>&lt; 30% points</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <h3>📋 Prediction Breakdown — {selGrade}</h3>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Based on {selTerm} {selAssess.toUpperCase()}</span>
        </div>
        <div className="panel-body">
          {gradeLearners.length > 0 ? (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Adm</th>
                    <th>Name</th>
                    <th style={{ textAlign: 'center' }}>Subjects</th>
                    <th style={{ textAlign: 'center' }}>Total Points</th>
                    <th style={{ textAlign: 'center' }}>Performance</th>
                    <th style={{ textAlign: 'center' }}>Trajectory</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeLearners.map(l => {
                    const pct = Math.round((l.totalPts / l.maxTotal) * 100);
                    const tColor = l.status === 'promote' ? 'var(--green)' : l.status === 'review' ? 'var(--amber)' : 'var(--red)';
                    const tBg = l.status === 'promote' ? '#ECFDF5' : l.status === 'review' ? '#FEF3C7' : '#FEE2E2';
                    const tLabel = l.status === 'promote' ? 'On Track' : l.status === 'review' ? 'Review' : 'Critical';
                    
                    return (
                      <tr key={l.adm}>
                        <td>{l.adm}</td>
                        <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{l.name}</td>
                        <td style={{ textAlign: 'center' }}>{l.enteredCount} / {subjects.length}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{l.totalPts} <span style={{ fontSize: '10px', color: 'var(--muted)' }}>/ {l.maxTotal}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#EEF2FF', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: tColor }}></div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, width: '30px' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{ background: tBg, color: tColor }}>{tLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>
              No graded learners found for {selGrade} ({selTerm} {selAssess.toUpperCase()})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
