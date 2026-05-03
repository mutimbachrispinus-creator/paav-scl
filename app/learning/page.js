'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { getCurriculum } from '@/lib/curriculum';
import { useProfile } from '@/app/PortalShell';

/* ── Tool palette for whiteboard ── */
const TOOLS = [
  { id: 'pen',    icon: '✏️', label: 'Pen' },
  { id: 'eraser', icon: '🧹', label: 'Eraser' },
  { id: 'text',   icon: '🔤', label: 'Text' },
];
const COLORS = ['#1e293b','#DC2626','#2563EB','#16A34A','#D97706','#7C3AED','#EC4899','#fff'];
const SIZES  = [2, 4, 8, 14];

export default function LiveClassPage() {
  const router = useRouter();
  const { profile: school } = useProfile() || {};
  const curr = getCurriculum(school?.curriculum || 'CBC');
  const ALL_GRADES = curr?.ALL_GRADES || [];

  const [user,          setUser]          = useState(null);
  const [sessions,      setSessions]      = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState('video'); // 'video' | 'board' | 'slides'
  const [newSession,    setNewSession]    = useState({ title: '', grade: '', subject: '', desc: '' });

  /* Whiteboard state */
  const canvasRef   = useRef(null);
  const drawing     = useRef(false);
  const lastPt      = useRef(null);
  const [tool,   setTool]   = useState('pen');
  const [color,  setColor]  = useState('#1e293b');
  const [size,   setSize]   = useState(4);

  /* Slides state */
  const [slides,      setSlides]      = useState([]); // [{ id, url, title }]
  const [activeSlide, setActiveSlide] = useState(0);
  const [uploadingSlide, setUploadingSlide] = useState(false);

  /* Jitsi */
  const jitsiRef = useRef(null);
  const apiRef   = useRef(null);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u) { router.push('/'); return; }
    setUser(u);
    const db = await getCachedDBMulti(['paav_live_sessions', 'paav_live_slides']);
    setSessions((db.paav_live_sessions || []).filter(s => Date.now() - s.createdAt < 24 * 60 * 60 * 1000));
    setSlides(db.paav_live_slides || []);
    // Set default grade
    if (ALL_GRADES.length > 0) setNewSession(n => ({ ...n, grade: n.grade || ALL_GRADES[0] }));
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (ALL_GRADES.length > 0 && !newSession.grade) {
      setNewSession(n => ({ ...n, grade: ALL_GRADES[0] }));
    }
  }, [ALL_GRADES]);

  /* Mount Jitsi when entering video tab */
  useEffect(() => {
    if (!activeSession || activeTab !== 'video' || !jitsiRef.current) return;

    if (apiRef.current) { try { apiRef.current.dispose(); } catch {} apiRef.current = null; }

    const init = () => {
      if (!window.JitsiMeetExternalAPI || !jitsiRef.current) return;
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: `eduvantage-${activeSession.id}`,
        parentNode: jitsiRef.current,
        width: '100%', height: '100%',
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          disableThirdPartyRequests: true,
          subject: `${school?.name || 'EduVantage'} — ${activeSession.title}`,
          toolbarButtons: ['camera','microphone','hangup','chat','raisehand','tileview','fullscreen'],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          MOBILE_APP_PROMO: false,
          DISPLAY_WELCOME_FOOTER: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          DEFAULT_LOGO_URL: '',
          JITSI_WATERMARK_LINK: '',
        },
        userInfo: { displayName: user?.name || user?.username || 'Student' },
      });
    };

    if (window.JitsiMeetExternalAPI) { init(); }
    else {
      const s = document.createElement('script');
      s.src = 'https://meet.jit.si/external_api.js';
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    }
    return () => { if (apiRef.current) { try { apiRef.current.dispose(); } catch {} apiRef.current = null; } };
  }, [activeSession, activeTab, user, school]);

  /* ── Whiteboard drawing ── */
  function startDraw(e) {
    drawing.current = true;
    const pt = getPoint(e);
    lastPt.current = pt;
    if (tool === 'text') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (tool === 'eraser' ? size * 3 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#fff' : color;
    ctx.fill();
  }

  function draw(e) {
    if (!drawing.current || tool === 'text') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastPt.current) return;
    const pt = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = tool === 'eraser' ? '#fff' : color;
    ctx.lineWidth   = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPt.current = pt;
  }

  function stopDraw() { drawing.current = false; lastPt.current = null; }

  function getPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function clearBoard() {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  /* ── Slides ── */
  async function uploadSlide(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlide(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.ok) {
        const updated = [...slides, { id: Date.now(), url: data.url, title: file.name.replace(/\.[^/.]+$/, '') }];
        setSlides(updated);
        setActiveSlide(updated.length - 1);
        await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_live_slides', value: updated }] }) });
      }
    } catch {}
    setUploadingSlide(false);
  }

  /* ── Session management ── */
  async function createSession() {
    if (!newSession.title.trim()) return;
    setSaving(true);
    const session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newSession.title,
      grade: newSession.grade || 'All',
      subject: newSession.subject,
      desc: newSession.desc,
      host: user.name || user.username,
      hostRole: user.role,
      createdAt: Date.now(),
    };
    const updated = [session, ...sessions];
    await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_live_sessions', value: updated }] }) });
    setSessions(updated);
    setShowCreate(false);
    setNewSession({ title: '', grade: ALL_GRADES[0] || '', subject: '', desc: '' });
    setSaving(false);
    setActiveSession(session);
    setActiveTab('video');
  }

  async function endSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_live_sessions', value: updated }] }) });
    setSessions(updated);
    if (activeSession?.id === id) {
      if (apiRef.current) { try { apiRef.current.dispose(); } catch {} apiRef.current = null; }
      setActiveSession(null);
    }
  }

  if (!user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Live Classes…</div>;

  const canHost = ['admin', 'teacher'].includes(user.role);
  const isHost  = activeSession && (activeSession.host === (user.name || user.username) || user.role === 'admin');

  return (
    <div className="page on">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <h2>📹 Live Classes</h2>
          <p>In-app video lessons — video, whiteboard &amp; slides, all in one</p>
        </div>
        <div className="page-hdr-acts">
          {canHost && !activeSession && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>＋ Start Live Class</button>
          )}
          {activeSession && (
            <button className="btn btn-danger btn-sm" onClick={() => {
              if (apiRef.current) { try { apiRef.current.dispose(); } catch {} apiRef.current = null; }
              setActiveSession(null);
            }}>📵 Leave Class</button>
          )}
        </div>
      </div>

      {/* Active session */}
      {activeSession ? (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid #8B1A1A', marginBottom: 20, boxShadow: '0 8px 32px rgba(139,26,26,0.15)' }}>
          {/* Session header */}
          <div style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>📹 {activeSession.title}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{activeSession.grade} • {activeSession.subject} • {activeSession.host}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#D4AF37', color: '#000', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800 }}>🔴 LIVE</span>
              {isHost && <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => endSession(activeSession.id)}>⏹ End Session</button>}
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: '#0F172A', gap: 2, padding: '6px 12px' }}>
            {[
              { id: 'video',  icon: '🎥', label: 'Video' },
              { id: 'board',  icon: '🖊️', label: 'Whiteboard' },
              { id: 'slides', icon: '🖼️', label: 'Slides' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ background: activeTab === t.id ? '#8B1A1A' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Video Tab ── */}
          {activeTab === 'video' && (
            <div ref={jitsiRef} style={{ width: '100%', height: 520, background: '#0F172A' }} />
          )}

          {/* ── Whiteboard Tab ── */}
          {activeTab === 'board' && (
            <div style={{ background: '#1e293b', padding: 0 }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#0F172A', flexWrap: 'wrap' }}>
                {/* Tools */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {TOOLS.map(t => (
                    <button key={t.id} title={t.label} onClick={() => setTool(t.id)}
                      style={{ background: tool === t.id ? '#8B1A1A' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 7, color: '#fff', padding: '6px 10px', fontSize: 15, cursor: 'pointer' }}>
                      {t.icon}
                    </button>
                  ))}
                </div>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
                {/* Colors */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
                  ))}
                </div>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
                {/* Sizes */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {SIZES.map(s => (
                    <button key={s} onClick={() => setSize(s)}
                      style={{ background: size === s ? '#8B1A1A' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#fff', padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                      {s}px
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={clearBoard} style={{ background: '#DC2626', border: 'none', borderRadius: 7, color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑️ Clear</button>
                </div>
              </div>
              {/* Canvas */}
              <canvas ref={canvasRef} width={900} height={480}
                style={{ display: 'block', width: '100%', height: 480, background: '#fff', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={e => { e.preventDefault(); startDraw(e); }}
                onTouchMove={e => { e.preventDefault(); draw(e); }}
                onTouchEnd={stopDraw}
              />
            </div>
          )}

          {/* ── Slides Tab ── */}
          {activeTab === 'slides' && (
            <div style={{ background: '#0F172A', minHeight: 520, display: 'flex' }}>
              {/* Slide panel (left) */}
              <div style={{ width: 160, background: '#1E293B', display: 'flex', flexDirection: 'column', gap: 6, padding: 10, overflowY: 'auto' }}>
                {slides.map((sl, i) => (
                  <div key={sl.id} onClick={() => setActiveSlide(i)}
                    style={{ cursor: 'pointer', borderRadius: 8, border: `2px solid ${activeSlide === i ? '#8B1A1A' : 'rgba(255,255,255,0.1)'}`, overflow: 'hidden', background: '#0F172A' }}>
                    <img src={sl.url} alt={sl.title} style={{ width: '100%', height: 80, objectFit: 'contain', background: '#fff' }} />
                    <div style={{ fontSize: 9, color: '#94A3B8', padding: '3px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sl.title}</div>
                  </div>
                ))}
                {canHost && (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 6px', cursor: 'pointer', color: '#94A3B8', fontSize: 11 }}>
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={uploadSlide} />
                    {uploadingSlide ? '⏳' : '➕'} {uploadingSlide ? 'Uploading…' : 'Add Slide'}
                  </label>
                )}
              </div>
              {/* Main slide view */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                {slides.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ fontSize: 52 }}>🖼️</div>
                    <div style={{ fontWeight: 700, marginTop: 12, color: '#94A3B8' }}>No slides yet</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      {canHost ? 'Click "+ Add Slide" to upload images' : 'Waiting for teacher to share slides'}
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', maxWidth: 800 }}>
                    <img src={slides[activeSlide]?.url} alt={slides[activeSlide]?.title}
                      style={{ width: '100%', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', background: '#fff', objectFit: 'contain', maxHeight: 420 }} />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
                      <button onClick={() => setActiveSlide(p => Math.max(0, p - 1))} disabled={activeSlide === 0}
                        style={{ background: '#8B1A1A', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: activeSlide === 0 ? 0.4 : 1 }}>‹ Prev</button>
                      <span style={{ color: '#94A3B8', fontSize: 13, lineHeight: '36px' }}>{activeSlide + 1} / {slides.length}</span>
                      <button onClick={() => setActiveSlide(p => Math.min(slides.length - 1, p + 1))} disabled={activeSlide === slides.length - 1}
                        style={{ background: '#8B1A1A', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: activeSlide === slides.length - 1 ? 0.4 : 1 }}>Next ›</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Session list */
        <div className="sg sg2" style={{ gap: 16 }}>
          <div className="panel">
            <div className="panel-hdr">
              <h3>🔴 Active Sessions</h3>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sessions.length} live now</span>
            </div>
            <div className="panel-body">
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🎥</div>
                  <p style={{ fontWeight: 700, margin: 0 }}>No live classes right now</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>{canHost ? 'Click "Start Live Class" to begin.' : 'Your teacher will start a session soon.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--navy)' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.grade} • {s.subject} • {s.host}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ background: '#FEF2F2', color: '#8B1A1A', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 800 }}>🔴 LIVE</span>
                        <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} onClick={() => { setActiveSession(s); setActiveTab('video'); }}>Join →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel">
              <div className="panel-hdr" style={{ background: 'linear-gradient(135deg,#1E40AF,#1E3A8A)' }}>
                <h3 style={{ color: '#fff' }}>✨ What's Inside</h3>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '🎥', t: 'Live Video', d: 'Real-time video and audio with all participants in the class.' },
                  { icon: '🖊️', t: 'Whiteboard', d: 'Draw, annotate, and explain concepts with pen, eraser and color tools.' },
                  { icon: '🖼️', t: 'Slides',     d: 'Upload images or diagrams and present them to students in real-time.' },
                  { icon: '💬', t: 'Chat',        d: 'In-session text chat so students can ask questions without interrupting.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{item.t}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-hdr">
              <h3>📹 Start a Live Class</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Session Title *</label>
                <input value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} placeholder="e.g. Mathematics — Fractions" autoFocus />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Grade / Level</label>
                  <select value={newSession.grade} onChange={e => setNewSession({ ...newSession, grade: e.target.value })}>
                    <option value="All">All Grades</option>
                    {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Subject</label>
                  <input value={newSession.subject} onChange={e => setNewSession({ ...newSession, subject: e.target.value })} placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div className="field">
                <label>Topic / Description</label>
                <input value={newSession.desc} onChange={e => setNewSession({ ...newSession, desc: e.target.value })} placeholder="What will you cover today?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSession} disabled={saving || !newSession.title.trim()}>
                {saving ? '⏳ Starting…' : '📹 Start Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
