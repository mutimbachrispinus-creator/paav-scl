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

const ALL_NAV = [
  { key:'dashboard',  label:'📊 Home',       roles:['admin','teacher','staff','member'] },
  { key:'learners',   label:'🎓 Learners',   roles:['admin','teacher'] },
  { key:'grades',     label:'📊 Grades',     roles:['admin','teacher'] },
  { key:'merit-list', label:'🏆 Merit List', roles:['admin','teacher'] },
  { key:'classes',    label:'🏫 Classes',    roles:['admin','teacher'] },
  { key:'fees',       label:'💰 Fees',       roles:['admin','staff']   },
  { key:'teachers',   label:'👔 Staff',      roles:['admin']           },
  { key:'sms',        label:'📱 SMS',        roles:['admin']           },
  { key:'settings',   label:'⚙ Settings',   roles:['admin']           },
];

export default function Navbar({ user, unreadCount = 0 }) {
  const router   = useRouter();
  const pathname = usePathname();

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
      {/* ── Brand ── */}
      <div className="tb-brand" onClick={() => router.push('/dashboard')}
        style={{ cursor: 'pointer' }}>
        <div className="tb-crest">
          <span style={{ fontSize: 20 }}>🏫</span>
        </div>
        <div>
          <div className="tb-sname">PAAV-GITOMBO</div>
          <div className="tb-stag">Community School</div>
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <nav className="tb-nav">
        {nav.map(n => (
          <button
            key={n.key}
            className={`tb-nbtn${isActive(n.key) ? ' on' : ''}`}
            onClick={() => router.push(
              n.key === 'classes' ? '/classes/GRADE%207' : `/${n.key}`
            )}>
            {n.label}
          </button>
        ))}
      </nav>

      {/* ── Actions ── */}
      <div className="tb-actions">
        {/* Message badge */}
        <div className="tb-msg" title="Messages" onClick={() => router.push('/dashboard')}>
          💬
          {unreadCount > 0 && (
            <span className="msg-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>

        {/* User pill */}
        <div className="tb-user">
          <div className="tb-avatar"
            style={{ background: user.color || '#2563EB' }}>
            {user.emoji || user.name?.charAt(0) || '?'}
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
