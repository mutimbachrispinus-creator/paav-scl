'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { ALL_GRADES } from '@/lib/cbe';

const KICD_RESOURCES = [
  { title: 'Kenya Education Cloud', url: 'https://kec.ac.ke/', desc: 'KICD-curated digital lessons and e-books.', icon: '☁️' },
  { title: 'CBC Curriculum Designs', url: 'https://kicd.ac.ke/cbc-curriculum-designs/', desc: 'Official curriculum designs for all grades.', icon: '📜' },
  { title: 'Radio Lessons', url: 'https://kec.ac.ke/radio-lessons', desc: 'Audio-based lessons for various subjects.', icon: '📻' },
  { title: 'KICD YouTube Channel', url: 'https://www.youtube.com/user/KICDKenya', desc: 'Video lessons and curriculum orientations.', icon: '🎥' }
];

const CATEGORIES = [
  { id: 'all', label: 'All Files', icon: '📁' },
  { id: 'notes', label: 'Class Notes', icon: '📝' },
  { id: 'exams', label: 'Past Papers', icon: '📄' },
  { id: 'schemes', label: 'Schemes of Work', icon: '📅' }
];

export default function EducationHubPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [selGrade, setSelGrade] = useState('ALL');
  const [selCat, setSelCat] = useState('all');

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u) { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav7_learning_docs']);
    setDocs(db.paav7_learning_docs || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Education Hub…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🎓 Education Hub</h2>
          <p>Official KICD CBC resources and shared institutional learning materials</p>
        </div>
        <div className="page-hdr-acts">
           {user.role === 'admin' || user.role === 'teacher' ? (
              <button className="btn btn-primary btn-sm">+ Upload Material</button>
           ) : null}
        </div>
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
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy)' }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.grade} • {d.subject} • Shared by {d.author}</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 20 }}>📥</button>
                </div>
              ))}
              {docs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', background: '#F8FAFC', borderRadius: 15 }}>
                  <div style={{ fontSize: 48, marginBottom: 15 }}>📚</div>
                  <h3 style={{ margin: 0 }}>No materials found</h3>
                  <p style={{ fontSize: 12, maxWidth: 300, margin: '10px auto 0' }}>{user.role === 'parent' ? 'Teachers haven\'t shared any notes for this grade yet.' : 'Start by uploading class notes or past papers for your students.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="panel" style={{ width: 350 }}>
          <div className="panel-hdr" style={{ background: 'linear-gradient(135deg, #0369A1, #075985)', color: '#fff' }}>
            <h3 style={{ color: '#fff' }}>🇰🇪 KICD Cloud</h3>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {KICD_RESOURCES.map((r, i) => (
              <a 
                key={i} 
                href={r.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="kicd-link"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</span>
                  </div>
                  <span style={{ opacity: 0.5 }}>↗</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{r.desc}</div>
              </a>
            ))}
            <div style={{ marginTop: 10, padding: 15, background: '#F0F9FF', borderRadius: 10, border: '1px solid #BAE6FD' }}>
               <div style={{ fontSize: 12, fontWeight: 800, color: '#0369A1', marginBottom: 5 }}>Did you know?</div>
               <p style={{ fontSize: 11, margin: 0, color: '#0369A1', lineHeight: 1.5 }}>EduVantage is fully integrated with the Kenya Education Cloud to provide seamless access to CBC curriculum designs.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sg-responsive { display: flex; gap: 20px; }
        .cat-card { cursor: pointer; text-align: center; padding: 20px; transition: 0.2s; border: 1.5px solid #E2E8F0; }
        .cat-card:hover { transform: translateY(-3px); border-color: var(--primary); background: var(--primary-low); }
        .cat-card.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .cat-icon { fontSize: 24px; marginBottom: 8px; }
        .cat-label { fontWeight: 800; fontSize: 12px; }
        .doc-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border: 1.5px solid #F1F5F9; borderRadius: 12px; transition: 0.2s; }
        .doc-row:hover { border-color: var(--primary); transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .kicd-link { text-decoration: none; color: inherit; padding: 15px; border-radius: 12px; border: 1.5px solid #F1F5F9; transition: 0.2s; display: block; }
        .kicd-link:hover { background: #F0F9FF; border-color: #0369A1; transform: translateX(5px); }
        @media (max-width: 900px) {
          .sg-responsive { flex-direction: column; }
          .panel { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
