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
  }
};

export default nextConfig;
