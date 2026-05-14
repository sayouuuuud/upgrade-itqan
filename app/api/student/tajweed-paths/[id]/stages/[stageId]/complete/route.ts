import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// POST /api/student/tajweed-paths/[id]/stages/[stageId]/complete
// Marks stage completed → unlocks next stage. Validates audio if path.require_audio.
// Body: { audio_url?, recitation_id?, notes? }
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; stageId: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["student"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id, stageId } = await ctx.params
    const body = await req.json().catch(() => ({}))

    const pathRows = (await query<any>(
      `SELECT * FROM tajweed_paths WHERE id = $1 LIMIT 1`,
      [id],
    )) as any[]
    const path = pathRows[0]
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

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
    if (progress.status === "locked") return NextResponse.json({ error: "المرحلة مقفولة" }, { status: 400 })
    if (progress.status === "completed") {
      return NextResponse.json({ ok: true, status: "completed", already: true })
    }

    const audioUrl = body.audio_url || progress.audio_url || null
    const recitationId = body.recitation_id || progress.recitation_id || null

    if (path.require_audio && !audioUrl && !recitationId) {
      return NextResponse.json({ error: "هذا المسار يتطلب تسجيل صوتي" }, { status: 400 })
    }

    await query(
      `UPDATE tajweed_path_progress
          SET status = 'completed',
              audio_url = $1,
              recitation_id = $2,
              notes = COALESCE($3, notes),
              completed_at = NOW(),
              started_at = COALESCE(started_at, NOW())
        WHERE id = $4`,
      [audioUrl, recitationId, body.notes || null, progress.id],
    )

    // Find next stage to unlock
    const stageRows = (await query<any>(
      `SELECT id, position FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
      [id],
    )) as any[]
    const currentIdx = stageRows.findIndex(s => s.id === stageId)
    const nextStage = currentIdx >= 0 && currentIdx < stageRows.length - 1
      ? stageRows[currentIdx + 1] : null

    if (nextStage) {
      await query(
        `UPDATE tajweed_path_progress
            SET status = CASE WHEN status = 'locked' THEN 'unlocked' ELSE status END
          WHERE enrollment_id = $1 AND stage_id = $2`,
        [enrollment.id, nextStage.id],
      )
    }

    // Recompute stages_completed from progress (avoids drift)
    const completedRows = (await query<any>(
      `SELECT COUNT(*)::int AS n FROM tajweed_path_progress
        WHERE enrollment_id = $1 AND status = 'completed'`,
      [enrollment.id],
    )) as any[]
    const stagesCompleted = completedRows[0]?.n || 0

    const isFinished = !nextStage && stagesCompleted >= stageRows.length
    if (isFinished) {
      await query(
        `UPDATE tajweed_path_enrollments
            SET status = 'completed',
                stages_completed = $1,
                last_activity_at = NOW(),
                completed_at = NOW(),
                current_stage_id = NULL
          WHERE id = $2`,
        [stagesCompleted, enrollment.id],
      )
    } else {
      await query(
        `UPDATE tajweed_path_enrollments
            SET stages_completed = $1,
                last_activity_at = NOW(),
                current_stage_id = $2
          WHERE id = $3`,
        [stagesCompleted, nextStage?.id || null, enrollment.id],
      )
    }

    return NextResponse.json({
      ok: true,
      status: "completed",
      next_stage_id: nextStage?.id || null,
      stages_completed: stagesCompleted,
      finished: isFinished,
    })
  } catch (err) {
    console.error("[student tajweed stage complete]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
