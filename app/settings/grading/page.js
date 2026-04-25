'use client';
/**
 * app/settings/grading/page.js — Adjust CBE/CBC grading thresholds
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { JSS_SCALE, PRIMARY_SCALE } from '@/lib/cbe';

export default function GradingSettingsPage() {
  const router  = useRouter();
  const [jss,   setJss]   = useState(JSS_SCALE.map(s => ({ ...s })));
  const [pri,   setPri]   = useState(PRIMARY_SCALE.map(s => ({ ...s })));
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth    = await authRes.json();
    if (!auth.ok || auth.user?.role !== 'admin') { router.push('/dashboard'); return; }

    const dbRes = await fetch('/api/db', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'get', key:'paav8_grad' }] }),
    });
    const db  = await dbRes.json();
    const cfg = db.results[0]?.value;
    if (cfg?.jss) setJss(cfg.jss.map(s => ({ ...s })));
    if (cfg?.pri) setPri(cfg.pri.map(s => ({ ...s })));
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await fetch('/api/db', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'set', key:'paav8_grad', value:{ jss, pri } }] }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  function ScaleEditor({ scale, setScale, title }) {
    return (
      <div className="panel" style={{ marginBottom:16 }}>
        <div className="panel-hdr"><h3>{title}</h3></div>
        <div className="panel-body">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Level</th><th>Min Score (%)</th><th>Points</th><th>Description</th></tr>
              </thead>
              <tbody>
                {scale.map((s, i) => (
                  <tr key={s.lv}>
                    <td>
                      <span className="badge"
                        style={{ background:s.bg, color:s.c }}>{s.lv}</span>
                    </td>
                    <td>
                      <input type="number" value={s.min} min="0" max="100"
                        onChange={e => {
                          const updated = [...scale];
                          updated[i] = { ...s, min: Number(e.target.value) };
                          setScale(updated);
                        }}
                        style={{ width:72, padding:'5px 8px', border:'2px solid var(--border)',
                          borderRadius:6, fontSize:12, outline:'none' }}
                      />
                    </td>
                    <td style={{ fontWeight:700 }}>{s.pts}</td>
                    <td style={{ fontSize:11.5, color:'var(--muted)' }}>{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding:40, color:'var(--muted)' }}>Loading…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div><h2>⚙ Grading Settings</h2><p>Adjust CBC minimum score thresholds per level</p></div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm" onClick={load}>↺ Reset to DB</button>
          <button className="btn btn-primary btn-sm" onClick={save}>💾 Save Changes</button>
        </div>
      </div>
      {saved && <div className="alert alert-ok show" style={{ display:'flex', marginBottom:14 }}>✅ Saved!</div>}
      <div className="note-box" style={{ marginBottom:18 }}>
        Changes apply immediately to all marks entry, report cards, and merit lists.
        Lowering a threshold upgrades learners; raising it downgrades them.
      </div>
      <ScaleEditor scale={jss} setScale={setJss} title="JSS / Senior (Grade 7–12) — 8-Level Scale" />
      <ScaleEditor scale={pri} setScale={setPri} title="Primary / Pre-School (KG–Grade 6) — 4-Level Scale" />
    </div>
  );
}
