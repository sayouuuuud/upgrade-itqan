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
    const lessons = await query<any>(`
      SELECT
        l.id,
        l.title,
        l.course_id,
        l.scheduled_at,
        c.title AS course_title
      FROM lessons l
      JOIN courses c ON c.id = l.course_id
      JOIN enrollments e ON e.course_id = l.course_id AND e.student_id = $1
      WHERE l.scheduled_at IS NOT NULL
        AND l.scheduled_at >= $2
        AND l.scheduled_at <= $3
        AND l.status = 'published'
      ORDER BY l.scheduled_at ASC
    `, [session.sub, startDate.toISOString(), endDate.toISOString()])

    for (const l of lessons) {
      const d = new Date(l.scheduled_at)
      events.push({
        id: `lesson-${l.id}`,
        title: l.title,
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'lesson',
        course: l.course_title || 'دورة',
        course_id: l.course_id,
        scheduled_at: l.scheduled_at,
      })
    }

    // ─── 4. MEMORIZATION GOALS ────────────────────────────────────────────────
    try {
      const goals = await query<any>(`
        SELECT id, week_start, surah_from, ayah_from, surah_to, ayah_to,
               target_verses, notes, status, completed_at
          FROM memorization_goals
         WHERE student_id = $1
           AND week_start >= $2::date - INTERVAL '7 days'
           AND week_start <= $3::date
      `, [session.sub,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]])

      for (const g of goals) {
        const weekStart = new Date(g.week_start)
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart)
          day.setUTCDate(day.getUTCDate() + i)
          if (day < startDate || day > endDate) continue
          events.push({
            id: `goal-${g.id}-${i}`,
            title: g.target_verses
              ? `هدف الحفظ: ${g.target_verses} آية`
              : 'هدف الحفظ الأسبوعي',
            date: toRiyadhDate(day),
            time: '07:00',
            type: 'memorization_goal',
            course: 'الحفظ والمراجعة',
            course_id: '',
            link: '/academy/student/memorization/goal',
            status: g.status,
            meta: {
              surah_from: g.surah_from,
              ayah_from: g.ayah_from,
              surah_to: g.surah_to,
              ayah_to: g.ayah_to,
              target_verses: g.target_verses,
              notes: g.notes,
              week_start: g.week_start,
            },
          })
        }
      }
    } catch {
      // memorization_goals table may not exist yet — ignore
    }

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
