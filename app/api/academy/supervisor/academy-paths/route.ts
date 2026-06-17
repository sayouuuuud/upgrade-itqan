import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const ALLOWED_ROLES = ['content_supervisor', 'academy_admin', 'admin']

const STATUS_MAP: Record<string, string> = {
  pending: 'pending_review',
  approved: 'published',
  rejected: 'rejected',
  all: 'all',
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('status') || 'pending'
  const search = searchParams.get('search') || ''
  const dbStatus = STATUS_MAP[filter] || 'pending_review'

  try {
    const counts = await query<any>(`
      SELECT
        count(*) FILTER (WHERE status = 'pending_review') AS pending,
        count(*) FILTER (WHERE status = 'published')      AS approved,
        count(*) FILTER (WHERE status = 'rejected')       AS rejected,
        count(*)                                           AS all
      FROM learning_paths
    `)

    const rows = await query<any>(`
      SELECT
        lp.id, lp.title, lp.description, lp.subject, lp.level,
        lp.estimated_hours, lp.status, lp.is_published,
        lp.rejection_reason, lp.submitted_for_review_at, lp.reviewed_at,
        lp.created_at,
        creator.id   AS creator_id,
        creator.name AS creator_name,
        creator.avatar_url AS creator_avatar,
        reviewer.name AS reviewer_name
      FROM learning_paths lp
      LEFT JOIN users creator  ON creator.id  = lp.created_by
      LEFT JOIN users reviewer ON reviewer.id = lp.reviewed_by
      WHERE ($1 = 'all' OR lp.status = $1)
        AND ($2 = '' OR lp.title ILIKE '%' || $2 || '%' OR creator.name ILIKE '%' || $2 || '%')
      ORDER BY
        CASE WHEN lp.status = 'pending_review' THEN 0 ELSE 1 END,
        COALESCE(lp.submitted_for_review_at, lp.created_at) DESC
    `, [dbStatus, search])

    const c = counts[0]
    return NextResponse.json({
      data: rows,
      counts: {
        pending: Number(c.pending),
        approved: Number(c.approved),
        rejected: Number(c.rejected),
        all: Number(c.all),
      },
    })
  } catch (err: any) {
    if (err?.code === '42703') {
      return NextResponse.json({ error: 'migration_not_applied' }, { status: 503 })
    }
    console.error('[supervisor/academy-paths GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
