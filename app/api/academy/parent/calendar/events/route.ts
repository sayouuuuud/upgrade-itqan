export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'live_session' | 'assignment_deadline' | 'booking'
  course: string
  course_id: string
  link?: string
  status?: string
  scheduled_at?: string
}

function toRiyadhDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

function toRiyadhTime(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = month ? parseInt(month.split('-')[0]) : new Date().getFullYear()
    const mon = month ? parseInt(month.split('-')[1]) : new Date().getMonth() + 1

    const startDate = new Date(Date.UTC(year, mon - 1, 1))
    startDate.setUTCDate(startDate.getUTCDate() - 1)
    const endDate = new Date(Date.UTC(year, mon, 0, 23, 59, 59))
    endDate.setUTCDate(endDate.getUTCDate() + 1)

    // Get linked children for this parent
    const children = await query<{ student_id: string; name: string }>(`
      SELECT psl.student_id, u.name
      FROM parent_student_links psl
      JOIN users u ON u.id = psl.student_id
      WHERE psl.parent_id = $1 AND psl.is_active = TRUE
    `, [session.sub])

    if (children.length === 0) {
      return NextResponse.json({ events: [] })
    }

    const childIds = children.map((c) => c.student_id)
    const childNames = new Map(children.map((c) => [c.student_id, c.name]))

    const events: CalendarEvent[] = []

    // Children's live course sessions (via enrollments)
    const sessions = await query<any>(`
      SELECT DISTINCT cs.id, cs.title, cs.course_id, cs.scheduled_at,
             cs.meeting_link, cs.status, c.title AS course_title,
             e.student_id
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN enrollments e ON e.course_id = cs.course_id
        AND e.student_id = ANY($1)
        AND LOWER(e.status) IN ('active','completed','accepted')
      WHERE cs.scheduled_at >= $2 AND cs.scheduled_at <= $3
        AND (cs.status IS NULL OR cs.status <> 'cancelled')
      ORDER BY cs.scheduled_at ASC
    `, [childIds, startDate.toISOString(), endDate.toISOString()])

    for (const s of sessions) {
      const d = new Date(s.scheduled_at)
      const childName = childNames.get(s.student_id) || ''
      events.push({
        id: `session-${s.id}-${s.student_id}`,
        title: childName ? `${s.title} — ${childName}` : s.title,
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'live_session',
        course: s.course_title || '',
        course_id: s.course_id,
        link: s.meeting_link,
        status: s.status,
        scheduled_at: s.scheduled_at,
      })
    }

    // Children's task deadlines
    const tasks = await query<any>(`
      SELECT DISTINCT t.id, t.title, t.course_id, t.due_date, c.title AS course_title,
             e.student_id
      FROM tasks t
      JOIN courses c ON c.id = t.course_id
      JOIN enrollments e ON e.course_id = t.course_id
        AND e.student_id = ANY($1)
        AND LOWER(e.status) IN ('active','completed','accepted')
      WHERE t.due_date >= $2 AND t.due_date <= $3
    `, [childIds, startDate.toISOString(), endDate.toISOString()])

    for (const t of tasks) {
      const d = new Date(t.due_date)
      const childName = childNames.get(t.student_id) || ''
      events.push({
        id: `task-${t.id}-${t.student_id}`,
        title: childName ? `${t.title} — ${childName}` : t.title,
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'assignment_deadline',
        course: t.course_title || '',
        course_id: t.course_id,
        scheduled_at: t.due_date,
      })
    }

    // Children's reader bookings
    const bookings = await query<any>(`
      SELECT b.id, b.scheduled_at, b.status, b.meeting_link, b.student_id,
             u.name AS reader_name
      FROM bookings b
      JOIN users u ON u.id = b.reader_id
      WHERE b.student_id = ANY($1)
        AND b.scheduled_at >= $2 AND b.scheduled_at <= $3
        AND b.status NOT IN ('cancelled')
    `, [childIds, startDate.toISOString(), endDate.toISOString()])

    for (const b of bookings) {
      const d = new Date(b.scheduled_at)
      const childName = childNames.get(b.student_id) || ''
      events.push({
        id: `booking-${b.id}`,
        title: childName ? `حجز تلاوة — ${childName}` : 'حجز تلاوة',
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'booking',
        course: b.reader_name ? `مع ${b.reader_name}` : 'تلاوة',
        course_id: '',
        link: b.meeting_link,
        status: b.status,
        scheduled_at: b.scheduled_at,
      })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[API] /academy/parent/calendar/events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
