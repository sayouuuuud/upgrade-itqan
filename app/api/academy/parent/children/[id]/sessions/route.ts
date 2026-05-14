import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id: childId } = await params
  const link = await getActiveParentChild(session.sub, childId)
  if (!link) {
    return NextResponse.json({ error: 'الطالب غير مربوط بحسابك' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  // 1) Recitation bookings (1-to-1 sessions with reader)
  const bookings = await query<{
    id: string
    type: string
    title: string
    scheduled_at: string
    status: string
    duration_minutes: number | null
    counterpart_id: string | null
    counterpart_name: string | null
    student_joined_at: string | null
    started_at: string | null
    ended_at: string | null
  }>(
    `SELECT b.id,
            'booking' AS type,
            CONCAT('جلسة تسميع مع ', u.name) AS title,
            b.scheduled_at,
            b.status,
            b.duration_minutes,
            b.reader_id AS counterpart_id,
            u.name AS counterpart_name,
            b.student_joined_at,
            b.started_at,
            b.ended_at
     FROM bookings b
     LEFT JOIN users u ON u.id = b.reader_id
     WHERE b.student_id = $1
     ORDER BY b.scheduled_at DESC
     LIMIT $2`,
    [childId, limit]
  )

  // 2) Course sessions (academy live sessions for courses the student is enrolled in)
  const courseSessions = await query<{
    id: string
    type: string
    title: string
    scheduled_at: string
    status: string
    duration_minutes: number | null
    counterpart_id: string | null
    counterpart_name: string | null
    course_title: string | null
  }>(
    `SELECT cs.id,
            'course_session' AS type,
            cs.title,
            cs.scheduled_at,
            cs.status,
            cs.duration_minutes,
            cs.teacher_id AS counterpart_id,
            u.name AS counterpart_name,
            c.title AS course_title
     FROM course_sessions cs
     JOIN courses c ON c.id = cs.course_id
     JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1
     LEFT JOIN users u ON u.id = cs.teacher_id
     WHERE e.status = 'active'
     ORDER BY cs.scheduled_at DESC
     LIMIT $2`,
    [childId, limit]
  )

  return NextResponse.json({ bookings, course_sessions: courseSessions })
}
