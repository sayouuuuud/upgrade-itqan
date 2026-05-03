import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get the active or upcoming session for this teacher
    const sessionResult = await query<any>(`
      SELECT 
        cs.id,
        cs.title,
        cs.course_id,
        cs.scheduled_at,
        cs.meeting_url,
        cs.duration_minutes,
        cs.status,
        c.title as course_title
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      WHERE c.teacher_id = $1
        AND cs.status IN ('scheduled', 'live')
        AND cs.scheduled_at >= NOW() - INTERVAL '2 hours'
      ORDER BY 
        CASE WHEN cs.status = 'live' THEN 0 ELSE 1 END,
        cs.scheduled_at ASC
      LIMIT 1
    `, [session.sub])

    if (sessionResult.length === 0) {
      return NextResponse.json(null)
    }

    const liveSession = sessionResult[0]

    // Get participants who joined this session
    const participants = await query<any>(`
      SELECT 
        sp.id,
        sp.joined_at,
        u.name,
        u.email
      FROM session_participants sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.session_id = $1
        AND sp.left_at IS NULL
      ORDER BY sp.joined_at ASC
    `, [liveSession.id])

    return NextResponse.json({
      id: liveSession.id,
      title: liveSession.title || liveSession.course_title,
      course: liveSession.course_title,
      course_id: liveSession.course_id,
      scheduled_at: liveSession.scheduled_at,
      meeting_url: liveSession.meeting_url,
      duration: liveSession.duration_minutes || 60,
      status: liveSession.status,
      participants: participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        join_time: new Date(p.joined_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      }))
    })
  } catch (error) {
    console.error('[API] Error fetching live session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { course_id, title, duration_minutes, meeting_url } = body

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Verify teacher owns this course
    const courseCheck = await query<any>(`
      SELECT id FROM courses WHERE id = $1 AND teacher_id = $2
    `, [course_id, session.sub])

    if (courseCheck.length === 0) {
      return NextResponse.json({ error: 'Unauthorized course' }, { status: 403 })
    }

    // Create new live session
    const result = await query<any>(`
      INSERT INTO course_sessions (
        course_id, 
        title, 
        scheduled_at, 
        duration_minutes, 
        meeting_url, 
        status,
        created_at
      )
      VALUES ($1, $2, NOW(), $3, $4, 'live', NOW())
      RETURNING *
    `, [course_id, title || 'جلسة حية', duration_minutes || 60, meeting_url])

    return NextResponse.json({ success: true, session: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating live session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { session_id, action } = body

    if (!session_id || !action) {
      return NextResponse.json({ error: 'Session ID and action required' }, { status: 400 })
    }

    // Verify teacher owns this session's course
    const sessionCheck = await query<any>(`
      SELECT cs.id, c.teacher_id 
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      WHERE cs.id = $1
    `, [session_id])

    if (sessionCheck.length === 0 || sessionCheck[0].teacher_id !== session.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let newStatus = 'scheduled'
    if (action === 'start') {
      newStatus = 'live'
    } else if (action === 'end') {
      newStatus = 'completed'
    }

    await query(`
      UPDATE course_sessions 
      SET status = $1, 
          ended_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE ended_at END
      WHERE id = $2
    `, [newStatus, session_id])

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('[API] Error updating live session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
