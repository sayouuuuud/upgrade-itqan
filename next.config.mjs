/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer', 'fluent-ffmpeg', 'ffmpeg-static'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  devIndicators: {
    buildActivity: false,
  },
  turbopack: {
    root: '/vercel/share/v0-project',
  },
}

export default nextConfig
