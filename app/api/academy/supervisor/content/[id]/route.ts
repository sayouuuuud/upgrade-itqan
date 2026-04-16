import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// PATCH /api/academy/supervisor/content/[id]
// Approve or reject a pending lesson
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || !['admin', 'academy_admin', 'supervisor'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const lessonId = (await params).id
        const { status, reason } = await req.json()

        if (!['approved', 'rejected', 'published'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status. Use approved, published, or rejected.' }, { status: 400 })
        }

        // Map approved -> published for the lessons table status
        const dbStatus = status === 'approved' ? 'published' : 'rejected'

        const result = await query<any>(
            `UPDATE lessons SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 RETURNING *, course_id`,
            [dbStatus, reason || null, session.sub, lessonId]
        )

        if (result.length === 0) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

        // Notify the teacher
        try {
            const lesson = result[0]
            const course = await query<any>(`SELECT teacher_id, title FROM courses WHERE id = $1`, [lesson.course_id])
            if (course.length > 0) {
                const msg = dbStatus === 'published'
                    ? `تمت الموافقة على الدرس "${lesson.title}" ونشره.`
                    : `تم رفض الدرس "${lesson.title}"${reason ? ': ' + reason : ''}`

                await query(
                    `INSERT INTO notifications (user_id, type, title, message, category, is_read, created_at)
           VALUES ($1, 'general', $2, $2, 'content', FALSE, NOW())`,
                    [course[0].teacher_id, msg]
                )
            }
        } catch { }

        return NextResponse.json({ success: true, data: result[0] })
    } catch (error) {
        console.error('[API] Error reviewing content:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
