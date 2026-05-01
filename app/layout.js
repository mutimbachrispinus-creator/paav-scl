/**
 * app/layout.js — Root layout
 * Updated with a Cache Killer to resolve persistent 404/branding issues 
 * caused by stale service workers and localStorage.
 */

import { Inter, Sora } from 'next/font/google';
import '../styles/globals.css';
import PortalShell from './PortalShell';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
});

const sora = Sora({
  subsets:  ['latin'],
  variable: '--font-sora',
  display:  'swap',
  weight:   ['400','600','700','800'],
});

export const metadata = {
  title:       'EduVantage School Management System',
  description: 'The future of school management — Multi-tenant SaaS with CBC & M-Pesa.',
  icons: { 
    icon: '/ev-brand-v3.png',
    apple: '/ev-brand-v3.png',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#4F46E5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="manifest" href="/manifest.json" />
        {/* 🚨 CACHE KILLER SCRIPT 🚨 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                  for (let reg of regs) { reg.unregister(); }
                });
              }
              // Force clear any icon caches
              if ('caches' in window) {
                caches.keys().then(names => {
                  for (let name of names) {
                    if (name.includes('image') || name.includes('static')) caches.delete(name);
                  }
                });
              }
              // Aggressive Legacy Branding Purge
              try {
                const profileRaw = localStorage.getItem('paav_cache_db_paav_school_profile');
                if (profileRaw && (profileRaw.includes('PAAV-Gitombo') || profileRaw.includes('community school'))) {
                  localStorage.removeItem('paav_cache_db_paav_school_profile');
                  localStorage.removeItem('paav_cache_db_paav_theme');
                  localStorage.removeItem('paav_cache_db_paav_announcement');
                  console.log('🧹 Purged legacy institutional branding cache');
                  window.location.reload();
                }
              } catch(e) {}
              console.log('🚀 EduVantage Cache Killer Active');
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
