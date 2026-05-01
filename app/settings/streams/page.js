'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti, invalidateDB } from '@/lib/client-cache';

export default function StreamsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStream, setNewStream] = useState('');

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav_school_streams']);
    setStreams(db.paav_school_streams || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function addStream() {
    if (!newStream.trim()) return;
    const s = newStream.trim().toUpperCase();
    if (streams.includes(s)) { alert('Stream already exists'); return; }
    
    const updated = [...streams, s];
    setStreams(updated);
    setNewStream('');

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_school_streams', value: updated }] })
    });
    invalidateDB(['paav_school_streams']);
  }

  async function removeStream(s) {
    if (!confirm(`Remove stream ${s}?`)) return;
    const updated = streams.filter(x => x !== s);
    setStreams(updated);
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_school_streams', value: updated }] })
    });
    invalidateDB(['paav_school_streams']);
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Streams…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🌊 Institutional Streams</h2>
          <p>Define and manage school streams (e.g., North, South, East, West)</p>
        </div>
      </div>

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr"><h3>➕ Add New Stream</h3></div>
          <div className="panel-body">
            <div className="field">
              <label>Stream Name</label>
              <input 
                value={newStream} 
                onChange={e => setNewStream(e.target.value)} 
                placeholder="e.g. WEST" 
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {streams.map(s => (
                <div key={s} className="badge bg-blue" style={{ padding: '10px 15px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s}
                  <span style={{ cursor: 'pointer', fontWeight: 900 }} onClick={() => removeStream(s)}>✕</span>
                </div>
              ))}
              {streams.length === 0 && (
                <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: 20 }}>No streams defined. Add one to get started.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
