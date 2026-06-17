import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/academy/admin/courses/[id]/review
// Body: { action: 'approve' | 'reject', reason?: string }
//
// Approve  → status = 'published', is_published = true, clears rejection_reason,
//            stamps reviewed_by / reviewed_at, notifies the teacher.
// Reject   → status = 'rejected', stores rejection_reason, stamps reviewed_by /
//            reviewed_at, notifies the teacher so they can edit and resubmit.
//
// Only courses currently in `pending_review` (or already rejected) are accepted
// — admins should not "re-reject" a published course through this endpoint;
// they can use PATCH for that, which preserves the existing flow.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  const REVIEW_ROLES = ['academy_admin', 'admin', 'supervisor', 'content_supervisor']
  const canReview =
    !!session &&
    (REVIEW_ROLES.includes(session.role) ||
      (Array.isArray((session as any).academy_roles) &&
        (session as any).academy_roles.some((r: string) => REVIEW_ROLES.includes(r))))
  if (!canReview) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }

  let body: { action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = body.action
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (action === 'reject' && reason.length < 3) {
    return NextResponse.json(
      { error: 'يجب كتابة سبب الرفض حتى يتمكن المدرس من تعديل الدورة وإعادة إرسالها.' },
      { status: 400 }
    )
  }

  try {
    const courseRows = await query<{
      id: string
      title: string
      status: string
      teacher_id: string | null
    }>(
      `SELECT id, title, status, teacher_id FROM courses WHERE id = $1`,
      [id]
    )
    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    const course = courseRows[0]

    if (action === 'approve') {
      await query(
        `UPDATE courses
            SET status            = 'published',
                is_published      = TRUE,
                rejection_reason  = NULL,
                reviewed_by       = $1,
                reviewed_at       = NOW(),
                updated_at        = NOW()
          WHERE id = $2`,
        [session.sub, id]
      )

      if (course.teacher_id) {
        await createNotification({
          userId: course.teacher_id,
          type: 'general',
          category: 'course',
          title: 'تم قبول دورتك',
          message: `تمت الموافقة على دورة "${course.title}" وأصبحت منشورة للطلاب.`,
          link: `/academy/teacher/courses/${id}`,
        }).catch(() => {})
      }
    } else {
      await query(
        `UPDATE courses
            SET status            = 'rejected',
                is_published      = FALSE,
                rejection_reason  = $1,
                reviewed_by       = $2,
                reviewed_at       = NOW(),
                updated_at        = NOW()
          WHERE id = $3`,
        [reason, session.sub, id]
      )

      if (course.teacher_id) {
        await createNotification({
          userId: course.teacher_id,
          type: 'general',
          category: 'course',
          title: 'تم رفض دورتك — يلزم تعديل',
          message: `دورتك "${course.title}" تم رفضها. السبب: ${reason}. عدِّل المحتوى وأعد إرسالها للمراجعة.`,
          link: `/academy/teacher/courses/${id}`,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Admin course review error:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}
