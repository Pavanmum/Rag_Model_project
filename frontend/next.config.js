/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In production on Vercel, it's better to use direct absolute URLs in API calls,
    // but if you want rewrites, we can point to an environment variable or fallback to localhost
    const destinationUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    return [
      {
        source: '/api/:path*',
        destination: `${destinationUrl}/:path*`, // Proxy to Backend
      },
    ];
  },
  // Enable experimental features if needed
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configure for production deployment
  output: 'standalone',
  // Image optimization
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
