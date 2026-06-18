import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amigacafé.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/library',
          '/lessons/',
        ],
        disallow: [
          '/academy/',
          '/student/',
          '/teacher/',
          '/reader/',
          '/admin/',
          '/api/',
          '/(auth)/',
          '/dashboard/',
          '/recordings',
          '/rejected',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
