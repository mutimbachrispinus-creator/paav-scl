/**
 * app/layout.js — Root layout
 *
 * Loads Google Fonts (Inter + Sora), global CSS, and wraps every page
 * in the portal shell (topbar + main content area).
 *
 * The login page (app/page.js) renders its own full-screen layout,
 * so the navbar is conditionally hidden on '/'.
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
  icons: { icon: '/favicon.ico' },
};

export const viewport = {
  width:        'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        {/* Preconnect to speed up Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
        {/*
          PortalShell is a Client Component that:
            1. Reads the current pathname
            2. Shows the Navbar only when NOT on the login page '/'
            3. Renders {children} inside #main
        */}
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
