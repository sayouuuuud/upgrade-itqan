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
    const [studentRows, enrollmentRows, badgeRows, specRows, submissionRows] = await Promise.all([
      query(`
        SELECT DISTINCT
          u.id, u.name, u.email, u.avatar_url, u.gender, u.bio,
          u.city, u.created_at, u.qualification, u.memorized_parts,
          (SELECT COUNT(e.id)::int FROM enrollments e WHERE e.student_id = u.id) as courses_count,
          (SELECT COUNT(DISTINCT ts.task_id)::int FROM task_submissions ts
             WHERE ts.student_id = u.id
             AND ts.status IN ('submitted','graded','late')) as tasks_completed,
          (SELECT COUNT(DISTINCT t.id)::int FROM tasks t
             JOIN enrollments e ON e.course_id = t.course_id
             WHERE e.student_id = u.id) as tasks_total,
          (SELECT COALESCE(SUM(up.total_points),0)::int FROM user_points up WHERE up.user_id = u.id) as total_points,
          (SELECT COALESCE(AVG(e.progress_percentage),0)::numeric(5,2) FROM enrollments e WHERE e.student_id = u.id) as progress_percentage,
          (SELECT MAX(e.enrolled_at) FROM enrollments e WHERE e.student_id = u.id) as last_activity
        FROM users u
        WHERE u.id = $1
          AND (
            $3 = 'academy_admin'
            OR u.created_by = $2
            OR EXISTS (
              SELECT 1 FROM enrollments e
              JOIN courses c ON e.course_id = c.id
              WHERE e.student_id = u.id AND c.teacher_id = $2
            )
          )
      `, [studentId, session.sub, session.role]),
      
      query(`
        SELECT c.id, c.title, c.thumbnail_url, e.status, e.enrolled_at, e.progress_percentage::numeric(5,2) as progress_percentage
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = $1
          AND ($3 = 'academy_admin' OR c.teacher_id = $2)
        ORDER BY e.enrolled_at DESC
      `, [studentId, session.sub, session.role]),
      
      query(`
        SELECT b.id,
               COALESCE(b.badge_name, bd.badge_name) as name,
               COALESCE(bd.badge_icon, '🏆') as icon,
               bd.badge_image_url as icon_url,
               b.awarded_at
        FROM badges b
        LEFT JOIN badge_definitions bd ON bd.badge_key = b.badge_key
        WHERE b.user_id = $1
        ORDER BY b.awarded_at DESC
        LIMIT 12
      `, [studentId]),
      
      query(`
        SELECT specialization FROM user_specializations WHERE user_id = $1
      `, [studentId]),

      // Recent task submissions (only for tasks in this teacher's courses,
      // unless the requester is an academy admin).
      query(`
        SELECT
          ts.id,
          ts.task_id,
          ts.status,
          ts.score,
          ts.auto_score,
          ts.submission_type,
          ts.submitted_at,
          ts.graded_at,
          t.title AS task_title,
          t.type AS task_type,
          t.max_score,
          c.title AS course_title
        FROM task_submissions ts
        JOIN tasks t ON t.id = ts.task_id
        LEFT JOIN courses c ON c.id = t.course_id
        WHERE ts.student_id = $1
          AND ($3 = 'academy_admin' OR c.teacher_id = $2)
        ORDER BY ts.submitted_at DESC NULLS LAST
        LIMIT 20
      `, [studentId, session.sub, session.role]),
    ])

    if (!studentRows.length) {
      return NextResponse.json({ error: 'الطالب غير موجود أو ليس لديك صلاحية' }, { status: 404 })
    }

    return NextResponse.json({
      student: studentRows[0],
      enrollments: enrollmentRows,
      badges: badgeRows,
      specializations: specRows.map((r: any) => r.specialization),
      submissions: submissionRows,
    })
  } catch (error) {
    console.error('Error fetching student profile for teacher:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
