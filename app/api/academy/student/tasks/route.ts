import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

/**
 * GET /api/academy/student/tasks
 *
 * Returns the list of tasks visible to the authenticated student.
 *
 * A task is visible if:
 *   - It is directly assigned to the student (`tasks.assigned_to = student_id`), OR
 *   - It is a course-wide task (`tasks.assigned_to IS NULL`) on a course the
 *     student is actively enrolled in.
 *
 * Each task is returned with the student's latest submission joined in so the
 * UI can compute the proper status (pending / submitted / graded / late) and
 * display the grade & feedback when available.
 *
 * Optional query params:
 *   - `pending=true` → only return tasks the student still needs to act on
 *                      (no submission, or submission status = 'returned').
 *   - `limit=N`      → cap the number of rows returned (used by the dashboard).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const pendingOnly = searchParams.get("pending") === "true"
    const limitRaw = Number.parseInt(searchParams.get("limit") || "0", 10)
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 100 ? limitRaw : null

    const rows = await query<any>(
      `
      WITH visible_tasks AS (
        SELECT t.*
        FROM tasks t
        WHERE
          t.assigned_to = $1
          OR (
            t.assigned_to IS NULL
            AND EXISTS (
              SELECT 1
              FROM enrollments e
              WHERE e.course_id = t.course_id
                AND e.student_id = $1
                AND e.status IN ('active', 'completed')
            )
          )
      ),
      latest_submissions AS (
        SELECT DISTINCT ON (s.task_id)
          s.task_id,
          s.id            AS submission_id,
          s.status        AS submission_status,
          s.score,
          s.feedback,
          s.submitted_at,
          s.graded_at
        FROM task_submissions s
        WHERE s.student_id = $1
        ORDER BY s.task_id, s.submitted_at DESC NULLS LAST, s.id DESC
      )
      SELECT
        vt.id,
        vt.title,
        vt.description,
        vt.course_id,
        c.title              AS course_title,
        vt.type,
        vt.due_date,
        COALESCE(vt.max_score, vt.points_reward, 0) AS points_value,
        vt.submission_instructions,
        ls.submission_id,
        ls.submission_status,
        ls.score             AS grade,
        ls.feedback,
        ls.submitted_at,
        ls.graded_at,
        CASE
          WHEN ls.submission_status = 'graded'    THEN 'graded'
          WHEN ls.submission_status = 'submitted' THEN 'submitted'
          WHEN ls.submission_status = 'returned'  THEN 'pending'
          WHEN vt.due_date IS NOT NULL AND vt.due_date < NOW() THEN 'late'
          ELSE 'pending'
        END AS status
      FROM visible_tasks vt
      LEFT JOIN courses c ON c.id = vt.course_id
      LEFT JOIN latest_submissions ls ON ls.task_id = vt.id
      WHERE vt.status IS DISTINCT FROM 'draft'
      ORDER BY
        CASE WHEN vt.due_date IS NULL THEN 1 ELSE 0 END,
        vt.due_date ASC,
        vt.created_at DESC
      `,
      [session.sub],
    )

    let data = rows
    if (pendingOnly) {
      data = data.filter((r: any) => r.status === "pending" || r.status === "late")
    }
    if (limit) {
      data = data.slice(0, limit)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[API] Error listing student tasks:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
