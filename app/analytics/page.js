'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useTransition } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from '@/components/DynamicCharts';
import { TrendingUp, Users, BookOpen, AlertCircle, Loader2, Filter, ChevronRight } from 'lucide-react';
import { getAcademicStats } from '@/lib/actions/analytics';
import { getAllGrades } from '@/lib/cbe';
import { useSchoolProfile } from '@/lib/school-profile';

const COLORS = ['#8B1A1A', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'];

export default function AnalyticsPage() {
  const profile = useSchoolProfile();
  const [grade, setGrade] = useState('GRADE 1');
  const [term, setTerm] = useState('TERM 1');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [isPending, startTransition] = useTransition();

  // Performance Detail States
  const [learners, setLearners] = useState([]);
  const [marks, setMarks] = useState({});
  const [gradCfg, setGradCfg] = useState(null);
  const [subjCfg, setSubjCfg] = useState({});
  const [pTerm, setPTerm] = useState('T1');
  const [pAssess, setPAssess] = useState('et1');
  const [pGrade, setPGrade] = useState('GRADE 1');
  const [pStream, setPStream] = useState('');

  const grades = getAllGrades(profile?.curriculum || 'CBC');

  useEffect(() => {
    if (profile?.tenantId) {
      setStats(null);
      setError(null);
      
      const timeout = setTimeout(() => {
        if (!stats) setError('Analysis is taking longer than expected. Please try again.');
      }, 12000);

      startTransition(async () => {
        try {
          const res = await getAcademicStats({ 
            tenantId: profile.tenantId, 
            grade, 
            term,
            curriculum: profile.curriculum || 'CBC'
          });
          clearTimeout(timeout);
          if (res.success) {
            setStats(res.data);
            setError(null);
          } else {
            setError(res.error || 'Failed to calculate insights');
          }
        } catch (e) {
          clearTimeout(timeout);
          setError(e.message || 'An unexpected error occurred');
        }
      });
      return () => clearTimeout(timeout);
    }
  }, [grade, term, profile]);

  useEffect(() => {
    async function loadPerformance() {
      if (!profile?.tenantId) return;
      const { getCachedDBMulti } = await import('@/lib/client-cache');
      const db = await getCachedDBMulti(['paav6_learners', 'paav6_marks', 'paav8_subj', 'paav8_grad']);
      setLearners(db.paav6_learners || []);
      setMarks(db.paav6_marks || {});
      setSubjCfg(db.paav8_subj || {});
      setGradCfg(db.paav8_grad || null);
    }
    if (activeTab === 'performance') loadPerformance();
  }, [activeTab, profile]);

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <AlertCircle className="text-red-500" size={48} />
      <div>
        <h3 className="text-lg font-bold text-slate-900">Analysis Failed</h3>
        <p className="text-slate-500">{error}</p>
      </div>
      <button 
        className="btn btn-primary btn-sm"
        onClick={() => window.location.reload()}
      >
        Retry Analysis
      </button>
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-slate-400" size={40} />
      <p className="text-slate-500 font-medium animate-pulse">Calculating institutional insights...</p>
    </div>
  );

  return (
    <div className="page on animate-in fade-in duration-500">
      
      {/* Header & Tabs */}
      <div className="page-hdr" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900 }}>Performance & Insights</h2>
          <p style={{ color: 'var(--muted)', marginTop: 4, fontWeight: 600 }}>Institutional excellence dashboard</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, background: 'var(--slate-50)', padding: 4, borderRadius: 12 }}>
          <button className={`btn btn-sm ${activeTab === 'insights' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('insights')}>📊 Insights</button>
          <button className={`btn btn-sm ${activeTab === 'performance' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('performance')}>📈 Academic Detail</button>
        </div>
      </div>

      {activeTab === 'insights' ? (
        <>
          <div className="page-hdr" style={{ marginTop: 20, border: 'none' }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Global Analytics</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}><Users size={14} className="inline mr-1" /> Analyzing {stats.studentCount} students in {grade}</p>
            </div>
            <div className="page-hdr-acts">
              <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ background: 'var(--slate-50)', fontWeight: 700 }}>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ background: 'var(--slate-50)', fontWeight: 700 }}>
                <option value="TERM 1">TERM 1</option><option value="TERM 2">TERM 2</option><option value="TERM 3">TERM 3</option>
              </select>
            </div>
          </div>
          {/* Insight Cards ... */}
        </>
      ) : (
        <>
          <div className="page-hdr" style={{ marginTop: 20, border: 'none' }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Academic Performance</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Rankings & detailed markbooks for {pGrade}</p>
            </div>
            <div className="page-hdr-acts">
              <select value={pGrade} onChange={(e) => setPGrade(e.target.value)} style={{ borderRadius: 8 }}>
                {grades.map(g => <option key={g}>{g}</option>)}
              </select>
              <select value={pTerm} onChange={(e) => setPTerm(e.target.value)} style={{ borderRadius: 8 }}>
                <option value="T1">Term 1</option><option value="T2">Term 2</option><option value="T3">Term 3</option>
              </select>
              <select value={pAssess} onChange={(e) => setPAssess(e.target.value)} style={{ borderRadius: 8 }}>
                <option value="op1">Opener</option><option value="mt1">Mid-Term</option><option value="et1">End-Term</option>
              </select>
            </div>
          </div>
          {/* Performance UI ... */}
        </>
      )}

      {activeTab === 'insights' ? (
        <>
          {/* Insight Cards */}
          <div className="sg sg3">
            <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
              <div className="sc-inner">
                <div className="sc-icon" style={{ background: '#ecfdf5', color: '#059669' }}><BookOpen size={20} /></div>
                <div>
                  <div className="sc-l" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>Top Subject</div>
                  <div className="sc-n" style={{ fontSize: 18, textTransform: 'uppercase' }}>{stats.subjectMastery[0]?.name || '—'}</div>
                  <div className="sc-sub" style={{ background: '#ecfdf5', color: '#059669' }}>
                    {stats.subjectMastery[0]?.level || '—'} ({stats.subjectMastery[0]?.average || 0}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="sc-inner">
                <div className="sc-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><AlertCircle size={20} /></div>
                <div>
                  <div className="sc-l" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>Weakest Subject</div>
                  <div className="sc-n" style={{ fontSize: 18, textTransform: 'uppercase' }}>{stats.subjectMastery[stats.subjectMastery.length-1]?.name || '—'}</div>
                  <div className="sc-sub" style={{ background: '#fef2f2', color: '#dc2626' }}>
                    {stats.subjectMastery[stats.subjectMastery.length-1]?.level || '—'} ({stats.subjectMastery[stats.subjectMastery.length-1]?.average || 0}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div className="sc-inner">
                <div className="sc-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><TrendingUp size={20} /></div>
                <div>
                  <div className="sc-l" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>Gender Gap</div>
                  <div className="sc-n" style={{ fontSize: 24 }}>
                    {Math.abs((stats.genderComparison[0]?.average || 0) - (stats.genderComparison[1]?.average || 0)).toFixed(1)}%
                  </div>
                  <div className="sc-sub" style={{ background: '#eff6ff', color: '#2563eb' }}>Performance Variance</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="panel">
              <div className="panel-hdr">
                <h3 style={{ fontSize: 16, fontWeight: 900 }}>Subject Mastery Heatmap</h3>
              </div>
              <div className="panel-body">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.subjectMastery} layout="vertical">
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="average" radius={[0, 8, 8, 0]}>
                        {stats.subjectMastery.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="panel">
                <div className="panel-hdr"><h3 style={{ fontSize: 16, fontWeight: 900 }}>Gender Parity Analysis</h3></div>
                <div className="panel-body">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stats.genderComparison} innerRadius={60} outerRadius={80} dataKey="average">
                        {stats.genderComparison.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel">
                <div className="panel-hdr"><h3 style={{ fontSize: 16, fontWeight: 900 }}>Stream Performance</h3></div>
                <div className="panel-body">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.streamComparison}>
                      <XAxis dataKey="name" />
                      <Bar dataKey="average" fill="#2563EB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Performance Ranking Table */}
          <PerformanceDetail 
            learners={learners} marks={marks} grade={pGrade} 
            term={pTerm} assess={pAssess} subjCfg={subjCfg} gradCfg={gradCfg} 
            curriculum={profile?.curriculum || 'CBC'}
          />
        </div>
      )}
    </div>
  );
}

