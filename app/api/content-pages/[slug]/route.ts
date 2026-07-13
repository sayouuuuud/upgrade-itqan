import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/content-pages/[slug]
 *
 * Public endpoint that returns the content for a static page (about, terms,
 * privacy, faq) from the content_pages table. Only returns published pages.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const rows = await query<{
      slug: string
      title_ar: string
      title_en: string
      content_ar: string
      content_en: string
      meta_desc_ar: string
      meta_desc_en: string
      is_published: boolean
      updated_at: string
    }>(
      `SELECT slug, title_ar, title_en, content_ar, content_en,
              meta_desc_ar, meta_desc_en, is_published, updated_at
       FROM content_pages
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [slug]
    )

    if (!rows.length) {
      return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 })
    }

    return NextResponse.json(
      { page: rows[0] },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("[ContentPages public] GET error:", error)
    return NextResponse.json({ error: "فشل في جلب الصفحة" }, { status: 500 })
  }
}
