'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
} from 'recharts';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { calcLearnerPoints, DEFAULT_SUBJECTS } from '@/lib/cbe';

const TERMS = ['T1', 'T2', 'T3'];
const ASSESS = ['op1', 'mt1', 'et1'];

export default function TrendsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selAdm, setSelAdm] = useState('');

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav6_learners', 'paav6_marks']);
    setLearners(db.paav6_learners || []);
    setMarks(db.paav6_marks || {});
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const learner = useMemo(() => learners.find(l => l.adm === selAdm), [learners, selAdm]);

  const trendData = useMemo(() => {
    if (!learner) return [];
    const subjects = DEFAULT_SUBJECTS[learner.grade] || [];
    const data = [];

    TERMS.forEach(t => {
      ASSESS.forEach(a => {
        const stats = calcLearnerPoints(marks, learner.adm, learner.grade, t, a, subjects);
        if (stats.enteredCount > 0) {
          data.push({
            name: `${t} ${a.toUpperCase().replace('1','')}`,
            score: Math.round((stats.totalPts / stats.maxTotal) * 100),
            points: stats.totalPts,
            max: stats.maxTotal
          });
        }
      });
    });
    return data;
  }, [learner, marks]);

  const radarData = useMemo(() => {
    if (!learner) return [];
    const subjects = DEFAULT_SUBJECTS[learner.grade] || [];
    const clusters = {
      'Languages': ['English', 'Kiswahili', 'Language', 'Kusoma', 'Reading', 'English Language'],
      'Sciences': ['Mathematics', 'Science & Technology', 'Integrated Science', 'Biology', 'Chemistry', 'Physics', 'Environmental Activity'],
      'Humanities': ['Social Studies', 'History & Government', 'Geography', 'CRE', 'IRE', 'C.R.E', 'Life Skills Education'],
      'Arts/Sports': ['Art & Craft', 'Music', 'Physical Education', 'Creative Activity', 'Creative Arts & Sports']
    };

    return Object.entries(clusters).map(([name, keywords]) => {
      let total = 0;
      let count = 0;
      let maxTotal = 0;

      subjects.forEach(s => {
        if (keywords.some(k => s.toLowerCase().includes(k.toLowerCase()))) {
          // Average across T1 ET1 for current view
          const stats = calcLearnerPoints(marks, learner.adm, learner.grade, 'T1', 'et1', [s]);
          if (stats.enteredCount > 0) {
            total += stats.totalPts;
            maxTotal += stats.maxTotal;
            count++;
          }
        }
      });

      return {
        subject: name,
        A: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0,
        fullMark: 100
      };
    });
  }, [learner, marks]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Analyzing performance trends…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📊 Advanced Performance Analytics</h2>
          <p>Deep-dive into student academic growth and competency clusters</p>
        </div>
      </div>

      <div className="sg" style={{ gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>👤 Select Learner</h3></div>
          <div className="panel-body">
            <input 
              type="text" 
              placeholder="Search by name or ADM..." 
              className="field"
              style={{ marginBottom: 15 }}
              onChange={(e) => {
                const found = learners.find(l => l.name.toLowerCase().includes(e.target.value.toLowerCase()) || l.adm.includes(e.target.value));
                if (found) setSelAdm(found.adm);
              }}
            />
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {learners.slice(0, 100).map(l => (
                <div 
                  key={l.adm} 
                  className={`audit-row ${selAdm === l.adm ? 'active' : ''}`}
                  onClick={() => setSelAdm(l.adm)}
                  style={{ cursor: 'pointer', padding: '10px 15px', borderRadius: 8, background: selAdm === l.adm ? '#FFF5F5' : 'transparent', border: selAdm === l.adm ? '1.5px solid #8B1A1A' : '1px solid transparent' }}
                >
                  <div style={{ fontWeight: 700 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.adm} • {l.grade}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!learner ? (
            <div className="panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Select a learner from the sidebar to view detailed analytics
            </div>
          ) : (
            <>
              <div className="sg sg3">
                <div className="panel" style={{ textAlign: 'center', background: '#F8FAFC' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>OVERALL MEAN</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#1E293B' }}>
                    {trendData.length > 0 ? Math.round(trendData.reduce((a,b)=>a+b.score,0)/trendData.length) : 0}%
                  </div>
                </div>
                <div className="panel" style={{ textAlign: 'center', background: '#F0F9FF' }}>
                  <div style={{ fontSize: 11, color: '#0369A1', fontWeight: 700 }}>LATEST TREND</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#0369A1' }}>
                    {trendData.length > 1 ? (trendData[trendData.length-1].score - trendData[trendData.length-2].score >= 0 ? '↗' : '↘') : '—'}
                  </div>
                </div>
                <div className="panel" style={{ textAlign: 'center', background: '#F0FDF4' }}>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>COMPETENCY INDEX</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#166534' }}>
                    {Math.round(radarData.reduce((a,b)=>a+b.A,0)/radarData.length)}%
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-hdr"><h3>📈 Performance Trend (Termly)</h3></div>
                <div className="panel-body" style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8B1A1A" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#8B1A1A', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <div className="panel-hdr"><h3>🕸 Competency Cluster Radar</h3></div>
                <div className="panel-body" style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar 
                        name={learner.name} 
                        dataKey="A" 
                        stroke="#8B1A1A" 
                        fill="#8B1A1A" 
                        fillOpacity={0.6} 
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel" style={{ border: '2px solid #8B1A1A', background: '#FFF5F5' }}>
                <div className="panel-hdr">
                  <h3 style={{ color: '#8B1A1A' }}>🤖 Smart Mentor — AI Feedback</h3>
                  <div className="badge bg-red" style={{ fontSize: 9 }}>BETA</div>
                </div>
                <div className="panel-body">
                  <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 40 }}>💡</div>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#1E293B' }}>Personalized Improvement Strategy</h4>
                      <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                        Based on the latest data for <strong>{learner.name}</strong>, their strongest cluster is <strong>{radarData.sort((a,b)=>b.A-a.A)[0]?.subject}</strong> ({radarData.sort((a,b)=>b.A-a.A)[0]?.A}%). 
                        However, there is a performance gap in <strong>{radarData.sort((a,b)=>a.A-b.A)[0]?.subject}</strong>.
                      </p>
                      <ul style={{ fontSize: 13, color: '#475569', paddingLeft: 20, marginTop: 10 }}>
                        <li>Focus on active recall for <strong>{radarData.sort((a,b)=>a.A-b.A)[0]?.subject}</strong> concepts.</li>
                        <li>The recent {trendData[trendData.length-1]?.score - trendData[trendData.length-2]?.score >= 0 ? 'improvement' : 'decline'} suggests that {trendData[trendData.length-1]?.score - trendData[trendData.length-2]?.score >= 0 ? 'the current study schedule is working' : 'a review of the study environment is needed'}.</li>
                        <li>Recommended KICD Resource: <a href="https://kec.ac.ke/" style={{ color: '#8B1A1A', fontWeight: 700 }}>Interactive Science Lessons</a>.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
