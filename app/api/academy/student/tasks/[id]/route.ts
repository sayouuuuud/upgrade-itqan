import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: taskId } = await params

    const tasks = await query<any>(
      `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.type,
        t.due_date,
        t.max_score,
        t.status,
        t.submission_instructions,
        t.created_at,
        t.course_id,
        c.title AS course_title,
        c.thumbnail_url AS course_thumbnail,
        u.name AS teacher_name
      FROM tasks t
      LEFT JOIN courses c ON c.id = t.course_id
      LEFT JOIN users u ON u.id = COALESCE(t.assigned_by, c.teacher_id)
      WHERE t.id = $1
      LIMIT 1
      `,
      [taskId],
    )

    if (tasks.length === 0) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 })
    }

    const task = tasks[0]

    // Pull the student's previous submission (if any) so they can resubmit/update
    const submissions = await query<any>(
      `
      SELECT 
        id, content, file_url, file_name, file_type, file_size,
        audio_url, video_url, submission_type, status,
        score, feedback, attempts, submitted_at, graded_at, updated_at
      FROM task_submissions
      WHERE task_id = $1 AND student_id = $2
      ORDER BY submitted_at DESC
      LIMIT 1
      `,
      [taskId, session.sub],
    )

    return NextResponse.json({
      task,
      submission: submissions[0] || null,
    })
  } catch (error) {
    console.error("[API] Error fetching student task:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/academy/student/tasks/:id
 *   { action: 'mark_done' | 'undo_done' }
 *
 * Lets the student self-mark a task as completed without going through the
 * full submission flow (used for simple to-do style tasks).  Internally we
 * upsert a row into task_submissions with status='submitted' so the
 * existing list / grading flow continues to work.  The teacher gets a
 * notification on first mark-done so they can grade it.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: taskId } = await params
    const body = await req.json().catch(() => ({}))
    const action = body.action === "undo_done" ? "undo_done" : "mark_done"

    // 1. Make sure the task exists and the student is allowed to see it.
    const tasks = await query<any>(
      `SELECT t.id, t.title, t.assigned_by, t.assigned_to, t.course_id,
              c.teacher_id, c.title AS course_title
         FROM tasks t
         LEFT JOIN courses c ON c.id = t.course_id
         WHERE t.id = $1
         LIMIT 1`,
      [taskId],
    )
    if (tasks.length === 0) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 })
    }
    const task = tasks[0]

    const visibleRows = await query<{ ok: boolean }>(
      `SELECT (
         $1::uuid = $2::uuid
         OR ($1::uuid IS NULL AND EXISTS (
           SELECT 1 FROM enrollments e
           WHERE e.course_id = $3 AND e.student_id = $2
             AND e.status IN ('active','completed')
         ))
       ) AS ok`,
      [task.assigned_to, session.sub, task.course_id],
    )
    if (!visibleRows[0]?.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "undo_done") {
      // Roll the submission back to a 'returned' state so the UI shows it as
      // pending again. We don't delete the row — that would lose history.
      await query(
        `UPDATE task_submissions
            SET status = 'returned', updated_at = NOW()
          WHERE task_id = $1 AND student_id = $2
            AND status = 'submitted'`,
        [taskId, session.sub],
      )
      return NextResponse.json({ success: true, action: "undo_done" })
    }

    // mark_done — upsert the submission as 'submitted'
    const existing = await query<{ id: string; status: string; attempts: number }>(
      `SELECT id, status, attempts FROM task_submissions
        WHERE task_id = $1 AND student_id = $2
        ORDER BY submitted_at DESC NULLS LAST, id DESC
        LIMIT 1`,
      [taskId, session.sub],
    )

    if (existing.length === 0) {
      await query(
        `INSERT INTO task_submissions (
           task_id, student_id, submission_type, status, content,
           submitted_at, attempts, created_at, updated_at
         ) VALUES ($1, $2, 'text', 'submitted', '✓ تم الإنجاز', NOW(), 1, NOW(), NOW())`,
        [taskId, session.sub],
      )
    } else if (existing[0].status !== "graded") {
      await query(
        `UPDATE task_submissions
            SET status = 'submitted',
                submitted_at = COALESCE(submitted_at, NOW()),
                attempts = COALESCE(attempts, 0) + 1,
                updated_at = NOW()
          WHERE id = $1`,
        [existing[0].id],
      )
    }

    // Notify the teacher (deduped per task per student)
    const teacherId = task.assigned_by || task.teacher_id
    if (teacherId && teacherId !== session.sub) {
      const studentRows = await query<{ name: string }>(
        `SELECT name FROM users WHERE id = $1`,
        [session.sub],
      )
      const studentName = studentRows[0]?.name || "الطالب"

      await createNotification({
        userId: teacherId,
        type: "task_marked_done",
        title: "تم إنجاز مهمة",
        message: `${studentName} أنهى المهمة "${task.title}".`,
        category: "task",
        link: `/academy/teacher/tasks/${taskId}/grade`,
        dedupKey: `task:done:${taskId}:${session.sub}`,
      })
    }

    return NextResponse.json({ success: true, action: "mark_done" })
  } catch (err: any) {
    console.error("[API] Error in PATCH student task:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}
