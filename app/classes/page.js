'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ALL_GRADES, gradeGroup } from '@/lib/cbe';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

export default function ClassesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti(['paav6_learners'])
      ]);
      if (!u) { router.push('/'); return; }
      setUser(u);
      setLearners(db.paav6_learners || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <div className="page on"><div className="skeleton" style={{ height: 200, borderRadius: 12 }} /></div>;

  const groups = [
    { title: 'Pre-School', grades: ['KINDERGARTEN', 'PP1', 'PP2'], color: '#0D9488' },
    { title: 'Lower Primary', grades: ['GRADE 1', 'GRADE 2', 'GRADE 3'], color: '#059669' },
    { title: 'Upper Primary', grades: ['GRADE 4', 'GRADE 5', 'GRADE 6'], color: '#2563EB' },
    { title: 'Junior Secondary', grades: ['GRADE 7', 'GRADE 8', 'GRADE 9'], color: '#7C3AED' },
  ];

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>School Classes</h2>
          <p>Select a grade to view learners and manage performance.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {groups.map(group => (
          <div key={group.title}>
            <h3 style={{ 
              fontSize: 14, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              color: group.color, 
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: group.color }} />
              {group.title}
            </h3>
            <div className="sg sg4">
              {group.grades.map(grade => {
                const count = learners.filter(l => l.grade === grade).length;
                return (
                  <Link 
                    key={grade} 
                    href={`/classes/${grade}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="panel stat-card" style={{ height: '100%', borderLeft: `4px solid ${group.color}` }}>
                      <div className="sc-inner">
                        <div className="sc-icon" style={{ background: `${group.color}15`, color: group.color }}>🏫</div>
                        <div>
                          <div className="sc-n" style={{ fontSize: 18 }}>{grade.replace('GRADE ', 'Gr ')}</div>
                          <div className="sc-l">{count} Learners</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
