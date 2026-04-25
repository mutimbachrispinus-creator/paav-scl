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

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

  const idleTimer    = useRef(null);
  const warnTimer    = useRef(null);
  const countdownRef = useRef(null);

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

  return (
    <>
      {/* ── Topbar ── */}
      {showNav && user && (
        <Navbar user={user} unreadCount={unreadCount} />
      )}

      {/* ── Announcement banner ── */}
      {showNav && announcement && (
        <div id="announcement-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📢</span>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{announcement}</span>
          </div>
          <button
            onClick={() => setAnnouncement('')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)',
              cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <div id="main" style={showNav ? {} : { padding: 0, maxWidth: 'none' }}>
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

      {/* ── Bottom mobile nav ── */}
      {showNav && user && (
        <nav id="bottom-nav" className="no-print">
          <div className="bnav-items">
            {[
              { path: '/dashboard',  icon: '📊', label: 'Home'    },
              { path: '/learners',   icon: '🎓', label: 'Learners', roles: ['admin','teacher'] },
              { path: '/grades',     icon: '📋', label: 'Grades',   roles: ['admin','teacher'] },
              { path: '/fees',       icon: '💰', label: 'Fees',     roles: ['admin','staff']   },
              { path: '/merit-list', icon: '🏆', label: 'Merit',    roles: ['admin','teacher'] },
            ]
              .filter(n => !n.roles || n.roles.includes(user.role))
              .map(n => (
                <button
                  key={n.path}
                  className={`bnav-btn${pathname.startsWith(n.path) ? ' on' : ''}`}
                  onClick={() => router.push(n.path)}>
                  <span className="bnav-icon">{n.icon}</span>
                  {n.label}
                </button>
              ))}
          </div>
        </nav>
      )}
    </>
  );
}
