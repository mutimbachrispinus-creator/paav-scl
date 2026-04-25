'use client';
/**
 * app/allocations/page.js — Subject & Grade Allocations
 *
 * Allows Admins to assign teachers to specific subjects and grades.
 * Data is stored in the 'paav_allocations' key in Turso.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES, DEFAULT_SUBJECTS } from '@/lib/cbe';

export default function AllocationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState([]);
  const [allocs, setAllocs] = useState({}); // { "GRADE 7|MATH": "Teacher ID" }
  const [subjCfg, setSubjCfg] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [authRes, dbRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [
              { type: 'get', key: 'paav6_staff' },
              { type: 'get', key: 'paav_allocations' },
              { type: 'get', key: 'paav8_subj' }
            ]})
          })
        ]);
        const auth = await authRes.json();
        if (!auth.ok || auth.user.role !== 'admin') { router.push('/dashboard'); return; }

        const db = await dbRes.json();
        setStaff(db.results[0]?.value || []);
        setAllocs(db.results[1]?.value || {});
        setSubjCfg(db.results[2]?.value || {});
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
        body: JSON.stringify({ requests: [
          { type: 'set', key: 'paav_allocations', value: allocs }
        ]})
      });
      alert('✅ Allocations saved successfully!');
    } catch (e) {
      alert('❌ Failed to save: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page on"><p>Loading allocations...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🗓️ Subject Allocations</h2>
          <p>Assign staff members to teach specific subjects per grade</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving...' : '💾 Save Allocations'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <p style={{ marginBottom: 20, fontSize: 13, color: '#666' }}>
            Select a teacher for each subject in each grade. These assignments will determine which classes appear for teachers in their "Grades" and "Learners" tabs.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
            {ALL_GRADES.map(grade => {
              const subjects = (subjCfg[grade] && subjCfg[grade].length > 0) ? subjCfg[grade] : (DEFAULT_SUBJECTS[grade] || []);
              return (
                <div key={grade} className="panel" style={{ margin: 0 }}>
                  <div className="panel-hdr" style={{ background: '#F8FAFF' }}>
                    <h3>{grade}</h3>
                  </div>
                  <div className="panel-body" style={{ padding: 15 }}>
                    {subjects.map(s => (
                      <div key={s} style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s}</div>
                        <select 
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          value={allocs[`${grade}|${s}`] || ''}
                          onChange={e => setAllocs({...allocs, [`${grade}|${s}`]: e.target.value})}
                        >
                          <option value="">(Not Assigned)</option>
                          {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
