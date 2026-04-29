import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()

    if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await req.json()
        const { title, description, scheduled_at, duration_minutes, status } = body

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
        const values: any[] = []
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
