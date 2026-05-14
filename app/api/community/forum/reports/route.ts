import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  canAccessCommunity,
  canModerate,
} from "@/lib/community/permissions"
import type {
  Community,
  ReportTargetType,
} from "@/lib/community/types"

const TARGETS: ReportTargetType[] = ["post", "reply"]

/**
 * GET /api/community/forum/reports?community=&status=
 * Moderators only.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const community = searchParams.get("community") as Community | null
  if (!community || !["academy", "maqraa"].includes(community)) {
    return NextResponse.json(
      { error: "community غير صالح" },
      { status: 400 }
    )
  }
  if (!canModerate(session, community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const status = searchParams.get("status") || "open"
  const reports = await query(
    `SELECT r.*,
            u.name AS reporter_name
     FROM forum_reports r
     JOIN users u ON u.id = r.reporter_id
     WHERE r.community = $1 AND r.status = $2
     ORDER BY r.created_at DESC
     LIMIT 200`,
    [community, status]
  )
  return NextResponse.json({ reports })
}

/**
 * POST /api/community/forum/reports
 * Body: { target_type, target_id, reason, details? }
 * Any community member can report.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  let body: {
    target_type?: ReportTargetType
    target_id?: string
    reason?: string
    details?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }

  const { target_type, target_id, reason, details } = body
  if (!target_type || !TARGETS.includes(target_type)) {
    return NextResponse.json({ error: "target_type غير صالح" }, { status: 400 })
  }
  if (!target_id || !reason) {
    return NextResponse.json(
      { error: "البيانات غير مكتملة" },
      { status: 400 }
    )
  }

  // Resolve community from the target so we can persist the right scope.
  let community: Community | undefined
  if (target_type === "post") {
    const row = await queryOne<{ community: Community }>(
      `SELECT community FROM forum_posts WHERE id = $1`,
      [target_id]
    )
    community = row?.community
  } else {
    const row = await queryOne<{ community: Community }>(
      `SELECT p.community
       FROM forum_replies r
       JOIN forum_posts p ON p.id = r.post_id
       WHERE r.id = $1`,
      [target_id]
    )
    community = row?.community
  }
  if (!community) {
    return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 })
  }
  if (!canAccessCommunity(session, community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const rows = await query(
      `INSERT INTO forum_reports (
         target_type, target_id, reporter_id, community, reason, details
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [target_type, target_id, session.sub, community, reason, details?.trim() || null]
    )
    return NextResponse.json({ report: rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[forum reports POST]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
