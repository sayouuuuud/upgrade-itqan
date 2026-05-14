import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// POST /api/student/tajweed-paths/[id]/stages/[stageId]/start
// Sets progress to 'in_progress' (only if currently 'unlocked' or already 'in_progress').
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; stageId: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["student"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id, stageId } = await ctx.params

    const enrollmentRows = (await query<any>(
      `SELECT * FROM tajweed_path_enrollments
        WHERE path_id = $1 AND student_id = $2 LIMIT 1`,
      [id, session!.sub],
    )) as any[]
    const enrollment = enrollmentRows[0]
    if (!enrollment) return NextResponse.json({ error: "غير مشترك" }, { status: 403 })

    const progressRows = (await query<any>(
      `SELECT * FROM tajweed_path_progress
        WHERE enrollment_id = $1 AND stage_id = $2 LIMIT 1`,
      [enrollment.id, stageId],
    )) as any[]
    const progress = progressRows[0]
    if (!progress) return NextResponse.json({ error: "لم يتم العثور على تقدم" }, { status: 404 })
    if (progress.status === "locked") {
      return NextResponse.json({ error: "هذه المرحلة مقفولة" }, { status: 400 })
    }
    if (progress.status === "completed") return NextResponse.json({ ok: true, status: "completed" })

    await query(
      `UPDATE tajweed_path_progress
          SET status = 'in_progress',
              started_at = COALESCE(started_at, NOW())
        WHERE id = $1`,
      [progress.id],
    )
    await query(
      `UPDATE tajweed_path_enrollments
          SET current_stage_id = $1, last_activity_at = NOW()
        WHERE id = $2`,
      [stageId, enrollment.id],
    )

    return NextResponse.json({ ok: true, status: "in_progress" })
  } catch (err) {
    console.error("[student tajweed stage start]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
