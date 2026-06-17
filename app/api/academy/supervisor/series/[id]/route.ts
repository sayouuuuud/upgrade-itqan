import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

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

/** GET /api/academy/supervisor/series/[id] — full series detail with items. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const rows = await query<any>(
      `
      SELECT
        s.id, s.title, s.description, s.thumbnail_url, s.subject,
        s.status, s.rejection_reason, s.reviewed_at, s.submitted_for_review_at, s.created_at,
        u.id as teacher_id, u.name as teacher_name, u.email as teacher_email, u.avatar_url as teacher_avatar,
        rev.name as reviewer_name
      FROM series s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN users rev ON s.reviewed_by = rev.id
      WHERE s.id = $1
      `,
      [id],
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'السلسلة غير موجودة' }, { status: 404 })
    }

    const items = await query<any>(
      `
      SELECT si.id, si.item_type, si.order_index,
             c.title AS course_title,
             lp.title AS path_title
      FROM series_items si
      LEFT JOIN courses c ON si.course_id = c.id
      LEFT JOIN learning_paths lp ON si.path_id = lp.id
      WHERE si.series_id = $1
      ORDER BY si.order_index ASC
      `,
      [id],
    )

    return NextResponse.json({ series: { ...rows[0], items } })
  } catch (error: any) {
    if (error?.code === '42703') {
      return NextResponse.json({ error: 'migration_not_applied', message: MIGRATION_HINT }, { status: 503 })
    }
    console.error('[API] supervisor/series/[id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/academy/supervisor/series/[id]
 * Body: { action: 'approve' | 'reject', notes?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action, notes } = await req.json()

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  }
  if (action === 'reject' && !notes?.trim()) {
    return NextResponse.json({ error: 'سبب الرفض مطلوب' }, { status: 400 })
  }

  try {
    let rows: any[]
    if (action === 'approve') {
      rows = await query<any>(
        `UPDATE series
            SET status = 'published', is_published = TRUE, rejection_reason = NULL,
                reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
          WHERE id = $2
          RETURNING id, title, teacher_id`,
        [session!.sub, id],
      )
    } else {
      rows = await query<any>(
        `UPDATE series
            SET status = 'rejected', is_published = FALSE, rejection_reason = $1,
                reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
          WHERE id = $3
          RETURNING id, title, teacher_id`,
        [notes.trim(), session!.sub, id],
      )
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'السلسلة غير موجودة' }, { status: 404 })
    }
    const series = rows[0]

    if (series.teacher_id) {
      await createNotification({
        userId: series.teacher_id,
        type: 'general',
        category: 'course',
        title: action === 'approve' ? 'تم اعتماد سلسلتك' : 'تم رفض سلسلتك — يلزم تعديل',
        message:
          action === 'approve'
            ? `تمت الموافقة على السلسلة "${series.title}" وأصبحت منشورة.`
            : `تم رفض السلسلة "${series.title}". السبب: ${notes}. عدِّل المحتوى وأعد إرسالها للمراجعة.`,
        link: `/academy/admin/series/${series.id}`,
      }).catch(() => {})
    }

    return NextResponse.json({ series })
  } catch (error: any) {
    if (error?.code === '42703') {
      return NextResponse.json({ error: 'migration_not_applied', message: MIGRATION_HINT }, { status: 503 })
    }
    console.error('[API] supervisor/series/[id] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
