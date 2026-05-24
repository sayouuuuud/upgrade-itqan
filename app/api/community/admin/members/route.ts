import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { isCommunityAdmin } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

const VALID_COMMUNITIES: Community[] = ["academy", "maqraa"]

// Active roles (or academy_roles) considered part of each community
const ACADEMY_ROLES = [
  "student",
  "teacher",
  "parent",
  "academy_admin",
  "student_supervisor",
  "content_supervisor",
  "fiqh_supervisor",
  "quality_supervisor",
  "supervisor",
  "admin",
]
const MAQRAA_ROLES = [
  "student",
  "reader",
  "reciter_supervisor",
  "student_supervisor",
  "admin",
]

/**
 * GET /api/community/admin/members?community=academy|maqraa&search=&banned=true|false&page=&page_size=
 *
 * Lists members of a community with their post/reply counts and ban status.
 * Restricted to community admins.
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

  const search = searchParams.get("search")?.trim()
  const bannedOnly = searchParams.get("banned") === "true"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("page_size") || "30", 10))
  )

  const roles = community === "academy" ? ACADEMY_ROLES : MAQRAA_ROLES

  const where: string[] = [`u.role = ANY($1::text[])`]
  const params: unknown[] = [roles]

  if (search) {
    params.push(`%${search}%`)
    where.push(
      `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    )
  }

  params.push(community)
  const communityIdx = params.length

  if (bannedOnly) {
    where.push(
      `EXISTS (SELECT 1 FROM community_bans b WHERE b.user_id = u.id AND b.community = $${communityIdx} AND (b.expires_at IS NULL OR b.expires_at > NOW()))`
    )
  }

  params.push(pageSize)
  params.push((page - 1) * pageSize)

  const sql = `
    SELECT u.id AS user_id, u.name, u.email, u.role, u.avatar_url,
           COALESCE(p.posts_count, 0) AS posts_count,
           COALESCE(r.replies_count, 0) AS replies_count,
           COALESCE(p.last_post_at, r.last_reply_at) AS last_active_at,
           b.id IS NOT NULL AS is_banned,
           b.reason AS ban_reason,
           b.expires_at AS ban_expires_at
    FROM users u
    LEFT JOIN (
      SELECT author_id,
             COUNT(*) AS posts_count,
             MAX(created_at) AS last_post_at
      FROM forum_posts
      WHERE community = $${communityIdx}
      GROUP BY author_id
    ) p ON p.author_id = u.id
    LEFT JOIN (
      SELECT fr.author_id,
             COUNT(*) AS replies_count,
             MAX(fr.created_at) AS last_reply_at
      FROM forum_replies fr
      JOIN forum_posts fp ON fp.id = fr.post_id
      WHERE fp.community = $${communityIdx}
      GROUP BY fr.author_id
    ) r ON r.author_id = u.id
    LEFT JOIN community_bans b
      ON b.user_id = u.id
     AND b.community = $${communityIdx}
     AND (b.expires_at IS NULL OR b.expires_at > NOW())
    WHERE ${where.join(" AND ")}
    ORDER BY (COALESCE(p.posts_count, 0) + COALESCE(r.replies_count, 0)) DESC,
             u.name ASC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `

  try {
    const members = await query(sql, params)
    return NextResponse.json({ members })
  } catch (err) {
    console.error("[community/admin/members GET]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

/**
 * POST /api/community/admin/members
 * Body: { community, user_id, action: 'ban'|'unban', reason?, expires_at? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  let body: {
    community?: Community
    user_id?: string
    action?: "ban" | "unban"
    reason?: string
    expires_at?: string | null
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

  if (!body.user_id || !body.action) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
  }
  if (body.user_id === session.sub) {
    return NextResponse.json(
      { error: "لا يمكنك حظر نفسك" },
      { status: 400 }
    )
  }

  try {
    if (body.action === "ban") {
      await query(
        `INSERT INTO community_bans (community, user_id, banned_by, reason, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (community, user_id) DO UPDATE
           SET banned_by = EXCLUDED.banned_by,
               reason = EXCLUDED.reason,
               expires_at = EXCLUDED.expires_at,
               created_at = NOW()`,
        [
          community,
          body.user_id,
          session.sub,
          body.reason || null,
          body.expires_at || null,
        ]
      )
      return NextResponse.json({ ok: true, banned: true })
    } else if (body.action === "unban") {
      await query(
        `DELETE FROM community_bans WHERE community = $1 AND user_id = $2`,
        [community, body.user_id]
      )
      return NextResponse.json({ ok: true, banned: false })
    }
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 })
  } catch (err) {
    console.error("[community/admin/members POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
