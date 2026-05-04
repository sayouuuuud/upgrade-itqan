import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()

  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // All stats in parallel for speed.
    const [
      studentCount,
      teacherCount,
      courseCount,
      pointsData,
      pendingTeacherApps,
      enrollmentsToday,
      enrollmentsWeek,
      activeEnrollments,
      certificatesIssued,
      latestCourses,
      topStudents,
    ] = await Promise.all([
      query<{ count: string }>(`
        SELECT COUNT(DISTINCT u.id)::text as count
        FROM users u
        WHERE u.role = 'student' AND u.is_active = true AND u.has_academy_access = true
      `).catch(() => [{ count: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(DISTINCT u.id)::text as count
        FROM users u
        WHERE u.role = 'teacher' AND u.is_active = true
      `).catch(() => [{ count: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(*)::text as count FROM courses
        WHERE status = 'published' OR is_published = true
      `).catch(() => [{ count: '0' }]),

      query<{ total: string }>(`
        SELECT COALESCE(SUM(points), 0)::text as total FROM user_points
      `).catch(() => [{ total: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(*)::text as count FROM teacher_applications
        WHERE status = 'pending'
      `).catch(() => [{ count: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(*)::text as count FROM enrollments
        WHERE created_at::date = CURRENT_DATE
      `).catch(() => [{ count: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(*)::text as count FROM enrollments
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `).catch(() => [{ count: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(*)::text as count FROM enrollments
        WHERE status = 'active'
      `).catch(() => [{ count: '0' }]),

      query<{ count: string }>(`
        SELECT COUNT(*)::text as count FROM academy_certificates
      `).catch(() => [{ count: '0' }]),

      query<{
        id: string
        title: string
        teacher_name: string | null
        enrollments: string
        created_at: string
      }>(`
        SELECT
          c.id,
          c.title,
          u.name as teacher_name,
          COUNT(e.id)::text as enrollments,
          c.created_at
        FROM courses c
        LEFT JOIN users u ON u.id = c.teacher_id
        LEFT JOIN enrollments e ON e.course_id = c.id
        WHERE c.status = 'published' OR c.is_published = true
        GROUP BY c.id, c.title, u.name, c.created_at
        ORDER BY c.created_at DESC
        LIMIT 5
      `).catch(() => []),

      query<{
        id: string
        name: string
        avatar_url: string | null
        total_points: string
      }>(`
        SELECT
          u.id,
          u.name,
          u.avatar_url,
          COALESCE(SUM(up.points), 0)::text as total_points
        FROM users u
        LEFT JOIN user_points up ON up.user_id = u.id
        WHERE u.role = 'student' AND u.has_academy_access = true AND u.is_active = true
        GROUP BY u.id, u.name, u.avatar_url
        ORDER BY total_points DESC NULLS LAST
        LIMIT 5
      `).catch(() => []),
    ])

    return NextResponse.json({
      total_students: parseInt(studentCount[0]?.count || '0'),
      total_teachers: parseInt(teacherCount[0]?.count || '0'),
      total_courses: parseInt(courseCount[0]?.count || '0'),
      total_points_distributed: parseInt(pointsData[0]?.total || '0'),
      pending_teacher_apps: parseInt(pendingTeacherApps[0]?.count || '0'),
      enrollments_today: parseInt(enrollmentsToday[0]?.count || '0'),
      enrollments_week: parseInt(enrollmentsWeek[0]?.count || '0'),
      active_enrollments: parseInt(activeEnrollments[0]?.count || '0'),
      certificates_issued: parseInt(certificatesIssued[0]?.count || '0'),
      latest_courses: latestCourses.map((c) => ({
        ...c,
        enrollments: parseInt(c.enrollments || '0'),
      })),
      top_students: topStudents.map((s) => ({
        ...s,
        total_points: parseInt(s.total_points || '0'),
      })),
    })
  } catch (error) {
    console.error('Error fetching academy stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
