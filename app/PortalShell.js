'use client';
import { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProfilePanel from '@/components/ProfilePanel';
import { ALL_NAV } from '@/lib/navigation';
import { getCachedUser, getCachedDBMulti, prefetchKeys, clearAllCache, fetchWithRetry, hydrateCache } from '@/lib/client-cache';
import { initSyncEngine, stopSyncEngine } from '@/lib/sync-engine';
import { readSchoolProfile } from '@/lib/school-profile';

/**
 * app/PortalShell.js — Client-side portal shell
 */

const ProfileContext = createContext();
export const useProfile = () => useContext(ProfileContext);

/**
 * Basic Error Boundary to prevent the entire portal from crashing
 */
import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FDF2F2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ color: '#8B1A1A', marginBottom: 10 }}>Something went wrong</h2>
          <p style={{ color: '#64748B', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
            An unexpected error occurred in this part of the portal. Our technical team has been notified.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', background: '#8B1A1A', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            🔄 Reload Portal
          </button>
          <div style={{ marginTop: 40, fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
            {this.state.error?.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Pages that should NOT show the navbar */
const NO_NAV_PATHS = ['/', '/login', '/fees/pay', '/saas/signup', '/api'];

/* Inactivity config */
const IDLE_WARNING_MS  = 7 * 60 * 1000;   // warn after 7 min
const IDLE_LOGOUT_MS   = 8 * 60 * 1000;   // log out after 8 min
const IDLE_EVENTS      = ['mousemove','keydown','click','touchstart','scroll'];

export default function PortalShell({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('paav_cache_user');
        if (raw) {
          const { v } = JSON.parse(raw);
          return v;
        }
      } catch {}
    }
    return null;
  });


  const [announcement, setAnnouncement] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('paav_cache_db_paav_announcement');
      if (raw) {
        const { v } = JSON.parse(raw);
        if (v?.text && v?.active) return v.text;
      }
    } catch {}
    return '';
  });

  const [unreadCount, setUnreadCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const rawUser = localStorage.getItem('paav_cache_user');
      const rawMsgs = localStorage.getItem('paav_cache_db_paav6_msgs');
      if (rawUser && rawMsgs) {
        const { v: u } = JSON.parse(rawUser);
        const { v: msgs } = JSON.parse(rawMsgs);
        if (u && Array.isArray(msgs)) {
          return msgs.filter(m => 
            !m.read?.includes(u.username) && (
              m.to === 'ALL' || 
              m.to === u.username || 
              (m.to === 'ALL_STAFF' && ['admin','teacher','staff'].includes(u.role)) ||
              (m.to === 'ALL_PARENTS' && u.role === 'parent')
            )
          ).length;
        }
      }
    } catch {}
    return 0;
  });

  const [pendingDuties, setPendingDuties] = useState(0);
  const [pendingReqs,   setPendingReqs]   = useState(0);
  const [showBanner,   setShowBanner]   = useState(false);
  const [countdown,    setCountdown]    = useState(60);
  const [editAnn,      setEditAnn]      = useState(false);
  const [annDraft,     setAnnDraft]     = useState('');
  const [heroUrl,      setHeroUrl]      = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('paav_cache_db_paav_hero_img');
      if (raw) {
        const { v } = JSON.parse(raw);
        return v || '';
      }
    } catch {}
    return '';
  });
  const [showProfile,  setShowProfile]  = useState(false);
  const [theme,        setTheme]        = useState(() => {
    if (typeof window === 'undefined') return { primary: '#8B1A1A', secondary: '#D4AF37', accent: '#1E293B' };
    try {
      const raw = localStorage.getItem('paav_cache_db_paav_theme');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v) return parsed.v;
      }
    } catch {}
    return { primary: '#1E293B', secondary: '#D4AF37', accent: '#334155' };
  });
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return { name: 'SCHOOL PORTAL', motto: 'Quality Education for All', logo: '/ev-brand-v3.png' };
    const cached = readSchoolProfile();
    return cached || { name: 'SCHOOL PORTAL', motto: 'Quality Education for All', logo: '/ev-brand-v3.png' };
  });

  const idleTimer    = useRef(null);
  const warnTimer    = useRef(null);
  const countdownRef = useRef(null);
  const heroFileRef  = useRef(null);

  const [impersonateId, setImpersonateId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('paav_impersonate_id');
  });

  // Sync document title with active branding to prevent stale metadata
  useEffect(() => {
    const siteName = 'EduVantage School Management System';
    const publicPaths = ['/', '/login', '/saas/signup'];
    
    if (publicPaths.includes(pathname)) {
      document.title = siteName;
      return;
    }

    document.title = profile.name ? `${profile.name} — ${siteName}` : siteName;
  }, [profile, pathname]);

  // Apply theme to document
  useEffect(() => {
    let activeTheme = theme;
    const isSuper = user?.tenantId === 'platform-master';
    
    if (isSuper && !impersonateId) {
      activeTheme = { primary: '#4F46E5', secondary: '#10B981', accent: '#0F172A' };
    }
    
    if (activeTheme) {
      document.documentElement.style.setProperty('--primary', activeTheme.primary);
      document.documentElement.style.setProperty('--secondary', activeTheme.secondary);
      document.documentElement.style.setProperty('--accent', activeTheme.accent);
      // Generate some derivatives
      document.documentElement.style.setProperty('--primary-low', activeTheme.primary + '22');
      document.documentElement.style.setProperty('--primary-mid', activeTheme.primary + '66');
    }
  }, [theme, user, impersonateId]);

  const showNav = !NO_NAV_PATHS.includes(pathname) && !pathname.startsWith('/api');

  const loadSession = useCallback(async () => {
    try {
      const [u, db] = await Promise.all([
        getCachedUser(),
        getCachedDBMulti([
          'paav_announcement',
          'paav6_msgs',
          'paav_hero_img',
          'paav7_duties',
          'paav_staff_reqs',
          'paav_theme'
        ])
      ]);
        
      // If we have a nav shell but no user, and we're not already on the login page
      if (!u && showNav) {
        console.warn('[PortalShell] No session found, redirecting...');
        window.location.href = '/';
        return;
      }

      if (u) {
        setUser(u);
        const activeTenant = impersonateId || u.tenantId;

        // Fetch profile and theme for the active tenant with cache-busting
        const configRes = await fetch(`/api/saas/config?tenant=${activeTenant}&_t=${Date.now()}`);
        const config = await configRes.json();
        
        if (config.profile) {
          setProfile(config.profile);
          const stamp = Date.now();
          localStorage.setItem('paav_cache_db_paav_school_profile', JSON.stringify({ v: config.profile, t: stamp, s: stamp }));
          window.dispatchEvent(new CustomEvent('paav:sync', { detail: { changed: ['paav_school_profile'] } }));
        }
        if (config.theme) {
          setTheme(config.theme);
          const stamp = Date.now();
          localStorage.setItem('paav_cache_db_paav_theme', JSON.stringify({ v: config.theme, t: stamp, s: stamp }));
          window.dispatchEvent(new CustomEvent('paav:sync', { detail: { changed: ['paav_theme'] } }));
        }

        const ann = db?.paav_announcement;
        if (ann?.text && ann?.active) setAnnouncement(ann.text);
        if (db?.paav_hero_img) setHeroUrl(db.paav_hero_img);

        const msgs = db?.paav6_msgs || [];
        const unr  = msgs.filter(m => 
          !m.read?.includes(u.username) && (
            m.to === 'ALL' || 
            m.to === u.username || 
            (m.to === 'ALL_STAFF' && ['admin','teacher','staff'].includes(u.role)) ||
            (m.to === 'ALL_PARENTS' && u.role === 'parent')
          )
        ).length;
        setUnreadCount(unr);

        const duties = db?.paav7_duties || [];
        setPendingDuties(duties.filter(d => d.staffId === u.id && d.status === 'pending').length);

        if (u.role === 'admin') {
          const reqs = db?.paav_staff_reqs || [];
          setPendingReqs(reqs.filter(r => r.status === 'pending').length);
        }
        
        prefetchKeys([
          'paav6_learners', 'paav6_staff', 'paav6_marks',
          'paav6_feecfg',  'paav_calendar_events', 'paav_presence',
          'paav6_dept_reports'
        ]);
      }
    } catch (e) {
      console.error('[PortalShell] session load error:', e);
    }
  }, []);

  useEffect(() => {
    if (showNav) {
      loadSession();
      initSyncEngine();
    }
    return () => stopSyncEngine();
  }, [showNav, loadSession]);

  useEffect(() => {
    const handler = (e) => {
      const changed = e.detail?.changed || [];
      
      // Update local state immediately if cache changed
      if (changed.includes('paav_school_profile')) {
        const fresh = readSchoolProfile();
        if (fresh) setProfile(fresh);
      }
      if (changed.includes('paav_theme')) {
        try {
          const raw = localStorage.getItem('paav_cache_db_paav_theme');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.v) setTheme(parsed.v);
          }
        } catch {}
      }

      // Refresh other shell state if relevant keys changed
      const networkKeys = ['paav_announcement','paav6_msgs','paav_hero_img','paav7_duties','paav_staff_reqs'];
      if (changed.some(k => networkKeys.includes(k))) {
        loadSession();
      }
    };
    window.addEventListener('paav:sync', handler);
    return () => window.removeEventListener('paav:sync', handler);
  }, [loadSession]);

  useEffect(() => {
    if (pathname && !NO_NAV_PATHS.includes(pathname)) {
      try { localStorage.setItem('paav_last_path', pathname); } catch {}
    }
  }, [pathname]);

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
    await fetchWithRetry('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'logout' }),
      timeout: 5000
    }).catch(() => {}); // Logout failure shouldn't block UI redirection
    clearAllCache();
    window.location.href = '/';
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
  }, [showNav, user]);

  /* PWA Update Detection — avoid stale UI */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('A new version of the portal is available. Update now?')) {
                window.location.reload();
              }
            }
          });
        });
      });
    }
  }, []);


  async function uploadHero(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = ev.target.result;
      setHeroUrl(b64);
      try {
        await fetchWithRetry('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_hero_img', value: b64 }] }),
          timeout: 15000
        });
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  async function saveAnnouncement() {
    try {
      await fetchWithRetry('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [
          { type: 'set', key: 'paav_announcement', value: { text: annDraft, active: !!annDraft, ts: Date.now() } }
        ]}),
        timeout: 8000
      });
      setAnnouncement(annDraft);
      setEditAnn(false);
    } catch(e) { alert('Failed to save announcement'); }
  }

  function playSuccessSound() {
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-37a.mp3');
    audio.play().catch(() => {});
  }

  async function saveAnnouncement() {
    setEditAnn(false);
    const ann = { text: annDraft, active: !!annDraft };
    setAnnouncement(annDraft);
    const response = await fetchWithRetry('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_announcement', value: ann }] }),
      timeout: 8000
    });
    if (response.ok) playSuccessSound();
  }

  return (

    <ProfileContext.Provider value={{ profile, openProfile: () => setShowProfile(true), setUser, playSuccessSound, impersonateId, setImpersonateId }}>
      <input ref={heroFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadHero} />

      {showNav && user && (
        <Navbar 
          user={user} 
          profile={profile}
          unreadCount={unreadCount} 
          pendingDuties={pendingDuties}
          pendingReqs={pendingReqs}
          onProfileClick={() => setShowProfile(true)} 
        />
      )}

      {showNav && (announcement || user?.role === 'admin') && (
        <div className="announcement-bar-live no-print">
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
              <button onClick={() => { setAnnouncement(''); setAnnDraft(''); saveAnnouncement(); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>✕</button>
            )}
          </div>
        </div>
      )}

      <div id="main" style={showNav ? {} : { padding: 0, maxWidth: 'none' }}>
        {showNav && pathname !== '/dashboard' && (
          <button 
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm no-print"
            style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#8B1A1A' }}
          >
            ← Back
          </button>
        )}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>


      <div className={`inactivity-banner${showBanner ? ' show' : ''}`}>
        <span>⏰ You will be logged out in {countdown}s due to inactivity</span>
        <button
          onClick={resetIdleTimers}
          style={{ padding: '6px 16px', background: 'rgba(255,255,255,.2)',
            border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 8,
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
          Stay Logged In
        </button>
        <button
          onClick={doLogout}
          style={{ padding: '6px 12px', background: 'transparent',
            border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12 }}>
          Log Out
        </button>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      {showNav && user && (
        <div className="mobile-bottom-nav no-print">
          {ALL_NAV
            .filter(n => !n.roles || n.roles.includes(user.role))
            .map(n => {
              const b = (n.key === 'messages' || n.key === 'sms') ? unreadCount :
                        (n.key === 'duties') ? (pendingDuties + (user.role === 'admin' ? pendingReqs : 0)) : 0;
              return (
                <Link
                  key={n.key}
                  href={n.key === 'classes' ? '/classes' : `/${n.key}`}
                  className={pathname.startsWith('/' + n.key) || (n.key === 'dashboard' && pathname === '/dashboard') ? 'active' : ''}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => n.prefetch && prefetchKeys(n.prefetch)}
                >
                  <span className="icon">{n.icon}</span>
                  <span className="label">{n.label}</span>
                  {b > 0 && <span className="nav-badge" style={{ top: 5, right: '15%', transform: 'scale(0.8)' }}>{b > 9 ? '9+' : b}</span>}
                </Link>
              );
            })}
        </div>
      )}

      {showProfile && user && (
        <ProfilePanel user={user} onClose={() => setShowProfile(false)} />
      )}
    </ProfileContext.Provider>
  );
}
