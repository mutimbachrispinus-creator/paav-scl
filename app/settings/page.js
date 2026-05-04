'use client';
/**
 * app/settings/page.js — Settings Hub
 *
 * Provides a central menu for administrators to configure various
 * school portal parameters (Grading, Subjects, Streams, etc.)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getCachedUser, getCachedDB } from '@/lib/client-cache';

export default function SettingsHubPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const u = await getCachedUser();
        if (!u || u.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setUser(u);
        setLoading(false); // Show page immediately

        // Fetch DB usage in background
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [{ type: 'storageUsage' }] })
        })
        .then(res => res.json())
        .then(dbData => {
          setUsage(dbData.results?.[0]?.usage || null);
        })
        .catch(err => console.error('Storage usage fetch failed:', err));
        
      } catch (e) {
        router.push('/');
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading || !user) return <div className="page on"><p>Loading settings...</p></div>;

  const ALL_SETTINGS_LINKS = [
    { title: '📊 Grading Scale', desc: 'Configure EE/ME/AE/BE score thresholds', href: '/settings/grading', icon: '📈' },
    { title: '🎓 Education System', desc: 'Switch between CBC, British, and IB curriculums', href: '/settings/profile?tab=info', icon: '📜' },
    { title: '📚 Subjects', desc: 'Add or remove subjects per grade level', href: '/settings/subjects', icon: '📖' },
    { title: '🏫 Streams & Classes', desc: 'Manage class streams and identifiers', href: '/streams', icon: '🏢' },
    { title: '📅 Timetable', desc: 'Configure lesson times and breaks', href: '/settings/timetable', icon: '⏰' },
    { title: '📱 SMS Configuration', desc: 'Manage Africa\'s Talking API credentials', href: '/settings/sms', icon: '📱', superOnly: true },
    { title: 'Identity & Branding', desc: 'Customize logo, theme, hero images, and announcements', href: '/settings/profile', icon: '🎨' },
    { title: '👤 My Profile', desc: 'Update your personal info and security', href: '/dashboard?tab=profile', icon: '🔑' },
    { title: '🗄️ Database Storage', desc: usage ? `Usage: ${usage.percent.toFixed(2)}% (${(usage.totalBytes / 1024 / 1024).toFixed(1)} MB / 9 GB)` : 'Loading database stats...', href: '#', icon: '💾' },
  ];

  const SETTINGS_LINKS = ALL_SETTINGS_LINKS.filter(l => !l.superOnly || user.role === 'super-admin');

  return (
    <div className="page on" id="pg-settings-hub">
      <div className="page-hdr">
        <div>
          <h2>⚙️ System Settings</h2>
          <p>Configure portal behavior and academic standards</p>
        </div>
      </div>

      <div className="sg sg2" style={{ marginTop: 20 }}>
        {SETTINGS_LINKS.map(link => (
          <Link href={link.href} key={link.href} className="panel" style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}>
            <div className="panel-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontSize: 32, width: 60, height: 60, borderRadius: 'var(--r2)', background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border)' }}>
                {link.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{link.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>{link.desc}</p>
              </div>
              <div style={{ opacity: 0.3, fontSize: 20 }}>➔</div>
            </div>
          </Link>
        ))}
      </div>
      
      <style jsx>{`
        .panel:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
