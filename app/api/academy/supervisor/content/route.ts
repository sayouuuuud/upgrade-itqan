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
 * GET /api/academy/supervisor/content?status=pending|approved|rejected|all&search=
 * List lessons with their review status. Includes counts for each filter.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'pending'
  const search = (url.searchParams.get('search') || '').trim()

  // Map our UI filter to DB status values
  // DB values: 'pending_review' | 'approved' | 'rejected' | 'draft' | 'published'
  const statusMap: Record<string, string[]> = {
    pending:  ['pending_review'],
    approved: ['approved', 'published'],
    rejected: ['rejected'],
    all:      ['pending_review', 'approved', 'rejected', 'draft', 'published'],
  }
  const statusValues = statusMap[status] || statusMap.pending

  try {
    const params: any[] = [statusValues]
    let where = `WHERE l.status = ANY($1::text[])`
    if (search) {
      params.push(`%${search}%`)
      where += ` AND (l.title ILIKE $${params.length} OR c.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`
    }

    const rows = await query<any>(
      `
      SELECT
        l.id,
        l.title,
        l.description,
        l.video_url,
        l.duration_minutes,
        l.status,
        l.review_notes,
        l.reviewed_at,
        l.created_at,
        l.order_index,
        c.id    AS course_id,
        c.title AS course_title,
        u.id    AS teacher_id,
        u.name  AS teacher_name,
        u.avatar_url AS teacher_avatar,
        rev.name AS reviewer_name
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN users u   ON c.teacher_id = u.id
      LEFT JOIN users rev ON l.reviewed_by = rev.id
      ${where}
      ORDER BY l.created_at DESC
      LIMIT 200
      `,
      params,
    )

    // Counts for each filter (no search)
    const countsRows = await query<{ status: string; count: number }>(
      `
      SELECT status, COUNT(*)::int AS count
      FROM lessons
      WHERE status IN ('pending_review','approved','rejected','draft','published')
      GROUP BY status
      `,
    )
    const counts = { pending: 0, approved: 0, rejected: 0, all: 0 }
    for (const r of countsRows) {
      const c = Number(r.count) || 0
      counts.all += c
      if (r.status === 'pending_review')               counts.pending  += c
      else if (r.status === 'approved' ||
               r.status === 'published')               counts.approved += c
      else if (r.status === 'rejected')                counts.rejected += c
    }

    return NextResponse.json({ data: rows, counts })
  } catch (error) {
    console.error('[API] supervisor/content GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
