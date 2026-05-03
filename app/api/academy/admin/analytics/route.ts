import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Total students with academy access
    const studentsResult = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM users WHERE role = 'student' AND has_academy_access = true`
    ).catch(() => [{ count: 0 }])
    const totalStudents = studentsResult[0]?.count || 0

    // Active courses
    const coursesResult = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM courses WHERE status = 'published' OR is_published = true`
    ).catch(() => [{ count: 0 }])
    const activeCourses = coursesResult[0]?.count || 0

    // Average completion rate
    const completionResult = await query<{ avg: number }>(
      `SELECT COALESCE(AVG(progress_percentage), 0)::int as avg FROM enrollments WHERE status = 'active'`
    ).catch(() => [{ avg: 0 }])
    const completionRate = completionResult[0]?.avg || 0

    // Total teachers
    const teachersResult = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM users WHERE role = 'teacher'`
    ).catch(() => [{ count: 0 }])
    const totalTeachers = teachersResult[0]?.count || 0

    // Enrollments per month (last 6 months)
    const enrollmentTrend = await query<{ month: string; count: number }>(
      `SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*)::int as count
       FROM enrollments
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month ASC`
    ).catch(() => [])

    // Students by gender
    const genderDistribution = await query<{ gender: string; count: number }>(
      `SELECT 
        COALESCE(gender, 'unknown') as gender,
        COUNT(*)::int as count
       FROM users
       WHERE role = 'student' AND has_academy_access = true
       GROUP BY gender`
    ).catch(() => [])

    // Top courses by enrollment
    const topCourses = await query<{ title: string; enrollments: number }>(
      `SELECT 
        c.title,
        COUNT(e.id)::int as enrollments
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.status = 'published' OR c.is_published = true
       GROUP BY c.id, c.title
       ORDER BY enrollments DESC
       LIMIT 5`
    ).catch(() => [])

    // Recent activity
    const recentEnrollments = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM enrollments WHERE created_at >= NOW() - INTERVAL '7 days'`
    ).catch(() => [{ count: 0 }])
    const weeklyEnrollments = recentEnrollments[0]?.count || 0

    // Certificates issued
    const certificatesResult = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM academy_certificates`
    ).catch(() => [{ count: 0 }])
    const totalCertificates = certificatesResult[0]?.count || 0

    return NextResponse.json({
      stats: {
        totalStudents,
        activeCourses,
        completionRate,
        totalTeachers,
        weeklyEnrollments,
        totalCertificates
      },
      enrollmentTrend,
      genderDistribution,
      topCourses
    })
  } catch (error) {
    console.error('[API] Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
