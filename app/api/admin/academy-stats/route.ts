import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

function isSuperOrAcademy(session: any) {
  return session && ["admin", "super_admin", "academy_admin"].includes(session.role)
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) {
    console.error("[academy-stats]", e)
    return fallback
  }
}

// GET /api/admin/academy-stats — academy platform metrics.
// Accessible by super_admin and academy_admin.
export async function GET() {
  const session = await getSession()
  if (!isSuperOrAcademy(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const [totals, recentCourses, topCourses, enrollmentsOverTime] = await Promise.all([
    safe(
      () => queryOne<{
        courses: number; published_courses: number; lessons: number;
        enrollments: number; active_enrollments: number;
        teachers: number; certificates: number; new_enrollments_30: number;
      }>(
        `SELECT
           (SELECT COUNT(*)::int FROM courses)                                                         AS courses,
           (SELECT COUNT(*)::int FROM courses WHERE status = 'published')                              AS published_courses,
           (SELECT COUNT(*)::int FROM lessons)                                                         AS lessons,
           (SELECT COUNT(*)::int FROM enrollments)                                                     AS enrollments,
           (SELECT COUNT(*)::int FROM enrollments WHERE progress_percentage < 100)                     AS active_enrollments,
           (SELECT COUNT(*)::int FROM academy_teachers)                                                AS teachers,
           (SELECT COUNT(*)::int FROM academy_certificates)                                            AS certificates,
           (SELECT COUNT(*)::int FROM enrollments WHERE enrolled_at >= NOW() - INTERVAL '30 days')     AS new_enrollments_30`
      ),
      null
    ),
    safe(
      () => query<{ id: string; title: string; status: string; students_count: number; created_at: string }>(
        `SELECT c.id, c.title, c.status,
           (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS students_count,
           c.created_at
         FROM courses c
         ORDER BY c.created_at DESC
         LIMIT 5`
      ),
      []
    ),
    safe(
      () => query<{ id: string; title: string; students_count: number }>(
        `SELECT c.id, c.title,
           COUNT(e.id)::int AS students_count
         FROM courses c
         LEFT JOIN enrollments e ON e.course_id = c.id
         GROUP BY c.id, c.title
         ORDER BY students_count DESC
         LIMIT 5`
      ),
      []
    ),
    safe(
      () => query<{ day: string; count: number }>(
        `SELECT to_char(enrolled_at, 'DD/MM') AS day, COUNT(*)::int AS count
         FROM enrollments
         WHERE enrolled_at >= NOW() - INTERVAL '30 days'
         GROUP BY to_char(enrolled_at, 'DD/MM'), DATE(enrolled_at)
         ORDER BY DATE(enrolled_at) ASC
         LIMIT 30`
      ),
      []
    ),
  ])

  return NextResponse.json({
    totals: totals ?? {
      courses: 0, published_courses: 0, lessons: 0,
      enrollments: 0, active_enrollments: 0,
      teachers: 0, certificates: 0, new_enrollments_30: 0,
    },
    recentCourses,
    topCourses,
    enrollmentsOverTime,
  })
}
