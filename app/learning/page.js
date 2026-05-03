'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { useProfile } from '@/app/PortalShell';

export default function LiveClassPage() {
  const router = useRouter();
  const { profile: school } = useProfile() || {};
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', grade: 'All', subject: '', desc: '' });
  const [saving, setSaving] = useState(false);
  const jitsiRef = useRef(null);
  const apiRef = useRef(null);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u) { router.push('/'); return; }
    setUser(u);
    const db = await getCachedDBMulti(['paav_live_sessions']);
    setSessions((db.paav_live_sessions || []).filter(s => {
      // Only show sessions from the last 24h or upcoming
      return Date.now() - s.createdAt < 24 * 60 * 60 * 1000;
    }));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Mount Jitsi when activeSession changes
  useEffect(() => {
    if (!activeSession || !jitsiRef.current) return;

    // Clean up previous instance
    if (apiRef.current) {
      try { apiRef.current.dispose(); } catch {}
      apiRef.current = null;
    }

    // Jitsi requires window context
    const loadJitsi = () => {
      if (!window.JitsiMeetExternalAPI) return;
      const roomName = `eduvantage-${activeSession.id}`;
      const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: jitsiRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          toolbarButtons: [
            'camera', 'microphone', 'hangup', 'chat',
            'raisehand', 'tileview', 'fullscreen', 'settings'
          ],
          subject: `${school?.name || 'EduVantage'} — ${activeSession.title}`,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          MOBILE_APP_PROMO: false,
          DISPLAY_WELCOME_FOOTER: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          filmStripOnly: false,
        },
        userInfo: {
          displayName: user?.name || user?.username || 'Student',
          email: user?.email || '',
        },
      });
      apiRef.current = api;
    };

    if (window.JitsiMeetExternalAPI) {
      loadJitsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = loadJitsi;
      document.head.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
    };
  }, [activeSession, user, school]);

  async function createSession() {
    if (!newSession.title.trim()) return;
    setSaving(true);
    const session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newSession.title,
      grade: newSession.grade,
      subject: newSession.subject,
      desc: newSession.desc,
      host: user.name || user.username,
      hostRole: user.role,
      createdAt: Date.now(),
      status: 'live',
    };
    const updated = [session, ...sessions];
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_live_sessions', value: updated }] })
    });
    setSessions(updated);
    setShowCreate(false);
    setNewSession({ title: '', grade: 'All', subject: '', desc: '' });
    setSaving(false);
    setActiveSession(session);
  }

  async function endSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_live_sessions', value: updated }] })
    });
    setSessions(updated);
    if (activeSession?.id === id) setActiveSession(null);
  }

  if (!user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Live Classes…</div>;

  const canHost = ['admin', 'teacher'].includes(user.role);

  return (
    <div className="page on">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <h2>📹 Live Classes</h2>
          <p>In-app video lessons — join or host a live class session</p>
        </div>
        <div className="page-hdr-acts">
          {canHost && !activeSession && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              ＋ Start Live Class
            </button>
          )}
          {activeSession && (
            <button className="btn btn-danger btn-sm" onClick={() => {
              if (apiRef.current) { try { apiRef.current.dispose(); } catch {} apiRef.current = null; }
              setActiveSession(null);
            }}>
              📵 Leave Class
            </button>
          )}
        </div>
      </div>

      {/* Active Class — full embedded room */}
      {activeSession && (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid #8B1A1A', marginBottom: 20, boxShadow: '0 8px 32px rgba(139,26,26,0.15)' }}>
          {/* Class Header */}
          <div style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>📹 {activeSession.title}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{activeSession.grade} • {activeSession.subject} • Hosted by {activeSession.host}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ background: '#D4AF37', color: '#000', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800, animation: 'pulse 2s infinite' }}>🔴 LIVE</span>
              {(canHost && activeSession.host === (user.name || user.username)) && (
                <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => endSession(activeSession.id)}>
                  ⏹ End Session
                </button>
              )}
            </div>
          </div>
          {/* Jitsi iframe container */}
          <div ref={jitsiRef} style={{ width: '100%', height: 500, background: '#0F172A' }} />
        </div>
      )}

      {/* Available sessions list */}
      <div className="sg sg2" style={{ gap: 16 }}>
        {/* Live Sessions */}
        <div className="panel">
          <div className="panel-hdr">
            <h3>🔴 Active Sessions</h3>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sessions.length} live</span>
          </div>
          <div className="panel-body">
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎥</div>
                <p style={{ fontWeight: 700, margin: 0 }}>No live classes right now</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>{canHost ? 'Start a session to begin teaching.' : 'Your teacher will start a session soon.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map(s => (
                  <div key={s.id} onClick={() => setActiveSession(s)}
                    style={{ cursor: 'pointer', padding: '14px 16px', borderRadius: 12, border: `2px solid ${activeSession?.id === s.id ? '#8B1A1A' : '#E2E8F0'}`, background: activeSession?.id === s.id ? '#FDF2F2' : '#FAFBFF', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--navy)' }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {s.grade} • {s.subject} • {s.host}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ background: '#FEF2F2', color: '#8B1A1A', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 800 }}>🔴 LIVE</span>
                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }}
                        onClick={e => { e.stopPropagation(); setActiveSession(s); }}>
                        Join →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How to use */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="panel-hdr" style={{ background: 'linear-gradient(135deg,#1E40AF,#1E3A8A)' }}>
              <h3 style={{ color: '#fff' }}>📖 How It Works</h3>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '🎓', title: 'Teachers & Admins', desc: 'Click "Start Live Class", fill in the details, and your students will instantly see your session appear in the list.' },
                { icon: '👨‍👩‍👧', role: 'Parents & Students', desc: 'When a live class appears, click "Join" to enter the video room instantly — no apps or accounts needed.' },
                { icon: '🎤', title: 'In-Room Controls', desc: 'Use the toolbar to toggle your camera/mic, raise your hand, chat, or go fullscreen.' },
                { icon: '⏹', title: 'Ending a Session', desc: 'Teachers can click "End Session" to remove the class from the live list for everyone.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{item.title || item.role}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '1.5px solid #A7F3D0' }}>
            <div className="panel-body" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#065F46' }}>Private & Secure</div>
              <div style={{ fontSize: 11, color: '#047857', marginTop: 4 }}>Each session has a unique room ID. Only portal users can see and join active sessions.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreate && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-hdr">
              <h3>📹 Start a Live Class</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Session Title *</label>
                <input value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} placeholder="e.g. Mathematics — Fractions Lesson" autoFocus />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Grade / Level</label>
                  <select value={newSession.grade} onChange={e => setNewSession({ ...newSession, grade: e.target.value })}>
                    <option value="All">All Grades</option>
                    {['PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Subject</label>
                  <input value={newSession.subject} onChange={e => setNewSession({ ...newSession, subject: e.target.value })} placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div className="field">
                <label>Description (optional)</label>
                <input value={newSession.desc} onChange={e => setNewSession({ ...newSession, desc: e.target.value })} placeholder="What will you cover today?" />
              </div>
              <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, fontSize: 11, color: '#047857', fontWeight: 600, marginTop: 4 }}>
                ✅ A private video room will open instantly inside the portal. No downloads or accounts needed for students.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSession} disabled={saving || !newSession.title.trim()}>
                {saving ? '⏳ Creating…' : '📹 Start Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
