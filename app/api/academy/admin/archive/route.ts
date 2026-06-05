import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/archive?type=all|courses|halaqat&search=...&reason=teacher_deleted
 *
 * يعيد كل المحتوى المؤرشف (كورسات وحلقات) للإدارة.
 * - type: تصفية حسب النوع (all = الكل)
 * - search: بحث بالعنوان أو الاسم
 * - reason: تصفية حسب سبب الأرشفة (مثلاً: teacher_deleted)
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type   = req.nextUrl.searchParams.get('type') || 'all'
  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const reason = req.nextUrl.searchParams.get('reason') || ''

  try {
    let courses: any[] = []
    let halaqat: any[] = []

    // ─── كورسات مؤرشفة ───────────────────────────────────────
    if (type === 'all' || type === 'courses') {
      const p: any[] = []
      const conditions: string[] = ['c.is_active = FALSE']

      if (search) {
        p.push(`%${search}%`)
        conditions.push(`(c.title ILIKE $${p.length} OR c.description ILIKE $${p.length})`)
      }
      if (reason) {
        p.push(reason)
        conditions.push(`c.archive_reason = $${p.length}`)
      }

      courses = await query<any>(
        `SELECT
           c.id,
           'course'                          AS item_type,
           c.title                           AS name,
           c.description,
           c.thumbnail_url,
           c.is_active,
           c.archived_at,
           c.archive_reason,
           NULL::text                        AS specialization,
           COALESCE(cat.name, '')            AS category_name,
           COALESCE(orig.name, '')           AS original_teacher_name,
           orig.email                        AS original_teacher_email,
           COALESCE(arch.name, '')           AS archived_by_name,
           COUNT(DISTINCT l.id)::int         AS total_lessons,
           COUNT(DISTINCT e.id)::int         AS total_enrolled,
           COUNT(DISTINCT CASE WHEN LOWER(e.status) = 'completed' THEN e.id END)::int
                                             AS completed_enrolled
         FROM courses c
         LEFT JOIN users orig   ON orig.id  = c.original_teacher_id
         LEFT JOIN users arch   ON arch.id  = c.archived_by
         LEFT JOIN categories cat ON cat.id = c.category_id
         LEFT JOIN lessons l    ON l.course_id = c.id
         LEFT JOIN enrollments e ON e.course_id = c.id
         WHERE ${conditions.join(' AND ')}
         GROUP BY c.id, cat.name, orig.name, orig.email, arch.name
         ORDER BY c.archived_at DESC NULLS LAST, c.updated_at DESC`,
        p
      )
    }

    // ─── حلقات مؤرشفة ────────────────────────────────────────
    if (type === 'all' || type === 'halaqat') {
      const p: any[] = []
      const conditions: string[] = ['h.is_active = FALSE', 'h.archived_at IS NOT NULL']

      if (search) {
        p.push(`%${search}%`)
        conditions.push(`(h.name ILIKE $${p.length} OR h.description ILIKE $${p.length})`)
      }
      if (reason) {
        p.push(reason)
        conditions.push(`h.archive_reason = $${p.length}`)
      }

      halaqat = await query<any>(
        `SELECT
           h.id,
           'halaqah'                         AS item_type,
           h.name,
           h.description,
           NULL::text                        AS thumbnail_url,
           h.is_active,
           h.archived_at,
           h.archive_reason,
           NULL::text                        AS specialization,
           ''                                AS category_name,
           COALESCE(orig.name, '')           AS original_teacher_name,
           orig.email                        AS original_teacher_email,
           COALESCE(arch.name, '')           AS archived_by_name,
           0::int                            AS total_lessons,
           COALESCE(h.current_students, 0)::int AS total_enrolled,
           0::int                            AS completed_enrolled
         FROM halaqat h
         LEFT JOIN users orig ON orig.id = h.original_teacher_id
         LEFT JOIN users arch ON arch.id = h.archived_by
         WHERE ${conditions.join(' AND ')}
         ORDER BY h.archived_at DESC NULLS LAST`,
        p
      )
    }

    // ─── دمج وترتيب ──────────────────────────────────────────
    const combined = [...courses, ...halaqat].sort((a, b) => {
      const da = a.archived_at ? new Date(a.archived_at).getTime() : 0
      const db = b.archived_at ? new Date(b.archived_at).getTime() : 0
      return db - da
    })

    return NextResponse.json({
      data: combined,
      counts: {
        total:   combined.length,
        courses: courses.length,
        halaqat: halaqat.length,
      },
    })
  } catch (error) {
    console.error('[API] admin archive unified error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
