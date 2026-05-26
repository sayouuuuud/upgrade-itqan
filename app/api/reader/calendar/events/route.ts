export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'booking'
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
  if (!session || session.role !== 'reader') {
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

    const bookings = await query<any>(`
      SELECT b.id, b.scheduled_at, b.duration_minutes, b.status,
             b.meeting_link, u.name AS student_name
      FROM bookings b
      JOIN users u ON u.id = b.student_id
      WHERE b.reader_id = $1
        AND b.scheduled_at >= $2 AND b.scheduled_at <= $3
        AND b.status NOT IN ('cancelled')
      ORDER BY b.scheduled_at ASC
    `, [session.sub, startDate.toISOString(), endDate.toISOString()])

    const events: CalendarEvent[] = bookings.map((b: any) => {
      const d = new Date(b.scheduled_at)
      return {
        id: `booking-${b.id}`,
        title: `${b.student_name || 'طالب'}`,
        date: toRiyadhDate(d),
        time: toRiyadhTime(d),
        type: 'booking' as const,
        course: 'حجز تلاوة',
        course_id: '',
        link: b.meeting_link,
        status: b.status,
        scheduled_at: b.scheduled_at,
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[API] /reader/calendar/events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
