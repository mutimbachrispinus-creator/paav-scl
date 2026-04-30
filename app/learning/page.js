'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { ALL_GRADES } from '@/lib/cbe';

const KICD_RESOURCES = [
  { title: 'Kenya Education Cloud', url: 'https://kec.ac.ke/', desc: 'KICD-curated digital lessons and e-books.' },
  { title: 'CBC Curriculum Designs', url: 'https://kicd.ac.ke/cbc-curriculum-designs/', desc: 'Official curriculum designs for all grades.' },
  { title: 'Radio Lessons', url: 'https://kec.ac.ke/radio-lessons', desc: 'Audio-based lessons for various subjects.' },
  { title: 'KICD YouTube Channel', url: 'https://www.youtube.com/user/KICDKenya', desc: 'Video lessons and curriculum orientations.' }
];

export default function LearningHubPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [selGrade, setSelGrade] = useState('ALL');

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u) { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav7_learning_docs']);
    setDocs(db.paav7_learning_docs || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Learning Hub…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📚 Learning Hub & KICD Integration</h2>
          <p>Access official CBC resources and shared classroom materials</p>
        </div>
      </div>

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr" style={{ background: 'linear-gradient(135deg, #0369A1, #075985)' }}>
            <h3 style={{ color: '#fff' }}>🇰🇪 Official KICD Resources</h3>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {KICD_RESOURCES.map((r, i) => (
                <a 
                  key={i} 
                  href={r.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="quick-access-btn"
                  style={{ textAlign: 'left', alignItems: 'flex-start', padding: 15, width: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, color: '#0369A1' }}>{r.title}</span>
                    <span>↗</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginTop: 4 }}>{r.desc}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr">
            <h3>📂 School Document Center</h3>
            {user.role === 'admin' || user.role === 'teacher' ? (
              <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}>+ Upload</button>
            ) : null}
          </div>
          <div className="panel-body">
            <div className="field">
              <label>Filter by Grade</label>
              <select value={selGrade} onChange={e => setSelGrade(e.target.value)}>
                <option value="ALL">All Materials</option>
                {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
              {docs.filter(d => selGrade === 'ALL' || d.grade === selGrade).map((d, i) => (
                <div key={i} className="audit-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.grade} • {d.subject} • by {d.author}</div>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 18 }}>📥</button>
                </div>
              ))}
              {docs.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', background: '#F8FAFC', borderRadius: 12 }}>
                  <div style={{ fontSize: 32 }}>📖</div>
                  No documents shared for this grade yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .quick-access-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          transition: all 0.2s;
          text-decoration: none;
        }
        .quick-access-btn:hover {
          border-color: #0369A1;
          background: #F0F9FF;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(3,105,161,0.1);
        }
      `}</style>
    </div>
  );
}
