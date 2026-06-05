import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/student/tajweed-paths/[id]
// Returns path + stages + per-stage progress for the calling student.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["student"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params

    let pathRows: any[]
    try {
      pathRows = (await query<any>(
        `SELECT * FROM tajweed_paths
          WHERE id = $1 AND is_published = TRUE AND is_active = TRUE
          LIMIT 1`,
        [id],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      throw err
    }
    const path = pathRows[0]
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const stages = (await query<any>(
      `SELECT s.*,
              c.title AS course_title,
              c.thumbnail_url AS course_thumbnail_url,
              ce.progress_percentage AS course_progress,
              ce.status AS course_status,
              h.name AS halaqa_name,
              h.is_active AS halaqa_is_active,
              l.title AS lesson_title
       FROM tajweed_path_stages s
       LEFT JOIN courses c ON c.id = s.course_id
       LEFT JOIN enrollments ce ON ce.course_id = s.course_id AND ce.student_id = $2
       LEFT JOIN halaqat h ON h.id = s.halaqa_id
       LEFT JOIN lessons l ON l.id = s.lesson_id
       WHERE s.path_id = $1 
       ORDER BY s.position ASC`,
      [id, session!.sub],
    )) as any[]

    const enrollmentRows = (await query<any>(
      `SELECT * FROM tajweed_path_enrollments
        WHERE path_id = $1 AND student_id = $2 LIMIT 1`,
      [id, session!.sub],
    )) as any[]
    const enrollment = enrollmentRows[0] || null

    let progressByStage: Record<string, any> = {}
    if (enrollment) {
      const progressRows = (await query<any>(
        `SELECT * FROM tajweed_path_progress WHERE enrollment_id = $1`,
        [enrollment.id],
      )) as any[]
      for (const r of progressRows) progressByStage[r.stage_id] = r
    }

    const stagesWithProgress = stages.map(s => ({
      ...s,
      progress: enrollment ? (progressByStage[s.id] || { status: "locked" }) : { status: "locked" },
    }))

    return NextResponse.json({ path, stages: stagesWithProgress, enrollment })
  } catch (err) {
    console.error("[student tajweed path GET]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
