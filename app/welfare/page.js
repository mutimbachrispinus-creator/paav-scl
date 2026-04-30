'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

export default function WelfarePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [discipline, setDiscipline] = useState([]);
  const [health, setHealth] = useState([]);
  const [tab, setTab] = useState('discipline'); // discipline | health
  const [selAdm, setSelAdm] = useState('');

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || (u.role !== 'admin' && u.role !== 'teacher')) { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav6_learners', 'paav7_discipline', 'paav7_health']);
    setLearners(db.paav6_learners || []);
    setDiscipline(db.paav7_discipline || []);
    setHealth(db.paav7_health || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const learner = learners.find(l => l.adm === selAdm);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Welfare records…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🛡 Student Welfare & Discipline</h2>
          <p>Manage behavioral records and health clinic visits</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${tab === 'discipline' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('discipline')}>⚖ Discipline</button>
          <button className={`btn ${tab === 'health' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('health')}>🏥 Health</button>
        </div>
      </div>

      <div className="sg" style={{ gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>👤 Select Student</h3></div>
          <div className="panel-body">
            <input type="text" placeholder="Search..." className="field" style={{ marginBottom: 10 }} />
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {learners.map(l => (
                <div 
                  key={l.adm} 
                  className={`audit-row ${selAdm === l.adm ? 'active' : ''}`}
                  onClick={() => setSelAdm(l.adm)}
                  style={{ cursor: 'pointer', padding: '10px 15px', borderRadius: 8, background: selAdm === l.adm ? '#F1F5F9' : 'transparent' }}
                >
                  <div style={{ fontWeight: 700 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.adm} • {l.grade}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          {!learner ? (
            <div style={{ textAlign: 'center', padding: 100, color: 'var(--muted)' }}>Select a student to manage their welfare records</div>
          ) : (
            <>
              <div className="panel-hdr">
                <h3>{tab === 'discipline' ? '⚖ Behavioral Record' : '🏥 Health Record'} — {learner.name}</h3>
                <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}>+ New Entry</button>
              </div>
              <div className="panel-body">
                {tab === 'discipline' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {discipline.filter(d => d.adm === selAdm).map((d, i) => (
                      <div key={i} className="audit-row" style={{ borderLeft: `4px solid ${d.type === 'merit' ? '#16A34A' : '#DC2626'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700 }}>{d.incident}</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{d.action}</div>
                        <div style={{ fontSize: 10, color: 'var(--light)', marginTop: 4 }}>By: {d.recordedBy}</div>
                      </div>
                    ))}
                    {discipline.filter(d => d.adm === selAdm).length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No disciplinary incidents recorded.</div>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {health.filter(h => h.adm === selAdm).map((h, i) => (
                      <div key={i} className="audit-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700 }}>{h.complaint}</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Treatment: {h.treatment}</div>
                        <div style={{ fontSize: 10, color: 'var(--light)', marginTop: 4 }}>By: {h.recordedBy}</div>
                      </div>
                    ))}
                    {health.filter(h => h.adm === selAdm).length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No health clinic visits recorded.</div>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
