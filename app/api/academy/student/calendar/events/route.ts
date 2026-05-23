export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CalendarEvent {
  id: string
  title: string
  date: string   // YYYY-MM-DD in Asia/Riyadh timezone
  time: string   // HH:mm in Asia/Riyadh timezone
  type: 'live_session' | 'assignment_deadline' | 'lesson' | 'memorization_goal'
  course: string
  course_id: string
  link?: string
  status?: string
  scheduled_at?: string  // raw UTC ISO string for client-side conversion
  meta?: Record<string, any>
}

// Format a JS Date into YYYY-MM-DD using Riyadh timezone (academy official tz)
function toRiyadhDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// Format a JS Date into HH:mm using Riyadh timezone
function toRiyadhTime(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // YYYY-MM
    const year  = month ? parseInt(month.split('-')[0]) : new Date().getFullYear()
    const mon   = month ? parseInt(month.split('-')[1]) : new Date().getMonth() + 1

    // Extend range by 1 day on each side to catch UTC midnight edge cases
    const startDate = new Date(Date.UTC(year, mon - 1, 1))
    startDate.setUTCDate(startDate.getUTCDate() - 1)
    const endDate = new Date(Date.UTC(year, mon, 0, 23, 59, 59))
    endDate.setUTCDate(endDate.getUTCDate() + 1)

    const events: CalendarEvent[] = []

    // ─── 1. LIVE SESSIONS ────────────────────────────────────────────────────
    // Exact same JOIN pattern as /api/academy/student/sessions/route.ts
    const liveSessions = await query<any>(`
      SELECT
        cs.id,
        cs.title,
        cs.course_id,
        cs.scheduled_at,
        cs.meeting_link,
        cs.duration_minutes,
        c.title AS course_title
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN enrollments e ON e.course_id = cs.course_id AND e.student_id = $1
      WHERE cs.scheduled_at >= $2
        AND cs.scheduled_at <= $3
        AND cs.status != 'cancelled'
      ORDER BY cs.scheduled_at ASC
    `, [session.sub, startDate.toISOString(), endDate.toISOString()])

    for (const s of liveSessions) {
      const d = new Date(s.scheduled_at)
      events.push({
        id: `session-${s.id}`,
        title: s.title || 'جلسة حية',
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'live_session',
        course: s.course_title || 'دورة',
        course_id: s.course_id,
        link: s.meeting_link,
        scheduled_at: s.scheduled_at,
      })
    }

    // ─── 2. TASK DEADLINES ────────────────────────────────────────────────────
    const tasks = await query<any>(`
      SELECT
        t.id,
        t.title,
        t.course_id,
        t.due_date,
        c.title AS course_title
      FROM tasks t
      JOIN courses c ON c.id = t.course_id
      JOIN enrollments e ON e.course_id = t.course_id AND e.student_id = $1
      WHERE t.due_date >= $2
        AND t.due_date <= $3
        AND t.status IN ('pending', 'active')
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
        course: t.course_title || 'دورة',
        course_id: t.course_id,
        scheduled_at: t.due_date,
      })
    }

    // Mark tasks that the student already submitted
    if (events.some(e => e.type === 'assignment_deadline')) {
      const taskIds = events
        .filter(e => e.type === 'assignment_deadline')
        .map(e => e.id.replace(/^task-/, ''))
      const subs = await query<any>(`
        SELECT task_id, status FROM task_submissions
        WHERE student_id = $1 AND task_id = ANY($2)
      `, [session.sub, taskIds])
      const subMap = new Map(subs.map((s: any) => [s.task_id, s.status]))
      for (const ev of events) {
        if (ev.type === 'assignment_deadline') {
          const st = subMap.get(ev.id.replace(/^task-/, ''))
          if (st) ev.status = st
        }
      }
    }

    // ─── 3. SCHEDULED LESSONS ─────────────────────────────────────────────────
    // Lessons do not have a scheduled_at column in the database.
    // They are self-paced and don't belong in the calendar query directly.


    // Sort by date then time
    events.sort((a, b) => {
      const dc = a.date.localeCompare(b.date)
      return dc !== 0 ? dc : a.time.localeCompare(b.time)
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[calendar/events] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
