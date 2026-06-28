/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the embedded certificate fonts are bundled into serverless functions
  // that render certificates (sharp/librsvg reads them from disk at runtime).
  outputFileTracingIncludes: {
    '/api/**': ['./lib/certificate/fonts/**'],
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/student_supervisor/:path*',
        destination: '/admin/:path*',
        permanent: false,
      },
      {
        source: '/reciter_supervisor/:path*',
        destination: '/admin/:path*',
        permanent: false,
      }
    ]
  }
};

export default nextConfig;