function PerformanceDetail({ learners, marks, grade, term, assess, subjCfg, gradCfg, curriculum }) {
  const [data, setData] = React.useState([]);
  
  React.useEffect(() => {
    async function calc() {
      const { buildMeritList } = await import('@/lib/cbe');
      const list = buildMeritList(learners, marks, grade, term, assess, gradCfg, curriculum);
      setData(list);
    }
    calc();
  }, [learners, marks, grade, term, assess, gradCfg, curriculum]);

  const subjects = (subjCfg[grade]?.length > 0) ? subjCfg[grade] : [];

  return (
    <div className="panel">
      <div className="panel-hdr">
        <h3>🏆 Class Rankings — {grade} ({data.length} learners)</h3>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th><th>Adm</th><th>Name</th>
              {subjects.map(s => <th key={s} style={{ fontSize: 9 }}>{s.slice(0, 5)}</th>)}
              <th>Total Pts</th><th>Avg %</th>
            </tr>
          </thead>
          <tbody>
            {data.map(l => (
              <tr key={l.adm}>
                <td style={{ fontWeight: 800 }}>#{l.rank}</td>
                <td>{l.adm}</td>
                <td style={{ fontWeight: 600 }}>{l.name}</td>
                {l.detail.map((d, i) => <td key={i} style={{ textAlign: 'center' }}>{d.lv || '—'}</td>)}
                <td style={{ fontWeight: 800, color: 'var(--lp-primary)' }}>{l.totalPts}</td>
                <td style={{ fontWeight: 700 }}>{Math.round(l.totalMarks / (l.enteredCount || 1))}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
