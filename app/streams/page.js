'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti, invalidateDB } from '@/lib/client-cache';
import { ALL_GRADES } from '@/lib/cbe';

export default function StreamsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [streams, setStaffStreams] = useState([]); // Array of { grade, name }
  const [loading, setLoading] = useState(true);
  const [newStream, setNewStream] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('GRADE 1');

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav7_streams', 'paav_school_streams']);
    // Migrate old flat streams if needed or just use new ones
    let list = db.paav7_streams || [];
    if (!Array.isArray(list)) list = [];
    
    setStaffStreams(list);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function addStream() {
    if (!newStream.trim()) return;
    const name = newStream.trim().toUpperCase();
    const grade = selectedGrade;
    
    if (streams.some(s => s.grade === grade && s.name === name)) { 
      alert('Stream already exists for this grade'); return; 
    }
    
    const updated = [...streams, { grade, name }];
    setStaffStreams(updated);
    setNewStream('');

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_streams', value: updated }] })
    });
    invalidateDB(['paav7_streams']);
  }

  async function removeStream(idx) {
    if (!confirm(`Remove this stream?`)) return;
    const updated = streams.filter((_, i) => i !== idx);
    setStaffStreams(updated);
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_streams', value: updated }] })
    });
    invalidateDB(['paav7_streams']);
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Streams…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🌊 Institutional Streams</h2>
          <p>Define streams (e.g. North, South) per grade level.</p>
        </div>
      </div>

      <div className="sg sg" style={{ gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <div className="panel" style={{ height: 'fit-content' }}>
          <div className="panel-hdr"><h3>➕ Add New Stream</h3></div>
          <div className="panel-body">
            <div className="field">
              <label>Grade</label>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Stream Name</label>
              <input 
                value={newStream} 
                onChange={e => setNewStream(e.target.value)} 
                placeholder="e.g. NORTH" 
                onKeyDown={e => e.key === 'Enter' && addStream()}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={addStream}>
              ✅ Create Stream
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>📋 Active Streams</h3></div>
          <div className="panel-body">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Stream Name</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.sort((a,b) => a.grade.localeCompare(b.grade)).map((s, i) => (
                    <tr key={i}>
                      <td><span className="badge bg-blue">{s.grade}</span></td>
                      <td style={{ fontWeight: 800 }}>{s.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => removeStream(i)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {streams.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontStyle: 'italic' }}>
                        No streams defined. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
