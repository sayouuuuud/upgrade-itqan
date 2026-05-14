import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { randomUUID } from 'crypto'

const MEETING_PLATFORMS = ['zoom', 'google_meet', 'custom']

function normalizeMeetingUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()

  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        cs.*,
        c.title as course_name,
        ls.title as series_title,
        COUNT(DISTINCT sa.id)::int as attendance_count
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN lesson_series ls ON cs.series_id = ls.id
      LEFT JOIN session_attendance sa ON cs.id = sa.session_id
      WHERE c.teacher_id = $1
      GROUP BY cs.id, c.title, ls.title
      ORDER BY cs.scheduled_at DESC
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()

  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      course_id,
      title,
      description,
      scheduled_at,
      duration_minutes,
      meeting_link,
      meeting_platform,
      is_public,
      series_title,
      announce_to_students,
    } = body

    if (!course_id || !title || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedMeetingLink = normalizeMeetingUrl(meeting_link)
    if (meeting_link && !normalizedMeetingLink) {
      return NextResponse.json({ error: 'Meeting link must be a valid URL' }, { status: 400 })
    }

    const platform = MEETING_PLATFORMS.includes(meeting_platform) ? meeting_platform : 'custom'

    // Verify teacher owns this course
    const courseCheck = await query('SELECT id FROM courses WHERE id = $1 AND teacher_id = $2', [course_id, session.sub])
    if (courseCheck.length === 0) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 })
    }

    let seriesId: string | null = null
    if (typeof series_title === 'string' && series_title.trim()) {
      const series = await query<{ id: string }>(`
        INSERT INTO lesson_series (teacher_id, title)
        VALUES ($1, $2)
        RETURNING id
      `, [session.sub, series_title.trim()])
      seriesId = series[0]?.id || null
    }

    const publicJoinToken = is_public ? randomUUID().replaceAll('-', '') : null

    const result = await query(`
      INSERT INTO course_sessions (
        course_id, title, description, session_type, scheduled_at, duration_minutes,
        meeting_link, meeting_platform, is_public, public_join_token, series_id,
        status, created_at
      )
      VALUES ($1, $2, $3, 'live', $4, $5, $6, $7, $8, $9, $10, 'scheduled', NOW())
      RETURNING *
    `, [
      course_id,
      title,
      description || null,
      scheduled_at,
      duration_minutes || 60,
      normalizedMeetingLink,
      platform,
      !!is_public,
      publicJoinToken,
      seriesId,
    ])

    if (announce_to_students) {
      const sessionRow = result[0] as { id: string; public_join_token?: string | null }
      const publicPath = sessionRow.public_join_token ? `/academy/public/session/${sessionRow.public_join_token}` : null
      const content = [
        description || 'تمت جدولة جلسة مباشرة جديدة.',
        normalizedMeetingLink ? `رابط الاجتماع: ${normalizedMeetingLink}` : null,
        publicPath ? `رابط الدرس العام: ${publicPath}` : null,
      ].filter(Boolean).join('\n\n')

      const announcement = await query<{ id: string }>(`
        INSERT INTO announcements (
          title_ar, title_en, content_ar, content_en, target_audience,
          priority, is_published, published_at, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, 'students', 'high', true, NOW(), $5, NOW())
        RETURNING id
      `, [title, title, content, content, session.sub])

      if (announcement[0]?.id) {
        await query(`
          UPDATE course_sessions SET announcement_id = $1 WHERE id = $2
        `, [announcement[0].id, sessionRow.id])
      }
    }

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
