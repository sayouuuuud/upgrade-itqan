export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'live_session' | 'assignment_deadline'
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
  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
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

    const events: CalendarEvent[] = []

    const sessions = await query<any>(`
      SELECT cs.id, cs.title, cs.course_id, cs.scheduled_at, cs.meeting_link,
             cs.status, c.title AS course_title
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      WHERE c.teacher_id = $1
        AND cs.scheduled_at >= $2 AND cs.scheduled_at <= $3
        AND (cs.status IS NULL OR cs.status <> 'cancelled')
      ORDER BY cs.scheduled_at ASC
    `, [session.sub, startDate.toISOString(), endDate.toISOString()])

    for (const s of sessions) {
      const d = new Date(s.scheduled_at)
      events.push({
        id: `session-${s.id}`,
        title: s.title || 'جلسة',
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

    const tasks = await query<any>(`
      SELECT t.id, t.title, t.course_id, t.due_date, c.title AS course_title
      FROM tasks t
      LEFT JOIN courses c ON c.id = t.course_id
      WHERE (t.assigned_by = $1 OR (t.course_id IS NOT NULL AND c.teacher_id = $1))
        AND t.due_date >= $2 AND t.due_date <= $3
      ORDER BY t.due_date ASC
    `, [session.sub, startDate.toISOString(), endDate.toISOString()])

    for (const t of tasks) {
      const d = new Date(t.due_date)
      events.push({
        id: `task-${t.id}`,
        title: `تسليم: ${t.title}`,
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'assignment_deadline',
        course: t.course_title || '',
        course_id: t.course_id,
        scheduled_at: t.due_date,
      })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[API] /academy/teacher/calendar/events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
