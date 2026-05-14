import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: pathId } = await params

  try {
    const progress = await queryOne<{ completed_courses: string[]; current_course_id: string | null }>(
      `SELECT completed_courses, current_course_id FROM student_path_progress WHERE student_id = $1 AND path_id = $2`,
      [session.sub, pathId]
    )

    const completedSet = new Set(progress?.completed_courses || [])
    const currentCourseId = progress?.current_course_id || null

    const rows = await query(`
      SELECT
        lpc.id,
        lpc.course_id,
        c.title as course_title,
        c.description as course_description,
        lpc.order_index,
        lpc.is_required
      FROM learning_path_courses lpc
      JOIN courses c ON c.id = lpc.course_id
      WHERE lpc.path_id = $1
      ORDER BY lpc.order_index ASC
    `, [pathId])

    let prevCompleted = true
    const data = rows.map((r: Record<string, unknown>) => {
      const courseId = r.course_id as string
      const isCompleted = completedSet.has(courseId)
      const isCurrent = courseId === currentCourseId
      const isLocked = !isCompleted && !isCurrent && !prevCompleted
      if (isCompleted) prevCompleted = true
      else prevCompleted = false

      return {
        id: r.id,
        course_id: courseId,
        course_title: r.course_title,
        course_description: r.course_description,
        order_index: r.order_index,
        is_required: r.is_required,
        is_completed: isCompleted,
        is_current: isCurrent,
        is_locked: isLocked,
        progress_percent: isCompleted ? 100 : isCurrent ? 50 : 0,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API] Error fetching path courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
