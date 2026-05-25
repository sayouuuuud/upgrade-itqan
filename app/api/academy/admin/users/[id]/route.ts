import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

/**
 * GET /api/academy/admin/users/[id]
 *
 * Academy-scoped profile for a single account, used by
 * /academy/admin/users/[id]/page.tsx
 *
 * IMPORTANT: This is intentionally separate from /api/admin/users/[id],
 * which returns the **reader** (Quran app) profile (recitations history,
 * bookings, etc.). The academy admin needs to see *academy* statistics for
 * the same user — courses, halaqat, tasks, attendance, points — so we
 * compute a different shape here.
 *
 * The response shape adapts to the user's role:
 *   - student  → enrollments / lessons / halaqah / tasks / attendance
 *   - teacher  → owned courses, halaqat, students taught, sessions
 *   - parent   → linked children, their statuses
 *   - other    → minimal stats (we still return user + activity)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !['academy_admin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    const user = await db.queryOne<{
      id: string
      name: string
      email: string | null
      phone: string | null
      role: string
      avatar_url: string | null
      bio: string | null
      is_active: boolean | null
      created_at: string
      last_login_at: string | null
      user_city: string | null
      is_online: boolean
      has_quran_access: boolean | null
      has_academy_access: boolean | null
      platform_preference: string | null
      academy_roles: string[] | null
      halaqah_id: string | null
      halaqah_name: string | null
      halaqah_teacher_name: string | null
      approval_status: string | null
    }>(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.bio,
              u.is_active, u.created_at, u.last_login_at,
              u.city AS user_city,
              EXISTS(
                SELECT 1 FROM user_sessions us
                WHERE us.user_id = u.id
                  AND us.last_active_at > NOW() - INTERVAL '5 minutes'
              ) AS is_online,
              u.has_quran_access, u.has_academy_access, u.platform_preference,
              u.academy_roles, u.halaqah_id,
              h.name AS halaqah_name,
              ht.name AS halaqah_teacher_name,
              u.approval_status
         FROM users u
         LEFT JOIN halaqat h  ON h.id = u.halaqah_id
         LEFT JOIN users   ht ON ht.id = h.teacher_id
        WHERE u.id = $1`,
      [userId],
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Academy-wide gamification stats (apply to any role that has them).
    const userPoints = await db.queryOne<{
      total_points: number | null
      level: string | null
      streak_days: number | null
      longest_streak: number | null
      last_activity_date: string | null
    }>(
      `SELECT total_points, level, streak_days, longest_streak, last_activity_date
         FROM user_points
        WHERE user_id = $1`,
      [userId],
    )

    const badgesCount = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM badges WHERE user_id = $1`,
      [userId],
    )

    // Last login event from activity_logs (same source the global profile uses).
    const lastSession = await db.queryOne<{
      ip_address: string | null
      user_agent: string | null
      last_active_at: string | null
    }>(
      `SELECT ip_address, user_agent, created_at AS last_active_at
         FROM activity_logs
        WHERE user_id = $1 AND action = 'login_success'
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId],
    )

    // Recent country (best-effort).
    const countryRes = await db.queryOne<{ country: string | null }>(
      `SELECT country FROM page_views
        WHERE user_id = $1 AND country IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId],
    )

    // 14-day academy activity = lesson_progress events + task_submissions + session_attendance
    const activityData = await db.query<{ date: string; count: number }>(
      `SELECT TO_CHAR(d, 'YYYY-MM-DD') AS date,
              (
                COALESCE((SELECT COUNT(*) FROM lesson_progress lp
                           WHERE lp.enrollment_id IN (SELECT id FROM enrollments WHERE student_id = $1)
                             AND DATE(lp.updated_at) = d), 0)
              + COALESCE((SELECT COUNT(*) FROM task_submissions ts
                           WHERE ts.student_id = $1 AND DATE(ts.submitted_at) = d), 0)
              + COALESCE((SELECT COUNT(*) FROM session_attendance sa
                           WHERE sa.student_id = $1 AND DATE(sa.joined_at) = d), 0)
              )::int AS count
         FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') d
        ORDER BY d ASC`,
      [userId],
    )

    let roleMetrics: Record<string, any> = {}
    let history: any[] = []

    if (user.role === 'student') {
      const enrollmentCounts = await db.queryOne<{
        total: string
        active: string
        completed: string
        paused: string
        dropped: string
      }>(
        `SELECT COUNT(*)::int                                                AS total,
                COUNT(*) FILTER (WHERE status = 'ACTIVE')::int               AS active,
                COUNT(*) FILTER (WHERE status = 'COMPLETED')::int            AS completed,
                COUNT(*) FILTER (WHERE status = 'PAUSED')::int               AS paused,
                COUNT(*) FILTER (WHERE status = 'DROPPED')::int              AS dropped
           FROM enrollments
          WHERE student_id = $1`,
        [userId],
      )

      const lessonStats = await db.queryOne<{
        completed_lessons: string
        in_progress_lessons: string
      }>(
        `SELECT COUNT(*) FILTER (WHERE is_completed)::int      AS completed_lessons,
                COUNT(*) FILTER (WHERE is_in_progress)::int    AS in_progress_lessons
           FROM lesson_progress
          WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id = $1)`,
        [userId],
      )

      const taskStats = await db.queryOne<{
        total: string
        completed: string
        pending: string
        overdue: string
        graded: string
      }>(
        `SELECT COUNT(*)::int                                                          AS total,
                COUNT(*) FILTER (WHERE status IN ('done', 'graded'))::int              AS completed,
                COUNT(*) FILTER (WHERE status = 'pending')::int                        AS pending,
                COUNT(*) FILTER (WHERE status = 'overdue')::int                        AS overdue,
                COUNT(*) FILTER (WHERE status = 'graded')::int                         AS graded
           FROM tasks
          WHERE assigned_to = $1`,
        [userId],
      )

      const attendanceStats = await db.queryOne<{
        total: string
        present: string
        late: string
        left_early: string
        absent: string
      }>(
        `SELECT COUNT(*)::int                                                AS total,
                COUNT(*) FILTER (WHERE attendance_status = 'present')::int   AS present,
                COUNT(*) FILTER (WHERE attendance_status = 'late')::int      AS late,
                COUNT(*) FILTER (WHERE attendance_status = 'left_early')::int AS left_early,
                COUNT(*) FILTER (WHERE attendance_status = 'absent')::int    AS absent
           FROM session_attendance
          WHERE student_id = $1`,
        [userId],
      )

      // Recent enrollments / progress timeline used by the History tab.
      history = await db.query<any>(
        `SELECT e.id,
                e.course_id,
                c.title             AS course_title,
                c.thumbnail_url     AS course_thumbnail,
                u_teacher.name      AS teacher_name,
                e.status,
                e.progress_percentage,
                e.enrolled_at,
                e.completed_at,
                e.last_accessed_at
           FROM enrollments e
           JOIN courses c        ON c.id = e.course_id
           LEFT JOIN users u_teacher ON u_teacher.id = c.teacher_id
          WHERE e.student_id = $1
          ORDER BY e.enrolled_at DESC
          LIMIT 50`,
        [userId],
      )

      roleMetrics = {
        enrollments: {
          total:     parseInt((enrollmentCounts?.total ?? '0') as any) || 0,
          active:    parseInt((enrollmentCounts?.active ?? '0') as any) || 0,
          completed: parseInt((enrollmentCounts?.completed ?? '0') as any) || 0,
          paused:    parseInt((enrollmentCounts?.paused ?? '0') as any) || 0,
          dropped:   parseInt((enrollmentCounts?.dropped ?? '0') as any) || 0,
        },
        lessons: {
          completed:   parseInt((lessonStats?.completed_lessons ?? '0') as any) || 0,
          in_progress: parseInt((lessonStats?.in_progress_lessons ?? '0') as any) || 0,
        },
        tasks: {
          total:     parseInt((taskStats?.total ?? '0') as any) || 0,
          completed: parseInt((taskStats?.completed ?? '0') as any) || 0,
          pending:   parseInt((taskStats?.pending ?? '0') as any) || 0,
          overdue:   parseInt((taskStats?.overdue ?? '0') as any) || 0,
          graded:    parseInt((taskStats?.graded ?? '0') as any) || 0,
        },
        attendance: {
          total:      parseInt((attendanceStats?.total ?? '0') as any) || 0,
          present:    parseInt((attendanceStats?.present ?? '0') as any) || 0,
          late:       parseInt((attendanceStats?.late ?? '0') as any) || 0,
          left_early: parseInt((attendanceStats?.left_early ?? '0') as any) || 0,
          absent:     parseInt((attendanceStats?.absent ?? '0') as any) || 0,
        },
      }
    } else if (user.role === 'teacher') {
      const courseCounts = await db.queryOne<{
        total: string
        published: string
        archived: string
      }>(
        `SELECT COUNT(*)::int                                              AS total,
                COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE))::int     AS published,
                COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = FALSE)::int AS archived
           FROM courses
          WHERE teacher_id = $1`,
        [userId],
      )

      const halaqatCounts = await db.queryOne<{
        total: string
        active: string
        archived: string
      }>(
        `SELECT COUNT(*)::int                                              AS total,
                COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE))::int     AS active,
                COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = FALSE)::int AS archived
           FROM halaqat
          WHERE teacher_id = $1`,
        [userId],
      )

      const studentsTaught = await db.queryOne<{ count: string }>(
        `SELECT COUNT(DISTINCT s.id)::int AS count
           FROM users s
          WHERE s.role = 'student'
            AND (
              s.halaqah_id IN (SELECT id FROM halaqat WHERE teacher_id = $1)
              OR s.id IN (
                SELECT e.student_id FROM enrollments e
                  JOIN courses c ON c.id = e.course_id
                 WHERE c.teacher_id = $1
              )
            )`,
        [userId],
      )

      const sessionCounts = await db.queryOne<{
        total: string
        scheduled: string
        completed: string
        cancelled: string
        live: string
      }>(
        `SELECT COUNT(*)::int                                                                 AS total,
                COUNT(*) FILTER (WHERE status = 'scheduled')::int                             AS scheduled,
                COUNT(*) FILTER (WHERE status = 'completed')::int                             AS completed,
                COUNT(*) FILTER (WHERE status = 'cancelled')::int                             AS cancelled,
                COUNT(*) FILTER (WHERE status IN ('in_progress','live'))::int                 AS live
           FROM course_sessions cs
           JOIN courses c ON c.id = cs.course_id
          WHERE c.teacher_id = $1`,
        [userId],
      )

      const tasksAssigned = await db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM tasks WHERE assigned_by = $1`,
        [userId],
      )

      // Teacher application status if any
      const application = await db.queryOne<{
        id: string
        status: string | null
        reviewed_at: string | null
        reviewer_name: string | null
      }>(
        `SELECT ta.id, ta.status, ta.reviewed_at, reviewer.name AS reviewer_name
           FROM teacher_applications ta
           LEFT JOIN users reviewer ON reviewer.id = ta.reviewed_by
          WHERE ta.user_id = $1
          ORDER BY ta.created_at DESC
          LIMIT 1`,
        [userId],
      )

      history = await db.query<any>(
        `SELECT c.id,
                c.title             AS course_title,
                c.thumbnail_url     AS course_thumbnail,
                COALESCE(c.is_active, TRUE) AS is_active,
                c.created_at,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id)::int AS students_count
           FROM courses c
          WHERE c.teacher_id = $1
          ORDER BY c.created_at DESC
          LIMIT 50`,
        [userId],
      )

      roleMetrics = {
        courses: {
          total:     parseInt((courseCounts?.total ?? '0') as any) || 0,
          published: parseInt((courseCounts?.published ?? '0') as any) || 0,
          archived:  parseInt((courseCounts?.archived ?? '0') as any) || 0,
        },
        halaqat: {
          total:    parseInt((halaqatCounts?.total ?? '0') as any) || 0,
          active:   parseInt((halaqatCounts?.active ?? '0') as any) || 0,
          archived: parseInt((halaqatCounts?.archived ?? '0') as any) || 0,
        },
        students_taught: parseInt((studentsTaught?.count ?? '0') as any) || 0,
        sessions: {
          total:     parseInt((sessionCounts?.total ?? '0') as any) || 0,
          scheduled: parseInt((sessionCounts?.scheduled ?? '0') as any) || 0,
          completed: parseInt((sessionCounts?.completed ?? '0') as any) || 0,
          cancelled: parseInt((sessionCounts?.cancelled ?? '0') as any) || 0,
          live:      parseInt((sessionCounts?.live ?? '0') as any) || 0,
        },
        tasks_assigned: parseInt((tasksAssigned?.count ?? '0') as any) || 0,
        application: application || null,
      }
    } else if (user.role === 'parent') {
      const childrenCounts = await db.queryOne<{
        total: string
        active: string
        pending: string
        rejected: string
      }>(
        `SELECT COUNT(*)::int                                          AS total,
                COUNT(*) FILTER (WHERE status = 'active')::int         AS active,
                COUNT(*) FILTER (WHERE status = 'pending')::int        AS pending,
                COUNT(*) FILTER (WHERE status = 'rejected')::int       AS rejected
           FROM parent_children
          WHERE parent_id = $1`,
        [userId],
      )

      history = await db.query<any>(
        `SELECT pc.id,
                pc.child_id,
                u.name      AS child_name,
                u.avatar_url AS child_avatar,
                pc.relation,
                pc.status,
                pc.created_at,
                pc.responded_at
           FROM parent_children pc
           JOIN users u ON u.id = pc.child_id
          WHERE pc.parent_id = $1
          ORDER BY pc.created_at DESC
          LIMIT 50`,
        [userId],
      )

      roleMetrics = {
        children: {
          total:    parseInt((childrenCounts?.total ?? '0') as any) || 0,
          active:   parseInt((childrenCounts?.active ?? '0') as any) || 0,
          pending:  parseInt((childrenCounts?.pending ?? '0') as any) || 0,
          rejected: parseInt((childrenCounts?.rejected ?? '0') as any) || 0,
        },
      }
    }

    return NextResponse.json({
      user,
      points: {
        total:           userPoints?.total_points ?? 0,
        level:           userPoints?.level ?? 'beginner',
        streak_days:     userPoints?.streak_days ?? 0,
        longest_streak:  userPoints?.longest_streak ?? 0,
        last_activity:   userPoints?.last_activity_date ?? null,
        badges_count:    parseInt((badgesCount?.count ?? '0') as any) || 0,
      },
      roleMetrics,
      history,
      activityData,
      lastSession: lastSession ?? null,
      country: countryRes?.country ?? null,
    })
  } catch (err) {
    console.error('[GET /api/academy/admin/users/[id]] error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
