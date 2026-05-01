import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { awardSessionAttendancePoints } from '@/lib/academy/gamification'
import { createNotification } from '@/lib/notifications'

/**
 * POST /api/academy/student/sessions/[id]/attend
 *
 * Records that the authenticated student has joined a live session and
 * awards them attendance points (Phase 5 — Gamification). Idempotent:
 * if a row already exists for this (session, student) we just return it
 * without double-awarding points.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: sessionId } = await params

    // Check the session exists and the student is enrolled in the course.
    const sess = await queryOne<{
      id: string
      title: string | null
      course_id: string
      status: string
    }>(
      `
      SELECT cs.id, cs.title, cs.course_id, cs.status
        FROM course_sessions cs
        JOIN enrollments e ON e.course_id = cs.course_id AND e.student_id = $1
       WHERE cs.id = $2
       LIMIT 1
      `,
      [session.sub, sessionId]
    )
    if (!sess) {
      return NextResponse.json({ error: 'Session not found or not enrolled' }, { status: 404 })
    }

    // Insert attendance row (no-op on conflict).
    const inserted = await query<{ id: string }>(
      `
      INSERT INTO session_attendance (session_id, student_id, joined_at, attendance_status)
      VALUES ($1, $2, NOW(), 'present')
      ON CONFLICT (session_id, student_id) DO NOTHING
      RETURNING id
      `,
      [sessionId, session.sub]
    )

    const isFirstJoin = inserted.length > 0

    let pointsResult: { total_points: number; new_badges: string[] } | null = null
    if (isFirstJoin) {
      try {
        const r = await awardSessionAttendancePoints(
          session.sub,
          sessionId,
          sess.title || undefined,
        )
        pointsResult = { total_points: r.total_points, new_badges: r.new_badges }
        for (const badgeType of r.new_badges) {
          await createNotification({
            userId: session.sub,
            type: 'general',
            title: '🏅 شارة جديدة!',
            message: `حصلت على شارة جديدة (${badgeType}).`,
            category: 'general',
            link: '/academy/student/badges',
          }).catch(() => {})
        }
      } catch (e) {
        console.error('[Gamification] award session attendance failed:', e)
      }
    }

    return NextResponse.json({
      success: true,
      first_join: isFirstJoin,
      points: pointsResult,
    })
  } catch (error) {
    console.error('[API] session/attend POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/academy/student/sessions/[id]/attend
 *
 * Marks the student as having left the session. Sets `left_at` and
 * recomputes `duration_minutes`.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: sessionId } = await params
    await query(
      `
      UPDATE session_attendance
         SET left_at = NOW(),
             duration_minutes = GREATEST(
               1,
               EXTRACT(EPOCH FROM (NOW() - joined_at))::int / 60
             )
       WHERE session_id = $1 AND student_id = $2
      `,
      [sessionId, session.sub]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] session/attend PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
