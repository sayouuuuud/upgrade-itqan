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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()

    if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await req.json()
        const {
            title,
            description,
            scheduled_at,
            duration_minutes,
            status,
            meeting_link,
            meeting_platform,
            is_public,
            series_title,
            announce_to_students,
        } = body

        // Check if the session belongs to a course the teacher owns
        const checkResult = await query(`
      SELECT cs.id 
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1 AND c.teacher_id = $2
    `, [id, session.sub])

        if (checkResult.length === 0) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
        }

        const fields: string[] = []
        const values: unknown[] = []
        let counter = 1

        if (title !== undefined) {
            fields.push(`title = $${counter++}`)
            values.push(title)
        }
        if (description !== undefined) {
            fields.push(`description = $${counter++}`)
            values.push(description)
        }
        if (scheduled_at !== undefined) {
            fields.push(`scheduled_at = $${counter++}`)
            values.push(scheduled_at)
        }
        if (duration_minutes !== undefined) {
            fields.push(`duration_minutes = $${counter++}`)
            values.push(duration_minutes)
        }
        if (status !== undefined) {
            fields.push(`status = $${counter++}`)
            values.push(status)
            if (status === 'completed') {
                fields.push(`ended_at = NOW()`)
            }
        }
        if (meeting_link !== undefined) {
            const normalizedMeetingLink = normalizeMeetingUrl(meeting_link)
            if (meeting_link && !normalizedMeetingLink) {
                return NextResponse.json({ error: 'Meeting link must be a valid URL' }, { status: 400 })
            }
            fields.push(`meeting_link = $${counter++}`)
            values.push(normalizedMeetingLink)
        }
        if (meeting_platform !== undefined) {
            fields.push(`meeting_platform = $${counter++}`)
            values.push(MEETING_PLATFORMS.includes(meeting_platform) ? meeting_platform : 'custom')
        }
        if (is_public !== undefined) {
            fields.push(`is_public = $${counter++}`)
            values.push(!!is_public)
            if (is_public) {
                fields.push(`public_join_token = COALESCE(public_join_token, $${counter++})`)
                values.push(randomUUID().replaceAll('-', ''))
            }
        }
        if (typeof series_title === 'string' && series_title.trim()) {
            const series = await query<{ id: string }>(`
                INSERT INTO lesson_series (teacher_id, title)
                VALUES ($1, $2)
                RETURNING id
            `, [session.sub, series_title.trim()])
            fields.push(`series_id = $${counter++}`)
            values.push(series[0]?.id || null)
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        values.push(id)

        const updateQuery = `
      UPDATE course_sessions 
      SET ${fields.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `

        const result = await query(updateQuery, values)

        if (announce_to_students) {
            const updated = result[0] as {
                id: string
                title: string
                description?: string | null
                meeting_link?: string | null
                public_join_token?: string | null
            }
            const publicPath = updated.public_join_token ? `/academy/public/session/${updated.public_join_token}` : null
            const content = [
                updated.description || 'تم تحديث جلسة مباشرة.',
                updated.meeting_link ? `رابط الاجتماع: ${updated.meeting_link}` : null,
                publicPath ? `رابط الدرس العام: ${publicPath}` : null,
            ].filter(Boolean).join('\n\n')

            const announcement = await query<{ id: string }>(`
                INSERT INTO announcements (
                    title_ar, title_en, content_ar, content_en, target_audience,
                    priority, is_published, published_at, created_by, created_at
                )
                VALUES ($1, $2, $3, $4, 'students', 'high', true, NOW(), $5, NOW())
                RETURNING id
            `, [updated.title, updated.title, content, content, session.sub])

            if (announcement[0]?.id) {
                await query(`UPDATE course_sessions SET announcement_id = $1 WHERE id = $2`, [announcement[0].id, updated.id])
            }
        }

        return NextResponse.json({ data: result[0] })
    } catch (error) {
        console.error('Error updating session:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()

    if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params

        const checkResult = await query(`
      SELECT cs.id 
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1 AND c.teacher_id = $2
    `, [id, session.sub])

        if (checkResult.length === 0) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
        }

        await query('DELETE FROM session_attendance WHERE session_id = $1', [id])
        await query('DELETE FROM course_sessions WHERE id = $1', [id])

        return NextResponse.json({ message: 'Session deleted successfully' })
    } catch (error) {
        console.error('Error deleting session:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
