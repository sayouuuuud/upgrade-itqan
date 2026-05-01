import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// PATCH /api/academy/teacher/enrollment-requests/[id]
// Accept or reject an enrollment request
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const enrollmentId = (await params).id
        const { status, reason } = await req.json()

        if (!['accepted', 'rejected', 'active'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Map 'accepted' -> 'active' for the DB schema
        const dbStatus = status === 'accepted' ? 'active' : status

        // Verify ownership: teacher must own the course
        if (session.role === 'teacher') {
            const check = await query(
                `SELECT e.id FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.id = $1 AND c.teacher_id = $2`,
                [enrollmentId, session.sub]
            )
            if (check.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const result = await query(
            `UPDATE enrollments
       SET status = $1, rejection_reason = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [dbStatus, reason || null, enrollmentId]
        )

        if (result.length === 0) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

        // B-6: إشعار للطالب باسم الدورة
        try {
            const enrollment = result[0] as any

            // جلب اسم الدورة
            const courseRes = await query<any>(
                `SELECT title FROM courses WHERE id = $1`,
                [enrollment.course_id]
            )
            const courseTitle = courseRes[0]?.title || 'الدورة'

            const notifTitle = dbStatus === 'active'
                ? `✅ تم قبولك في دورة «${courseTitle}»`
                : `❌ تم رفض طلبك للانضمام لدورة «${courseTitle}»`

            const notifMsg = dbStatus === 'active'
                ? `مبروك! تم قبول طلبك في دورة «${courseTitle}». يمكنك البدء الآن.`
                : `تم رفض طلبك للانضمام لدورة «${courseTitle}»${reason ? '. السبب: ' + reason : ''}.`

            await createNotification({
                userId: enrollment.student_id,
                type: 'general',
                title: notifTitle,
                message: notifMsg,
                category: 'course',
                link: dbStatus === 'active' ? '/academy/student/courses' : '/academy/student/courses/browse',
            })
        } catch (notifErr) {
            console.error('[B-6] Failed to send enrollment notification:', notifErr)
        }

        return NextResponse.json({ success: true, data: result[0] })
    } catch (error) {
        console.error('[API] Error updating enrollment:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

