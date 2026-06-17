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

// Map path_type → { table, stages table, fk, link prefix }
const PATH_CONFIG: Record<string, { table: string; stagesTable: string; fk: string; link: string }> = {
  tajweed: {
    table: 'tajweed_paths',
    stagesTable: 'tajweed_path_stages',
    fk: 'path_id',
    link: '/reader/tajweed-paths',
  },
  memorization: {
    table: 'memorization_paths',
    stagesTable: 'memorization_path_units',
    fk: 'path_id',
    link: '/reader/memorization-paths',
  },
}

function getConfig(req: NextRequest) {
  const type = new URL(req.url).searchParams.get('type') || ''
  return PATH_CONFIG[type] || null
}

/** GET /api/academy/supervisor/paths/[id]?type=tajweed|memorization */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const cfg = getConfig(req)
  if (!cfg) return NextResponse.json({ error: 'نوع المسار غير صالح' }, { status: 400 })

  const { id } = await params
  try {
    const rows = await query<any>(
      `
      SELECT
        p.id, p.title, p.description, p.thumbnail_url, p.level, p.status,
        p.rejection_reason, p.reviewed_at, p.submitted_for_review_at, p.created_at,
        u.id as creator_id, u.name as creator_name, u.email as creator_email, u.avatar_url as creator_avatar,
        rev.name as reviewer_name
      FROM ${cfg.table} p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users rev ON p.reviewed_by = rev.id
      WHERE p.id = $1
      `,
      [id],
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'المسار غير موجود' }, { status: 404 })
    }

    const stages = await query<any>(
      `SELECT id, title, position FROM ${cfg.stagesTable} WHERE ${cfg.fk} = $1 ORDER BY position ASC`,
      [id],
    )

    return NextResponse.json({ path: { ...rows[0], path_type: new URL(req.url).searchParams.get('type'), stages } })
  } catch (error: any) {
    if (error?.code === '42703') {
      return NextResponse.json({ error: 'migration_not_applied', message: MIGRATION_HINT }, { status: 503 })
    }
    console.error('[API] supervisor/paths/[id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/academy/supervisor/paths/[id]?type=tajweed|memorization
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
  const cfg = getConfig(req)
  if (!cfg) return NextResponse.json({ error: 'نوع المسار غير صالح' }, { status: 400 })

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
        `UPDATE ${cfg.table}
            SET status = 'published', is_published = TRUE, rejection_reason = NULL,
                reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
          WHERE id = $2
          RETURNING id, title, created_by`,
        [session!.sub, id],
      )
    } else {
      rows = await query<any>(
        `UPDATE ${cfg.table}
            SET status = 'rejected', is_published = FALSE, rejection_reason = $1,
                reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
          WHERE id = $3
          RETURNING id, title, created_by`,
        [notes.trim(), session!.sub, id],
      )
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'المسار غير موجود' }, { status: 404 })
    }
    const path = rows[0]

    if (path.created_by) {
      await createNotification({
        userId: path.created_by,
        type: 'general',
        category: 'course',
        title: action === 'approve' ? 'تم اعتماد مسارك' : 'تم رفض مسارك — يلزم تعديل',
        message:
          action === 'approve'
            ? `تمت الموافقة على المسار "${path.title}" وأصبح منشورًا.`
            : `تم رفض المسار "${path.title}". السبب: ${notes}. عدِّل المحتوى وأعد إرساله للمراجعة.`,
        link: `${cfg.link}/${path.id}`,
      }).catch(() => {})
    }

    return NextResponse.json({ path })
  } catch (error: any) {
    if (error?.code === '42703') {
      return NextResponse.json({ error: 'migration_not_applied', message: MIGRATION_HINT }, { status: 503 })
    }
    console.error('[API] supervisor/paths/[id] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
