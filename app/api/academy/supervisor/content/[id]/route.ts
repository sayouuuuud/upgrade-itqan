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

/**
 * GET /api/academy/supervisor/content/[id]
 * Returns full lesson detail with course + teacher info.
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
  try {
    const rows = await query<any>(
      `
      SELECT
        l.id, l.title, l.description, l.video_url, l.audio_url,
        l.transcript_text, l.duration_minutes, l.order_index,
        l.status, l.review_notes, l.reviewed_at, l.created_at,
        c.id as course_id, c.title as course_title, c.description as course_description,
        u.id as teacher_id, u.name as teacher_name, u.email as teacher_email,
        u.avatar_url as teacher_avatar,
        rev.name as reviewer_name
      FROM lessons l
      JOIN courses c  ON l.course_id = c.id
      JOIN users u    ON c.teacher_id = u.id
      LEFT JOIN users rev ON l.reviewed_by = rev.id
      WHERE l.id = $1
      `,
      [id],
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ lesson: rows[0] })
  } catch (error) {
    console.error('[API] supervisor/content/[id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/academy/supervisor/content/[id]
 * Body: { action: 'approve' | 'reject', notes?: string }
 * Approves or rejects a lesson and notifies the teacher.
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

  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  const isPublished = action === 'approve'

  try {
    const rows = await query<any>(
      `
      UPDATE lessons
      SET status = $1,
          review_notes = $2,
          reviewed_by = $3,
          reviewed_at = NOW(),
          is_published = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, title, status, course_id
      `,
      [newStatus, notes?.trim() || null, session!.sub, isPublished, id],
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 })
    }

    const lesson = rows[0]

    // Notify the teacher who owns the course
    const teacherRow = await query<{ teacher_id: string }>(
      `SELECT teacher_id FROM courses WHERE id = $1`,
      [lesson.course_id],
    )
    const teacherId = teacherRow[0]?.teacher_id

    if (teacherId) {
      await createNotification({
        userId: teacherId,
        type: 'general',
        title: action === 'approve' ? 'تم اعتماد درسك' : 'تم رفض درسك',
        message:
          action === 'approve'
            ? `تم اعتماد الدرس "${lesson.title}" ونشره.`
            : `تم رفض الدرس "${lesson.title}".${notes ? ` السبب: ${notes}` : ''}`,
        category: 'course',
        link: `/academy/teacher/courses/${lesson.course_id}`,
      }).catch(() => {})
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('[API] supervisor/content/[id] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
