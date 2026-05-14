import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { canModerate } from "@/lib/community/permissions"
import type { Community, ReportStatus } from "@/lib/community/types"

const VALID_STATUSES: ReportStatus[] = [
  "open",
  "reviewed",
  "dismissed",
  "actioned",
]

/**
 * PATCH /api/community/forum/reports/[id]
 * Body: { status: ReportStatus }
 * Moderators only — and only within their own community.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params
  const report = await queryOne<{ id: string; community: Community }>(
    `SELECT id, community FROM forum_reports WHERE id = $1`,
    [id]
  )
  if (!report) {
    return NextResponse.json({ error: "البلاغ غير موجود" }, { status: 404 })
  }
  if (!canModerate(session, report.community)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  let body: { status?: ReportStatus }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "status غير صالح" }, { status: 400 })
  }

  try {
    const rows = await query(
      `UPDATE forum_reports
         SET status = $1,
             reviewed_by = $2,
             reviewed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [body.status, session.sub, id]
    )
    return NextResponse.json({ report: rows[0] })
  } catch (err) {
    console.error("[forum reports PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
