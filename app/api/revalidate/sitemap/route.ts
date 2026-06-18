import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/revalidate/sitemap
 *
 * Revalidates the sitemap (and optionally a specific lesson page) on-demand.
 * Call this from admin/teacher APIs whenever a lesson is published/unpublished.
 *
 * Body (optional): { slug?: string }
 * Header required: Authorization: Bearer <SITEMAP_REVALIDATE_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SITEMAP_REVALIDATE_SECRET
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => null)
    const slug = typeof body?.slug === 'string' ? body.slug : null

    // Revalidate the sitemap route
    revalidatePath('/sitemap.xml')

    // If a specific lesson slug is provided, revalidate that page too
    if (slug) {
      revalidatePath(`/lessons/${slug}`)
    }

    return NextResponse.json({
      revalidated: true,
      slug: slug ?? null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[revalidate/sitemap]', err)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
