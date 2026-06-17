import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const ALLOWED_ROLES = ['content_supervisor', 'academy_admin', 'admin']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    const rows = await query<any>(`
      SELECT
        lp.*,
        creator.name       AS creator_name,
        creator.avatar_url AS creator_avatar,
        creator.email      AS creator_email,
        reviewer.name      AS reviewer_name
      FROM learning_paths lp
      LEFT JOIN users creator  ON creator.id  = lp.created_by
      LEFT JOIN users reviewer ON reviewer.id = lp.reviewed_by
      WHERE lp.id = $1
    `, [id])

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: rows[0] })
  } catch (err: any) {
    if (err?.code === '42703') return NextResponse.json({ error: 'migration_not_applied' }, { status: 503 })
    console.error('[supervisor/academy-paths/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { action, notes } = await req.json()

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }
  if (action === 'reject' && !notes?.trim()) {
    return NextResponse.json({ error: 'rejection reason required' }, { status: 400 })
  }

  try {
    // Verify path exists and is pending
    const existing = await query<any>('SELECT status, created_by FROM learning_paths WHERE id = $1', [id])
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing[0].status !== 'pending_review') {
      return NextResponse.json({ error: 'Path is not pending review' }, { status: 409 })
    }

    if (action === 'approve') {
      const updated = await query<any>(`
        UPDATE learning_paths
          SET status = 'published', is_published = TRUE,
              reviewed_by = $1, reviewed_at = NOW(),
              rejection_reason = NULL
        WHERE id = $2 RETURNING *
      `, [session.sub, id])
      return NextResponse.json({ data: updated[0] })
    }

    // reject
    const updated = await query<any>(`
      UPDATE learning_paths
        SET status = 'rejected', is_published = FALSE,
            rejection_reason = $1,
            reviewed_by = $2, reviewed_at = NOW()
      WHERE id = $3 RETURNING *
    `, [notes.trim(), session.sub, id])

    // Notify the admin who created it (best-effort)
    const creatorId = existing[0].created_by
    if (creatorId) {
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, created_at)
           VALUES ($1, 'content_rejected', 'تم رفض المسار', $2, NOW())`,
          [creatorId, `تم رفض مسار الأكاديمية بسبب: ${notes.trim()}`],
        )
      } catch { /* notifications table may not exist */ }
    }

    return NextResponse.json({ data: updated[0] })
  } catch (err: any) {
    if (err?.code === '42703') return NextResponse.json({ error: 'migration_not_applied' }, { status: 503 })
    console.error('[supervisor/academy-paths/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
