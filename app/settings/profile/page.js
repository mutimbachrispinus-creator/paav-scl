'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDB, invalidateDB } from '@/lib/client-cache';
import { useProfile } from '@/app/PortalShell';

export default function SchoolProfilePage() {
  const router = useRouter();
  const { playSuccessSound } = useProfile();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: '', motto: '', phone: '', email: '', logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await getCachedUser();
      if (!u || u.role !== 'admin') { router.push('/'); return; }
      setUser(u);
      
      const db = await getCachedDB('paav_school_profile');
      if (db) setProfile(db);
      setLoading(false);
    }
    load();
  }, [router]);

  async function save() {
    setBusy(true);
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ type: 'set', key: 'paav_school_profile', value: profile }]
        })
      });
      invalidateDB(['paav_school_profile']);
      playSuccessSound();
      alert('✅ School profile updated successfully!');
    } catch (e) {
      alert('❌ Failed to save: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <div className="page on"><p>Loading...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🏫 School Profile</h2>
          <p>Customize how your school appears across the portal</p>
        </div>
        <div className="page-hdr-acts">
           <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
             {busy ? 'Saving...' : '💾 Save Profile'}
           </button>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 600 }}>
        <div className="panel-body">
          <div className="field">
            <label>School Name</label>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Hilltop Academy" />
          </div>
          <div className="field">
            <label>School Motto / Tagline</label>
            <input value={profile.motto} onChange={e => setProfile({...profile, motto: e.target.value})} placeholder="e.g. Excellence in Education" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Official Phone</label>
              <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="07XXXXXXXX" />
            </div>
            <div className="field">
              <label>Official Email</label>
              <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="info@school.com" />
            </div>
          </div>
          <div className="field">
            <label>Logo URL (PNG/JPG)</label>
            <input value={profile.logo} onChange={e => setProfile({...profile, logo: e.target.value})} placeholder="https://..." />
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Note: High resolution PNG with transparent background is recommended.</p>
          </div>
          
          {profile.logo && (
            <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: '#F8FAFC', borderRadius: 12 }}>
               <p style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Preview:</p>
               <img src={profile.logo} alt="Preview" style={{ height: 100, objectFit: 'contain' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
