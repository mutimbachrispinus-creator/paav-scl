'use client';
/**
 * app/attendance/page.js — Student Attendance Marking
 *
 * Allows Teachers (assigned to grades) to mark daily attendance.
 * Data is stored in 'paav_student_attendance' key.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES } from '@/lib/cbe';

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [learners, setLearners] = useState([]);
  const [att, setAtt] = useState({}); // { "GRADE 7|2024-04-25|ADM001": "P" }
  const [grade, setGrade] = useState('GRADE 7');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
              { type: 'get', key: 'paav_student_attendance' }
            ]})
          })
        ]);
        const auth = await authRes.json();
        if (!auth.ok) { router.push('/'); return; }
        setUser(auth.user);

        const db = await dbRes.json();
        setLearners(db.results[0]?.value || []);
        setAtt(db.results[1]?.value || {});
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
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_student_attendance', value: att }] })
      });
      alert('✅ Attendance saved successfully!');
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  const list = learners.filter(l => l.grade === grade);

  if (loading) return <div className="page on"><p>Loading attendance...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📋 Student Attendance</h2>
          <p>Mark daily presence for students in {grade}</p>
        </div>
        <div className="page-hdr-acts">
          <input type="date" className="sc-inp" value={date} onChange={e => setDate(e.target.value)} />
          <select value={grade} onChange={e => setGrade(e.target.value)} className="sc-inp">
            {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
          </select>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>ADM</th>
                <th style={{ textAlign: 'left' }}>Student Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(l => {
                const key = `${grade}|${date}|${l.adm}`;
                const status = att[key] || 'P'; // default Present
                return (
                  <tr key={l.adm}>
                    <td>{l.adm}</td>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>
                      <span className={`badge bg-${status === 'P' ? 'green' : status === 'A' ? 'red' : 'amber'}`}>
                        {status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Late'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setAtt({...att, [key]: 'P'})}>P</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setAtt({...att, [key]: 'A'})}>A</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setAtt({...att, [key]: 'L'})}>L</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
