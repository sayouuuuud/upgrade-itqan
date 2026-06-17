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

const MIGRATION_HINT =
  'تتطلب هذه الميزة تشغيل سكربت قاعدة البيانات scripts/030-content-review-workflow.sql أولاً.'

/**
 * GET /api/academy/supervisor/series?status=pending|approved|rejected|all&search=
 * Lists academy series awaiting content-supervisor review. Not scoped by specialization.
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
    all: ['pending_review', 'published', 'rejected', 'draft'],
  }
  const statusValues = statusMap[status] || statusMap.pending

  try {
    const params: any[] = [statusValues]
    let where = `WHERE s.status = ANY($1::text[])`
    if (search) {
      params.push(`%${search}%`)
      where += ` AND (s.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`
    }

    const rows = await query<any>(
      `
      SELECT
        s.id,
        s.title,
        s.description,
        s.thumbnail_url,
        s.subject,
        s.status,
        s.rejection_reason,
        s.reviewed_at,
        s.submitted_for_review_at,
        s.created_at,
        u.id   AS teacher_id,
        u.name AS teacher_name,
        u.avatar_url AS teacher_avatar,
        rev.name AS reviewer_name,
        COUNT(si.id)::int AS total_items
      FROM series s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN users rev ON s.reviewed_by = rev.id
      LEFT JOIN series_items si ON si.series_id = s.id
      ${where}
      GROUP BY s.id, u.id, u.name, u.avatar_url, rev.name
      ORDER BY s.submitted_for_review_at DESC NULLS LAST, s.created_at DESC
      LIMIT 200
      `,
      params,
    )

    const countsRows = await query<{ status: string; count: number }>(
      `
      SELECT status, COUNT(*)::int AS count
      FROM series
      WHERE status IN ('pending_review','published','rejected','draft')
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
    if (error?.code === '42703') {
      return NextResponse.json(
        { error: 'migration_not_applied', message: MIGRATION_HINT },
        { status: 503 },
      )
    }
    console.error('[API] supervisor/series GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
