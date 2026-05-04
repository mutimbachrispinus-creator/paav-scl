'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Users, BookOpen, AlertCircle, Loader2, Filter, ChevronRight } from 'lucide-react';
import { getAcademicStats } from '@/lib/actions/analytics';
import { getAllGrades } from '@/lib/cbe';
import { useSchoolProfile } from '@/lib/school-profile';

const COLORS = ['#8B1A1A', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'];

export default function AnalyticsPage() {
  const { profile } = useSchoolProfile();
  const [grade, setGrade] = useState('GRADE 1');
  const [term, setTerm] = useState('TERM 1');
  const [stats, setStats] = useState(null);
  const [isPending, startTransition] = useTransition();

  const grades = getAllGrades();

  useEffect(() => {
    if (profile?.tenantId) {
      startTransition(async () => {
        const res = await getAcademicStats({ 
          tenantId: profile.tenantId, 
          grade, 
          term,
          curriculum: profile.curriculum || 'CBC'
        });
        if (res.success) setStats(res.data);
      });
    }
  }, [grade, term, profile]);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-slate-400" size={40} />
      <p className="text-slate-500 font-medium animate-pulse">Calculating institutional insights...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Analytics</h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
            <Users size={16} /> Data-driven insights for {stats.studentCount} students in {grade}
          </p>
        </div>
        
        <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <select 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
            className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 px-4 py-2 outline-none cursor-pointer"
          >
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="w-px h-8 bg-slate-200 self-center" />
          <select 
            value={term} 
            onChange={(e) => setTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 px-4 py-2 outline-none cursor-pointer"
          >
            <option value="TERM 1">TERM 1</option>
            <option value="TERM 2">TERM 2</option>
            <option value="TERM 3">TERM 3</option>
          </select>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-maroon-100 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><BookOpen size={24} /></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength</div>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-1">Top Subject</div>
          <div className="text-2xl font-black text-slate-900 uppercase">{stats.subjectMastery[0]?.name || '—'}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-green-600 font-black text-2xl">{stats.subjectMastery[0]?.level || '—'}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">({stats.subjectMastery[0]?.average || 0}%)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-maroon-100 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertCircle size={24} /></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Required</div>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-1">Weakest Subject</div>
          <div className="text-2xl font-black text-slate-900 uppercase">{stats.subjectMastery[stats.subjectMastery.length-1]?.name || '—'}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-red-600 font-black text-2xl">{stats.subjectMastery[stats.subjectMastery.length-1]?.level || '—'}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">({stats.subjectMastery[stats.subjectMastery.length-1]?.average || 0}%)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-maroon-100 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={24} /></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parity Check</div>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-1">Gender Gap</div>
          <div className="text-2xl font-black text-slate-900">
            {Math.abs((stats.genderComparison[0]?.average || 0) - (stats.genderComparison[1]?.average || 0)).toFixed(1)}%
          </div>
          <div className="mt-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Difference in Gender Averages</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subject Mastery Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900">Subject Mastery Heatmap</h3>
            <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase">Sort: High to Low</div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subjectMastery} layout="vertical" margin={{ left: 60, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{d.name}</div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-slate-900">{d.level}</div>
                            <div className="text-xs font-bold text-slate-400">({d.average}%)</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="average" radius={[0, 8, 8, 0]} barSize={24}>
                  {stats.subjectMastery.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          {/* Gender Comparison */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Gender Parity</h3>
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.genderComparison}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="average"
                    >
                      {stats.genderComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 flex-1">
                {stats.genderComparison.map((g, idx) => (
                  <div key={g.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="font-bold text-slate-700">{g.name}</span>
                    </div>
                    <span className="text-lg font-black text-slate-900">{g.average}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stream Comparison */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="text-xl font-black text-slate-900 mb-6">Stream Comparison</h3>
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.streamComparison}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#2563EB" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-maroon-100 { background-color: #FFF5F5; }
        .hover\\:border-maroon-100:hover { border-color: #FED7D7; }
      `}</style>
    </div>
  );
}
