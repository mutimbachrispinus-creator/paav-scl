'use client';
/**
 * app/settings/portal/page.js — Admin: Portal Branding & Announcements
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    announcement: '',
    heroImg: '',
  });

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth = await authRes.json();
    if (!auth.ok || auth.user?.role !== 'admin') { router.push('/dashboard'); return; }

    const dbRes = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [
        { type: 'get', key: 'paav7_announcement' },
        { type: 'get', key: 'paav7_hero_img' }
      ] }),
    });
    const db = await dbRes.json();
    setForm({
      announcement: db.results[0]?.value || '',
      heroImg: db.results[1]?.value || '',
    });
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [
        { type: 'set', key: 'paav7_announcement', value: form.announcement },
        { type: 'set', key: 'paav7_hero_img', value: form.heroImg }
      ] }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div><h2>🎨 Portal Branding</h2><p>Configure Hero image and Login page announcements</p></div>
        <div className="page-hdr-acts">
          <button className="btn btn-primary" onClick={save}>💾 Save Portal Settings</button>
        </div>
      </div>

      {saved && <div className="alert alert-ok show" style={{ marginBottom: 15 }}>✅ Settings updated!</div>}

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr"><h3>Announcement</h3></div>
          <div className="panel-body">
            <div className="field">
              <label>Scrolling / Panel Announcement</label>
              <textarea 
                value={form.announcement} 
                onChange={e => setForm({...form, announcement: e.target.value})}
                placeholder="Enter important school news here..."
                style={{ minHeight: 120 }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>This text appears on the login page left panel for all visitors.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>Hero Background</h3></div>
          <div className="panel-body">
            <div className="field">
              <label>Hero Image URL</label>
              <input 
                value={form.heroImg} 
                onChange={e => setForm({...form, heroImg: e.target.value})}
                placeholder="https://example.com/school-photo.jpg"
              />
            </div>
            <div style={{ marginTop: 15, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--border)', height: 160, background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {form.heroImg ? <img src={form.heroImg} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>No image preview</span>}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Paste a direct link to an image. This will be the login page background.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
