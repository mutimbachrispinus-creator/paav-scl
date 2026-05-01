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
  title:       'EduVantage School Management Platform',
  description: 'The future of school management — Multi-tenant SaaS with CBC & M-Pesa.',
  icons: { 
    icon: '/eduvantage-logo.png',
  },
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
        {/* 🚨 CACHE KILLER SCRIPT 🚨 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                  for (let reg of regs) { reg.unregister(); }
                });
              }
              // Clear stale tenant themes to force reload
              try {
                const keys = ['paav_cache_db_paav_theme', 'paav_cache_user'];
                keys.forEach(k => localStorage.removeItem(k));
              } catch(e) {}
              console.log('🚀 EduVantage Cache Killer Executed');
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
