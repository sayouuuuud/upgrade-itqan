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

const STATUS_MAP: Record<string, string[]> = {
  pending: ['pending_review'],
  approved: ['published'],
  rejected: ['rejected'],
  all: ['pending_review', 'published', 'rejected', 'draft'],
}

/**
 * GET /api/academy/supervisor/paths?status=&search=
 * Unified list of reader content paths (tajweed + memorization) awaiting review.
 * Each row carries a `path_type` so the UI/PATCH can route correctly.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'pending'
  const search = (url.searchParams.get('search') || '').trim()
  const statusValues = STATUS_MAP[status] || STATUS_MAP.pending

  try {
    const buildQuery = (table: string, type: string) => {
      const params: any[] = [statusValues]
      let where = `WHERE p.status = ANY($1::text[])`
      if (search) {
        params.push(`%${search}%`)
        where += ` AND (p.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`
      }
      return {
        text: `
          SELECT
            p.id, p.title, p.description, p.thumbnail_url, p.level, p.status,
            p.rejection_reason, p.reviewed_at, p.submitted_for_review_at, p.created_at,
            '${type}'::text AS path_type,
            u.id AS creator_id, u.name AS creator_name, u.avatar_url AS creator_avatar,
            rev.name AS reviewer_name
          FROM ${table} p
          LEFT JOIN users u ON p.created_by = u.id
          LEFT JOIN users rev ON p.reviewed_by = rev.id
          ${where}
        `,
        params,
      }
    }

    const tajweed = buildQuery('tajweed_paths', 'tajweed')
    const memo = buildQuery('memorization_paths', 'memorization')

    const [tajweedRows, memoRows] = await Promise.all([
      query<any>(tajweed.text, tajweed.params),
      query<any>(memo.text, memo.params),
    ])

    const rows = [...tajweedRows, ...memoRows].sort((a, b) => {
      const ta = new Date(a.submitted_for_review_at || a.created_at).getTime()
      const tb = new Date(b.submitted_for_review_at || b.created_at).getTime()
      return tb - ta
    })

    const countRows = async (table: string) =>
      query<{ status: string; count: number }>(
        `SELECT status, COUNT(*)::int AS count FROM ${table}
         WHERE status IN ('pending_review','published','rejected','draft')
         GROUP BY status`,
      )
    const [tc, mc] = await Promise.all([countRows('tajweed_paths'), countRows('memorization_paths')])
    const counts = { pending: 0, approved: 0, rejected: 0, all: 0 }
    for (const r of [...tc, ...mc]) {
      const c = Number(r.count) || 0
      counts.all += c
      if (r.status === 'pending_review') counts.pending += c
      else if (r.status === 'published') counts.approved += c
      else if (r.status === 'rejected') counts.rejected += c
    }

    return NextResponse.json({ data: rows, counts })
  } catch (error: any) {
    if (error?.code === '42703') {
      return NextResponse.json({ error: 'migration_not_applied', message: MIGRATION_HINT }, { status: 503 })
    }
    console.error('[API] supervisor/paths GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
