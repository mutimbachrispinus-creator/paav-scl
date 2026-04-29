'use client';
import { useState, useEffect, useCallback } from 'react';
import PortalShell from '@/app/PortalShell';
import { invalidateDB } from '@/lib/client-cache';

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

      invalidateDB('paav6_dept_reports');
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
          <div className="panel" style={{ border: '1.5px solid var(--border)', background: '#F8FAFC' }}>
            <div className="panel-hdr" style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: '#fff' }}>
              <h3 style={{ color: '#fff' }}>📄 Departmental Progress Submission</h3>
            </div>
            <div className="panel-body" style={{ padding: '25px' }}>
              <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', position: 'relative' }}>
                  {/* Memorandum Header */}
                  <div style={{ textAlign: 'center', marginBottom: 25, borderBottom: '2px solid #1E293B', paddingBottom: 15 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#1E293B', letterSpacing: '2px', marginBottom: 4 }}>PAAV-GITOMBO COMMUNITY SCHOOL</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>Departmental Memorandum</div>
                  </div>

                  <div className="sg sg2" style={{ marginBottom: 20 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Department</label>
                      <input type="text" value={form.dept} onChange={e => setForm({...form, dept: e.target.value})} 
                        placeholder="e.g. Mathematics Department" 
                        style={{ border: 'none', borderBottom: '1.5px solid #CBD5E1', borderRadius: 0, padding: '8px 0', fontSize: 14, fontWeight: 600, background: 'transparent' }} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Subject/Title</label>
                      <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} 
                        placeholder="e.g. Monthly Progress Update" 
                        style={{ border: 'none', borderBottom: '1.5px solid #CBD5E1', borderRadius: 0, padding: '8px 0', fontSize: 14, fontWeight: 600, background: 'transparent' }} required />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: 10 }}>Report Narrative</label>
                    <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} 
                      placeholder="Type your official report here..." 
                      style={{ 
                        minHeight: 300, 
                        resize: 'vertical', 
                        border: '1px solid #E2E8F0', 
                        borderRadius: 8, 
                        padding: 15, 
                        fontSize: 15, 
                        lineHeight: 1.7, 
                        fontFamily: 'Georgia, serif',
                        background: '#FFFEFA', /* Subtle paper tint */
                        color: '#1E293B'
                      }} required />
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      Submitted by: <strong>{user?.name}</strong><br/>
                      Date: {new Date().toLocaleDateString()}
                    </div>
                    <div style={{ opacity: 0.1, fontWeight: 900, fontSize: 24, userSelect: 'none' }}>OFFICIAL</div>
                  </div>
                </div>

                {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
                
                <button className="btn btn-primary" style={{ height: 50, fontSize: 16, fontWeight: 800, background: '#1E293B', border: 'none', borderRadius: 8 }} disabled={submitting}>
                  {submitting ? '🚀 Submitting Official Record...' : '📜 Authenticate & Submit Report'}
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
