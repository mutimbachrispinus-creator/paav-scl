'use client';
/**
 * app/learners/bulk/page.js — Bulk Learner Registration
 *
 * Provides a 20-row grid to quickly add multiple learners with:
 * ADM, Name, DOB, Grade, Stream, Parent Name, Phone
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES } from '@/lib/cbe';

const EMPTY_ROW = { adm: '', name: '', dob: '', grade: 'GRADE 7', stream: '', parent: '', phone: '' };

export default function BulkLearnersPage() {
  const router = useRouter();
  const [rows, setRows] = useState(Array(20).fill(EMPTY_ROW));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (!data.ok || (data.user.role !== 'admin' && data.user.role !== 'teacher')) {
        router.push('/'); return;
      }
      setLoading(false);
    }
    check();
  }, [router]);

  function updateRow(idx, field, val) {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    setRows(newRows);
  }

  async function handleSave() {
    const validRows = rows.filter(r => r.adm && r.name && r.grade);
    if (validRows.length === 0) { alert('Please fill at least one row (ADM, Name, Grade required)'); return; }

    setBusy(true);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'get', key: 'paav6_learners' }] })
      });
      const data = await res.json();
      const current = data.results[0]?.value || [];
      
      const updated = [...current, ...validRows];
      
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav6_learners', value: updated }] })
      });
      
      alert(`✅ Successfully added ${validRows.length} learners!`);
      router.push('/learners');
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page on"><p>Loading bulk registration...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🎓 Bulk Add Learners</h2>
          <p>Fill the grid below to register multiple students at once</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost" onClick={() => setRows([...rows, ...Array(10).fill(EMPTY_ROW)])}>➕ Add 10 More Rows</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving...' : '💾 Save All Learners'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>ADM</th>
                <th>Full Name</th>
                <th style={{ width: 140 }}>DOB</th>
                <th style={{ width: 150 }}>Grade</th>
                <th style={{ width: 100 }}>Stream</th>
                <th>Parent Name</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input type="text" className="sc-inp" style={{ width: '100%' }} value={r.adm} onChange={e => updateRow(i, 'adm', e.target.value)} placeholder="000" />
                  </td>
                  <td>
                    <input type="text" className="sc-inp" style={{ width: '100%', textAlign: 'left' }} value={r.name} onChange={e => updateRow(i, 'name', e.target.value.toUpperCase())} placeholder="STUDENT NAME" />
                  </td>
                  <td>
                    <input type="date" className="sc-inp" style={{ width: '100%' }} value={r.dob} onChange={e => updateRow(i, 'dob', e.target.value)} />
                  </td>
                  <td>
                    <select className="sc-inp" style={{ width: '100%' }} value={r.grade} onChange={e => updateRow(i, 'grade', e.target.value)}>
                      {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="text" className="sc-inp" style={{ width: '100%' }} value={r.stream} onChange={e => updateRow(i, 'stream', e.target.value.toUpperCase())} placeholder="A" />
                  </td>
                  <td>
                    <input type="text" className="sc-inp" style={{ width: '100%', textAlign: 'left' }} value={r.parent} onChange={e => updateRow(i, 'parent', e.target.value.toUpperCase())} placeholder="PARENT NAME" />
                  </td>
                  <td>
                    <input type="text" className="sc-inp" style={{ width: '100%' }} value={r.phone} onChange={e => updateRow(i, 'phone', e.target.value)} placeholder="07..." />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
