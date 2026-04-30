'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
} from 'recharts';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { ALL_GRADES, DEFAULT_SUBJECTS, calcLearnerPoints } from '@/lib/cbe';

const M = '#8B1A1A', M2 = '#6B1212', ML = '#FDF2F2', MB = '#F5E6E6';
const TERMS = ['T1', 'T2', 'T3'];
const ASSESS = ['op1', 'mt1', 'et1'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [paylog, setPaylog] = useState([]);
  const [marks, setMarks] = useState({});
  const [feeCfg, setFeeCfg] = useState({});
  const [tab, setTab] = useState('school'); // school | student
  const [selAdm, setSelAdm] = useState('');

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
  const learner = useMemo(() => learners.find(l => l.adm === selAdm), [learners, selAdm]);
  const trendData = useMemo(() => {
    if (!learner) return [];
    const subjects = DEFAULT_SUBJECTS[learner.grade] || [];
    const data = [];
    TERMS.forEach(t => ASSESS.forEach(a => {
      const stats = calcLearnerPoints(marks, learner.adm, learner.grade, t, a, subjects);
      if (stats.enteredCount > 0) data.push({ name: `${t} ${a.toUpperCase().replace('1','')}`, score: Math.round((stats.totalPts / stats.maxTotal) * 100) });
    }));
    return data;
  }, [learner, marks]);

  const radarData = useMemo(() => {
    if (!learner) return [];
    const subjects = DEFAULT_SUBJECTS[learner.grade] || [];
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
          const stats = calcLearnerPoints(marks, learner.adm, learner.grade, 'T1', 'et1', [s]);
          if (stats.enteredCount > 0) { total += stats.totalPts; maxTotal += stats.maxTotal; }
        }
      });
      return { subject: name, A: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0, fullMark: 100 };
    });
  }, [learner, marks]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Analyzing performance trends…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📊 Advanced Analytics Command Center</h2>
          <p>Holistic view of school-wide and individual learner performance</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 25, background: MB, borderRadius: 12, padding: 5 }}>
        <button className={`tab-btn ${tab === 'school' ? 'on' : ''}`} onClick={() => setTab('school')} style={tab === 'school' ? { background: M, color: '#fff' } : {}}>🏫 School Overview</button>
        <button className={`tab-btn ${tab === 'student' ? 'on' : ''}`} onClick={() => setTab('student')} style={tab === 'student' ? { background: M, color: '#fff' } : {}}>👤 Individual Student Trends</button>
      </div>

      {tab === 'school' ? (
        <>
          <div className="sg sg3" style={{ marginBottom: 20 }}>
            <div className="panel" style={{ textAlign: 'center', borderTop: `4px solid ${M}` }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>COLLECTION RATE</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: M }}>
                {Math.round(paylog.reduce((s,p)=>s+Number(p.amount),0) / learners.reduce((s,l)=>s+(feeCfg[l.grade]?.annual||5000), 0) * 100)}%
              </div>
            </div>
            <div className="panel" style={{ textAlign: 'center', borderTop: `4px solid #16A34A` }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>ACADEMIC MEAN</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#16A34A' }}>
                {Math.round(schoolStats.perf.reduce((s,p)=>s+p.avg,0)/schoolStats.perf.length)}%
              </div>
            </div>
            <div className="panel" style={{ textAlign: 'center', borderTop: `4px solid #0369A1` }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>ENROLMENT</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0369A1' }}>{learners.length}</div>
            </div>
          </div>

          <div className="sg sg2">
            <div className="panel">
              <div className="panel-hdr"><h3>💰 Fee Collection Trend</h3></div>
              <div className="panel-body" style={{ height: 300 }}>
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
              <div className="panel-hdr"><h3>📊 Academic Performance by Grade</h3></div>
              <div className="panel-body" style={{ height: 300 }}>
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
        <div className="sg" style={{ gridTemplateColumns: '300px 1fr', gap: 20 }}>
          <div className="panel">
            <div className="panel-hdr"><h3>👤 Select Student</h3></div>
            <div className="panel-body">
              <input type="text" placeholder="Search ADM or Name..." className="field" style={{ marginBottom: 15 }} onChange={(e) => {
                const found = learners.find(l => l.name.toLowerCase().includes(e.target.value.toLowerCase()) || l.adm.includes(e.target.value));
                if (found) setSelAdm(found.adm);
              }} />
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {learners.slice(0, 100).map(l => (
                  <div key={l.adm} className={`audit-row ${selAdm === l.adm ? 'active' : ''}`} onClick={() => setSelAdm(l.adm)} style={{ cursor: 'pointer', padding: '10px 15px', borderRadius: 8, background: selAdm === l.adm ? ML : 'transparent', border: selAdm === l.adm ? `1.5px solid ${M}` : '1px solid transparent' }}>
                    <div style={{ fontWeight: 700 }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.adm} • {l.grade}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!learner ? (
              <div className="panel" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Select a student to view trend analytics</div>
            ) : (
              <>
                <div className="panel">
                  <div className="panel-hdr"><h3>📈 Termly Progress — {learner.name}</h3></div>
                  <div className="panel-body" style={{ height: 350 }}>
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
                    <div className="panel-hdr"><h3>🕸 Competency Cluster Radar</h3></div>
                    <div className="panel-body" style={{ height: 350 }}>
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
                    <div className="panel-hdr"><h3 style={{ color: M }}>🤖 Smart Mentor AI</h3></div>
                    <div className="panel-body">
                      <div style={{ fontSize: 40, marginBottom: 10 }}>💡</div>
                      <h4 style={{ margin: '0 0 10px 0' }}>Personalized Feedback</h4>
                      <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                        Strongest Cluster: <strong>{radarData.sort((a,b)=>b.A-a.A)[0]?.subject}</strong>.<br/>
                        Focus Needed: <strong>{radarData.sort((a,b)=>a.A-b.A)[0]?.subject}</strong>.
                      </p>
                      <ul style={{ fontSize: 13, color: '#475569', paddingLeft: 20, marginTop: 10 }}>
                        <li>Improve active recall in science-related subjects.</li>
                        <li>Maintain consistency in {trendData[trendData.length-1]?.score > 50 ? 'the current routine' : 'revising core units'}.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
