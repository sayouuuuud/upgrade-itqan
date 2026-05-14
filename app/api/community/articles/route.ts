import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canAccessCommunity,
  canAuthorArticle,
} from "@/lib/community/permissions"
import {
  estimateReadingMinutes,
  generateSlug,
  withSuffix,
} from "@/lib/community/slug"
import type {
  ArticleCategory,
  Community,
} from "@/lib/community/types"

const VALID_COMMUNITIES: Community[] = ["academy", "maqraa"]

/**
 * GET /api/community/articles?community=&category=&search=&status=published
 * Defaults to `status=published` for public listing; authenticated authors can
 * pass `status=mine` to fetch all their own drafts.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!canAccessCommunity(session, community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const category = searchParams.get("category")
  const search = searchParams.get("search")?.trim()
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("page_size") || "12", 10))
  )

  const where: string[] = ["a.community = $1", "a.status = 'published'"]
  const params: unknown[] = [community]

  if (category && category !== "all") {
    params.push(category)
    where.push(`a.category = $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    where.push(
      `(a.title ILIKE $${params.length} OR a.excerpt ILIKE $${params.length} OR a.content ILIKE $${params.length})`
    )
  }

  params.push(pageSize)
  params.push((page - 1) * pageSize)

  const sql = `
    SELECT a.id, a.community, a.title, a.slug, a.excerpt, a.cover_image_url,
           a.category, a.tags, a.status, a.views_count, a.likes_count,
           a.comments_count, a.reading_minutes, a.published_at, a.created_at,
           a.author_id,
           u.name AS author_name,
           u.avatar_url AS author_avatar
    FROM articles a
    JOIN users u ON u.id = a.author_id
    WHERE ${where.join(" AND ")}
    ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `
  try {
    const articles = await query(sql, params)
    return NextResponse.json({ articles })
  } catch (err) {
    console.error("[community/articles GET]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * POST /api/community/articles
 * Body: { community, title, content, category, excerpt?, tags?, cover_image_url? }
 * Saves as `draft`. Authors must call /submit to push into the review queue.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  let body: {
    community?: Community
    title?: string
    content?: string
    category?: ArticleCategory
    excerpt?: string
    tags?: string[]
    cover_image_url?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const { community, title, content, category } = body
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!canAuthorArticle(session, community)) {
    return NextResponse.json(
      { error: "لا تملك صلاحية إضافة مقال في هذا المجتمع" },
      { status: 403 }
    )
  }
  if (!title?.trim() || !content?.trim() || !category) {
    return NextResponse.json(
      { error: "العنوان والمحتوى والفئة مطلوبة" },
      { status: 400 }
    )
  }

  // Build a unique slug — append numeric suffix on collision.
  const baseSlug = generateSlug(title.trim())
  let slug = baseSlug
  for (let i = 2; ; i++) {
    const existing = await queryOne(
      `SELECT 1 FROM articles WHERE slug = $1`,
      [slug]
    )
    if (!existing) break
    slug = withSuffix(baseSlug, i)
    if (i > 50) {
      slug = `${baseSlug}-${Date.now()}`
      break
    }
  }

  const excerpt = body.excerpt?.trim() ||
    content.trim().slice(0, 280).replace(/\s+\S*$/, "")
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    : []
  const readingMinutes = estimateReadingMinutes(content)

  try {
    const rows = await query(
      `INSERT INTO articles (
         author_id, community, title, slug, excerpt, content,
         cover_image_url, category, tags, status, reading_minutes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
       RETURNING *`,
      [
        session.sub,
        community,
        title.trim(),
        slug,
        excerpt,
        content.trim(),
        body.cover_image_url?.trim() || null,
        category,
        tags,
        readingMinutes,
      ]
    )
    return NextResponse.json({ article: rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[community/articles POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
