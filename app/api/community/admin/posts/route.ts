import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { isCommunityAdmin } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

const VALID_COMMUNITIES: Community[] = ["academy", "maqraa"]

/**
 * GET /api/community/admin/posts
 *   ?community=academy|maqraa
 *   &status=visible|hidden|pending|all
 *   &category=
 *   &author=  (free text against author name/email)
 *   &search=  (against title/content)
 *   &page=
 *   &page_size=
 *
 * Admin-facing post listing with filters & total counters. Returns the full
 * post row including moderation fields and joined author info.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!isCommunityAdmin(session, community)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 })
  }

  const status = searchParams.get("status") || "all"
  const category = searchParams.get("category")
  const search = searchParams.get("search")?.trim()
  const author = searchParams.get("author")?.trim()
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("page_size") || "30", 10))
  )

  const where: string[] = ["p.community = $1"]
  const params: unknown[] = [community]

  switch (status) {
    case "visible":
      where.push("p.is_hidden = FALSE AND p.is_approved = TRUE")
      break
    case "hidden":
      where.push("p.is_hidden = TRUE")
      break
    case "pending":
      where.push("p.is_approved = FALSE")
      break
    case "pinned":
      where.push("p.is_pinned = TRUE")
      break
    case "locked":
      where.push("p.is_locked = TRUE")
      break
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

  if (author) {
    params.push(`%${author}%`)
    where.push(
      `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    )
  }

  // Counts (computed independently of the filter so the dashboard tabs
  // show totals regardless of the current filter).
  const counters = await query<{ status: string; count: string }>(
    `SELECT 'visible' AS status, COUNT(*) AS count FROM forum_posts WHERE community = $1 AND is_hidden = FALSE AND is_approved = TRUE
     UNION ALL
     SELECT 'hidden'  AS status, COUNT(*) AS count FROM forum_posts WHERE community = $1 AND is_hidden = TRUE
     UNION ALL
     SELECT 'pending' AS status, COUNT(*) AS count FROM forum_posts WHERE community = $1 AND is_approved = FALSE
     UNION ALL
     SELECT 'pinned'  AS status, COUNT(*) AS count FROM forum_posts WHERE community = $1 AND is_pinned = TRUE
     UNION ALL
     SELECT 'locked'  AS status, COUNT(*) AS count FROM forum_posts WHERE community = $1 AND is_locked = TRUE`,
    [community]
  )

  params.push(pageSize)
  params.push((page - 1) * pageSize)

  const sql = `
    SELECT p.id, p.title, p.content, p.community, p.category, p.post_type,
           p.is_pinned, p.is_locked, p.is_hidden, p.is_approved, p.hidden_reason,
           p.views_count, p.replies_count, p.upvotes_count, p.created_at, p.updated_at,
           p.author_id, u.name AS author_name, u.email AS author_email,
           u.avatar_url AS author_avatar, u.role AS author_role
    FROM forum_posts p
    JOIN users u ON u.id = p.author_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `

  try {
    const posts = await query(sql, params)
    return NextResponse.json({ posts, counters })
  } catch (err) {
    console.error("[community/admin/posts GET]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * POST /api/community/admin/posts
 * Body: { community, ids: string[], action: 'hide'|'unhide'|'pin'|'unpin'|'lock'|'unlock'|'approve'|'delete', reason? }
 *
 * Bulk admin action. Each id is validated to belong to the given community.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  let body: {
    community?: Community
    ids?: string[]
    action?: string
    reason?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const community = body.community
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ error: "community غير صالح" }, { status: 400 })
  }
  if (!isCommunityAdmin(session, community)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 })
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "لا توجد منشورات محددة" }, { status: 400 })
  }
  if (body.ids.length > 200) {
    return NextResponse.json({ error: "عدد كبير جدًا" }, { status: 400 })
  }

  const ids = body.ids
  let sql = ""
  const params: unknown[] = [ids, community]

  switch (body.action) {
    case "hide":
      sql = `UPDATE forum_posts
             SET is_hidden = TRUE, hidden_reason = $3, hidden_by = $4, hidden_at = NOW(), updated_at = NOW()
             WHERE id = ANY($1::uuid[]) AND community = $2`
      params.push(body.reason || null, session.sub)
      break
    case "unhide":
      sql = `UPDATE forum_posts
             SET is_hidden = FALSE, hidden_reason = NULL, hidden_by = NULL, hidden_at = NULL, updated_at = NOW()
             WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    case "pin":
      sql = `UPDATE forum_posts SET is_pinned = TRUE,  updated_at = NOW() WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    case "unpin":
      sql = `UPDATE forum_posts SET is_pinned = FALSE, updated_at = NOW() WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    case "lock":
      sql = `UPDATE forum_posts SET is_locked = TRUE,  updated_at = NOW() WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    case "unlock":
      sql = `UPDATE forum_posts SET is_locked = FALSE, updated_at = NOW() WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    case "approve":
      sql = `UPDATE forum_posts SET is_approved = TRUE, updated_at = NOW() WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    case "delete":
      sql = `DELETE FROM forum_posts WHERE id = ANY($1::uuid[]) AND community = $2`
      break
    default:
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 })
  }

  try {
    await query(sql, params)
    return NextResponse.json({ ok: true, count: ids.length })
  } catch (err) {
    console.error("[community/admin/posts POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
