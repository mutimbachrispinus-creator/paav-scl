'use client';
/**
 * app/timetable/page.js — CBE Timetable Module
 *
 * Handles:
 *   • CBE Timetabling Logic (Slot-based)
 *   • Admin editing vs Teacher viewing
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES, DEFAULT_SUBJECTS } from '@/lib/cbe';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['08:00', '08:40', '09:20', '10:00', '10:30', '11:10', '11:50', '12:30'];

export default function TimetablePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState('GRADE 7');
  const [tt, setTt] = useState({}); // { "GRADE 7|Monday|08:00": "Math" }

  useEffect(() => {
    async function load() {
      try {
        const [authRes, dbRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ type: 'get', key: 'paav_timetable' }] })
          })
        ]);
        const auth = await authRes.json();
        if (!auth.ok) { router.push('/'); return; }
        setUser(auth.user);

        const db = await dbRes.json();
        setTt(db.results[0]?.value || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function save() {
    setBusy(true);
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_timetable', value: tt }] })
      });
      alert('✅ Timetable saved!');
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = user?.role === 'admin';
  const subjects = DEFAULT_SUBJECTS[grade] || [];

  if (loading) return <div className="page on"><p>Loading timetable...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📅 CBE Timetable</h2>
          <p>Manage and view subject allocations per slot for {grade}</p>
        </div>
        <div className="page-hdr-acts">
          <select value={grade} onChange={e => setGrade(e.target.value)} className="sc-inp" style={{ width: 150 }}>
            {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
          </select>
          {isAdmin && (
            <button className="btn btn-primary" onClick={save} disabled={busy}>
              {busy ? 'Saving...' : '💾 Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table style={{ borderCollapse: 'separate', borderSpacing: '2px' }}>
            <thead>
              <tr>
                <th style={{ background: '#f8f8f8', width: 100 }}>Time</th>
                {DAYS.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map(time => (
                <tr key={time}>
                  <td style={{ textAlign: 'center', fontWeight: 700, background: '#f8f8f8', fontSize: 11 }}>{time}</td>
                  {DAYS.map(day => {
                    const key = `${grade}|${day}|${time}`;
                    if (time === '10:00') return <td key={day} style={{ background: '#f0f4ff', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#2563eb' }}>BREAK</td>;
                    if (time === '12:30') return <td key={day} style={{ background: '#fffbeb', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#d97706' }}>LUNCH</td>;
                    
                    return (
                      <td key={day} style={{ padding: 0 }}>
                        {isAdmin ? (
                          <select 
                            style={{ width: '100%', border: 'none', padding: 8, fontSize: 11, background: tt[key] ? '#eef2ff' : '#fff' }}
                            value={tt[key] || ''}
                            onChange={e => setTt({...tt, [key]: e.target.value})}
                          >
                            <option value="">—</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <div style={{ padding: 8, fontSize: 11, textAlign: 'center', minHeight: 34 }}>
                            {tt[key] || <span style={{ opacity: 0.3 }}>—</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
