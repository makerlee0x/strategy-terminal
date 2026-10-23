/** @type {import('next').NextConfig} */
const sec = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];
module.exports = {
  poweredByHeader: false,
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/earn', destination: '/mstr#work', permanent: true },
      { source: '/opportunities', destination: '/mstr#work', permanent: true },
      { source: '/learn', destination: '/mstr#how', permanent: true },
      { source: '/resources', destination: '/mstr#how', permanent: true },
      { source: '/tokens', destination: '/mstr', permanent: true }
    ];
  },
  async headers() {
    return [
      { source: '/(.*)', headers: sec },
      { source: '/:file(strategy-icon.png|strategy-wordmark.png)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] }
    ];
  }
};
