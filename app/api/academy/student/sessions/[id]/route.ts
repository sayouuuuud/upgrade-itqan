import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { awardSessionAttendancePoints } from '@/lib/academy/gamification'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get session details with course and teacher info
    const sessionData = await queryOne<{
      id: string
      title: string
      public_join_token: string | null
      description: string | null
      course_id: string
      course_title: string
      course_description: string | null
      teacher_id: string
      teacher_name: string
      teacher_avatar: string | null
      scheduled_at: string
      duration_minutes: number
      meeting_link: string | null
      meeting_platform: string | null
      status: string
      recording_url: string | null
      notes: string | null
      attachments: string | null
    }>(
      `SELECT 
         cs.id,
         cs.title,
         cs.public_join_token,
         cs.description,
         cs.course_id,
         c.title as course_title,
         c.description as course_description,
         c.teacher_id,
         COALESCE(u.name, 'غير محدد') as teacher_name,
         u.avatar_url as teacher_avatar,
         cs.scheduled_at,
         cs.duration_minutes,
         cs.meeting_link,
         cs.meeting_platform,
         cs.status,
         cs.recording_url,
         cs.notes,
         cs.attachments
       FROM course_sessions cs
       JOIN courses c ON cs.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id AND e.student_id = $2
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE cs.id = $1`,
      [id, session.sub]
    )

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get attendees count
    const attendeesResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM session_attendance WHERE session_id = $1`,
      [id]
    )

    // Check if current user has attended
    const userAttendance = await queryOne<{ id: string; joined_at: string; left_at: string | null }>(
      `SELECT id, joined_at, left_at FROM session_attendance WHERE session_id = $1 AND student_id = $2`,
      [id, session.sub]
    )

    // Get related materials from the course lessons
    const materials = await query<{
      id: string
      title: string
      type: string
      content_url: string | null
    }>(
      `SELECT id, title, type, content_url 
       FROM academy_lessons 
       WHERE course_id = $1 AND status = 'published'
       ORDER BY "order" ASC
       LIMIT 5`,
      [sessionData.course_id]
    )

    return NextResponse.json({
      session: {
        ...sessionData,
        attendees_count: parseInt(attendeesResult?.count || '0'),
        user_attended: !!userAttendance,
        user_attendance: userAttendance,
        materials,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching session details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark attendance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action } = body // 'join' or 'leave'

  try {
    // Verify the session exists and user is enrolled
    const sessionData = await queryOne<{ id: string; status: string; title: string | null }>(
      `SELECT cs.id, cs.status, cs.title
       FROM course_sessions cs
       JOIN courses c ON cs.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id AND e.student_id = $2
       WHERE cs.id = $1`,
      [id, session.sub]
    )

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (action === 'join') {
      // Check if already joined
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM session_attendance WHERE session_id = $1 AND student_id = $2`,
        [id, session.sub]
      )

      if (existing) {
        return NextResponse.json({ message: 'Already joined' })
      }

      await query(
        `INSERT INTO session_attendance (session_id, student_id, joined_at) VALUES ($1, $2, NOW())`,
        [id, session.sub]
      )

      let points = null
      try {
        points = await awardSessionAttendancePoints(session.sub, id, sessionData.title || undefined)
      } catch (pointsError) {
        console.error('[Gamification] Failed to award session attendance points:', pointsError)
      }

      return NextResponse.json({ success: true, message: 'Joined session', points })
    }

    if (action === 'leave') {
      await query(
        `UPDATE session_attendance SET left_at = NOW() WHERE session_id = $1 AND student_id = $2 AND left_at IS NULL`,
        [id, session.sub]
      )

      return NextResponse.json({ success: true, message: 'Left session' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Error updating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
