'use client';
/**
 * app/performance/page.js — School Performance Analytics
 *
 * Provides analytical views of:
 *   • Grade-wise average points
 *   • Subject-wise performance trends
 *   • Top performing students per grade
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES, gInfo, DEFAULT_SUBJECTS } from '@/lib/cbe';

export default function PerformancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [marks, setMarks] = useState({});
  const [subjCfg, setSubjCfg] = useState({});
  const [grade, setGrade] = useState('GRADE 7');

  useEffect(() => {
    async function load() {
      try {
        const [authRes, dbRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [
              { type: 'get', key: 'paav6_learners' },
              { type: 'get', key: 'paav6_marks' },
              { type: 'get', key: 'paav8_subj' }
            ]})
          })
        ]);
        const auth = await authRes.json();
        if (!auth.ok) { router.push('/'); return; }

        const db = await dbRes.json();
        setLearners(db.results[0]?.value || []);
        setMarks(db.results[1]?.value || {});
        setSubjCfg(db.results[2]?.value || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const stats = useMemo(() => {
    const results = {};
    ALL_GRADES.forEach(g => {
      const gLearners = learners.filter(l => l.grade === g);
      const subjects = (subjCfg[g] && subjCfg[g].length > 0) ? subjCfg[g] : (DEFAULT_SUBJECTS[g] || []);
      
      let totalPts = 0;
      let totalEntries = 0;

      gLearners.forEach(l => {
        subjects.forEach(s => {
          const score = marks[`T1:${g}|${s}|et1`]?.[l.adm];
          if (score !== undefined) {
            totalPts += gInfo(score, g).pts;
            totalEntries++;
          }
        });
      });

      results[g] = {
        avg: totalEntries > 0 ? (totalPts / totalEntries).toFixed(2) : '0.00',
        count: gLearners.length,
        entries: totalEntries
      };
    });
    return results;
  }, [learners, marks, subjCfg]);

  if (loading) return <div className="page on"><p>Loading performance data...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📈 Performance Analytics</h2>
          <p>School-wide academic trends and insights</p>
        </div>
      </div>

      <div className="sg sg4">
        {ALL_GRADES.slice(0, 4).map(g => (
          <div key={g} className="stat-card">
            <div className="sc-inner">
              <div className="sc-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>📊</div>
              <div>
                <div className="sc-n">{stats[g].avg}</div>
                <div className="sc-l">{g} AVG PTS</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <h3>Grade-wise Comparison</h3>
        </div>
        <div className="panel-body">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Learners</th>
                  <th>Total Entries (T1)</th>
                  <th>Average Points</th>
                  <th>Performance Level</th>
                </tr>
              </thead>
              <tbody>
                {ALL_GRADES.map(g => (
                  <tr key={g}>
                    <td style={{ fontWeight: 700 }}>{g}</td>
                    <td>{stats[g].count}</td>
                    <td>{stats[g].entries}</td>
                    <td style={{ fontWeight: 700, color: '#2563EB' }}>{stats[g].avg}</td>
                    <td>
                      <span className={`badge bg-${parseFloat(stats[g].avg) > 5 ? 'green' : 'amber'}`}>
                        {parseFloat(stats[g].avg) > 5 ? 'Strong' : 'Average'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
