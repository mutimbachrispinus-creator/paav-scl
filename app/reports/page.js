'use client';
import { useState, useEffect, useCallback } from 'react';
import PortalShell from '@/app/PortalShell';

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ dept: '', title: '', text: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth');
      const auth = await authRes.json();
      if (!auth.ok) { window.location.href = '/'; return; }
      setUser(auth.user);

      const dbRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'get', key: 'paav6_dept_reports' }] })
      });
      const db = await dbRes.json();
      const allReports = db.results[0]?.value || [];
      
      // Admins see all, others see nothing or just a success confirmation
      if (auth.user.role === 'admin') {
        setReports(allReports.reverse());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitReport(e) {
    e.preventDefault();
    if (!form.dept || !form.title || !form.text) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const dbRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'get', key: 'paav6_dept_reports' }] })
      });
      const db = await dbRes.json();
      const list = db.results[0]?.value || [];
      
      const newReport = {
        id: Date.now(),
        author: user.name,
        authorRole: user.role,
        dept: form.dept,
        title: form.title,
        text: form.text,
        time: new Date().toISOString()
      };

      list.push(newReport);

      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav6_dept_reports', value: list }] })
      });

      setForm({ dept: '', title: '', text: '' });
      setMsg({ type: 'success', text: '✅ Report submitted successfully to administration!' });
      if (user.role === 'admin') load();
    } catch (err) {
      setMsg({ type: 'error', text: '❌ Failed to submit report: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PortalShell user={user}><div className="page on">Loading...</div></PortalShell>;

  return (
    <PortalShell user={user}>
      <div className="page on" id="pg-reports">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0 }}>📊 Progress Reports</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
              {user.role === 'admin' ? 'Review departmental progress updates' : 'Submit progress updates to administration'}
            </p>
          </div>
        </div>

        <div className="sg sg2" style={{ gridTemplateColumns: user.role === 'admin' ? '1fr 1.5fr' : '1fr' }}>
          {/* Submission Form */}
          <div className="panel">
            <div className="panel-hdr"><h3>📝 New Progress Report</h3></div>
            <div className="panel-body">
              <form onSubmit={submitReport}>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={form.dept} onChange={e => setForm({...form, dept: e.target.value})} placeholder="e.g. Mathematics, Sports, Finance..." required />
                </div>
                <div className="form-group">
                  <label>Report Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Monthly Curriculum Coverage" required />
                </div>
                <div className="form-group">
                  <label>Progress Details</label>
                  <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} 
                    placeholder="Provide a detailed update on progress, challenges, and goals..." 
                    style={{ minHeight: 180, resize: 'vertical' }} required />
                </div>
                {msg.text && <div className={`msg ${msg.type}`} style={{ marginBottom: 15 }}>{msg.text}</div>}
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Submitting...' : '🚀 Submit Report'}
                </button>
              </form>
            </div>
          </div>

          {/* Admin View: List of Reports */}
          {user.role === 'admin' && (
            <div className="panel">
              <div className="panel-hdr"><h3>📋 All Departmental Reports</h3></div>
              <div className="panel-body" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                    No reports submitted yet.
                  </div>
                ) : (
                  reports.map(r => (
                    <div key={r.id} style={{ padding: 16, border: '1.5px solid var(--border)', borderRadius: 12, marginBottom: 14, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', background: '#EFF6FF', padding: '2px 8px', borderRadius: 20 }}>{r.dept}</span>
                          <h4 style={{ margin: '6px 0 2px', fontSize: 16 }}>{r.title}</h4>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>By <strong>{r.author}</strong> ({r.authorRole})</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                          {new Date(r.time).toLocaleDateString()}<br/>
                          {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        {r.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
