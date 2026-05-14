import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// Helper: ensure path exists AND was created by the calling reader.
async function loadOwnedPath(id: string, readerId: string) {
  const rows = (await query<any>(
    `SELECT * FROM memorization_paths WHERE id = $1 AND created_by = $2 LIMIT 1`,
    [id, readerId],
  )) as any[]
  return rows[0] || null
}

// GET /api/reader/memorization-paths/[id]
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params

    let path: any
    try {
      path = await loadOwnedPath(id, session!.sub)
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const units = (await query(
      `SELECT * FROM memorization_path_units WHERE path_id = $1 ORDER BY position ASC`,
      [id],
    )) as any[]

    const enrollmentStats = (await query<any>(
      `SELECT
         COUNT(*)::text AS enrolled,
         COUNT(*) FILTER (WHERE status = 'active')::text AS active,
         COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
         COUNT(*) FILTER (WHERE status = 'paused')::text AS paused,
         COUNT(*) FILTER (WHERE status = 'dropped')::text AS dropped,
         ROUND(AVG(units_completed), 2)::text AS avg_completed_units
       FROM memorization_path_enrollments WHERE path_id = $1`,
      [id],
    )) as any[]

    const recentEnrollments = (await query(
      `SELECT
         e.id, e.status, e.units_completed, e.started_at, e.last_activity_at, e.completed_at,
         u.id AS student_id, u.name AS student_name, u.email AS student_email
       FROM memorization_path_enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.path_id = $1
       ORDER BY e.last_activity_at DESC
       LIMIT 50`,
      [id],
    )) as any[]

    return NextResponse.json({
      path, units,
      stats: enrollmentStats[0] || null,
      recent_enrollments: recentEnrollments,
    })
  } catch (err) {
    console.error("[reader path GET]", err)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/reader/memorization-paths/[id]
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const body = await req.json()

    const owned = await loadOwnedPath(id, session!.sub)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const allowed = ["title", "description", "level", "thumbnail_url", "is_published", "is_active", "require_audio", "estimated_days"] as const
    const sets: string[] = []
    const params: any[] = []
    let i = 1
    for (const key of allowed) {
      if (key in body) {
        sets.push(`${key} = $${i++}`)
        params.push((body as any)[key])
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: "لا تعديلات" }, { status: 400 })
    params.push(id)
    const updated = (await query(
      `UPDATE memorization_paths SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      params,
    )) as any[]
    return NextResponse.json({ path: updated[0] })
  } catch (err) {
    console.error("[reader path PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// DELETE /api/reader/memorization-paths/[id]
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const owned = await loadOwnedPath(id, session!.sub)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })
    await query(`DELETE FROM memorization_paths WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[reader path DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
