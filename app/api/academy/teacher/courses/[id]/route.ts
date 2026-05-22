import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;

    // Course Data
    const courseQuery = `
      SELECT c.*, cat.name as category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1 AND c.teacher_id = $2
    `
    const courses = await query<any>(courseQuery, [courseId, session.sub])
    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
    }

    // Lessons
    const lessonsQuery = `
      SELECT id, title, description, video_url, order_index, duration_minutes, created_at
      FROM lessons
      WHERE course_id = $1
      ORDER BY order_index ASC
    `
    const lessons = await query<any>(lessonsQuery, [courseId])

    // Fetch attachments for these lessons
    if (lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id)
      const attachmentsQuery = `
        SELECT id, lesson_id, file_url, file_name, file_type
        FROM lesson_attachments
        WHERE lesson_id = ANY($1)
      `
      const allAttachments = await query<any>(attachmentsQuery, [lessonIds])

      // Map attachments to lessons
      lessons.forEach(lesson => {
        lesson.attachments = allAttachments.filter(a => a.lesson_id === lesson.id).map(a => ({
          id: a.id,
          name: a.file_name,
          url: a.file_url,
          type: a.file_type
        }))
      })
    }

    // Pending requests count
    const pendingQuery = `
      SELECT COUNT(*)::int as pending_count 
      FROM enrollments
      WHERE course_id = $1 AND status = 'pending'
    `
    const pending = await query<any>(pendingQuery, [courseId])

    return NextResponse.json({
      course: courses[0],
      lessons,
      pending_requests: pending[0]?.pending_count || 0
    })
  } catch (error) {
    console.error('[API] Error fetching teacher course detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;
    const body = await req.json()
    const { title, description, thumbnail_url, level, category_id, status } = body

    // Ownership check for teachers; admins/academy_admins can update any course.
    if (session.role === 'teacher') {
      const own = await query<{ teacher_id: string; status: string; title: string }>(
        `SELECT teacher_id, status, title FROM courses WHERE id = $1`,
        [courseId]
      )
      if (own.length === 0) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      if (own[0].teacher_id !== session.sub) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Teachers are not allowed to publish courses directly. Any "published"
    // / "approved" transition coming from a teacher is downgraded to
    // "pending_review" so an academy admin or content supervisor can vet
    // the course first. Admin and academy_admin sessions keep full control.
    let statusToSet: string | undefined = status
    if (statusToSet && session.role === 'teacher') {
      if (statusToSet === 'published' || statusToSet === 'approved') {
        statusToSet = 'pending_review'
      }
    }

    // When a course moves into pending_review (teacher submitting or
    // resubmitting), clear the previous rejection_reason and stamp the
    // submission timestamp so the admin sees a fresh review state.
    const isSubmittingForReview = statusToSet === 'pending_review'

    const updateParams: unknown[] = [
      title,
      description,
      thumbnail_url,
      level,
      category_id,
      statusToSet,
      courseId,
    ]
    if (session.role === 'teacher') updateParams.push(session.sub)
    const submitFlagIdx = updateParams.length + 1
    updateParams.push(isSubmittingForReview)

    const updateQuery = `
      UPDATE courses SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        thumbnail_url = COALESCE($3, thumbnail_url),
        level = COALESCE($4, level),
        category_id = COALESCE($5, category_id),
        status = COALESCE($6, status),
        rejection_reason = CASE WHEN $${submitFlagIdx}::boolean THEN NULL ELSE rejection_reason END,
        submitted_for_review_at = CASE WHEN $${submitFlagIdx}::boolean THEN NOW() ELSE submitted_for_review_at END,
        updated_at = NOW()
      WHERE id = $7 ${session.role === 'teacher' ? 'AND teacher_id = $8' : ''}
      RETURNING *
    `
    const result = await query<any>(updateQuery, updateParams)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Update failed' }, { status: 400 })
    }

    // When a teacher submits a course for review, notify admins / academy
    // admins / content supervisors so the course can be approved or rejected.
    if (session.role === 'teacher' && statusToSet === 'pending_review') {
      try {
        const reviewers = await query<{ id: string; role: string }>(
          `SELECT id, role FROM users
             WHERE is_active = true
               AND (
                 role IN ('content_supervisor', 'supervisor', 'admin', 'academy_admin')
                 OR academy_roles && ARRAY['content_supervisor','supervisor']::varchar[]
               )`,
        )
        for (const r of reviewers) {
          await createNotification({
            userId: r.id,
            type: 'general',
            category: 'course',
            title: 'دورة جديدة تنتظر المراجعة',
            message: `رفع المدرس دورة "${result[0].title}" للمراجعة وتنتظر موافقتك قبل النشر.`,
            link: '/academy/admin/courses',
          }).catch(() => {})
        }
      } catch (notifErr) {
        console.error('[API] Failed to notify reviewers about course submission:', notifErr)
      }
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('[API] Error updating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/academy/teacher/courses/[id]
// Teachers may permanently delete *their own* courses provided no students
// are enrolled. Admins and academy admins may delete any course. We refuse
// deletion when active enrollments exist so historic progress isn't lost
// silently — the teacher should archive instead.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id

    if (session.role === 'teacher') {
      const own = await query<{ id: string }>(
        `SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`,
        [courseId, session.sub]
      )
      if (own.length === 0) {
        return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
      }
    }

    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1'

    const enrollmentRows = await query<{ enrolled: string }>(
      `SELECT COUNT(*)::int as enrolled FROM enrollments
         WHERE course_id = $1
           AND LOWER(status) IN ('active', 'completed', 'accepted')`,
      [courseId]
    )
    const activeEnrolled = Number((enrollmentRows[0] as any)?.enrolled || 0)
    if (activeEnrolled > 0 && !force) {
      return NextResponse.json({
        error: 'has_active_enrollments',
        message: `لا يمكن حذف الدورة حالياً: يوجد ${activeEnrolled} طالب ملتحق. الرجاء أرشفة الدورة أو تأكيد الحذف.`,
        enrolled_count: activeEnrolled,
      }, { status: 409 })
    }

    const del = await query<{ id: string; title: string }>(
      `DELETE FROM courses WHERE id = $1
         ${session.role === 'teacher' ? 'AND teacher_id = $2' : ''}
         RETURNING id, title`,
      session.role === 'teacher' ? [courseId, session.sub] : [courseId]
    )
    if (del.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, deleted: del[0] })
  } catch (error: any) {
    // Foreign-key violations bubble up here — surface a friendly message.
    if (error?.code === '23503') {
      return NextResponse.json({
        error: 'has_dependencies',
        message: 'لا يمكن حذف الدورة لوجود بيانات مرتبطة. حاول أرشفة الدورة بدلاً من الحذف.',
      }, { status: 409 })
    }
    console.error('[API] Error deleting course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
