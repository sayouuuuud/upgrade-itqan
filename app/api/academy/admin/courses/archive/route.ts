import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/courses/archive?search=...
 * Returns courses that have been deactivated (is_active = FALSE) — i.e. moved
 * to the archive by a teacher or admin. Search runs against title + description.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const params: any[] = []
  let searchFilter = ''
  if (search) {
    params.push(`%${search}%`)
    searchFilter = ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`
  }

  try {
    const rows = await query<any>(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        c.is_active,
        c.archived_at,
        c.specialization,
        COALESCE(cat.name, '') AS category_name,
        COALESCE(u.name, '') AS teacher_name,
        COALESCE(arch.name, '') AS archived_by_name,
        COUNT(DISTINCT l.id)::int AS total_lessons,
        COUNT(DISTINCT e.id)::int AS total_enrolled,
        COUNT(DISTINCT CASE WHEN LOWER(e.status) = 'completed' THEN e.id END)::int AS completed_enrolled
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN users arch ON c.archived_by = arch.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.is_active = FALSE
        ${searchFilter}
      GROUP BY c.id, cat.name, u.name, arch.name
      ORDER BY c.archived_at DESC NULLS LAST, c.updated_at DESC
      `,
      params,
    )
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] admin archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
