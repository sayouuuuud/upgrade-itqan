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

    // 3. check completion (if lesson_progress exists, try to fetch, if errors return false)
    let is_completed = false
    try {
      const compQ = `SELECT completed_at FROM lesson_progress WHERE lesson_id = $1 AND student_id = $2`
      const comps = await query(compQ, [lessonId, session.sub])
      if (comps.length > 0) is_completed = true
    } catch(e) {}

    return NextResponse.json({ lesson, is_completed })
  } catch (error) {
    console.error('[API] Error fetching lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
