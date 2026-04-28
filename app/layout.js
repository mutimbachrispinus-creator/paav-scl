/**
 * app/layout.js — Root layout
 *
 * Loads Google Fonts (Inter + Sora), global CSS, and wraps every page
 * in the portal shell (topbar + main content area).
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
  title:       'PAAV-Gitombo Community School Portal',
  description: 'School management portal — CBC grades, fees, SMS alerts, merit lists.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PAAV School',
  },
  icons: { 
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#8B1A1A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
