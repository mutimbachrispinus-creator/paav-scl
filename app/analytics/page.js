'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { getAllGrades, getDefaultSubjects, calcLearnerPoints } from '@/lib/cbe';
import { useProfile } from '@/app/PortalShell';

const M = '#8B1A1A', M2 = '#6B1212', ML = '#FDF2F2', MB = '#F5E6E6';
const TERMS = ['T1', 'T2', 'T3'];
const ASSESS = ['op1', 'mt1', 'et1'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { profile: school } = useProfile();
  const ALL_GRADES = getAllGrades(school?.curriculum || 'CBC');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [paylog, setPaylog] = useState([]);
  const [marks, setMarks] = useState({});
  const [feeCfg, setFeeCfg] = useState({});
  const [tab, setTab] = useState('school'); 
  const [selGrade, setSelGrade] = useState('');
  const [selAdm, setSelAdm] = useState('');

  useEffect(() => {
    if (!selGrade && ALL_GRADES.length > 0) setSelGrade(ALL_GRADES[0]);
  }, [ALL_GRADES, selGrade]);

  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti(['paav6_learners', 'paav6_paylog', 'paav6_marks', 'paav6_feecfg'])
      ]);

      if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
      setUser(u);
      setLearners(db.paav6_learners || []);
      setPaylog(db.paav6_paylog || []);
      setMarks(db.paav6_marks || {});
      setFeeCfg(db.paav6_feecfg || {});
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filteredLearners = useMemo(() => learners.filter(l => l.grade === selGrade), [learners, selGrade]);
  const learner = useMemo(() => learners.find(l => l.adm === selAdm), [learners, selAdm]);

  /* ── AI Early Warning System ── */
  const warnings = useMemo(() => {
    const list = [];
    learners.forEach(l => {
      const subjects = getDefaultSubjects(l.grade, school?.curriculum || 'CBC');
      const mt1 = calcLearnerPoints(marks, l.adm, l.grade, 'T1', 'mt1', subjects, null, school?.curriculum || 'CBC');
      const et1 = calcLearnerPoints(marks, l.adm, l.grade, 'T1', 'et1', subjects, null, school?.curriculum || 'CBC');
      if (mt1.enteredCount > 0 && et1.enteredCount > 0) {
        const mt1Avg = Math.round((mt1.totalPts / mt1.maxTotal) * 100);
        const et1Avg = Math.round((et1.totalPts / et1.maxTotal) * 100);
        const drop = mt1Avg - et1Avg;
        if (drop > 7) list.push({ ...l, oldAvg: mt1Avg, curAvg: et1Avg, drop });
      }
    });
    return list.sort((a,b) => b.drop - a.drop);
  }, [learners, marks, school?.curriculum]);

  /* ── School Data Processing ── */
  const schoolStats = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const collection = months.map((m, i) => {
      const total = paylog.filter(p => Number(p.date.split('/')[1]) === (i + 1)).reduce((s, p) => s + Number(p.amount), 0);
      return { name: m, amount: total };
    });

    const perf = ALL_GRADES.map(g => {
      const lInG = learners.filter(l => l.grade === g);
      let total = 0, count = 0;
      lInG.forEach(l => Object.keys(marks).forEach(k => { if (marks[k][l.adm]) { total += Number(marks[k][l.adm]); count++; } }));
      return { name: g.replace('GRADE ', 'G'), avg: count ? Math.round(total / count) : 0 };
    }).filter(d => d.avg > 0);

    return { collection, perf };
  }, [paylog, learners, marks]);

  /* ── Student Data Processing ── */
  const trendData = useMemo(() => {
    if (!learner) return [];
    const subjects = getDefaultSubjects(learner.grade, school?.curriculum || 'CBC');
    const data = [];
    TERMS.forEach(t => ASSESS.forEach(a => {
      const stats = calcLearnerPoints(marks, learner.adm, learner.grade, t, a, subjects, null, school?.curriculum || 'CBC');
      if (stats.enteredCount > 0) data.push({ name: `${t} ${a.toUpperCase().replace('1','')}`, score: Math.round((stats.totalPts / stats.maxTotal) * 100) });
    }));
    return data;
  }, [learner, marks, school?.curriculum]);

  const radarData = useMemo(() => {
    if (!learner) return [];
    const subjects = getDefaultSubjects(learner.grade, school?.curriculum || 'CBC');
    const clusters = {
      'Languages': ['English', 'Kiswahili', 'Language', 'Kusoma', 'Reading'],
      'Sciences': ['Mathematics', 'Science', 'Integrated Science', 'Biology', 'Chemistry', 'Physics', 'Environmental'],
      'Humanities': ['Social Studies', 'History', 'Geography', 'CRE', 'IRE', 'Life Skills'],
      'Arts/Sports': ['Art', 'Music', 'Physical Education', 'Creative']
    };
    return Object.entries(clusters).map(([name, keywords]) => {
      let total = 0, maxTotal = 0;
      subjects.forEach(s => {
        if (keywords.some(k => s.toLowerCase().includes(k.toLowerCase()))) {
          const stats = calcLearnerPoints(marks, learner.adm, learner.grade, 'T1', 'et1', [s], null, school?.curriculum || 'CBC');
          if (stats.enteredCount > 0) { total += stats.totalPts; maxTotal += stats.maxTotal; }
        }
      });
      return { subject: name, A: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0, fullMark: 100 };
    });
  }, [learner, marks, school?.curriculum]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Analyzing performance trends…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📊 Analytics Command Center</h2>
          <p>Holistic view of performance analytics</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 25, background: MB, borderRadius: 12, padding: 5 }}>
        <button className={`tab-btn ${tab === 'school' ? 'on' : ''}`} onClick={() => setTab('school')} style={tab === 'school' ? { background: M, color: '#fff' } : {}}>🏫 School</button>
        <button className={`tab-btn ${tab === 'student' ? 'on' : ''}`} onClick={() => setTab('student')} style={tab === 'student' ? { background: M, color: '#fff' } : {}}>👤 Individual</button>
        <button className={`tab-btn ${tab === 'warning' ? 'on' : ''}`} onClick={() => setTab('warning')} style={tab === 'warning' ? { background: M, color: '#fff' } : {}}>⚠️ Early Warning {warnings.length > 0 && <span className="badge bg-red" style={{ marginLeft: 5 }}>{warnings.length}</span>}</button>
      </div>

      {tab === 'warning' ? (
        <div className="panel">
          <div className="panel-hdr">
            <h3>⚠️ Academic Risk Report (AI Analysis)</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Students with {'>'}7% drop between Mid-Term and End-Term</p>
          </div>
          <div className="panel-body">
            {warnings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 100, color: 'var(--green)', fontWeight: 700 }}>✅ No students currently flagged for academic risk.</div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Grade</th>
                      <th>Previous Avg</th>
                      <th>Current Avg</th>
                      <th>Drop</th>
                      <th>Intervention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warnings.map(w => (
                      <tr key={w.adm}>
                        <td><strong>{w.name}</strong></td>
                        <td>{w.grade}</td>
                        <td>{w.oldAvg}%</td>
                        <td style={{ fontWeight: 700 }}>{w.curAvg}%</td>
                        <td style={{ color: '#DC2626', fontWeight: 900 }}>↓ {w.drop}%</td>
                        <td><button className="btn btn-sm btn-gold" onClick={() => { setSelGrade(w.grade); setSelAdm(w.adm); setTab('student'); }}>View Trends</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : tab === 'school' ? (
        <>
          <div className="sg sg3" style={{ marginBottom: 20 }}>
            <div className="panel" style={{ textAlign: 'center', borderTop: `4px solid ${M}` }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>COLLECTION</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: M }}>
                {Math.round(paylog.reduce((s,p)=>s+Number(p.amount),0) / learners.reduce((s,l)=>s+(feeCfg[l.grade]?.annual||5000), 0) * 100)}%
              </div>
            </div>
            <div className="panel" style={{ textAlign: 'center', borderTop: `4px solid #16A34A` }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>ACADEMIC MEAN</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16A34A' }}>
                {Math.round(schoolStats.perf.reduce((s,p)=>s+p.avg,0)/schoolStats.perf.length)}%
              </div>
            </div>
            <div className="panel" style={{ textAlign: 'center', borderTop: `4px solid #0369A1` }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>ENROLMENT</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0369A1' }}>{learners.length}</div>
            </div>
          </div>

          <div className="sg sg2">
            <div className="panel">
              <div className="panel-hdr"><h3>💰 Collection Trend</h3></div>
              <div className="panel-body" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={schoolStats.collection}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={M} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={M} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                    <Tooltip />
                    <Area type="monotone" dataKey="amount" stroke={M} fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="panel">
              <div className="panel-hdr"><h3>📊 Academic Average by Grade</h3></div>
              <div className="panel-body" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={schoolStats.perf}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avg" fill="#16A34A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-body" style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
              <div className="field" style={{ marginBottom: 0, minWidth: 150 }}>
                <label>Grade</label>
                <select value={selGrade} onChange={e => { setSelGrade(e.target.value); setSelAdm(''); }}>
                  {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                <label>Learner</label>
                <select value={selAdm} onChange={e => setSelAdm(e.target.value)}>
                  <option value="">— Choose Learner —</option>
                  {filteredLearners.map(l => <option key={l.adm} value={l.adm}>{l.name} ({l.adm})</option>)}
                </select>
              </div>
            </div>
          </div>

          {!learner ? (
            <div className="panel" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Select a learner above to view detailed analytics</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="panel">
                <div className="panel-hdr"><h3>📈 Termly Progress — {learner.name}</h3></div>
                <div className="panel-body" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} axisLine={false} />
                      <YAxis domain={[0, 100]} fontSize={11} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke={M} strokeWidth={4} dot={{ r: 6, fill: M }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="sg sg2">
                <div className="panel">
                  <div className="panel-hdr"><h3>🕸 Competency Radar</h3></div>
                  <div className="panel-body" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={learner.name} dataKey="A" stroke={M} fill={M} fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="panel" style={{ border: `2px solid ${M}`, background: ML }}>
                  <div className="panel-hdr"><h3 style={{ color: M }}>🤖 AI Feedback</h3></div>
                  <div className="panel-body">
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                      Strongest: <strong>{radarData.sort((a,b)=>b.A-a.A)[0]?.subject}</strong>.<br/>
                      Focus: <strong>{radarData.sort((a,b)=>a.A-b.A)[0]?.subject}</strong>.
                    </p>
                    <ul style={{ fontSize: 12, color: '#475569', paddingLeft: 15, marginTop: 10 }}>
                      <li>Maintain current study habits in language units.</li>
                      <li>Review science fundamentals to boost overall mean.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
