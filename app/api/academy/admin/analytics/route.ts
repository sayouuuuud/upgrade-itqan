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

    const activeStudentsResult = await query<{ count: number }>(
      `SELECT COUNT(DISTINCT user_id)::int AS count
       FROM points_log
       WHERE created_at >= NOW() - INTERVAL '1 day'`
    ).catch(() => [{ count: 0 }])
    const dailyActivityRate = totalStudents > 0
      ? Math.round(((activeStudentsResult[0]?.count || 0) / totalStudents) * 100)
      : 0

    const studentsByCountry = await query<{ country: string; country_code: string | null; count: number; active_count: number }>(
      `SELECT
        COALESCE(NULLIF(country, ''), 'غير محدد') AS country,
        NULLIF(country_code, '') AS country_code,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days')::int AS active_count
       FROM users
       WHERE role = 'student' AND has_academy_access = true
       GROUP BY COALESCE(NULLIF(country, ''), 'غير محدد'), NULLIF(country_code, '')
       ORDER BY count DESC, country ASC`
    ).catch(() => [])

    const geoHeatmap = await query<{ country: string; country_code: string | null; region: string; city: string; count: number }>(
      `SELECT
        COALESCE(NULLIF(country, ''), 'غير محدد') AS country,
        NULLIF(country_code, '') AS country_code,
        COALESCE(NULLIF(region, ''), 'غير محدد') AS region,
        COALESCE(NULLIF(city, ''), 'غير محدد') AS city,
        COUNT(*)::int AS count
       FROM users
       WHERE role = 'student' AND has_academy_access = true
       GROUP BY
        COALESCE(NULLIF(country, ''), 'غير محدد'),
        NULLIF(country_code, ''),
        COALESCE(NULLIF(region, ''), 'غير محدد'),
        COALESCE(NULLIF(city, ''), 'غير محدد')
       ORDER BY count DESC, country ASC, region ASC
       LIMIT 50`
    ).catch(() => [])

    const dailyActivity = await query<{ day: string; active_students: number; points: number }>(
      `SELECT
        TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT user_id)::int AS active_students,
        COALESCE(SUM(points), 0)::int AS points
       FROM points_log
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`
    ).catch(() => [])

    const topSurahs = await query<{ surah_name: string; surah_number: number | null; recordings: number; unique_students: number }>(
      `SELECT
        COALESCE(surah_name, 'غير محدد') AS surah_name,
        surah_number,
        COUNT(*)::int AS recordings,
        COUNT(DISTINCT student_id)::int AS unique_students
       FROM recitations
       WHERE created_at >= NOW() - INTERVAL '90 days'
       GROUP BY COALESCE(surah_name, 'غير محدد'), surah_number
       ORDER BY recordings DESC, unique_students DESC
       LIMIT 10`
    ).catch(() => [])

    return NextResponse.json({
      stats: {
        totalStudents,
        activeCourses,
        completionRate,
        totalTeachers,
        weeklyEnrollments,
        totalCertificates,
        dailyActiveStudents: activeStudentsResult[0]?.count || 0,
        dailyActivityRate,
      },
      enrollmentTrend,
      genderDistribution,
      topCourses,
      studentsByCountry,
      geoHeatmap,
      dailyActivity,
      topSurahs,
    })
  } catch (error) {
    console.error('[API] Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
