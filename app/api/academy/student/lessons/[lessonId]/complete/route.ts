import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { lessonId } = await params

    // 1) Find the lesson's course
    const lessons = await query<{ course_id: string }>(
      `SELECT course_id FROM lessons WHERE id = $1`,
      [lessonId],
    )
    if (lessons.length === 0) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 })
    }
    const courseId = lessons[0].course_id

    // 2) Find the active enrollment for this student in this course
    //    Teachers / admins can view but cannot mark a student's lesson as complete here.
    if (!["student", "teacher", "admin", "academy_admin"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const enrollments = await query<{ id: string; status: string }>(
      `SELECT id, status FROM enrollments WHERE course_id = $1 AND student_id = $2`,
      [courseId, session.sub],
    )
    if (enrollments.length === 0 || enrollments[0].status !== "active") {
      return NextResponse.json(
        { error: "غير مسجل في هذه الدورة" },
        { status: 403 },
      )
    }
    const enrollmentId = enrollments[0].id

    // 3) Upsert into lesson_progress (uses unique constraint on (enrollment_id, lesson_id))
    await query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, is_completed, is_in_progress, completed_at, updated_at)
       VALUES ($1, $2, TRUE, FALSE, NOW(), NOW())
       ON CONFLICT (enrollment_id, lesson_id)
       DO UPDATE SET
         is_completed = TRUE,
         is_in_progress = FALSE,
         completed_at = COALESCE(lesson_progress.completed_at, NOW()),
         updated_at = NOW()`,
      [enrollmentId, lessonId],
    )

    // 4) Update enrollment progress percentage based on completed lessons
    const progressResult = await query<{ pct: number }>(
      `UPDATE enrollments e
       SET progress_percentage = sub.pct,
           last_accessed_at = NOW(),
           updated_at = NOW(),
           completed_at = CASE WHEN sub.pct >= 100 THEN COALESCE(e.completed_at, NOW()) ELSE e.completed_at END
       FROM (
         SELECT
           CASE WHEN COUNT(l.id) = 0 THEN 0
                ELSE ROUND(
                  COUNT(lp.id) FILTER (WHERE lp.is_completed = TRUE)::numeric
                  / COUNT(l.id) * 100
                )
           END AS pct
         FROM lessons l
         LEFT JOIN lesson_progress lp
           ON lp.lesson_id = l.id AND lp.enrollment_id = $1
         WHERE l.course_id = $2
       ) sub
       WHERE e.id = $1
       RETURNING sub.pct`,
      [enrollmentId, courseId],
    )

    // 5) Auto-issue certificate when course is 100% complete
    const newProgress = progressResult[0]?.pct || 0
    if (newProgress >= 100) {
      // Check if certificate already exists
      const existingCert = await query<{ id: string }>(
        `SELECT id FROM academy_certificates WHERE student_id = $1 AND course_id = $2`,
        [session.sub, courseId]
      )

      if (existingCert.length === 0) {
        // Issue new certificate
        await query(
          `INSERT INTO academy_certificates (student_id, course_id, issued_at, certificate_number)
           VALUES ($1, $2, NOW(), $3)
           ON CONFLICT DO NOTHING`,
          [session.sub, courseId, `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`]
        )

        // Create notification for the student
        await query(
          `INSERT INTO notifications (user_id, title, message, type, link, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            session.sub,
            'تهانينا! حصلت على شهادة جديدة',
            'لقد أكملت الدورة بنجاح وحصلت على شهادة إتمام. يمكنك تنزيلها من صفحة الشهادات.',
            'certificate',
            '/academy/student/certificates'
          ]
        ).catch(() => {}) // Ignore if notifications table doesn't exist
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "تم تحديد الدرس كمكتمل",
      courseCompleted: newProgress >= 100,
      progress: newProgress
    })
  } catch (error) {
    console.error("[API] Error completing lesson:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديد الدرس كمكتمل" },
      { status: 500 },
    )
  }
}
