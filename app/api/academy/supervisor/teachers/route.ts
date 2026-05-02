import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const SUPERVISOR_ROLES = [
  'admin',
  'academy_admin',
  'supervisor',
  'content_supervisor',
  'fiqh_supervisor',
  'quality_supervisor',
  'student_supervisor',
  'reciter_supervisor',
]

function isSupervisor(session: any): boolean {
  if (!session) return false
  if (SUPERVISOR_ROLES.includes(session.role)) return true
  if (Array.isArray(session.academy_roles)) {
    return session.academy_roles.some((r: string) => SUPERVISOR_ROLES.includes(r))
  }
  return false
}

/**
 * GET /api/academy/supervisor/teachers?status=pending|verified|all
 *
 * Lists academy teachers along with their verification state. Supervisors
 * use this list to approve / revoke verification on teachers — it's the
 * counterpart to the admin teachers page but limited to the verification
 * workflow. (Phase 6 — Supervisor Verification.)
 *
 * Response shape:
 *   { data: [{ id, name, email, avatar_url, phone,
 *              bio, specialization, years_of_experience, certifications,
 *              subjects, rating, total_students, total_courses,
 *              is_verified, is_accepting_students, created_at }],
 *     counts: { pending, verified, all } }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'all'

  try {
    const conditions: string[] = [`u.role = 'teacher'`]
    if (status === 'pending') {
      conditions.push(`COALESCE(at.is_verified, FALSE) = FALSE`)
    } else if (status === 'verified') {
      conditions.push(`COALESCE(at.is_verified, FALSE) = TRUE`)
    }
    const where = `WHERE ${conditions.join(' AND ')}`

    const rows = await query<any>(
      `
      SELECT u.id,
             u.name,
             u.email,
             u.phone,
             u.avatar_url,
             u.created_at,
             COALESCE(u.is_active, TRUE)              AS is_active,
             at.bio,
             at.specialization,
             at.years_of_experience,
             at.certifications,
             at.subjects,
             at.rating,
             at.total_students,
             at.total_courses,
             at.is_accepting_students,
             COALESCE(at.is_verified, FALSE)          AS is_verified,
             (SELECT COUNT(*)::int FROM courses c WHERE c.teacher_id = u.id)               AS courses_count,
             (SELECT COUNT(DISTINCT e.student_id)::int
                FROM courses c
                JOIN enrollments e ON e.course_id = c.id
               WHERE c.teacher_id = u.id AND e.status = 'active')                          AS students_count
        FROM users u
        LEFT JOIN academy_teachers at ON at.user_id = u.id
        ${where}
        ORDER BY COALESCE(at.is_verified, FALSE) ASC,  -- pending first
                 u.created_at DESC
      `,
    )

    const counts = await query<{ status: string; count: number }>(
      `
      SELECT 'all' AS status, COUNT(*)::int AS count FROM users WHERE role = 'teacher'
      UNION ALL
      SELECT 'pending', COUNT(*)::int
        FROM users u
        LEFT JOIN academy_teachers at ON at.user_id = u.id
       WHERE u.role = 'teacher' AND COALESCE(at.is_verified, FALSE) = FALSE
      UNION ALL
      SELECT 'verified', COUNT(*)::int
        FROM users u
        LEFT JOIN academy_teachers at ON at.user_id = u.id
       WHERE u.role = 'teacher' AND COALESCE(at.is_verified, FALSE) = TRUE
      `,
    )
    const countMap: Record<string, number> = { all: 0, pending: 0, verified: 0 }
    for (const c of counts) countMap[c.status] = Number(c.count) || 0

    return NextResponse.json({ data: rows, counts: countMap })
  } catch (error) {
    console.error('[API] supervisor/teachers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
