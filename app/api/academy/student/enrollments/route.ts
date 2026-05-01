import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query<any>(`
      SELECT 
        e.id,
        e.status,
        e.enrolled_at,
        c.id as course_id,
        c.title as course_title,
        c.level,
        c.thumbnail_url,
        u.name as teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching student enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// B-5: POST — طلب انضمام لدورة + إشعار للأستاذ
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { course_id } = await req.json()
    if (!course_id) {
      return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    }

    // جلب معلومات الدورة والأستاذ
    const courseRes = await query<any>(
      `SELECT c.id, c.title, c.teacher_id, u.name as student_name
       FROM courses c
       CROSS JOIN users u
       WHERE c.id = $1 AND u.id = $2`,
      [course_id, session.sub]
    )
    if (courseRes.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    const course = courseRes[0]

    // تحقق من عدم وجود enrollment سابق
    const existing = await query<any>(
      `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2`,
      [session.sub, course_id]
    )
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already enrolled or requested' }, { status: 400 })
    }

    // إنشاء طلب الانضمام بحالة pending
    const result = await query<any>(
      `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
       VALUES ($1, $2, 'pending', NOW()) RETURNING *`,
      [session.sub, course_id]
    )

    // B-5: إرسال إشعار للأستاذ
    if (course.teacher_id) {
      await createNotification({
        userId: course.teacher_id,
        type: 'general',
        title: 'طلب انضمام جديد لدورتك',
        message: `طلب الطالب ${course.student_name} الانضمام إلى دورة «${course.title}»`,
        category: 'course',
        link: '/academy/teacher/enrollment-requests',
      })
    }

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating enrollment request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

