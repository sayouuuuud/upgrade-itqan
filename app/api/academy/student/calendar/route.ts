import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  type: 'live_session' | 'assignment_deadline' | 'review'
  course: string
  link?: string | null
  meta?: Record<string, unknown>
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * GET /api/academy/student/calendar
 *
 * Aggregates calendar events visible to the authenticated student:
 *   - course_sessions for courses the student is enrolled in
 *   - tasks (assignments) due dates assigned to the student
 *
 * Optional query params:
 *   - from=YYYY-MM-DD
 *   - to=YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Live + scheduled sessions for the student's enrolled courses
    const sessionsRows = await query<{
      id: string
      title: string
      scheduled_at: string
      duration_minutes: number | null
      meeting_link: string | null
      status: string
      course_title: string
    }>(
      `
      SELECT cs.id, cs.title, cs.scheduled_at, cs.duration_minutes, cs.meeting_link, cs.status, c.title AS course_title
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1 AND e.status IN ('active','completed')
      WHERE cs.scheduled_at IS NOT NULL
        AND ($2::timestamptz IS NULL OR cs.scheduled_at >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR cs.scheduled_at <= $3::timestamptz)
      ORDER BY cs.scheduled_at ASC
      `,
      [session.sub, from || null, to || null]
    )

    // Tasks due dates
    const tasksRows = await query<{
      id: string
      title: string
      due_date: string
      course_title: string | null
    }>(
      `
      SELECT t.id, t.title, t.due_date, c.title AS course_title
      FROM tasks t
      LEFT JOIN courses c ON c.id = t.course_id
      WHERE t.due_date IS NOT NULL
        AND (
          t.assigned_to = $1
          OR (
            t.assigned_to IS NULL
            AND EXISTS (
              SELECT 1 FROM enrollments e
              WHERE e.course_id = t.course_id AND e.student_id = $1 AND e.status IN ('active','completed')
            )
          )
        )
        AND ($2::timestamptz IS NULL OR t.due_date >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR t.due_date <= $3::timestamptz)
      ORDER BY t.due_date ASC
      `,
      [session.sub, from || null, to || null]
    )

    const events: CalendarEvent[] = []

    for (const s of sessionsRows) {
      const d = new Date(s.scheduled_at)
      events.push({
        id: `session_${s.id}`,
        title: s.title,
        date: toDateStr(d),
        time: toTimeStr(d),
        type: 'live_session',
        course: s.course_title,
        link: s.meeting_link,
        meta: { duration_minutes: s.duration_minutes, status: s.status },
      })
    }

    for (const t of tasksRows) {
      const d = new Date(t.due_date)
      events.push({
        id: `task_${t.id}`,
        title: t.title,
        date: toDateStr(d),
        time: toTimeStr(d),
        type: 'assignment_deadline',
        course: t.course_title || '',
      })
    }

    events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('[API] /academy/student/calendar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
