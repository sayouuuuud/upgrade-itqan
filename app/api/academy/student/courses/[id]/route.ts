import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const p = await params;
    const courseId = p.id;

    // 1. Course Details
    const courseQuery = `
      SELECT c.*, 
        COALESCE(u.name, 'غير محدد') as teacher_name,
        COALESCE(cat.name, '') as category_name,
        COUNT(DISTINCT e.id)::int as total_enrolled
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      WHERE c.id = $1
      GROUP BY c.id, u.name, cat.name
    `
    const courseRows = await query<any>(courseQuery, [courseId])
    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    const course = courseRows[0]

    // 2. Lessons
    const lessonsQuery = `
      SELECT l.id, l.title, l.description, l.order_index, l.duration_minutes,
             (SELECT COUNT(*)>0 FROM lesson_progress lp 
              JOIN enrollments e ON lp.enrollment_id = e.id
              WHERE lp.lesson_id = l.id AND e.student_id = $2) as is_completed
      FROM lessons l 
      WHERE l.course_id = $1 
      ORDER BY l.order_index ASC
    `
    const lessons = await query<any>(lessonsQuery, [courseId, session.sub])

    // 3. Enrollment Status
    const enrollmentQuery = `
      SELECT status FROM enrollments WHERE course_id = $1 AND student_id = $2
    `
    const enrollmentRows = await query<any>(enrollmentQuery, [courseId, session.sub])
    let enrollment_status = 'none'
    if (enrollmentRows.length > 0) {
      enrollment_status = enrollmentRows[0].status // 'pending' or 'active' or 'rejected'
    }

    return NextResponse.json({
      course,
      lessons,
      enrollment_status
    })
  } catch (error) {
    console.error('[API] Error fetching course detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
