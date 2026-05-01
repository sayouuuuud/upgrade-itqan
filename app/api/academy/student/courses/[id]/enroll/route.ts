import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;

    // 1. Check if already enrolled or requested
    const checkQuery = `SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2`
    const existing = await query(checkQuery, [courseId, session.sub])

    if (existing.length > 0) {
      return NextResponse.json({ error: 'طلب انضمام مسبق موجود' }, { status: 409 })
    }

    // 2. Insert new enrollment request
    const insertQuery = `
      INSERT INTO enrollments (course_id, student_id, status, enrolled_at)
      VALUES ($1, $2, 'pending', NOW())
      RETURNING id
    `
    // We assume columns exist. If not, error will be caught.
    const result = await query(insertQuery, [courseId, session.sub])

    try {
      const courseInfo = await query<any>(
        `SELECT c.title, c.teacher_id, u.name as student_name 
         FROM courses c, users u 
         WHERE c.id = $1 AND u.id = $2`,
        [courseId, session.sub]
      )
      if (courseInfo[0]?.teacher_id) {
        await createNotification({
          userId: courseInfo[0].teacher_id,
          type: 'general',
          title: '📩 طلب انضمام جديد',
          message: `قدم الطالب «${courseInfo[0].student_name || 'طالب'}» طلب انضمام لدورتك «${courseInfo[0].title || 'الدورة'}».`,
          category: 'course',
          link: '/academy/teacher/enrollment-requests',
        })
      }
    } catch (notifErr) {
      console.error('[B-5] Failed to notify teacher:', notifErr)
    }

    return NextResponse.json({ success: true, message: 'تم إرسال طلب الانضمام بنجاح', data: result[0] })
  } catch (error: any) {
    // Return exact error message for debugging
    console.error('[API] Error enrolling:', error)
    return NextResponse.json({ error: error.message || 'Internal server error while enrolling', details: error.stack }, { status: 500 })
  }
}
