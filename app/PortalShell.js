'use client';
/**
 * app/PortalShell.js — Client-side portal shell
 *
 * Handles:
 *   • Session fetch on mount (populates user context)
 *   • Navbar visibility (hidden on '/' login page and '/fees/pay' public pay page)
 *   • Inactivity auto-logout (8-minute warning → 1-minute countdown)
 *   • Announcement banner (from DB 'paav_announcement' key)
 *   • Bottom mobile nav
 */


import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* Pages that should NOT show the navbar */
const NO_NAV_PATHS = ['/', '/fees/pay'];

/* Inactivity config */
const IDLE_WARNING_MS  = 7 * 60 * 1000;   // warn after 7 min
const IDLE_LOGOUT_MS   = 8 * 60 * 1000;   // log out after 8 min
const IDLE_EVENTS      = ['mousemove','keydown','click','touchstart','scroll'];

export default function PortalShell({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,         setUser]         = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [showBanner,   setShowBanner]   = useState(false);   // inactivity warning
  const [countdown,    setCountdown]    = useState(60);
  const [editAnn,      setEditAnn]      = useState(false);
  const [annDraft,     setAnnDraft]     = useState('');
  const [heroUrl,      setHeroUrl]      = useState('');

  const idleTimer    = useRef(null);
  const warnTimer    = useRef(null);
  const countdownRef = useRef(null);
  const heroFileRef  = useRef(null);

  const showNav = !NO_NAV_PATHS.includes(pathname);

  /* ── Load session + announcement ── */
  const loadSession = useCallback(async () => {
    try {
      const [authRes, dbRes] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/db', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ requests: [
            { type: 'get', key: 'paav_announcement' },
            { type: 'get', key: 'paav6_msgs'        },
            { type: 'get', key: 'paav_hero_img'     },
          ]}),
        }),
      ]);

      const auth = await authRes.json();
      const db   = await dbRes.json();

      if (auth.ok && auth.user) {
        setUser(auth.user);
        // Persist last active path for session restore
        try { localStorage.setItem('paav_last_path', pathname); } catch {}
      }
      // Note: if auth fails, we do NOT redirect here — each page does its own check.
      // This prevents the shell from fighting with page-level guards.

      const ann = db.results[0]?.value;
      if (ann?.text && ann?.active) setAnnouncement(ann.text);

      // Load hero image
      const heroDb = db.results[2]?.value;
      if (heroDb) setHeroUrl(heroDb);

      const msgs = db.results[1]?.value || [];
      setUnreadCount(msgs.filter(m =>
        m.to === 'ALL' || m.to === 'ALL_STAFF'
      ).length);
    } catch (e) {
      console.error('[PortalShell] session load error:', e);
    }
  }, [pathname]);

  useEffect(() => {
    if (showNav) loadSession();
  }, [showNav, loadSession]);

  /* ── Inactivity logout ── */
  function resetIdleTimers() {
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countdownRef.current);
    setShowBanner(false);

    warnTimer.current = setTimeout(() => {
      setShowBanner(true);
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            doLogout();
          }
          return c - 1;
        });
      }, 1000);
    }, IDLE_WARNING_MS);

    idleTimer.current = setTimeout(doLogout, IDLE_LOGOUT_MS);
  }

  async function doLogout() {
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countdownRef.current);
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'logout' }),
    });
    router.push('/');
  }

  useEffect(() => {
    if (!showNav || !user) return;
    IDLE_EVENTS.forEach(ev => window.addEventListener(ev, resetIdleTimers));
    resetIdleTimers();
    return () => {
      IDLE_EVENTS.forEach(ev => window.removeEventListener(ev, resetIdleTimers));
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
      clearInterval(countdownRef.current);
    };
  }, [showNav, user]); // eslint-disable-line

  async function saveAnnouncement() {
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [
          { type: 'set', key: 'paav_announcement', value: { text: annDraft, active: !!annDraft, ts: Date.now() } }
        ]})
      });
      setAnnouncement(annDraft);
      setEditAnn(false);
    } catch(e) { alert('Failed to save announcement'); }
  }

  async function uploadHero(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = ev.target.result;
      setHeroUrl(b64);
      try {
        await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_hero_img', value: b64 }] })
        });
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      {/* ── Hero file input (hidden) ── */}
      <input ref={heroFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadHero} />

      {/* ── Topbar ── */}
      {showNav && user && (
        <Navbar user={user} unreadCount={unreadCount} />
      )}

      {/* ── Announcement banner ── */}
      {showNav && (announcement || user?.role === 'admin') && (
        <div className="announcement-bar-live">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 18 }}>📢</span>
            {editAnn ? (
              <input
                autoFocus
                value={annDraft}
                onChange={e => setAnnDraft(e.target.value)}
                placeholder="Type announcement…"
                style={{ flex: 1, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 8, color: '#fff', padding: '6px 12px', fontSize: 13, outline: 'none', minWidth: 200 }}
                onKeyDown={e => e.key === 'Enter' && saveAnnouncement()}
              />
            ) : (
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{announcement || (user?.role === 'admin' ? 'Click Edit to add an announcement…' : '')}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {user?.role === 'admin' && !editAnn && (
              <button onClick={() => { setAnnDraft(announcement); setEditAnn(true); }}
                style={{ background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 7, color: '#fff', padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                ✏️ Edit
              </button>
            )}
            {user?.role === 'admin' && editAnn && (
              <>
                <button onClick={saveAnnouncement}
                  style={{ background: '#D97706', border: 'none', borderRadius: 7, color: '#fff', padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  💾 Save
                </button>
                <button onClick={() => setEditAnn(false)}
                  style={{ background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 7, color: '#fff', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            )}
            {announcement && (
              <button onClick={() => { setAnnouncement(''); saveAnnouncement(); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div id="main" style={showNav ? {} : { padding: 0, maxWidth: 'none' }}>
        {/* Pass heroUrl + uploadTrigger as a data attribute on a context div */}
        {children}
      </div>

      {/* ── Inactivity warning banner ── */}
      <div className={`inactivity-banner${showBanner ? ' show' : ''}`}>
        <span>⏰ You will be logged out in {countdown}s due to inactivity</span>
        <button
          onClick={resetIdleTimers}
          style={{ padding: '6px 16px', background: 'rgba(255,255,255,.2)',
            border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 8,
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
          Stay Logged In
        </button>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      {showNav && user && (
        <div className="mobile-bottom-nav no-print">
          {[
            { path: '/dashboard',  icon: '📊', label: 'Home'    },
            { path: '/messages',   icon: '💬', label: 'Messages' },
            { path: '/grades',     icon: '📋', label: 'Grades',   roles: ['admin','teacher'] },
            { path: '/fees',       icon: '💰', label: 'Fees',     roles: ['admin','staff']   },
            { path: '/settings',   icon: '⚙️', label: 'Setup',    roles: ['admin'] },
          ]
            .filter(n => !n.roles || n.roles.includes(user.role))
            .map(n => (
              <Link
                key={n.path}
                href={n.path}
                className={pathname.startsWith(n.path) ? 'active' : ''}
              >
                <span className="icon">{n.icon}</span>
                <span className="label">{n.label}</span>
              </Link>
            ))}
        </div>
      )}
    </>
  );
}
