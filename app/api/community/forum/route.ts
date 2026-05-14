import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import {
  canAccessCommunity,
  canModerate,
} from "@/lib/community/permissions"
import type { Community, PostType } from "@/lib/community/types"

const VALID_COMMUNITIES: Community[] = ["academy", "maqraa"]
const VALID_POST_TYPES: PostType[] = ["discussion", "qna"]

/**
 * GET /api/community/forum
 * Query params:
 *   - community: 'academy' | 'maqraa' (required)
 *   - post_type: 'discussion' | 'qna'  (default: discussion)
 *   - category:  string or 'all'
 *   - search:    free-text search on title/content
 *   - page:      1-based page number
 *   - page_size: 1..50, default 20
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json(
      { error: "community غير صالح" },
      { status: 400 }
    )
  }

  if (!canAccessCommunity(session, community)) {
    return NextResponse.json(
      { error: "لا تملك صلاحية الوصول لهذا المجتمع" },
      { status: 403 }
    )
  }

  const postTypeParam = (searchParams.get("post_type") as PostType | null) ||
    "discussion"
  if (!VALID_POST_TYPES.includes(postTypeParam)) {
    return NextResponse.json(
      { error: "post_type غير صالح" },
      { status: 400 }
    )
  }

  const category = searchParams.get("category")
  const search = searchParams.get("search")?.trim()
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("page_size") || "20", 10))
  )
  const showHidden = canModerate(session, community)

  const where: string[] = ["p.community = $1", "p.post_type = $2"]
  const params: unknown[] = [community, postTypeParam]

  if (!showHidden) {
    where.push("p.is_hidden = FALSE AND p.is_approved = TRUE")
  }

  if (category && category !== "all") {
    params.push(category)
    where.push(`p.category = $${params.length}`)
  }

  if (search) {
    params.push(`%${search}%`)
    where.push(
      `(p.title ILIKE $${params.length} OR p.content ILIKE $${params.length})`
    )
  }

  params.push(pageSize)
  params.push((page - 1) * pageSize)

  const sql = `
    SELECT p.*,
           u.name        AS author_name,
           u.avatar_url  AS author_avatar,
           u.role        AS author_role
    FROM forum_posts p
    JOIN users u ON u.id = p.author_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.is_pinned DESC,
             COALESCE(p.last_reply_at, p.created_at) DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `

  try {
    const posts = await query(sql, params)
    return NextResponse.json({ posts })
  } catch (err) {
    console.error("[community/forum GET]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * POST /api/community/forum
 * Body: { community, post_type, title, content, category, tags? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  let body: {
    community?: Community
    post_type?: PostType
    title?: string
    content?: string
    category?: string
    tags?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const community = body.community
  const postType: PostType = body.post_type || "discussion"

  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json(
      { error: "community غير صالح" },
      { status: 400 }
    )
  }
  if (!VALID_POST_TYPES.includes(postType)) {
    return NextResponse.json(
      { error: "post_type غير صالح" },
      { status: 400 }
    )
  }
  if (!canAccessCommunity(session, community)) {
    return NextResponse.json(
      { error: "لا تملك صلاحية الوصول لهذا المجتمع" },
      { status: 403 }
    )
  }

  const title = body.title?.trim()
  const content = body.content?.trim()
  const category = body.category?.trim()

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: "العنوان والمحتوى والفئة مطلوبة" },
      { status: 400 }
    )
  }
  if (title.length > 255) {
    return NextResponse.json(
      { error: "العنوان طويل جدًا (255 حرف كحد أقصى)" },
      { status: 400 }
    )
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    : []

  try {
    const rows = await query<{ id: string }>(
      `INSERT INTO forum_posts (
         author_id, community, post_type,
         title, content, category, tags,
         is_approved
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [session.sub, community, postType, title, content, category, tags]
    )
    return NextResponse.json({ post: rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[community/forum POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
