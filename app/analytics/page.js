'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fmtK, ALL_GRADES, PRE, LOWER, UPPER, JSS, SENIOR } from '@/lib/cbe';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [learners, setLearners] = useState([]);
  const [paylog,   setPaylog]   = useState([]);
  const [marks,    setMarks]    = useState({});
  const [feeCfg,   setFeeCfg]   = useState({});

  const load = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti(['paav6_learners', 'paav6_paylog', 'paav6_marks', 'paav6_feecfg'])
      ]);

      if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
      setUser(u);
      setLearners(db.paav6_learners || []);
      setPaylog(  db.paav6_paylog   || []);
      setMarks(   db.paav6_marks    || {});
      setFeeCfg(  db.paav6_feecfg   || {});
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading || !user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading analytics…</div>;

  /* ─── DATA PROCESSING ─── */

  // 1. Fee Collection Trends (by month)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const collectionData = months.map((m, i) => {
    const total = paylog.filter(p => {
      // Date format is DD/MM/YYYY or similar from toLocaleDateString('en-KE')
      const [d, mon, y] = p.date.split('/');
      return Number(mon) === (i + 1);
    }).reduce((s, p) => s + Number(p.amount), 0);
    return { name: m, amount: total };
  });

  // 2. Class-level Performance Comparison (Average score per grade)
  const performanceData = ALL_GRADES.map(g => {
    const lInG = learners.filter(l => l.grade === g);
    let totalScore = 0;
    let count = 0;
    
    lInG.forEach(l => {
      // Find all marks for this learner across all subjects and assessments
      Object.keys(marks).forEach(key => {
        if (marks[key][l.adm]) {
          totalScore += Number(marks[key][l.adm]);
          count++;
        }
      });
    });

    return { 
      name: g.replace('GRADE ', 'G'), 
      avg: count ? Math.round(totalScore / count) : 0 
    };
  }).filter(d => d.avg > 0);

  // 3. Term-on-term Improvement (Average score per term)
  const termImprovementData = ['T1', 'T2', 'T3'].map(t => {
    let totalScore = 0;
    let count = 0;
    Object.keys(marks).forEach(key => {
      if (key.startsWith(t + ':')) {
        Object.values(marks[key]).forEach(s => {
          totalScore += Number(s);
          count++;
        });
      }
    });
    return { name: t, avg: count ? Math.round(totalScore / count) : 0 };
  }).filter(d => d.avg > 0);

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📈 School Analytics</h2>
          <p>Deep dive into academic and financial performance</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>← Dashboard</button>
        </div>
      </div>

      <div className="sg sg2">
        {/* Fee Trends */}
        <div className="panel">
          <div className="panel-hdr"><h3>💰 Monthly Collection Trend</h3></div>
          <div className="panel-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `KSH ${v/1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#2563EB" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Term Improvement */}
        <div className="panel">
          <div className="panel-hdr"><h3>📖 Termly Academic Trend</h3></div>
          <div className="panel-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={termImprovementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#7C3AED" strokeWidth={4} dot={{ r: 6, fill: '#7C3AED' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-hdr"><h3>📊 Class-level Performance Comparison</h3></div>
        <div className="panel-body" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="avg" fill="#059669" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sg sg3" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>Top Performing Grades</h3></div>
          <div className="panel-body">
            {performanceData.sort((a,b)=>b.avg-a.avg).slice(0, 3).map((d, i) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{i+1}. {d.name}</span>
                <strong style={{ color: 'var(--green)' }}>{d.avg}%</strong>
              </div>
            ))}
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-hdr"><h3>Collection Rate</h3></div>
          <div className="panel-body" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--navy)' }}>
              {Math.round(paylog.reduce((s,p)=>s+Number(p.amount),0) / learners.reduce((s,l)=>s+(feeCfg[l.grade]?.annual||5000), 0) * 100)}%
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Overall Year-to-Date</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>Total Enrolment</h3></div>
          <div className="panel-body" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#7C3AED' }}>{learners.length}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Active Learners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
