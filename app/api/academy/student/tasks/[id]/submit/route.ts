import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { awardTaskPoints } from "@/lib/academy/gamification"

const ALLOWED_TYPES = ["text", "file", "audio", "video", "image", "mixed", "quiz"] as const

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
      quiz_answers,
    } = body as {
      content?: string
      file_url?: string
      file_name?: string
      file_type?: string
      file_size?: number
      audio_url?: string
      video_url?: string
      submission_type?: string
      quiz_answers?: { questionId: string; selected?: number; text?: string }[]
    }

    // Make sure task exists & student is enrolled
    const tasks = await query<any>(
      `
      SELECT t.id, t.course_id, t.due_date, t.status, t.type, t.title,
             t.max_score, t.quiz_questions, t.assigned_by,
             COALESCE(t.points_reward, 15) AS points_reward,
             c.teacher_id
      FROM tasks t
      LEFT JOIN courses c ON c.id = t.course_id
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

    // ============ QUIZ SUBMISSION ============
    if (task.type === "quiz") {
      return await handleQuizSubmission(session.sub, task, quiz_answers || [])
    }

    const hasContent = (content || "").trim().length > 0
    const hasAttachment = !!(file_url || audio_url || video_url)

    if (!hasContent && !hasAttachment) {
      return NextResponse.json(
        { error: "يجب كتابة محتوى أو إرفاق ملف" },
        { status: 400 },
      )
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

/**
 * Handle a quiz submission:
 *  - Auto-grade MCQ questions against the stored correct answers.
 *  - Essay questions are left for the teacher to grade (auto_score = MCQ only).
 *  - If the quiz has NO essay questions, mark it graded immediately, surface
 *    the score to the student, and award task points (once).
 *  - Otherwise keep it 'submitted' so the teacher can finalise the score.
 */
async function handleQuizSubmission(
  studentId: string,
  task: any,
  answers: { questionId: string; selected?: number; text?: string }[],
) {
  let questions: any[] = []
  try {
    questions =
      typeof task.quiz_questions === "string"
        ? JSON.parse(task.quiz_questions)
        : task.quiz_questions || []
  } catch {
    questions = []
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json(
      { error: "هذا الاختبار لا يحتوي على أسئلة" },
      { status: 400 },
    )
  }

  // Block resubmission once a quiz has been graded.
  const prev = await query<any>(
    `SELECT id, status FROM task_submissions WHERE task_id = $1 AND student_id = $2 LIMIT 1`,
    [task.id, studentId],
  )
  if (prev[0]?.status === "graded") {
    return NextResponse.json(
      { error: "تم تصحيح هذا الاختبار بالفعل ولا يمكن إعادة حله" },
      { status: 400 },
    )
  }

  const answerMap = new Map(answers.map(a => [a.questionId, a]))

  let autoScore = 0
  let hasEssay = false
  const gradedAnswers = questions.map(q => {
    const a = answerMap.get(q.id)
    if (q.type === "mcq") {
      const selected = typeof a?.selected === "number" ? a.selected : null
      const isCorrect = selected !== null && selected === q.correct
      const earned = isCorrect ? Number(q.points) || 0 : 0
      autoScore += earned
      return {
        questionId: q.id,
        type: "mcq",
        selected,
        correct: q.correct,
        isCorrect,
        score: earned,
      }
    }
    hasEssay = true
    return {
      questionId: q.id,
      type: "essay",
      text: (a?.text || "").trim() || null,
      score: null,
    }
  })

  const status = hasEssay ? "submitted" : "graded"
  const finalScore = hasEssay ? null : autoScore

  const existing = await query<any>(
    `SELECT id, attempts FROM task_submissions WHERE task_id = $1 AND student_id = $2 LIMIT 1`,
    [task.id, studentId],
  )

  let row
  if (existing.length > 0) {
    const newAttempts = (existing[0].attempts || 1) + 1
    row = await query<any>(
      `
      UPDATE task_submissions SET
        submission_type = 'quiz',
        quiz_answers = $1,
        auto_score = $2,
        score = $3,
        status = $4,
        content = NULL,
        feedback = NULL,
        submitted_at = NOW(),
        graded_at = CASE WHEN $4 = 'graded' THEN NOW() ELSE NULL END,
        updated_at = NOW(),
        attempts = $5
      WHERE id = $6
      RETURNING *
      `,
      [JSON.stringify(gradedAnswers), autoScore, finalScore, status, newAttempts, existing[0].id],
    )
  } else {
    row = await query<any>(
      `
      INSERT INTO task_submissions (
        task_id, student_id, submission_type, quiz_answers, auto_score,
        score, status, submitted_at, graded_at, attempts
      )
      VALUES ($1, $2, 'quiz', $3, $4, $5, $6, NOW(),
              CASE WHEN $6 = 'graded' THEN NOW() ELSE NULL END, 1)
      RETURNING *
      `,
      [task.id, studentId, JSON.stringify(gradedAnswers), autoScore, finalScore, status],
    )
  }

  // Award points + notify when the quiz is fully auto-graded (MCQ only).
  if (status === "graded") {
    try {
      const earned = Number(task.points_reward) || 15
      if (earned > 0) {
        await awardTaskPoints(studentId, earned, task.id, task.title)
      }
    } catch (e) {
      console.error("[Quiz] award points failed:", e)
    }
  }

  // Notify the teacher that a quiz was submitted.
  const teacherId = task.assigned_by || task.teacher_id
  if (teacherId && teacherId !== studentId) {
    try {
      const studentRows = await query<{ name: string }>(
        `SELECT name FROM users WHERE id = $1`,
        [studentId],
      )
      const studentName = studentRows[0]?.name || "الطالب"
      await createNotification({
        userId: teacherId,
        type: "task_marked_done",
        title: hasEssay ? "تم حل اختبار (يحتاج تصحيح)" : "تم حل اختبار",
        message: hasEssay
          ? `${studentName} حلّ اختبار «${task.title}» ويحتاج تصحيح الأسئلة المقالية.`
          : `${studentName} حلّ اختبار «${task.title}» وحصل على ${autoScore} من ${task.max_score}.`,
        category: "task",
        link: `/academy/teacher/tasks/${task.id}/grade`,
        dedupKey: `quiz:submit:${task.id}:${studentId}`,
      }).catch(() => {})
    } catch (e) {
      console.error("[Quiz] notify teacher failed:", e)
    }
  }

  return NextResponse.json({
    success: true,
    data: row[0],
    quiz: {
      auto_score: autoScore,
      max_score: task.max_score,
      status,
      needs_grading: hasEssay,
    },
  })
}
