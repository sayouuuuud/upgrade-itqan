import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ALLOWED_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "reader"] as const

// GET /api/admin/tajweed-paths/[id]/stats
// Returns: overall enrollment stats + per-stage funnel + top students
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ALLOWED_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params

    let pathRows: any[]
    try {
      pathRows = (await query(
        `SELECT id, title, total_stages, created_by FROM tajweed_paths WHERE id = $1 LIMIT 1`,
        [id],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }
    const path = pathRows[0]
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })
    if (session!.role === "reader" && path.created_by !== session!.sub) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const totalStages = parseInt(path.total_stages || "0", 10)

    const overallRows = (await query<any>(
      `SELECT
         COUNT(*)::text AS enrolled,
         COUNT(*) FILTER (WHERE status = 'active')::text AS active,
         COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
         COUNT(*) FILTER (WHERE status = 'paused')::text AS paused,
         COUNT(*) FILTER (WHERE status = 'dropped')::text AS dropped,
         COALESCE(ROUND(AVG(stages_completed), 2)::text, '0') AS avg_stages_completed,
         COALESCE(ROUND(AVG(
           CASE WHEN $2::int > 0
             THEN stages_completed::numeric / $2::numeric * 100
             ELSE 0 END
         ), 1)::text, '0') AS avg_progress_percent
       FROM tajweed_path_enrollments
       WHERE path_id = $1`,
      [id, totalStages],
    )) as any[]

    const perStage = (await query<any>(
      `SELECT
         s.id AS stage_id,
         s.position,
         s.title,
         COUNT(p.id) FILTER (WHERE p.status IN ('in_progress','completed'))::text AS started,
         COUNT(p.id) FILTER (WHERE p.status = 'completed')::text                    AS completed,
         COUNT(p.id) FILTER (WHERE p.status = 'in_progress')::text                  AS in_progress
       FROM tajweed_path_stages s
       LEFT JOIN tajweed_path_progress p ON p.stage_id = s.id
       WHERE s.path_id = $1
       GROUP BY s.id
       ORDER BY s.position ASC`,
      [id],
    )) as any[]

    const topStudents = (await query<any>(
      `SELECT
         u.id, u.name, u.email, u.avatar_url,
         e.stages_completed, e.status, e.last_activity_at, e.completed_at
       FROM tajweed_path_enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.path_id = $1
       ORDER BY e.stages_completed DESC, e.last_activity_at DESC
       LIMIT 10`,
      [id],
    )) as any[]

    return NextResponse.json({
      path,
      overall: overallRows[0] || null,
      per_stage: perStage,
      top_students: topStudents,
    })
  } catch (err) {
    console.error("[tajweed path stats]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
