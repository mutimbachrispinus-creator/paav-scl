'use client';
/**
 * app/settings/streams/page.js — Admin: rename class streams
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES } from '@/lib/cbe';

export default function StreamsPage() {
  const router  = useRouter();
  const [streams, setStreams] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved,   setSaved]   = useState(false);

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth    = await authRes.json();
    if (!auth.ok || auth.user?.role !== 'admin') { router.push('/dashboard'); return; }

    const dbRes = await fetch('/api/db', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'get', key:'paav7_streams' }] }),
    });
    const db = await dbRes.json();
    setStreams(db.results[0]?.value || {});
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await fetch('/api/db', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'set', key:'paav7_streams', value:streams }] }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div style={{ padding:40, color:'var(--muted)' }}>Loading…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div><h2>⚙ Streams</h2><p>Rename class streams for each grade</p></div>
        <div className="page-hdr-acts">
          <button className="btn btn-primary btn-sm" onClick={save}>💾 Save</button>
        </div>
      </div>
      {saved && <div className="alert alert-ok show" style={{ display:'flex', marginBottom:14 }}>✅ Saved!</div>}
      <div className="panel">
        <div className="panel-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {ALL_GRADES.map(g => (
              <div key={g} className="field" style={{ marginBottom:0 }}>
                <label>{g} — Stream Name</label>
                <input
                  value={streams[g] || ''}
                  onChange={e => setStreams(p => ({ ...p, [g]: e.target.value }))}
                  placeholder="e.g. Daisy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
