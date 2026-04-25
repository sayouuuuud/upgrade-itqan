import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get lesson
    const lessons = await query(`
      SELECT course_id FROM lessons WHERE id = $1 AND is_public = true
    `, [lessonId])

    if (lessons.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const courseId = lessons[0].course_id

    // Subscribe user to the course
    try {
      await query(`
        INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
        VALUES ($1, $2, 'active', NOW())
      `, [session.sub, courseId])
    } catch (e: any) {
      // Ignore if already enrolled (duplicate key error)
      if (e.code !== '23505') throw e
    }

    // Track public lesson subscription
    try {
      await query(`
        INSERT INTO public_lesson_subscribers (lesson_id, user_id, subscribed_at)
        VALUES ($1, $2, NOW())
      `, [lessonId, session.sub])
    } catch (e: any) {
      // Ignore if already subscribed
      if (e.code !== '23505') throw e
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error subscribing to lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
