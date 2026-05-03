'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { getAllGrades } from '@/lib/cbe';
import { getCurriculum } from '@/lib/curriculum';
import { useProfile } from '@/app/PortalShell';

const CATEGORIES = [
  { id: 'all', label: 'All Files', icon: '📁' },
  { id: 'notes', label: 'Class Notes', icon: '📝' },
  { id: 'exams', label: 'Past Papers', icon: '📄' },
  { id: 'schemes', label: 'Schemes of Work', icon: '📅' }
];

export default function EducationHubPage() {
  const router = useRouter();
  const { profile: school } = useProfile() || {};
  const curr = getCurriculum(school?.curriculum || 'CBC');
  const ALL_GRADES = curr.ALL_GRADES || [];
  const RESOURCES = curr.RESOURCES || [];
  const TERMS = curr.TERMS || [{ id: 'T1', name: 'Term 1' }, { id: 'T2', name: 'Term 2' }, { id: 'T3', name: 'Term 3' }];

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [selGrade, setSelGrade] = useState('ALL');
  const [selCat, setSelCat] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', grade: '', subject: '', category: 'notes', url: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (ALL_GRADES.length > 0 && !newDoc.grade) {
      setNewDoc(d => ({ ...d, grade: ALL_GRADES[0] }));
    }
  }, [ALL_GRADES]);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u) { router.push('/'); return; }
    setUser(u);
    const db = await getCachedDBMulti(['paav7_learning_docs']);
    setDocs(db.paav7_learning_docs || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function saveDoc() {
    if (!newDoc.title || !newDoc.url) return;
    const doc = { ...newDoc, id: Date.now(), author: user.name, date: new Date().toISOString() };
    const updated = [doc, ...docs];
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_learning_docs', value: updated }] })
    });
    setDocs(updated);
    setShowUpload(false);
    setNewDoc({ title: '', grade: ALL_GRADES[0] || '', subject: '', category: 'notes', url: '' });
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.ok) {
        setNewDoc(prev => ({ ...prev, url: data.url, title: prev.title || file.name }));
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Education Hub…</div>;

  // Partition resources by category
  const officialRes = RESOURCES.filter(r => r.cat === 'Official');
  const otherRes    = RESOURCES.filter(r => r.cat !== 'Official');

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🎓 Academic Resource Center</h2>
          <p>{curr.name || school?.curriculum || 'CBC'} — Resources &amp; Institutional Learning Library</p>
        </div>
        <div className="page-hdr-acts">
          {(user.role === 'admin' || user.role === 'teacher') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>+ Upload Material</button>
          )}
        </div>
      </div>

      {/* Academic Calendar / Terms Banner */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        {TERMS.map(t => (
          <div key={t.id} style={{ background: 'linear-gradient(135deg,#1E40AF,#1E3A8A)', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            📆 {t.name}
          </div>
        ))}
      </div>

      <div className="sg sg4" style={{ marginBottom: 25 }}>
        {CATEGORIES.map(c => (
          <div key={c.id} className={`panel cat-card ${selCat === c.id ? 'active' : ''}`} onClick={() => setSelCat(c.id)}>
            <div className="cat-icon">{c.icon}</div>
            <div className="cat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="sg-responsive">
        {/* Resource Library */}
        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-hdr">
            <h3>📂 Resource Library</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={selGrade} onChange={e => setSelGrade(e.target.value)} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>
                <option value="ALL">All Grades</option>
                {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {docs.filter(d => (selGrade === 'ALL' || d.grade === selGrade) && (selCat === 'all' || d.category === selCat)).map((d, i) => (
                <div key={i} className="doc-row">
                  <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div style={{ fontSize: 24 }}>📄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy)' }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.grade} • {d.subject} • Shared by {d.author}</div>
                    </div>
                  </div>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 20, textDecoration: 'none' }}>📥</a>
                </div>
              ))}
              {docs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', background: '#F8FAFC', borderRadius: 15 }}>
                  <div style={{ fontSize: 48, marginBottom: 15 }}>📚</div>
                  <h3 style={{ margin: 0 }}>No materials found</h3>
                  <p style={{ fontSize: 12, maxWidth: 300, margin: '10px auto 0' }}>
                    {user.role === 'parent' ? "Teachers haven't shared any notes yet." : 'Upload class notes or past papers for your students.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar" style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {officialRes.length > 0 && (
            <div className="panel">
              <div className="panel-hdr" style={{ background: 'linear-gradient(135deg, #0369A1, #075985)', color: '#fff' }}>
                <h3 style={{ color: '#fff' }}>🌐 Official {curr.name || school?.curriculum || 'CBC'} Portals</h3>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {officialRes.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="kicd-link">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{r.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {otherRes.length > 0 && (
            <div className="panel">
              <div className="panel-hdr"><h3>📚 Learning Resources</h3></div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {otherRes.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="kicd-link">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{r.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-hdr">
              <h3>➕ Upload Resource</h3>
              <button className="modal-close" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Resource Title</label>
                <input value={newDoc.title} onChange={e => setNewDoc({...newDoc, title: e.target.value})} placeholder="e.g. Mathematics Mid-Term Paper" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Grade / Level</label>
                  <select value={newDoc.grade} onChange={e => setNewDoc({...newDoc, grade: e.target.value})}>
                    {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Category</label>
                  <select value={newDoc.category} onChange={e => setNewDoc({...newDoc, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Subject</label>
                <input value={newDoc.subject} onChange={e => setNewDoc({...newDoc, subject: e.target.value})} placeholder="e.g. Mathematics" />
              </div>
              <div className="field">
                <label>File Upload</label>
                <div style={{ border: '2px dashed #E2E8F0', padding: 20, borderRadius: 12, textAlign: 'center', background: '#F8FAFC' }}>
                  {uploading ? (
                    <div style={{ fontSize: 12, fontWeight: 700 }}>⏳ Uploading...</div>
                  ) : (
                    <>
                      <input type="file" id="file-up" style={{ display: 'none' }} onChange={handleFileChange} />
                      <label htmlFor="file-up" style={{ cursor: 'pointer', display: 'block' }}>
                        <div style={{ fontSize: 32, marginBottom: 5 }}>📁</div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{newDoc.url ? '✅ File Ready' : 'Click to Select File'}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{newDoc.url || 'PDF, Docs, Images (Max 10MB)'}</div>
                      </label>
                    </>
                  )}
                </div>
              </div>
              <div className="field">
                <label>Or External Link URL</label>
                <input value={newDoc.url} onChange={e => setNewDoc({...newDoc, url: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveDoc} disabled={uploading}>Upload &amp; Share</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .sg-responsive { display: flex; gap: 20px; }
        .cat-card { cursor: pointer; text-align: center; padding: 20px; transition: 0.2s; border: 1.5px solid #E2E8F0; }
        .cat-card:hover { transform: translateY(-3px); border-color: var(--primary); background: var(--primary-low); }
        .cat-card.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .cat-icon { font-size: 24px; margin-bottom: 8px; }
        .cat-label { font-weight: 800; font-size: 12px; }
        .doc-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border: 1.5px solid #F1F5F9; border-radius: 12px; transition: 0.2s; }
        .doc-row:hover { border-color: var(--primary); transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .kicd-link { text-decoration: none; color: inherit; padding: 12px; border-radius: 10px; border: 1.5px solid #F1F5F9; transition: 0.2s; display: block; }
        .kicd-link:hover { background: #F0F9FF; border-color: #0369A1; transform: translateX(5px); }
        @media (max-width: 1000px) {
          .sg-responsive { flex-direction: column; }
          .sidebar { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
