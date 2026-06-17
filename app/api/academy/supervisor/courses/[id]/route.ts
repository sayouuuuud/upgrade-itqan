import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
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
 * GET /api/academy/supervisor/courses/[id]
 * Full course detail (with lessons) for the content supervisor review page.
 * Approve/reject is performed via POST /api/academy/admin/courses/[id]/review.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!isAllowed(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }

  try {
    const courseRows = await query<any>(
      `
      SELECT
        c.*,
        COALESCE(cat.name, '') AS category_name,
        COALESCE(u.name, '')   AS teacher_name,
        u.email                AS teacher_email,
        u.avatar_url           AS teacher_avatar,
        rev.name               AS reviewer_name
      FROM courses c
      LEFT JOIN users u        ON u.id = c.teacher_id
      LEFT JOIN users rev      ON rev.id = c.reviewed_by
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [id],
    )
    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    const lessons = await query<any>(
      `SELECT id, title, description, video_url, order_index, duration_minutes, status, created_at
         FROM lessons
        WHERE course_id = $1
        ORDER BY order_index ASC`,
      [id],
    )

    return NextResponse.json({ course: courseRows[0], lessons })
  } catch (error: any) {
    console.error('[API] supervisor/courses/[id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
