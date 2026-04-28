const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the portal to be embedded in an iframe from the same origin
  // (used when printing report cards / receipts in a pop-up window)
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

  // Redirect /fees/pay to the M-Pesa parent payment page
  async redirects() {
    return [
      // Legacy HTML anchor links → Next.js routes
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },

  // Turso client uses Node.js crypto — must run in Node runtime, not Edge
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
};

module.exports = withPWA(nextConfig);

