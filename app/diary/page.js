'use client';
export const runtime = 'edge';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

export default function StudentDiaryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState({});

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u) { router.push('/'); return; }
    setUser(u);

    const keys = [
      'paav6_learners', 
      'paav6_marks', 
      'paav6_att', 
      'paav6_paylog', 
      'paav_duties',
      'paav_msgs'
    ];
    const data = await getCachedDBMulti(keys);
    setDb(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const feed = useMemo(() => {
    if (!user || !db.paav6_learners) return [];

    // If parent, find their children
    const children = user.role === 'parent' 
      ? db.paav6_learners.filter(l => l.parentPhone === user.phone || l.adm === user.adm) 
      : db.paav6_learners;

    const events = [];

    children.forEach(l => {
      // 1. Attendance
      if (db.paav6_att) {
        Object.entries(db.paav6_att).forEach(([date, attMap]) => {
          if (attMap[l.adm]) {
            events.push({
              id: `att-${date}-${l.adm}`,
              date,
              student: l.name,
              type: 'attendance',
              icon: '📅',
              title: 'Attendance Marked',
              desc: `${l.name} was marked ${attMap[l.adm]} today.`,
              color: attMap[l.adm] === 'Present' ? '#059669' : '#DC2626'
            });
          }
        });
      }

      // 2. Payments
      if (db.paav6_paylog) {
        db.paav6_paylog.filter(p => p.adm === l.adm).forEach(p => {
          events.push({
            id: `pay-${p.id}`,
            date: p.date,
            student: l.name,
            type: 'payment',
            icon: '💰',
            title: 'Payment Received',
            desc: `Fee payment of KSH ${p.amount.toLocaleString()} recorded for ${l.name}.`,
            color: '#0369A1'
          });
        });
      }

      // 3. Duties
      if (db.paav_duties) {
        db.paav_duties.filter(d => d.assignedTo === l.name || d.assignedTo === l.adm).forEach(d => {
          events.push({
            id: `duty-${d.id}`,
            date: d.date,
            student: l.name,
            type: 'duty',
            icon: '📋',
            title: 'New Duty Assigned',
            desc: `${l.name} has been assigned to: ${d.title}.`,
            color: '#D97706'
          });
        });
      }

      // 4. Marks Release (Simplified: if marks exist for an assessment)
      if (db.paav6_marks) {
        // We look for assessment keys in marks
        Object.keys(db.paav6_marks).forEach(mKey => {
          if (db.paav6_marks[mKey][l.adm] !== undefined) {
            // Key format: "T1:GRADE 7|Integrated Science|mt1"
            const [tPart, sPart] = mKey.split(':');
            if (sPart) {
               const [gradeSub, assess] = sPart.split('|');
               const [grade, subject] = gradeSub.split('|');
               events.push({
                 id: `marks-${mKey}-${l.adm}`,
                 date: new Date().toLocaleDateString('en-KE'), // Approximate
                 student: l.name,
                 type: 'marks',
                 icon: '📈',
                 title: 'New Marks Released',
                 desc: `${l.name} scored in ${subject} (${assess}).`,
                 color: '#7C3AED'
               });
            }
          }
        });
      }
    });

    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [user, db]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Student Diary…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📓 Student Diary</h2>
          <p>Real-time updates on attendance, payments, and school activities</p>
        </div>
      </div>

      <div className="sg-responsive" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="panel">
          <div className="panel-hdr">
            <h3>🕒 Activity Feed</h3>
          </div>
          <div className="panel-body">
            {feed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>🏜️</div>
                <h3 style={{ margin: 0 }}>No recent activities</h3>
                <p style={{ fontSize: 12 }}>Check back later for updates on student progress.</p>
              </div>
            ) : (
              <div className="timeline">
                {feed.map((ev, i) => (
                  <div key={ev.id} className="timeline-item">
                    <div className="timeline-icon" style={{ background: ev.color + '15', color: ev.color }}>
                      {ev.icon}
                    </div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{ev.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ev.date}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{ev.desc}</p>
                      {user.role !== 'parent' && (
                        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                          Student: {ev.student}
                        </div>
                      )}
                    </div>
                    {i < feed.length - 1 && <div className="timeline-connector" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline { display: flex; flexDirection: column; gap: 25px; padding: 10px 0; }
        .timeline-item { display: flex; gap: 20px; position: relative; }
        .timeline-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; fontSize: 20px; flex-shrink: 0; z-index: 1; }
        .timeline-content { flex: 1; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1.5px solid #f1f5f9; transition: 0.2s; }
        .timeline-content:hover { border-color: var(--primary); transform: translateX(5px); }
        .timeline-connector { position: absolute; left: 20px; top: 40px; bottom: -25px; width: 2px; background: #e2e8f0; z-index: 0; }
      `}</style>
    </div>
  );
}
