import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

type PublicSession = {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  meeting_platform: string | null
  status: string
  teacher_id: string
  teacher_name: string
  teacher_bio: string | null
  course_title: string
  course_description: string | null
  series_id: string | null
  series_title: string | null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const session = await queryOne<PublicSession>(`
      SELECT
        cs.id,
        cs.title,
        cs.description,
        cs.scheduled_at,
        cs.duration_minutes,
        cs.meeting_link,
        cs.meeting_platform,
        cs.status,
        c.teacher_id,
        COALESCE(u.name, 'غير محدد') as teacher_name,
        u.bio as teacher_bio,
        c.title as course_title,
        c.description as course_description,
        cs.series_id,
        ls.title as series_title
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      LEFT JOIN users u ON u.id = c.teacher_id
      LEFT JOIN lesson_series ls ON ls.id = cs.series_id
      WHERE cs.public_join_token = $1 AND cs.is_public = TRUE
      LIMIT 1
    `, [token])

    if (!session) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const seriesSessions = session.series_id
      ? await query<{
          id: string
          title: string
          scheduled_at: string
          public_join_token: string | null
          status: string
        }>(`
          SELECT id, title, scheduled_at, public_join_token, status
          FROM course_sessions
          WHERE series_id = $1 AND is_public = TRUE
          ORDER BY scheduled_at ASC
        `, [session.series_id])
      : []

    return NextResponse.json({ data: { ...session, series_sessions: seriesSessions } })
  } catch (error) {
    console.error('[API] Error fetching public session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
