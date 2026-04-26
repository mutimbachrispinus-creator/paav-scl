'use client';
/**
 * app/profile/page.js — Learner & Staff Profile Viewer
 *
 * Tabs: My Profile | Change Password | Staff Directory | Learner Lookup
 * Features:
 *   - View / edit own profile info
 *   - Upload profile photo via file input (stores as base64 in DB)
 *   - Staff directory with search
 *   - Learner lookup by name / admission
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const M = '#8B1A1A', ML = '#FDF2F2';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('me');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Own profile
  const [profileData, setProfileData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null); // base64

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  // Staff directory
  const [allStaff, setAllStaff] = useState([]);
  const [staffQ, setStaffQ] = useState('');

  // Learner lookup
  const [allLearners, setAllLearners] = useState([]);
  const [learnerQ, setLearnerQ] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);

  const photoRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [authRes, dbRes] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [
            { type: 'get', key: 'paav6_staff' },
            { type: 'get', key: 'paav6_learners' },
            { type: 'get', key: 'paav_profiles' },
          ]})
        })
      ]);
      const auth = await authRes.json();
      if (!auth.ok) { router.push('/'); return; }
      setUser(auth.user);

      const db = await dbRes.json();
      const staff = db.results[0]?.value || [];
      const learners = db.results[1]?.value || [];
      const profiles = db.results[2]?.value || {};

      setAllStaff(staff);
      setAllLearners(learners);

      // Load own profile (merge staff record + extra profiles)
      const myStaff = staff.find(s => s.id === auth.user.id) || {};
      const myExtra = profiles[auth.user.id] || {};
      setProfileData({ ...myStaff, ...auth.user, ...myExtra });
      if (myExtra.photo) setPhotoPreview(myExtra.photo);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPhotoPreview(ev.target.result);
      setNewPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const dbRes = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'get', key: 'paav_profiles' }] })
      });
      const db = await dbRes.json();
      const profiles = db.results[0]?.value || {};
      profiles[user.id] = { ...profiles[user.id], ...profileData, photo: newPhoto || photoPreview || '' };

      await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_profiles', value: profiles }] })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert('Error saving profile: ' + e.message); }
    finally { setBusy(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'New passwords do not match' }); return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ type: 'err', text: 'Password must be at least 6 characters' }); return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', current: pwForm.current, next: pwForm.next })
      });
      const data = await res.json();
      if (data.ok) {
        setPwMsg({ type: 'ok', text: '✅ Password changed successfully!' });
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        setPwMsg({ type: 'err', text: data.error || 'Failed to change password' });
      }
    } catch (e) { setPwMsg({ type: 'err', text: e.message }); }
    finally { setBusy(false); }
  }

  const filteredStaff = allStaff.filter(s =>
    !staffQ || s.name?.toLowerCase().includes(staffQ.toLowerCase()) ||
    s.role?.toLowerCase().includes(staffQ.toLowerCase())
  );
  const filteredLearners = learnerQ.length >= 2 ? allLearners.filter(l =>
    l.name?.toLowerCase().includes(learnerQ.toLowerCase()) ||
    l.adm?.toLowerCase().includes(learnerQ.toLowerCase())
  ) : [];

  if (loading) return <div className="page on"><p style={{ padding: 30 }}>Loading profile…</p></div>;

  const TABS = [
    { key: 'me', label: '👤 My Profile' },
    { key: 'pw', label: '🔒 Password' },
    { key: 'staff', label: '👔 Staff Directory' },
    ...(user?.role === 'admin' || user?.role === 'teacher' ? [{ key: 'learner', label: '🎓 Learner Lookup' }] : []),
  ];

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>👤 Profile</h2>
          <p>Manage your profile and view school directory</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`profile-tab-btn${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── My Profile ── */}
      {tab === 'me' && profileData && (
        <form onSubmit={saveProfile}>
          <div className="sg sg2">
            {/* Avatar panel */}
            <div className="panel">
              <div className="panel-hdr"><h3>Profile Photo</h3></div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div className="photo-upload-wrapper" style={{ width: 100, height: 100 }}>
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Profile" style={{ width: 100, height: 100, borderRadius: 18, objectFit: 'cover', border: `3px solid ${M}` }} />
                  ) : (
                    <div style={{ width: 100, height: 100, borderRadius: 18, background: `linear-gradient(135deg, ${M}, #6B1212)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#fff', fontWeight: 800 }}>
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <button type="button" className="photo-upload-btn" onClick={() => photoRef.current?.click()} title="Upload photo">📷</button>
                </div>
                <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{profileData.name}</div>
                  <span className="badge bg-purple" style={{ marginTop: 4 }}>{profileData.role}</span>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => photoRef.current?.click()}>📷 Change Photo</button>
                <p style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>Photo is saved to your device file system — no URL needed</p>
              </div>
            </div>

            {/* Info panel */}
            <div className="panel">
              <div className="panel-hdr"><h3>Personal Details</h3></div>
              <div className="panel-body">
                <div className="field">
                  <label>Full Name</label>
                  <input value={profileData.name || ''} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={profileData.email || ''} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={profileData.phone || ''} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Role / Subject</label>
                  <input value={profileData.subject || profileData.role || ''} readOnly style={{ opacity: .65 }} />
                </div>
                <div className="field">
                  <label>Staff ID</label>
                  <input value={profileData.id || user?.id || ''} readOnly style={{ opacity: .65 }} />
                </div>
                {saved && <div className="alert alert-ok show">✅ Profile saved!</div>}
                <button type="submit" className="btn btn-maroon" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} disabled={busy}>
                  {busy ? 'Saving…' : '💾 Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Change Password ── */}
      {tab === 'pw' && (
        <div className="panel" style={{ maxWidth: 480 }}>
          <div className="panel-hdr"><h3>🔒 Change Password</h3></div>
          <div className="panel-body">
            <form onSubmit={changePassword}>
              <div className="field">
                <label>Current Password</label>
                <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required />
              </div>
              <div className="field">
                <label>New Password</label>
                <input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} required minLength={6} />
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              {pwMsg.text && (
                <div className={`alert ${pwMsg.type === 'ok' ? 'alert-ok' : 'alert-err'} show`}>{pwMsg.text}</div>
              )}
              <button type="submit" className="btn btn-maroon" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                {busy ? 'Changing…' : '🔑 Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Staff Directory ── */}
      {tab === 'staff' && (
        <div className="panel">
          <div className="panel-hdr">
            <h3>👔 Staff Directory</h3>
            <input
              className="field" style={{ margin: 0, width: 220 }}
              placeholder="Search by name or role…"
              value={staffQ} onChange={e => setStaffQ(e.target.value)}
            />
          </div>
          <div className="panel-body">
            <div className="sg sg3">
              {filteredStaff.map(s => (
                <div key={s.id} className="stat-card" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${M}, #6B1212)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                      {s.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                      <span className="badge bg-purple" style={{ marginTop: 3 }}>{s.role}</span>
                      {s.subject && <div style={{ fontSize: 11.5, color: '#666', marginTop: 3 }}>📚 {s.subject}</div>}
                      {s.phone && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>📞 {s.phone}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {filteredStaff.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>No staff found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Learner Lookup ── */}
      {tab === 'learner' && (
        <div className="panel">
          <div className="panel-hdr">
            <h3>🎓 Learner Lookup</h3>
          </div>
          <div className="panel-body">
            <div className="field" style={{ maxWidth: 340 }}>
              <label>Search by Name or Admission No.</label>
              <input
                placeholder="Type at least 2 characters…"
                value={learnerQ} onChange={e => { setLearnerQ(e.target.value); setSelectedLearner(null); }}
              />
            </div>
            {filteredLearners.length > 0 && !selectedLearner && (
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Adm</th><th>Name</th><th>Grade</th><th>Stream</th><th></th></tr></thead>
                  <tbody>
                    {filteredLearners.slice(0, 20).map(l => (
                      <tr key={l.adm}>
                        <td><span className="badge bg-gray">{l.adm}</span></td>
                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                        <td>{l.grade}</td>
                        <td>{l.stream || '—'}</td>
                        <td><button className="btn btn-sm btn-maroon" onClick={() => setSelectedLearner(l)}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedLearner && (
              <div>
                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setSelectedLearner(null)}>← Back to Results</button>
                <div className="sg sg2">
                  <div className="panel" style={{ background: `linear-gradient(135deg, ${M}, #6B1212)`, color: '#fff' }}>
                    <div className="panel-body">
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
                      <div style={{ fontFamily: '\'Sora\', sans-serif', fontSize: 17, fontWeight: 800 }}>{selectedLearner.name}</div>
                      <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>Adm: {selectedLearner.adm}</div>
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                          ['Grade', selectedLearner.grade],
                          ['Stream', selectedLearner.stream || '—'],
                          ['DOB', selectedLearner.dob || '—'],
                          ['Parent/Guardian', selectedLearner.parent || '—'],
                          ['Contact', selectedLearner.phone || '—'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                            <span style={{ opacity: .6, minWidth: 110 }}>{k}:</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-hdr"><h3>Admission Details</h3></div>
                    <div className="panel-body">
                      {[
                        ['Admission No.', selectedLearner.adm],
                        ['Full Name', selectedLearner.name],
                        ['Grade', selectedLearner.grade],
                        ['Stream', selectedLearner.stream || '—'],
                        ['Date of Birth', selectedLearner.dob || '—'],
                        ['Gender', selectedLearner.gender || '—'],
                        ['Parent / Guardian', selectedLearner.parent || '—'],
                        ['Contact', selectedLearner.phone || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="profile-field">
                          <div className="profile-label">{label}</div>
                          <div style={{ fontWeight: 600 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
