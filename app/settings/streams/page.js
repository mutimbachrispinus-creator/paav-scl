'use client';
/**
 * app/settings/streams/page.js — Admin: manage multiple class streams per grade
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES } from '@/lib/cbe';

export default function StreamsPage() {
  const router  = useRouter();
  const [streams, setStreams] = useState({}); // { 'GRADE 1': ['Daisy', 'Rose', ...], ... }
  const [loading, setLoading] = useState(true);
  const [saved,   setSaved]   = useState(false);
  const [selGrade, setSelGrade] = useState('GRADE 7');

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth    = await authRes.json();
    if (!auth.ok || auth.user?.role !== 'admin') { router.push('/dashboard'); return; }

    const dbRes = await fetch('/api/db', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'get', key:'paav7_streams_multi' }] }),
    });
    const db = await dbRes.json();
    setStreams(db.results[0]?.value || {});
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await fetch('/api/db', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'set', key:'paav7_streams_multi', value:streams }] }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  function updateStream(idx, val) {
    const current = streams[selGrade] || [''];
    const updated = [...current];
    updated[idx] = val;
    setStreams(p => ({ ...p, [selGrade]: updated }));
  }

  function addStream() {
    const current = streams[selGrade] || [];
    if (current.length >= 15) { alert('Max 15 streams reached'); return; }
    setStreams(p => ({ ...p, [selGrade]: [...current, ''] }));
  }

  function removeStream(idx) {
    const current = streams[selGrade] || [];
    const updated = current.filter((_, i) => i !== idx);
    setStreams(p => ({ ...p, [selGrade]: updated }));
  }

  if (loading) return <div style={{ padding:40, color:'var(--muted)' }}>Loading…</div>;

  const currentStreams = streams[selGrade] || [];

  return (
    <div className="page on">
      <div className="page-hdr">
        <div><h2>⚙ Streams Management</h2><p>Configure multiple streams (up to 15) for each grade</p></div>
        <div className="page-hdr-acts">
          <button className="btn btn-primary" onClick={save}>💾 Save All Changes</button>
        </div>
      </div>

      {saved && <div className="alert alert-ok show" style={{ display:'flex', marginBottom:14 }}>✅ Saved successfully!</div>}

      <div className="sg sg4" style={{ marginBottom: 20 }}>
        <div className="panel" style={{ gridColumn: 'span 1' }}>
          <div className="panel-hdr"><h3>Select Grade</h3></div>
          <div className="list-group">
            {ALL_GRADES.map(g => (
              <div key={g} 
                className={`list-item ${selGrade === g ? 'active' : ''}`}
                onClick={() => setSelGrade(g)}
                style={{ cursor:'pointer', padding: 10, fontSize: 13, borderBottom: '1px solid #eee' }}>
                {g} <span style={{ float:'right', fontSize: 11, opacity: 0.5 }}>{(streams[g] || []).length} streams</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 3' }}>
          <div className="panel-hdr">
            <h3>Streams for {selGrade}</h3>
            <button className="btn btn-sm btn-ghost" onClick={addStream}>➕ Add Stream</button>
          </div>
          <div className="panel-body">
            {currentStreams.length === 0 ? <p style={{ textAlign:'center', padding: 40, opacity: 0.5 }}>No streams defined. Add one below.</p> : (
              <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
                {currentStreams.map((s, i) => (
                  <div key={i} className="field" style={{ position: 'relative', marginBottom: 0 }}>
                    <label>Stream {i + 1}</label>
                    <div style={{ display:'flex', gap: 5 }}>
                      <input 
                        value={s} 
                        onChange={e => updateStream(i, e.target.value)}
                        placeholder="Stream name (e.g. Red, Daisy)"
                      />
                      <button className="btn btn-danger btn-sm" onClick={() => removeStream(i)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .list-item.active {
          background: var(--primary);
          color: #fff;
          font-weight: 700;
        }
        .list-item:hover:not(.active) {
          background: #F8FAFF;
        }
      `}</style>
    </div>
  );
}
