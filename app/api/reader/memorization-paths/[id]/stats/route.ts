import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/reader/memorization-paths/[id]/stats
// Same shape as the admin stats endpoint, but only the path's owner (reader)
// can read it.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params

    let pathRows: any[]
    try {
      pathRows = (await query<any>(
        `SELECT id, title, total_units, created_by
           FROM memorization_paths
          WHERE id = $1 AND created_by = $2 LIMIT 1`,
        [id, session!.sub],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }
    const path = pathRows[0]
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const totalUnits = parseInt(path.total_units || "0", 10)

    const overallRows = (await query<any>(
      `SELECT
         COUNT(*)::text AS enrolled,
         COUNT(*) FILTER (WHERE status = 'active')::text AS active,
         COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
         COUNT(*) FILTER (WHERE status = 'paused')::text AS paused,
         COUNT(*) FILTER (WHERE status = 'dropped')::text AS dropped,
         COALESCE(ROUND(AVG(units_completed), 2)::text, '0') AS avg_units_completed,
         COALESCE(ROUND(AVG(
           CASE WHEN $2::int > 0
             THEN units_completed::numeric / $2::numeric * 100
             ELSE 0 END
         ), 1)::text, '0') AS avg_progress_percent
       FROM memorization_path_enrollments
       WHERE path_id = $1`,
      [id, totalUnits],
    )) as any[]

    const perUnit = (await query<any>(
      `SELECT
         u.id AS unit_id, u.position, u.title,
         COUNT(p.id) FILTER (WHERE p.status IN ('in_progress','completed'))::text AS started,
         COUNT(p.id) FILTER (WHERE p.status = 'completed')::text                  AS completed,
         COUNT(p.id) FILTER (WHERE p.status = 'in_progress')::text                AS in_progress
       FROM memorization_path_units u
       LEFT JOIN memorization_path_progress p ON p.unit_id = u.id
       WHERE u.path_id = $1
       GROUP BY u.id
       ORDER BY u.position ASC`,
      [id],
    )) as any[]

    const topStudents = (await query<any>(
      `SELECT
         u.id, u.name, u.email, u.avatar_url,
         e.units_completed, e.status, e.last_activity_at, e.completed_at
       FROM memorization_path_enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.path_id = $1
       ORDER BY e.units_completed DESC, e.last_activity_at DESC
       LIMIT 10`,
      [id],
    )) as any[]

    return NextResponse.json({
      path,
      overall: overallRows[0] || null,
      per_unit: perUnit,
      top_students: topStudents,
    })
  } catch (err) {
    console.error("[reader path stats]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
