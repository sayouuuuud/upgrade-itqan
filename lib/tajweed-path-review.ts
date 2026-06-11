import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export type ReviewSession = { sub: string; role: string }

const REVIEW_ROLES = ["reader", "teacher", "admin", "academy_admin"]

// Ensure the caller manages the given path (admins bypass ownership).
async function authorizePath(pathId: string, session: ReviewSession) {
  const rows = (await query<any>(
    `SELECT created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1`,
    [pathId],
  )) as any[]
  if (rows.length === 0) return { ok: false as const, status: 404, error: "المسار غير موجود" }
  const p = rows[0]
  const isAdmin = session.role === "admin" || session.role === "academy_admin"
  const owns = isAdmin || p.created_by === session.sub || p.manager_id === session.sub
  if (!owns) return { ok: false as const, status: 403, error: "غير مصرح بإدارة هذا المسار" }
  return { ok: true as const }
}

// GET — list submissions awaiting review (status = 'pending_review') for a path.
export async function listSubmissions(_req: NextRequest, pathId: string) {
  const session = await getSession()
  if (!session || !REVIEW_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const auth = await authorizePath(pathId, session)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const rows = await query<any>(
      `SELECT pr.id AS progress_id, pr.status, pr.audio_url, pr.file_url,
              pr.recitation_id, pr.notes, pr.submitted_at, pr.reviewer_feedback,
              s.id AS stage_id, s.title AS stage_title, s.position AS stage_position,
              s.require_audio, s.require_file, s.task_instructions,
              u.id AS student_id, u.name AS student_name, u.email AS student_email
         FROM tajweed_path_progress pr
         JOIN tajweed_path_stages s ON s.id = pr.stage_id
         JOIN tajweed_path_enrollments e ON e.id = pr.enrollment_id
         JOIN users u ON u.id = e.student_id
        WHERE s.path_id = $1 AND pr.status = 'pending_review'
        ORDER BY pr.submitted_at ASC`,
      [pathId],
    )
    return NextResponse.json({ submissions: rows })
  } catch (err) {
    console.error("[path submissions GET]", err)
    return NextResponse.json({ error: "حدث خطأ في جلب التسليمات" }, { status: 500 })
  }
}

// POST — approve or reject a submission.
// Body: { progress_id, action: 'approve' | 'reject', feedback? }
export async function reviewSubmission(req: NextRequest, pathId: string) {
  const session = await getSession()
  if (!session || !REVIEW_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const auth = await authorizePath(pathId, session)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await req.json().catch(() => ({}))
    const progressId = (body.progress_id || "").toString()
    const action = (body.action || "").toString()
    const feedback = body.feedback ? body.feedback.toString() : null
    if (!progressId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 })
    }

    // Load the progress row and verify it belongs to this path and is pending.
    const prRows = (await query<any>(
      `SELECT pr.*, e.id AS enrollment_id, e.path_id
         FROM tajweed_path_progress pr
         JOIN tajweed_path_enrollments e ON e.id = pr.enrollment_id
         JOIN tajweed_path_stages s ON s.id = pr.stage_id
        WHERE pr.id = $1 AND s.path_id = $2 LIMIT 1`,
      [progressId, pathId],
    )) as any[]
    const pr = prRows[0]
    if (!pr) return NextResponse.json({ error: "التسليم غير موجود" }, { status: 404 })
    if (pr.status !== "pending_review") {
      return NextResponse.json({ error: "تمت مراجعة هذا التسليم مسبقاً" }, { status: 409 })
    }

    if (action === "reject") {
      // Send back to the student to re-submit; stage stays unlocked.
      await query(
        `UPDATE tajweed_path_progress
            SET status = 'rejected',
                reviewer_feedback = $1,
                reviewed_by = $2,
                reviewed_at = NOW()
          WHERE id = $3`,
        [feedback, session.sub, progressId],
      )
      await query(
        `UPDATE tajweed_path_enrollments SET last_activity_at = NOW() WHERE id = $1`,
        [pr.enrollment_id],
      )
      return NextResponse.json({ ok: true, status: "rejected" })
    }

    // Approve → mark completed, then unlock the next stage.
    await query(
      `UPDATE tajweed_path_progress
          SET status = 'completed',
              reviewer_feedback = $1,
              reviewed_by = $2,
              reviewed_at = NOW(),
              completed_at = NOW()
        WHERE id = $3`,
      [feedback, session.sub, progressId],
    )

    // Unlock next stage.
    const stageRows = (await query<any>(
      `SELECT id, position FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
      [pathId],
    )) as any[]
    const currentIdx = stageRows.findIndex(s => s.id === pr.stage_id)
    const nextStage = currentIdx >= 0 && currentIdx < stageRows.length - 1
      ? stageRows[currentIdx + 1] : null
    if (nextStage) {
      await query(
        `UPDATE tajweed_path_progress
            SET status = CASE WHEN status = 'locked' THEN 'unlocked' ELSE status END
          WHERE enrollment_id = $1 AND stage_id = $2`,
        [pr.enrollment_id, nextStage.id],
      )
    }

    // Recompute completed count.
    const completedRows = (await query<any>(
      `SELECT COUNT(*)::int AS n FROM tajweed_path_progress
        WHERE enrollment_id = $1 AND status = 'completed'`,
      [pr.enrollment_id],
    )) as any[]
    const stagesCompleted = completedRows[0]?.n || 0
    const isFinished = !nextStage && stagesCompleted >= stageRows.length

    if (isFinished) {
      await query(
        `UPDATE tajweed_path_enrollments
            SET status = 'completed', stages_completed = $1, last_activity_at = NOW(),
                completed_at = NOW(), current_stage_id = NULL
          WHERE id = $2`,
        [stagesCompleted, pr.enrollment_id],
      )
    } else {
      await query(
        `UPDATE tajweed_path_enrollments
            SET stages_completed = $1, last_activity_at = NOW(), current_stage_id = $2
          WHERE id = $3`,
        [stagesCompleted, nextStage?.id || null, pr.enrollment_id],
      )
    }

    return NextResponse.json({ ok: true, status: "completed", finished: isFinished })
  } catch (err) {
    console.error("[path submissions POST]", err)
    return NextResponse.json({ error: "حدث خطأ في حفظ المراجعة" }, { status: 500 })
  }
}
