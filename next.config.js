/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabling PWA temporarily to resolve 404/Network errors on API routes
  // caused by stale service worker cache in the user's browser.
  /*
  const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    reloadOnOnline: true,
  });
  */

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },

  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
};

module.exports = nextConfig;
