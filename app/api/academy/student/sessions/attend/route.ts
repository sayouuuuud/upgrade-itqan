import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { awardAttendancePoints } from '@/lib/academy/points'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    // Check session exists
    const cs = await queryOne<{ id: string }>(
      `SELECT id FROM course_sessions WHERE id = $1`,
      [session_id],
    )
    if (!cs) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Upsert attendance
    const att = await query(
      `INSERT INTO session_attendance (session_id, student_id, joined_at, attendance_status)
       VALUES ($1, $2, NOW(), 'present')
       ON CONFLICT (session_id, student_id) DO UPDATE SET
         attendance_status = 'present',
         joined_at = COALESCE(session_attendance.joined_at, NOW())
       RETURNING *`,
      [session_id, session.sub],
    )

    // Award attendance points (+20) — only once per session
    try {
      const alreadyAwarded = await query(
        `SELECT id FROM points_log
         WHERE user_id = $1 AND reason = 'session_attend' AND related_entity_id = $2
         LIMIT 1`,
        [session.sub, session_id],
      )
      if (alreadyAwarded.length === 0) {
        await awardAttendancePoints(session.sub, session_id)
      }
    } catch (e) {
      console.error('Failed to award attendance points:', e)
    }

    return NextResponse.json({ success: true, data: att[0] })
  } catch (error) {
    console.error('[API] Error recording attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
