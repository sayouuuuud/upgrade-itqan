import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const lessonId = (await params).lessonId;

    // 1. Fetch lesson
    const lessonQuery = `
      SELECT l.*, c.title as course_title, c.id as course_id
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = $1
    `
    const lessons = await query<any>(lessonQuery, [lessonId])
    if (lessons.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }
    const lesson = lessons[0]

    // 2. Check enrollment unless admin/teacher
    if (session.role !== 'admin' && session.role !== 'teacher' && session.role !== 'academy_admin') {
      const authQuery = `SELECT status FROM enrollments WHERE course_id = $1 AND student_id = $2`
      const enrs = await query<any>(authQuery, [lesson.course_id, session.sub])
      if (enrs.length === 0 || enrs[0].status !== 'active') {
        return NextResponse.json({ error: 'غير مسجل في هذه الدورة' }, { status: 403 })
      }
    }

    // 3. check completion
    let is_completed = false
    try {
      const compQ = `
        SELECT lp.completed_at 
        FROM lesson_progress lp
        JOIN enrollments e ON lp.enrollment_id = e.id
        WHERE lp.lesson_id = $1 AND e.student_id = $2 AND lp.is_completed = TRUE
      `
      const comps = await query(compQ, [lessonId, session.sub])
      if (comps.length > 0) is_completed = true
    } catch (e) { }

    // 4. Fetch attachments
    const attachments = await query(`SELECT id, file_url, file_type, file_name FROM lesson_attachments WHERE lesson_id = $1`, [lessonId])

    return NextResponse.json({
      lesson: {
        ...lesson,
        attachments: attachments || []
      },
      is_completed
    })
  } catch (error) {
    console.error('[API] Error fetching lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
