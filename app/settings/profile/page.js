'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDB, invalidateDB, fetchWithRetry, mutateDB } from '@/lib/client-cache';
import { writeSchoolProfileCache, readSchoolProfile } from '@/lib/school-profile';
import { useProfile } from '@/app/PortalShell';

const PRESET_COLORS = [
  { name: 'Maroon (Default)', p: '#8B1A1A', s: '#D4AF37' },
  { name: 'Navy Blue', p: '#1E3A8A', s: '#3B82F6' },
  { name: 'Forest Green', p: '#065F46', s: '#10B981' },
  { name: 'Deep Purple', p: '#581C87', s: '#8B5CF6' },
  { name: 'Sleek Black', p: '#0F172A', s: '#64748B' },
];

export default function SchoolProfilePage() {
  const router = useRouter();
  const { playSuccessSound } = useProfile();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return { name: '', motto: '', phone: '', email: '', address: '', website: '', logo: '', bankAccounts: [] };
    return readSchoolProfile() || { name: '', motto: '', phone: '', email: '', address: '', website: '', logo: '', bankAccounts: [] };
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return { primary: '#8B1A1A', secondary: '#D4AF37', accent: '#1E293B' };
    try {
      const raw = localStorage.getItem('paav_cache_db_paav_theme');
      if (raw) return JSON.parse(raw).v;
    } catch {}
    return { primary: '#8B1A1A', secondary: '#D4AF37', accent: '#1E293B' };
  });
  
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('info'); // info | branding | payments

  useEffect(() => {
    async function load() {
      const u = await getCachedUser();
      if (!u || u.role !== 'admin') { router.push('/'); return; }
      setUser(u);
      
      const pRaw = await getCachedDB('paav_school_profile');
      const tRaw = await getCachedDB('paav_theme');
      
      if (pRaw) setProfile(prev => ({ ...prev, ...pRaw }));
      if (tRaw) setTheme(prev => ({ ...prev, ...tRaw }));
      
      setLoading(false);
    }
    load();
  }, [router]);

  async function save() {
    setBusy(true);
    try {
      // Use the robust mutateDB engine for atomic updates and instant cache hydration
      await mutateDB('paav_school_profile', profile);
      await mutateDB('paav_theme', theme);

      playSuccessSound();
      alert('✅ School configuration updated successfully!');
    } catch (e) {
      alert('❌ Failed to save: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  const addBank = () => setProfile({ ...profile, bankAccounts: [...(profile.bankAccounts || []), { bank: '', branch: '', accName: '', accNo: '' }] });
  const updateBank = (i, k, v) => {
    const list = [...profile.bankAccounts];
    list[i][k] = v;
    setProfile({ ...profile, bankAccounts: list });
  };
  const removeBank = (i) => setProfile({ ...profile, bankAccounts: profile.bankAccounts.filter((_, idx) => idx !== i) });

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setProfile({ ...profile, logo: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  if (loading || !user) return <div className="page on"><p>Loading...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🏫 School Configuration</h2>
          <p>Branding, Contacts, and Payment Accounts</p>
        </div>
        <div className="page-hdr-acts">
           <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
             {busy ? 'Saving...' : '💾 Save Changes'}
           </button>
        </div>
      </div>

      <div className="tabs no-print" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${tab === 'info' ? 'on' : ''}`} onClick={() => setTab('info')}>📞 Info & Contacts</button>
        <button className={`tab-btn ${tab === 'branding' ? 'on' : ''}`} onClick={() => setTab('branding')}>🎨 Branding & Theme</button>
        <button className={`tab-btn ${tab === 'payments' ? 'on' : ''}`} onClick={() => setTab('payments')}>💰 Payment Accounts</button>
      </div>

      <div className="panel" style={{ maxWidth: 800 }}>
        <div className="panel-body">
          
          {tab === 'info' && (
            <div className="sg sg1">
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
                <label>Physical Address</label>
                <textarea 
                  value={profile.address} 
                  onChange={e => setProfile({...profile, address: e.target.value})} 
                  placeholder="Street, City, Country"
                  style={{ minHeight: 80 }}
                />
              </div>
              <div className="field">
                <label>Website URL</label>
                <input value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} placeholder="https://www.school.com" />
              </div>
            </div>
          )}

          {tab === 'branding' && (
            <div className="sg sg1">
              <div className="field">
                <label>School Logo (Upload Image or Paste URL)</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={handleLogoUpload} 
                    style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 8 }} 
                  />
                  <div style={{ padding: '8px', color: 'var(--muted)', fontWeight: 600 }}>OR</div>
                  <input 
                    value={profile.logo} 
                    onChange={e => setProfile({...profile, logo: e.target.value})} 
                    placeholder="https://..." 
                    style={{ flex: 2 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Upload a file from your device, or paste an image URL. High resolution PNG with transparent background is recommended.</p>
              </div>
              
              <div style={{ marginBottom: 25, display: 'flex', gap: 20, alignItems: 'center', background: '#F8FAFC', padding: 15, borderRadius: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 5 }}>Logo Preview</div>
                  <div style={{ width: 80, height: 80, background: '#fff', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {profile.logo ? <img src={profile.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" /> : '🖼️'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                   <h4 style={{ margin: 0, color: theme.primary }}>{profile.name || 'School Name'}</h4>
                   <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>{profile.motto || 'Motto goes here...'}</p>
                </div>
              </div>

              <div className="field">
                <label>Portal Theme Colors</label>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
                   <div>
                     <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Primary Color</div>
                     <input type="color" value={theme.primary} onChange={e => setTheme({...theme, primary: e.target.value})} style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                   </div>
                   <div>
                     <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Secondary Color</div>
                     <input type="color" value={theme.secondary} onChange={e => setTheme({...theme, secondary: e.target.value})} style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                   </div>
                   <div>
                     <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Accent/Nav Color</div>
                     <input type="color" value={theme.accent} onChange={e => setTheme({...theme, accent: e.target.value})} style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                   </div>
                </div>
              </div>

              <div className="field">
                <label>Presets</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  {PRESET_COLORS.map(p => (
                    <button 
                      key={p.name} 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setTheme({ primary: p.p, secondary: p.s, accent: '#1E293B' })}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.p }}></div>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="sg sg1">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>🏦 Bank Accounts</h3>
                <button className="btn btn-ghost btn-sm" onClick={addBank}>+ Add Account</button>
              </div>
              
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
                These bank details will be visible to parents in their dashboard. 
                For M-Pesa Paybill/Till configuration, use the <a href="/fees" style={{ color: 'var(--primary)', fontWeight: 700 }}>Fees Dashboard</a>.
              </p>

              {(profile.bankAccounts || []).map((acc, i) => (
                <div key={i} style={{ padding: 15, border: '1.5px solid var(--border)', borderRadius: 12, marginBottom: 15, background: '#FAFBFF', position: 'relative' }}>
                  <button 
                    onClick={() => removeBank(i)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 18 }}
                  >✕</button>
                  <div className="field-row">
                    <div className="field">
                      <label>Bank Name</label>
                      <input value={acc.bank} onChange={e => updateBank(i, 'bank', e.target.value)} placeholder="e.g. Equity Bank" />
                    </div>
                    <div className="field">
                      <label>Branch</label>
                      <input value={acc.branch} onChange={e => updateBank(i, 'branch', e.target.value)} placeholder="e.g. Westlands" />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Account Name</label>
                      <input value={acc.accName} onChange={e => updateBank(i, 'accName', e.target.value)} placeholder="e.g. Hilltop Primary School" />
                    </div>
                    <div className="field">
                      <label>Account Number</label>
                      <input value={acc.accNo} onChange={e => updateBank(i, 'accNo', e.target.value)} placeholder="e.g. 1234567890" />
                    </div>
                  </div>
                </div>
              ))}

              {(!profile.bankAccounts || profile.bankAccounts.length === 0) && (
                <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 12, color: 'var(--muted)' }}>
                  No bank accounts added yet.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      
      <style jsx>{`
        .tab-btn {
          padding: 10px 20px;
          border: none;
          background: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          transition: all 0.2s;
        }
        .tab-btn.on {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .tab-btn:hover:not(.on) {
          background: #F8FAFC;
        }
      `}</style>
    </div>
  );
}
