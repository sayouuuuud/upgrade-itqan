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
 * GET /api/academy/supervisor/courses?status=pending|approved|rejected|all&search=
 * Lists whole courses with their review status (content supervisor reviews
 * complete courses before publishing). Not scoped by specialization.
 * Approve/reject is handled by POST /api/academy/admin/courses/[id]/review.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'pending'
  const search = (url.searchParams.get('search') || '').trim()

  const statusMap: Record<string, string[]> = {
    pending: ['pending_review'],
    approved: ['published'],
    rejected: ['rejected'],
    all: ['pending_review', 'published', 'rejected', 'draft', 'archived'],
  }
  const statusValues = statusMap[status] || statusMap.pending

  try {
    const params: any[] = [statusValues]
    let where = `WHERE c.status = ANY($1::text[])`
    if (search) {
      params.push(`%${search}%`)
      where += ` AND (c.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`
    }

    const rows = await query<any>(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        c.level,
        c.rejection_reason,
        c.reviewed_at,
        c.submitted_for_review_at,
        c.created_at,
        u.id   AS teacher_id,
        u.name AS teacher_name,
        u.avatar_url AS teacher_avatar,
        rev.name AS reviewer_name,
        COUNT(DISTINCT l.id)::int AS total_lessons
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN users rev ON c.reviewed_by = rev.id
      LEFT JOIN lessons l ON l.course_id = c.id
      ${where}
      GROUP BY c.id, u.id, u.name, u.avatar_url, rev.name
      ORDER BY c.submitted_for_review_at DESC NULLS LAST, c.created_at DESC
      LIMIT 200
      `,
      params,
    )

    const countsRows = await query<{ status: string; count: number }>(
      `
      SELECT status, COUNT(*)::int AS count
      FROM courses
      WHERE status IN ('pending_review','published','rejected','draft','archived')
      GROUP BY status
      `,
    )
    const counts = { pending: 0, approved: 0, rejected: 0, all: 0 }
    for (const r of countsRows) {
      const c = Number(r.count) || 0
      counts.all += c
      if (r.status === 'pending_review') counts.pending += c
      else if (r.status === 'published') counts.approved += c
      else if (r.status === 'rejected') counts.rejected += c
    }

    return NextResponse.json({ data: rows, counts })
  } catch (error: any) {
    console.error('[API] supervisor/courses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
