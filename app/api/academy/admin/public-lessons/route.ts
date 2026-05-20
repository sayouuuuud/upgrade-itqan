import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/public-lessons
 * List every public lesson (halaqa) with its review status. Used by the
 * admin / academy-admin / content-supervisor review queue.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin', 'supervisor', 'content_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const reviewStatus = url.searchParams.get('review_status')

  const filters: string[] = []
  const params: unknown[] = []
  if (reviewStatus) {
    params.push(reviewStatus)
    filters.push(`pl.review_status = $${params.length}`)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const rows = await query(
    `SELECT pl.id, pl.teacher_id, COALESCE(u.name, 'مدرّس') AS teacher_name,
            pl.title, pl.description, pl.cover_image_url, pl.public_slug,
            pl.scheduled_at, pl.duration_minutes, pl.status, pl.is_published,
            pl.review_status, pl.review_notes, pl.reviewed_at,
            pl.category_id, cat.name AS category_name,
            pl.created_at, pl.updated_at
       FROM public_lessons pl
       LEFT JOIN users u ON u.id = pl.teacher_id
       LEFT JOIN categories cat ON cat.id = pl.category_id
       ${where}
       ORDER BY
         CASE pl.review_status WHEN 'pending_review' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
         pl.scheduled_at DESC`,
    params
  )
  return NextResponse.json({ data: rows })
}
