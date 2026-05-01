'use client';
/**
 * components/Navbar.js — Role-based top navigation bar
 *
 * Renders the sticky topbar with:
 *   • School crest + name
 *   • Tab buttons filtered by role (matching ALL_NAV in index-122.html)
 *   • Message badge
 *   • User pill + logout
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ALL_NAV } from '@/lib/navigation';
import { prefetchKeys, clearAllCache } from '@/lib/client-cache';
import { useProfile } from '@/app/PortalShell';


export default function Navbar({ user, profile, unreadCount = 0, pendingDuties = 0, pendingReqs = 0, onProfileClick }) {

  const router   = useRouter();
  const pathname = usePathname();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const { impersonateId } = useProfile() || {};
  const activeRoles = [user?.role || 'member'];
  if (user?.role === 'super-admin' && impersonateId) {
    activeRoles.push('admin'); // Add admin role to see school management tabs
  }

  const nav = ALL_NAV.filter(n => n.roles.some(r => activeRoles.includes(r)));

  function isActive(key) {
    if (key === 'dashboard') return pathname === '/dashboard';
    return pathname.startsWith('/' + key);
  }

  function getBadge(key) {
    if (key === 'messages' && unreadCount > 0) return unreadCount;
    if (key === 'sms' && unreadCount > 0) return unreadCount; // User requested "sms button should show number of inbox sms"
    if (key === 'duties') {
      const total = pendingDuties + (user.role === 'admin' ? pendingReqs : 0);
      if (total > 0) return total;
    }
    return 0;
  }

  async function logout() {
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'logout' }),
    });
    clearAllCache();
    router.push('/');
  }

  if (!user) return null;

  return (
    <div id="topbar">
      <Link href="/dashboard" className="tb-brand" style={{ cursor: 'pointer', textDecoration: 'none' }}>
        <div className="tb-crest">
          <img 
            src={(user.tenantId === 'platform-master' && !impersonateId) ? '/eduvantage-logo.png' : (profile.logo || '/logo.png')} 
            alt="Logo" 
            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%' }} 
          />
        </div>
        <div>
          <div className="tb-sname">
            {(user.tenantId === 'platform-master' && !impersonateId) ? 'EDUVANTAGE PLATFORM' : (profile.name?.toUpperCase() || 'SCHOOL PORTAL')} — {new Date().getFullYear()}
          </div>
          <div className="tb-stag">
            {(user.tenantId === 'platform-master' && !impersonateId) ? 'Empowering Education' : (profile.motto || 'Education Portal')}
          </div>
        </div>
      </Link>

      {/* ── Mobile Hamburger ── */}
      <button className="tb-hamburger no-print" onClick={() => setShowMobileNav(!showMobileNav)}>
        {showMobileNav ? '✕' : '☰'}
      </button>

      {/* ── Nav tabs ── */}
      <div className="nav-container">
        <button className="nav-scroll-btn no-print" onClick={() => document.getElementById('tb-nav-inner').scrollBy({left:-200, behavior:'smooth'})}>‹</button>
        <nav className="tb-nav" id="tb-nav-inner">
          {nav.map(n => {
            const b = getBadge(n.key);
            return (
              <Link
                key={n.key}
                href={n.key === 'classes' ? '/classes' : `/${n.key}`}
                className={`tb-nbtn${isActive(n.key) ? ' on' : ''}`}
                style={{ textDecoration: 'none', position: 'relative' }}
                onClick={() => setShowMobileNav(false)}
                onMouseEnter={() => n.prefetch && prefetchKeys(n.prefetch)}
              >
                {n.icon} {n.label}
                {b > 0 && <span className="nav-badge">{b > 9 ? '9+' : b}</span>}
              </Link>
            );
          })}
        </nav>
        <button className="nav-scroll-btn no-print" onClick={() => document.getElementById('tb-nav-inner').scrollBy({left:200, behavior:'smooth'})}>›</button>
      </div>

      {/* ── Mobile Drawer ── */}
      {showMobileNav && (
        <div className="mobile-drawer no-print">
          {nav.map(n => {
            const b = getBadge(n.key);
            return (
              <Link 
                key={n.key}
                href={`/${n.key}`} 
                className={`drawer-item ${isActive(n.key)?'on':''}`} 
                onClick={() => setShowMobileNav(false)} 
                onMouseEnter={() => n.prefetch && prefetchKeys(n.prefetch)}
                style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{n.icon} {n.label}</span>
                {b > 0 && <span className="nav-badge" style={{ right: 20 }}>{b > 9 ? '9+' : b}</span>}
              </Link>
            );
          })}
          <button className="btn btn-danger" style={{ margin: 20 }} onClick={logout}>🚪 Logout</button>
        </div>
      )}


      {/* ── Actions ── */}
      <div className="tb-actions">
        {/* Message badge */}
        <Link href="/dashboard" className="tb-msg" title="Messages" style={{ textDecoration: 'none' }}>
          💬
          {unreadCount > 0 && (
            <span className="msg-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>

        {/* User pill */}
        <div className="tb-user" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
          <div className="tb-avatar"
            style={{ background: user.color || '#2563EB', overflow: 'hidden' }}>
            {user.avatar ? (
              <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              user.emoji || user.name?.charAt(0) || '?'
            )}
          </div>
          <div>
            <div className="tb-uname">{user.name?.split(' ')[0] || user.username}</div>
            <div className="tb-urole">{user.role}</div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="tb-sync" title="Sync Status" style={{ fontSize: 18, marginRight: 10 }}>
          {navigator.onLine ? '🌐' : '📵'}
        </div>

        {/* Logout */}
        {user.role === 'super-admin' && impersonateId && (
          <button className="btn btn-warning btn-sm" style={{ marginRight: 10, fontWeight: 900, border: '2px solid #000' }} onClick={() => {
            localStorage.removeItem('paav_impersonate_id');
            window.location.href = '/super-admin';
          }}>⏹ STOP VIEWING SCHOOL</button>
        )}
        <button className="btn-logout" onClick={logout}>⏻ Out</button>
      </div>
    </div>
  );
}
