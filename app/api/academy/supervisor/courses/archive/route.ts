import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const ALLOWED_ROLES = ['admin', 'academy_admin', 'supervisor', 'content_supervisor']

function isAllowed(session: any) {
  if (!session) return false
  if (ALLOWED_ROLES.includes(session.role)) return true
  if (Array.isArray(session.academy_roles)) {
    return session.academy_roles.some((r: string) => ALLOWED_ROLES.includes(r))
  }
  return false
}

/**
 * GET /api/academy/supervisor/courses/archive?search=...
 * Archive view for content supervisors — limited to courses whose
 * `specialization` matches one of the supervisor's user_specializations.
 * Admins / academy_admins see everything (no specialization filter).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const params: any[] = []
  let where = `c.is_active = FALSE`

  // For content supervisors, restrict to their own specialization(s).
  // Admins / academy_admins skip this filter.
  const isAdminLike = session && ['admin', 'academy_admin'].includes(session.role)
  if (!isAdminLike) {
    const specs = await query<{ specialization: string }>(
      `SELECT specialization FROM user_specializations WHERE user_id = $1`,
      [session!.sub],
    )
    if (specs.length === 0) {
      return NextResponse.json({ data: [] })
    }
    params.push(specs.map(s => s.specialization))
    where += ` AND c.specialization = ANY($${params.length}::text[])`
  }

  if (search) {
    params.push(`%${search}%`)
    where += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`
  }

  try {
    const rows = await query<any>(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.specialization,
        c.archived_at,
        COALESCE(cat.name, '') AS category_name,
        COALESCE(u.name, '') AS teacher_name,
        COALESCE(arch.name, '') AS archived_by_name,
        COUNT(DISTINCT l.id)::int AS total_lessons,
        COUNT(DISTINCT e.id)::int AS total_enrolled
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN users arch ON c.archived_by = arch.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE ${where}
      GROUP BY c.id, cat.name, u.name, arch.name
      ORDER BY c.archived_at DESC NULLS LAST, c.updated_at DESC
      `,
      params,
    )
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] supervisor archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
