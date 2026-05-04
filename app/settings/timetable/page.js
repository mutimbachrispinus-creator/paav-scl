'use client';
export const runtime = 'edge';
/**
 * app/settings/timetable/page.js — Admin: configure school timetable parameters
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function TimetableSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState({
    startTime: '08:00',
    lessonDuration: 40,
    breaks: [
      { name: 'Short Break', startTime: '10:00', duration: 20 },
      { name: 'Lunch Break', startTime: '12:40', duration: 60 },
    ],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    lessonsPerDay: 8
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const authRes = await fetch('/api/auth');
      const auth = await authRes.json();
      if (!auth.ok || auth.user?.role !== 'admin') { router.push('/dashboard'); return; }

      const dbRes = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'get', key: 'paav7_timetable_cfg' }] }),
      });
      const db = await dbRes.json();
      if (db.results[0]?.value) setConfig(db.results[0].value);
      setLoading(false);
    }
    load();
  }, [router]);

  async function save() {
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_timetable_cfg', value: config }] }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const F = (k, v) => setConfig(p => ({ ...p, [k]: v }));

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div><h2>📅 Timetable Configuration</h2><p>Set lesson durations, breaks, and start times</p></div>
        <div className="page-hdr-acts">
          <button className="btn btn-primary" onClick={save}>💾 Save Config</button>
        </div>
      </div>

      {saved && <div className="alert alert-ok show" style={{ marginBottom: 15 }}>✅ Configuration saved!</div>}

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr"><h3>General Parameters</h3></div>
          <div className="panel-body">
            <div className="field">
              <label>School Start Time</label>
              <input type="time" value={config.startTime} onChange={e => F('startTime', e.target.value)} />
            </div>
            <div className="field">
              <label>Lesson Duration (minutes)</label>
              <input type="number" value={config.lessonDuration} onChange={e => F('lessonDuration', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Lessons Per Day</label>
              <input type="number" value={config.lessonsPerDay} onChange={e => F('lessonsPerDay', Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr">
            <h3>Break Intervals</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => F('breaks', [...config.breaks, { name:'New Break', startTime:'12:00', duration:30 }])}>
              ➕ Add Break
            </button>
          </div>
          <div className="panel-body">
            {config.breaks.map((b, i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:15, borderBottom:'1px solid #eee', paddingBottom:10 }}>
                <div style={{ flex:2 }} className="field">
                  <label>Break Name</label>
                  <input value={b.name} onChange={e => {
                    const nb = [...config.breaks]; nb[i].name = e.target.value; F('breaks', nb);
                  }} />
                </div>
                <div style={{ flex:1 }} className="field">
                  <label>Starts At</label>
                  <input type="time" value={b.startTime} onChange={e => {
                    const nb = [...config.breaks]; nb[i].startTime = e.target.value; F('breaks', nb);
                  }} />
                </div>
                <div style={{ flex:1 }} className="field">
                  <label>Mins</label>
                  <input type="number" value={b.duration} onChange={e => {
                    const nb = [...config.breaks]; nb[i].duration = Number(e.target.value); F('breaks', nb);
                  }} />
                </div>
                <button className="btn btn-danger btn-sm" style={{ alignSelf:'flex-end', marginBottom:8 }} onClick={() => {
                  F('breaks', config.breaks.filter((_, idx) => idx !== i));
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
