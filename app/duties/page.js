'use client';
/**
 * app/duties/page.js — Staff Duties & Presence
 *
 * Handles:
 *   • Duty Roster
 *   • Presence Logging (Login/Logout present)
 *   • Permission Seeking
 *   • Issue Reporting
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DutiesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [presence, setPresence] = useState([]); // [{id, date, login, logout}]
  const [duties, setDuties] = useState([]);
  const [requests, setRequests] = useState([]); // permissions/reports

  useEffect(() => {
    async function load() {
      try {
        const [authRes, dbRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [
              { type: 'get', key: 'paav_presence' },
              { type: 'get', key: 'paav_duties' },
              { type: 'get', key: 'paav_staff_reqs' }
            ]})
          })
        ]);
        const auth = await authRes.json();
        if (!auth.ok) { router.push('/'); return; }
        setUser(auth.user);

        const db = await dbRes.json();
        setPresence(db.results[0]?.value || []);
        setDuties(db.results[1]?.value || []);
        setRequests(db.results[2]?.value || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const today = new Date().toLocaleDateString();
  const todayRecord = presence.find(p => p.id === user?.id && p.date === today);

  async function logPresence(type) {
    setBusy(true);
    try {
      const newPresence = [...presence];
      const idx = newPresence.findIndex(p => p.id === user.id && p.date === today);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (idx !== -1) {
        newPresence[idx] = { ...newPresence[idx], [type]: now };
      } else {
        newPresence.push({ id: user.id, name: user.name, date: today, login: now, logout: '' });
      }

      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_presence', value: newPresence }] })
      });
      setPresence(newPresence);
      alert(`✅ Marked as ${type === 'login' ? 'Present' : 'Logged Out'}!`);
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  const [reqForm, setReqForm] = useState({ type: 'permission', text: '' });
  const [reqSent, setReqSent] = useState(false);

  async function submitRequest(e) {
    e?.preventDefault();
    if (!reqForm.text.trim()) { alert('Please enter details'); return; }
    setBusy(true);
    try {
      const newReqs = [...requests, {
        id: Date.now(), userId: user.id, userName: user.name,
        type: reqForm.type, text: reqForm.text, date: today, status: 'pending'
      }];
      await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_staff_reqs', value: newReqs }] })
      });
      setRequests(newReqs);
      setReqForm({ type: 'permission', text: '' });
      setReqSent(true);
      setTimeout(() => setReqSent(false), 3000);
    } catch(e) { alert('❌ Error: ' + e.message); } finally { setBusy(false); }
  }

  if (loading) return <div className="page on"><p>Loading duties...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🎖️ Duties & Presence</h2>
          <p>Manage your daily attendance and duty assignments</p>
        </div>
        <div className="page-hdr-acts">
          {!todayRecord?.login && (
            <button className="btn btn-success" onClick={() => logPresence('login')} disabled={busy}>📍 Mark Present</button>
          )}
          {todayRecord?.login && !todayRecord?.logout && (
            <button className="btn btn-danger" onClick={() => logPresence('logout')} disabled={busy}>🚪 Log Out</button>
          )}
        </div>
      </div>

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr"><h3>📅 Your Duty Roster</h3></div>
          <div className="panel-body">
            {duties.filter(d => d.staffId === user.id).length === 0 ? (
              <p style={{ opacity: 0.6 }}>No duties assigned this week.</p>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Day</th><th>Role</th><th>Location</th></tr></thead>
                  <tbody>
                    {duties.filter(d => d.staffId === user.id).map((d, i) => (
                      <tr key={i}>
                        <td>{d.day}</td>
                        <td><span className="badge bg-blue">{d.role}</span></td>
                        <td>{d.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>🖇️ Actions</h3></div>
          <div className="panel-body" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => submitRequest('permission')}>✋ Seek Permission</button>
            <button className="btn btn-purple" style={{ flex: 1 }} onClick={() => submitRequest('report')}>🚩 Report Issue</button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr"><h3>📜 Recent Attendance Log</h3></div>
        <div className="panel-body">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Date</th><th>Login Time</th><th>Logout Time</th><th>Status</th></tr></thead>
              <tbody>
                {presence.filter(p => p.id === user.id).slice(-5).reverse().map((p, i) => (
                  <tr key={i}>
                    <td>{p.date}</td>
                    <td>{p.login}</td>
                    <td>{p.logout || '—'}</td>
                    <td><span className="badge bg-green">Present</span></td>
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
