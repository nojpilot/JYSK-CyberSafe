/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_BASE
          ? `${process.env.API_BASE}/api/:path*`
          : 'http://localhost:3001/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
