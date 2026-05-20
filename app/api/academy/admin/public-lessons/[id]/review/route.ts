import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

/**
 * POST /api/academy/admin/public-lessons/[id]/review
 * Body: { action: 'approve' | 'reject', notes?: string }
 *
 * Approving flips `is_published = true` so the episode becomes visible on the
 * public landing page; rejecting keeps it private and stores a note that the
 * teacher can read. Either way we notify the teacher.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin', 'supervisor', 'content_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: { action?: 'approve' | 'reject'; notes?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const reviewStatus = action === 'approve' ? 'approved' : 'rejected'
  const isPublished = action === 'approve'

  const result = await query<{
    id: string; teacher_id: string; title: string; public_slug: string;
    review_status: string; is_published: boolean;
  }>(
    `UPDATE public_lessons
       SET review_status = $1,
           is_published  = $2,
           review_notes  = COALESCE($3, review_notes),
           reviewed_by   = $4,
           reviewed_at   = NOW(),
           updated_at    = NOW()
     WHERE id = $5
     RETURNING id, teacher_id, title, public_slug, review_status, is_published`,
    [reviewStatus, isPublished, body.notes || null, session.sub, id]
  )

  if (result.length === 0) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  const lesson = result[0]

  await createNotification({
    userId: lesson.teacher_id,
    type: 'general',
    category: 'course',
    title: action === 'approve' ? 'تمت الموافقة على الحلقة' : 'تم رفض الحلقة',
    message:
      action === 'approve'
        ? `تمت الموافقة على نشر حلقتك العامة "${lesson.title}"، وأصبحت متاحة الآن للجمهور.`
        : `لم تتم الموافقة على نشر حلقتك العامة "${lesson.title}"${body.notes ? `: ${body.notes}` : '.'}`,
    link: `/academy/teacher/public-lessons/${lesson.id}`,
  }).catch(() => {})

  return NextResponse.json({ data: lesson })
}
