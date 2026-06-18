import type { MetadataRoute } from 'next'
import { query } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amigacafé.com'

// Static pages that are always public
const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/library`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch all published public lessons
    const lessons = await query<{
      public_slug: string
      updated_at: string | null
      created_at: string
    }>(
      `SELECT public_slug, updated_at, created_at
       FROM public_lessons
       WHERE is_published = true
         AND review_status = 'approved'
         AND public_slug IS NOT NULL
         AND public_slug != ''
       ORDER BY COALESCE(updated_at, created_at) DESC`,
      []
    )

    const lessonUrls: MetadataRoute.Sitemap = lessons.map((l) => ({
      url: `${BASE_URL}/lessons/${l.public_slug}`,
      lastModified: new Date(l.updated_at || l.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...STATIC_PAGES, ...lessonUrls]
  } catch (err) {
    // If DB is unreachable during build, fall back to static pages only
    console.error('[sitemap] Failed to fetch dynamic pages:', err)
    return STATIC_PAGES
  }
}
