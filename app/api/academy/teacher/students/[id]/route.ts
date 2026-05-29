import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id: studentId } = await params

  try {
    const [studentRows, enrollmentRows, badgeRows, specRows] = await Promise.all([
      query(`
        SELECT DISTINCT
          u.id, u.name, u.email, u.avatar_url, u.gender, u.bio,
          u.city, u.created_at, u.qualification, u.memorized_parts,
          (SELECT COUNT(e.id)::int FROM enrollments e WHERE e.student_id = u.id) as courses_count,
          (SELECT COUNT(ts.id)::int FROM task_submissions ts WHERE ts.student_id = u.id AND ts.status='submitted') as tasks_completed,
          (SELECT COUNT(ts.id)::int FROM task_submissions ts WHERE ts.student_id = u.id) as tasks_total,
          (SELECT COALESCE(SUM(up.points),0)::int FROM user_points up WHERE up.user_id = u.id) as total_points,
          (SELECT COALESCE(AVG(e.progress_percentage),0)::numeric(5,2) FROM enrollments e WHERE e.student_id = u.id) as progress_percentage,
          (SELECT MAX(e.enrolled_at) FROM enrollments e WHERE e.student_id = u.id) as last_activity
        FROM users u
        WHERE u.id = $1
          AND (u.created_by = $2 OR EXISTS (
            SELECT 1 FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.student_id = u.id AND c.teacher_id = $2
          ) OR $3 = 'academy_admin')
      `, [studentId, session.sub, session.role]),
      
      query(`
        SELECT c.id, c.title, e.status, e.enrolled_at, e.progress_percentage::numeric(5,2) as progress_percentage
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = $1 AND c.teacher_id = $2
        ORDER BY e.enrolled_at DESC
      `, [studentId, session.sub]),
      
      query(`
        SELECT bd.id, bd.name, bd.icon, bd.icon_url, b.awarded_at
        FROM badges b
        JOIN badge_definitions bd ON b.badge_id = bd.id
        WHERE b.user_id = $1
        ORDER BY b.awarded_at DESC
        LIMIT 12
      `, [studentId]),
      
      query(`
        SELECT specialization FROM user_specializations WHERE user_id = $1
      `, [studentId]),
    ])

    if (!studentRows.length) {
      return NextResponse.json({ error: 'الطالب غير موجود أو ليس لديك صلاحية' }, { status: 404 })
    }

    return NextResponse.json({
      student: studentRows[0],
      enrollments: enrollmentRows,
      badges: badgeRows,
      specializations: specRows.map((r: any) => r.specialization),
    })
  } catch (error) {
    console.error('Error fetching student profile for teacher:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
