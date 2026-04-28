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

const ALL_NAV = [
  { key:'dashboard',  label:'📊 Home',        roles:['admin','teacher','staff','member','parent'] },
  { key:'attendance', label:'📋 Attendance',  roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'timetable',  label:'📅 Timetable',   roles:['admin','teacher','staff'] },
  { key:'duties',     label:'🎖️ Duties',       roles:['admin','teacher','staff'] },
  { key:'performance',label:'📈 Performance', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'learners',   label:'🎓 Learners',    roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'grades',     label:'📊 Grades',      roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'merit-list', label:'🏆 Merit List',  roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'allocations',label:'🗓️ Allocations', roles:['admin'] },
  { key:'salary',     label:'💵 Salary',       roles:['admin'] },
  { key:'templates',  label:'📄 Templates',   roles:['admin'] },
  { key:'fees',       label:'💰 Fees',        roles:['admin','staff'] },
  { key:'teachers',   label:'👔 Staff',       roles:['admin'] },
  { key:'settings',   label:'⚙ Settings',    roles:['admin'] },
  { key:'analytics',  label:'📈 Analytics', roles:['admin'] },
  { key:'messages',   label:'💬 Messages',    roles:['admin','teacher','jss_teacher','senior_teacher','staff','parent'] },
  { key:'profile',     label:'👤 Profile',      roles:['admin'] },
  { key:'documents',   label:'📂 Documents',    roles:['admin','teacher','staff','member','parent'] },
  { key:'sms',        label:'📱 SMS',         roles:['admin'] },
];

export default function Navbar({ user, unreadCount = 0, onProfileClick }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const nav = ALL_NAV.filter(n => n.roles.includes(user?.role || 'member'));

  function isActive(key) {
    if (key === 'dashboard') return pathname === '/dashboard';
    return pathname.startsWith('/' + key);
  }

  async function logout() {
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'logout' }),
    });
    router.push('/');
  }

  if (!user) return null;

  return (
    <div id="topbar">
      <Link href="/dashboard" className="tb-brand" style={{ cursor: 'pointer', textDecoration: 'none' }}>
        <div className="tb-crest">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PAAV Logo" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%' }} />
        </div>
        <div>
          <div className="tb-sname">PAAV-GITOMBO</div>
          <div className="tb-stag">More Than Academics!</div>
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
          {nav.map(n => (
            <Link
              key={n.key}
              href={n.key === 'classes' ? '/classes/GRADE%207' : `/${n.key}`}
              className={`tb-nbtn${isActive(n.key) ? ' on' : ''}`}
              style={{ textDecoration: 'none' }}
              onClick={() => setShowMobileNav(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button className="nav-scroll-btn no-print" onClick={() => document.getElementById('tb-nav-inner').scrollBy({left:200, behavior:'smooth'})}>›</button>
      </div>

      {/* ── Mobile Drawer ── */}
      {showMobileNav && (
        <div className="mobile-drawer no-print">
          {nav.map(n => (
            <Link key={n.key} href={`/${n.key}`} className={`drawer-item ${isActive(n.key)?'on':''}`} onClick={() => setShowMobileNav(false)}>
              {n.label}
            </Link>
          ))}
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

        {/* Logout */}
        <button className="btn-logout" onClick={logout}>⏻ Out</button>
      </div>
    </div>
  );
}
