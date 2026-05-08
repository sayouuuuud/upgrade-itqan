import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'live_session' | 'assignment_deadline' | 'review' | 'lesson'
  course: string
  course_id: string
  link?: string
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const year = month ? parseInt(month.split('-')[0]) : new Date().getFullYear()
    const monthNum = month ? parseInt(month.split('-')[1]) : new Date().getMonth() + 1

    // Calculate start and end of month
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)

    const events: CalendarEvent[] = []

    // 1. Get enrolled courses for this student
    const enrollments = await query<any>(`
      SELECT 
        ce.course_id,
        c.title as course_title
      FROM course_enrollments ce
      JOIN courses c ON c.id = ce.course_id
      WHERE ce.student_id = $1 
        AND ce.status = 'enrolled'
    `, [session.sub])

    const courseIds = enrollments.map(e => e.course_id)
    const courseMap = new Map(enrollments.map(e => [e.course_id, e.course_title]))

    if (courseIds.length === 0) {
      return NextResponse.json({ events: [] })
    }

    // 2. Get live sessions (from course_sessions table)
    const liveSessions = await query<any>(`
      SELECT 
        cs.id,
        cs.title,
        cs.course_id,
        cs.scheduled_at,
        cs.meeting_url,
        cs.duration_minutes
      FROM course_sessions cs
      WHERE cs.course_id = ANY($1)
        AND cs.scheduled_at >= $2
        AND cs.scheduled_at <= $3
        AND cs.status != 'cancelled'
      ORDER BY cs.scheduled_at ASC
    `, [courseIds, startDate.toISOString(), endDate.toISOString()])

    for (const session of liveSessions) {
      const schedDate = new Date(session.scheduled_at)
      events.push({
        id: `session-${session.id}`,
        title: session.title || 'جلسة حية',
        date: schedDate.toISOString().split('T')[0],
        time: schedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'live_session',
        course: courseMap.get(session.course_id) || 'دورة',
        course_id: session.course_id,
        link: session.meeting_url
      })
    }

    // 3. Get task deadlines
    const tasks = await query<any>(`
      SELECT 
        t.id,
        t.title,
        t.course_id,
        t.due_date
      FROM tasks t
      WHERE t.course_id = ANY($1)
        AND t.due_date >= $2
        AND t.due_date <= $3
        AND t.status = 'published'
      ORDER BY t.due_date ASC
    `, [courseIds, startDate.toISOString(), endDate.toISOString()])

    for (const task of tasks) {
      const dueDate = new Date(task.due_date)
      events.push({
        id: `task-${task.id}`,
        title: `تسليم: ${task.title}`,
        date: dueDate.toISOString().split('T')[0],
        time: dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'assignment_deadline',
        course: courseMap.get(task.course_id) || 'دورة',
        course_id: task.course_id
      })
    }

    // 4. Get scheduled lessons (if they have a scheduled_at date)
    const lessons = await query<any>(`
      SELECT 
        l.id,
        l.title,
        l.course_id,
        l.scheduled_at
      FROM lessons l
      WHERE l.course_id = ANY($1)
        AND l.scheduled_at IS NOT NULL
        AND l.scheduled_at >= $2
        AND l.scheduled_at <= $3
        AND l.status = 'published'
      ORDER BY l.scheduled_at ASC
    `, [courseIds, startDate.toISOString(), endDate.toISOString()])

    for (const lesson of lessons) {
      const schedDate = new Date(lesson.scheduled_at)
      events.push({
        id: `lesson-${lesson.id}`,
        title: lesson.title,
        date: schedDate.toISOString().split('T')[0],
        time: schedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'lesson',
        course: courseMap.get(lesson.course_id) || 'دورة',
        course_id: lesson.course_id
      })
    }

    // Sort all events by date and time
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.time.localeCompare(b.time)
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[API] Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
