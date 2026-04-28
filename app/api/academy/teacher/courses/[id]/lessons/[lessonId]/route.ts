import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// PATCH /api/academy/teacher/courses/[id]/lessons/[lessonId] – Edit a lesson
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    const session = await getSession()
    if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: courseId, lessonId } = await params

        // Ownership check
        if (session.role === 'teacher') {
            const own = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
            if (own.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        console.log('[PATCH Lesson] Body received:', JSON.stringify({
            fields: Object.keys(body).filter(k => k !== 'attachments'),
            attachments_count: body.attachments?.length ?? 'not provided',
            attachments: body.attachments
        }))
        const allowedFields = ['title', 'description', 'video_url', 'duration_minutes', 'order_index']
        const updates: string[] = []
        const values: unknown[] = []

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                values.push(body[field])
                updates.push(`${field} = $${values.length}`)
            }
        }

        if (updates.length === 0 && !(body.attachments && Array.isArray(body.attachments))) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        let updatedLesson = null;
        if (updates.length > 0) {
            values.push(lessonId)
            const result = await query(
                `UPDATE lessons SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
                values
            )
            if (result.length === 0) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
            updatedLesson = result[0];
        }

        // Handle Attachments Update if provided
        if (body.attachments && Array.isArray(body.attachments)) {
            // Delete old
            await query(`DELETE FROM lesson_attachments WHERE lesson_id = $1`, [lessonId])

            // Insert new
            for (const att of body.attachments) {
                // Normalize file_type to DB-accepted CHECK values
                const allowedTypes = ['PDF', 'DOC', 'DOCX', 'XLSX', 'PPTX', 'ZIP']
                const ext = att.name?.split('.').pop()?.toUpperCase() || ''
                const fileType = allowedTypes.includes(ext) ? ext : 'OTHER'

                await query(
                    `INSERT INTO lesson_attachments (lesson_id, file_url, file_name, file_type)
                     VALUES ($1, $2, $3, $4)`,
                    [lessonId, att.url, att.name, fileType]
                )
            }
        }

        return NextResponse.json({ success: true, data: updatedLesson })
    } catch (error) {
        console.error('[API] Error updating lesson:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/academy/teacher/courses/[id]/lessons/[lessonId] – Delete a lesson
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    const session = await getSession()
    if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: courseId, lessonId } = await params

        // Ownership check
        if (session.role === 'teacher') {
            const own = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
            if (own.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete lesson progress first (FK constraint)
        await query(`DELETE FROM lesson_progress WHERE lesson_id = $1`, [lessonId]).catch(() => { })

        const result = await query(`DELETE FROM lessons WHERE id = $1 RETURNING id`, [lessonId])
        if (result.length === 0) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Error deleting lesson:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
