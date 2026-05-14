import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await req.json()
  const email = normalizeEmail(body.email)

  if (!email) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  try {
    const session = await queryOne<{
      id: string
      course_id: string
      teacher_id: string
    }>(`
      SELECT cs.id, cs.course_id, c.teacher_id
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      WHERE cs.public_join_token = $1 AND cs.is_public = TRUE
      LIMIT 1
    `, [token])

    if (!session) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    await query(`
      INSERT INTO public_lesson_subscribers (
        email, teacher_id, course_id, session_id, reminder_enabled,
        is_verified, source, subscribed_at
      )
      VALUES ($1, $2, $3, $4, TRUE, TRUE, 'public_session', NOW())
      ON CONFLICT DO NOTHING
    `, [email, session.teacher_id, session.course_id, session.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error subscribing to public session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
