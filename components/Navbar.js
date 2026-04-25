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
  { key:'parent-home',label:'🏠 My Child',   roles:['parent'] },
  { key:'parent-marks',label:'📋 Report Card', roles:['parent'] },
  { key:'messages',   label:'💬 Messages',   roles:['admin','teacher','staff','parent'] },
  { key:'learners',   label:'🎓 Learners',   roles:['admin','teacher'] },
  { key:'grades',     label:'📊 Grades',     roles:['admin','teacher'] },
  { key:'predictor',  label:'🎯 Predictor',  roles:['admin','teacher'] },
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
      <div className="tb-brand" onClick={() => router.push('/dashboard')}
        style={{ cursor: 'pointer' }}>
        <div className="tb-crest">
          <img src="data:image/jpeg;base64,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" alt="Logo" style={{ width: 36, height: 36, objectFit: 'cover' }} />
        </div>
        <div>
          <div className="tb-sname">PAAV-GITOMBO</div>
          <div className="tb-stag">Portal v122</div>
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
