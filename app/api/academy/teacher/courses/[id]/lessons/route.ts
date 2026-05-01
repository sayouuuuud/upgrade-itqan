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

    // Check if teacher owns course
    const ownCheck = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
    if (ownCheck.length === 0 && session.role === 'teacher') {
      return NextResponse.json({ error: 'Unauthorized course' }, { status: 403 })
    }

    // B-7: المشرفون وأدمن يشوفوا كل الدروس، المدرس يشوفهم كلهم، الطلاب يشوفوا published فقط
    const lessonsResult = await query(`SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC`, [courseId])

    return NextResponse.json({ lessons: lessonsResult })
  } catch (error) {
    console.error('[API] Error fetching lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;

    // Check if teacher owns course
    const ownCheck = await query<any>(`SELECT id, title FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
    if (ownCheck.length === 0) {
      return NextResponse.json({ error: 'Unauthorized course' }, { status: 403 })
    }
    const courseTitle = ownCheck[0]?.title || 'دورة'

    const body = await req.json()
    const { title, description, video_url, duration_minutes, attachments } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get next order index
    const orderQuery = `SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM lessons WHERE course_id = $1`
    const orderResult = await query<any>(orderQuery, [courseId])
    const orderIndex = orderResult[0]?.next_order || 1

    // B-7: إدراج الدرس بحالة pending_review بدل published
    const insertQuery = `
      INSERT INTO lessons (course_id, title, description, video_url, order_index, lesson_order, duration_minutes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $5, $6, 'pending_review', NOW())
      RETURNING *
    `
    const result = await query(insertQuery, [
      courseId, title, description || null, video_url || null, orderIndex, duration_minutes || null
    ])
    const newLesson = result[0] as any;

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        let fileType = 'OTHER'
        const ext = att.name.split('.').pop()?.toUpperCase()
        if (['PDF', 'DOC', 'DOCX', 'XLSX', 'PPTX', 'ZIP'].includes(ext || '')) fileType = ext!

        await query(`
          INSERT INTO lesson_attachments (lesson_id, file_url, file_type, file_name)
          VALUES ($1, $2, $3, $4)
        `, [newLesson.id, att.url, fileType, att.name])
      }
    }

    // B-7: إشعار للمشرفين بدرس جديد ينتظر المراجعة
    try {
      const supervisors = await query<any>(
        `SELECT DISTINCT u.id FROM users u
         WHERE u.is_active = true
           AND (u.role IN ('admin', 'academy_admin')
             OR u.academy_roles && ARRAY['supervisor', 'content_supervisor', 'quality_supervisor']::varchar[])`,
        []
      )
      for (const sup of supervisors) {
        await createNotification({
          userId: sup.id,
          type: 'general',
          title: '📚 درس جديد ينتظر المراجعة',
          message: `رفع المدرس درساً جديداً «${title}» في دورة «${courseTitle}» وينتظر موافقتك قبل النشر.`,
          category: 'course',
          link: `/academy/supervisor/content`,
        })
      }
    } catch (notifErr) {
      console.error('[B-7] Failed to notify supervisors:', notifErr)
    }

    return NextResponse.json({ success: true, data: newLesson }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

