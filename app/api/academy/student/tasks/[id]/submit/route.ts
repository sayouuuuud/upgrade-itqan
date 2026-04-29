import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const ALLOWED_TYPES = ["text", "file", "audio", "video", "image", "mixed"] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: taskId } = await params
    const body = await req.json()

    const {
      content,
      file_url,
      file_name,
      file_type,
      file_size,
      audio_url,
      video_url,
      submission_type,
    } = body as {
      content?: string
      file_url?: string
      file_name?: string
      file_type?: string
      file_size?: number
      audio_url?: string
      video_url?: string
      submission_type?: string
    }

    const hasContent = (content || "").trim().length > 0
    const hasAttachment = !!(file_url || audio_url || video_url)

    if (!hasContent && !hasAttachment) {
      return NextResponse.json(
        { error: "يجب كتابة محتوى أو إرفاق ملف" },
        { status: 400 },
      )
    }

    // Make sure task exists & student is enrolled
    const tasks = await query<any>(
      `
      SELECT t.id, t.course_id, t.due_date, t.status
      FROM tasks t
      WHERE t.id = $1
      LIMIT 1
      `,
      [taskId],
    )
    if (tasks.length === 0) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 })
    }
    const task = tasks[0]

    if (task.course_id) {
      const enroll = await query<any>(
        `SELECT id FROM enrollments 
         WHERE course_id = $1 AND student_id = $2 
         AND lower(status) IN ('active','completed')
         LIMIT 1`,
        [task.course_id, session.sub],
      )
      if (enroll.length === 0) {
        return NextResponse.json(
          { error: "غير مشترك في هذه الدورة" },
          { status: 403 },
        )
      }
    }

    // Determine submission type. Accept what client sent if valid, else infer.
    let subType: string = submission_type || "text"
    if (!ALLOWED_TYPES.includes(subType as any)) {
      if (audio_url) subType = "audio"
      else if (video_url) subType = "video"
      else if (file_url) subType = "file"
      else subType = "text"
    }

    // Late detection (informational only — still allow submission)
    const isLate = task.due_date && new Date() > new Date(task.due_date)
    const status = isLate ? "late" : "submitted"

    const existing = await query<any>(
      `SELECT id, attempts FROM task_submissions WHERE task_id = $1 AND student_id = $2 LIMIT 1`,
      [taskId, session.sub],
    )

    let result
    if (existing.length > 0) {
      const newAttempts = (existing[0].attempts || 1) + 1
      result = await query<any>(
        `
        UPDATE task_submissions SET
          content = $1,
          file_url = $2,
          file_name = $3,
          file_type = $4,
          file_size = $5,
          audio_url = $6,
          video_url = $7,
          submission_type = $8,
          status = $9,
          submitted_at = NOW(),
          updated_at = NOW(),
          attempts = $10,
          score = NULL,
          feedback = NULL,
          graded_at = NULL
        WHERE id = $11
        RETURNING *
        `,
        [
          content || null,
          file_url || null,
          file_name || null,
          file_type || null,
          file_size || null,
          audio_url || null,
          video_url || null,
          subType,
          status,
          newAttempts,
          existing[0].id,
        ],
      )
    } else {
      result = await query<any>(
        `
        INSERT INTO task_submissions (
          task_id, student_id, content, file_url, file_name, file_type,
          file_size, audio_url, video_url, submission_type, status,
          submitted_at, attempts
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 1)
        RETURNING *
        `,
        [
          taskId,
          session.sub,
          content || null,
          file_url || null,
          file_name || null,
          file_type || null,
          file_size || null,
          audio_url || null,
          video_url || null,
          subType,
          status,
        ],
      )
    }

    return NextResponse.json(
      { success: true, data: result[0], late: isLate },
      { status: existing.length > 0 ? 200 : 201 },
    )
  } catch (error: any) {
    console.error("[API] Error submitting task:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    )
  }
}
