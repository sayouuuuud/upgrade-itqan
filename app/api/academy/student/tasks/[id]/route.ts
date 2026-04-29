import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

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
        u.full_name AS teacher_name
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
