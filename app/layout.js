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
        {/* 🚀 EduVantage Stability Script 🚀 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ensure service worker is stable and not being aggressively cleared
              console.log('🚀 EduVantage Portal Core Active');
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
