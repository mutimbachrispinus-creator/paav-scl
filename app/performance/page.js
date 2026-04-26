'use client';
/**
 * app/performance/page.js — Advanced Performance Analytics
 * 
 * Analyzes performance across exams, terms, and subjects.
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
  
  // Filters
  const [term, setTerm] = useState('T1');
  const [assess, setAssess] = useState('et1'); // op1 | mt1 | et1
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

  const schoolStats = useMemo(() => {
    const results = {};
    ALL_GRADES.forEach(g => {
      const gLearners = learners.filter(l => l.grade === g);
      const subjects = (subjCfg[g] && subjCfg[g].length > 0) ? subjCfg[g] : (DEFAULT_SUBJECTS[g] || []);
      
      let totalPts = 0;
      let totalEntries = 0;

      gLearners.forEach(l => {
        subjects.forEach(s => {
          const score = marks[`${term}:${g}|${s}|${assess}`]?.[l.adm];
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
  }, [learners, marks, subjCfg, term, assess]);

  const subjectStats = useMemo(() => {
    const gLearners = learners.filter(l => l.grade === grade);
    const subjects = (subjCfg[grade] && subjCfg[grade].length > 0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade] || []);
    const results = [];

    subjects.forEach(s => {
      let sTotal = 0;
      let sCount = 0;
      gLearners.forEach(l => {
        const score = marks[`${term}:${grade}|${s}|${assess}`]?.[l.adm];
        if (score !== undefined) {
          sTotal += Number(score);
          sCount++;
        }
      });
      results.push({
        name: s,
        avg: sCount > 0 ? (sTotal / sCount).toFixed(1) : '—',
        count: sCount
      });
    });
    return results.sort((a, b) => (parseFloat(b.avg) || 0) - (parseFloat(a.avg) || 0));
  }, [learners, marks, subjCfg, grade, term, assess]);

  if (loading) return <div className="page on"><p>Loading analytics...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📈 Performance Analytics</h2>
          <p>School-wide and Grade-specific academic insights</p>
        </div>
        <div className="page-hdr-acts">
           <select className="input-sm" value={term} onChange={e => setTerm(e.target.value)}>
             <option value="T1">Term 1</option><option value="T2">Term 2</option><option value="T3">Term 3</option>
           </select>
           <select className="input-sm" value={assess} onChange={e => setAssess(e.target.value)}>
             <option value="op1">Opener Exam</option><option value="mt1">Mid-Term</option><option value="et1">End-Term</option>
           </select>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr"><h3>📊 School-Wide Grade Comparison</h3></div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Learners</th>
                <th>Entries</th>
                <th>Avg Points</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {ALL_GRADES.map(g => (
                <tr key={g} style={g === grade ? { background: '#F0F9FF', borderLeft: '4px solid #0EA5E9' } : {}}>
                  <td style={{ fontWeight: 700 }}>{g}</td>
                  <td>{schoolStats[g].count}</td>
                  <td>{schoolStats[g].entries}</td>
                  <td style={{ fontWeight: 700, color: '#2563EB' }}>{schoolStats[g].avg}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => setGrade(g)}>View Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sg sg2" style={{ marginTop: 25 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>📚 {grade} Subject Ranking</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Subject</th><th>Avg Score (%)</th><th>Learners</th></tr>
              </thead>
              <tbody>
                {subjectStats.map((s, i) => (
                  <tr key={i}>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ color: parseFloat(s.avg) > 50 ? '#059669' : '#DC2626', fontWeight: 700 }}>{s.avg}</td>
                    <td>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>🏆 Top Learners ({grade})</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Rank</th><th>Name</th><th>Points</th></tr>
              </thead>
              <tbody>
                {learners.filter(l => l.grade === grade).map(l => {
                  const subjects = (subjCfg[grade] && subjCfg[grade].length > 0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade] || []);
                  let pts = 0;
                  subjects.forEach(s => {
                    const score = marks[`${term}:${grade}|${s}|${assess}`]?.[l.adm];
                    if (score !== undefined) pts += gInfo(score, grade).pts;
                  });
                  return { ...l, pts };
                }).filter(l => l.pts > 0).sort((a,b) => b.pts - a.pts).slice(0, 10).map((l, i) => (
                  <tr key={i}>
                    <td>#{i+1}</td>
                    <td><strong>{l.name}</strong></td>
                    <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{l.pts}</td>
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
