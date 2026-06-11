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
        const { status, reason, kind } = await req.json()

        if (!['accepted', 'rejected', 'active'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Map 'accepted' -> 'active' for the DB schema
        const dbStatus = status === 'accepted' ? 'active' : status

        // Tajweed path enrollment request (managed by this teacher).
        if (kind === 'tajweed_path') {
            const rows = (await query<any>(
                `SELECT tpe.id, tpe.path_id, tpe.student_id, tpe.status, tp.title
                   FROM tajweed_path_enrollments tpe
                   JOIN tajweed_paths tp ON tp.id = tpe.path_id
                  WHERE tpe.id = $1
                    AND (tp.created_by = $2 OR tp.manager_id = $2)
                  LIMIT 1`,
                [enrollmentId, session.sub],
            )) as any[]
            const enrollment = rows[0]
            if (!enrollment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

            if (dbStatus === 'rejected') {
                await query(
                    `UPDATE tajweed_path_enrollments
                        SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW()
                      WHERE id = $1`,
                    [enrollmentId, session.sub],
                )
                try {
                    await createNotification({
                        userId: enrollment.student_id,
                        type: 'general',
                        title: `❌ تم رفض طلبك للانضمام لمسار «${enrollment.title}»`,
                        message: `تم رفض طلبك للانضمام لمسار «${enrollment.title}»${reason ? '. السبب: ' + reason : ''}.`,
                        category: 'course',
                        link: '/academy/student/path',
                    })
                } catch (e) { console.error('[path enroll notif]', e) }
                return NextResponse.json({ success: true, status: 'rejected' })
            }

            // Approve: seed progress rows + activate.
            const stages = (await query<any>(
                `SELECT id FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
                [enrollment.path_id],
            )) as any[]
            if (stages.length === 0) {
                return NextResponse.json({ error: 'لا توجد مراحل في هذا المسار' }, { status: 400 })
            }
            const values: any[] = []
            const placeholders: string[] = []
            let i = 1
            stages.forEach((s: any, idx: number) => {
                placeholders.push(`($${i++}, $${i++}, $${i++})`)
                values.push(enrollmentId, s.id, idx === 0 ? 'unlocked' : 'locked')
            })
            await query(
                `INSERT INTO tajweed_path_progress (enrollment_id, stage_id, status)
                   VALUES ${placeholders.join(', ')}
                 ON CONFLICT (enrollment_id, stage_id) DO NOTHING`,
                values,
            )
            await query(
                `UPDATE tajweed_path_enrollments
                    SET status = 'active', current_stage_id = $2, reviewed_by = $3,
                        reviewed_at = NOW(), last_activity_at = NOW()
                  WHERE id = $1`,
                [enrollmentId, stages[0].id, session.sub],
            )
            try {
                await createNotification({
                    userId: enrollment.student_id,
                    type: 'general',
                    title: `✅ تم قبولك في مسار «${enrollment.title}»`,
                    message: `مبروك! تم قبول طلبك في مسار «${enrollment.title}». يمكنك البدء الآن.`,
                    category: 'course',
                    link: '/academy/student/path',
                })
            } catch (e) { console.error('[path enroll notif]', e) }
            return NextResponse.json({ success: true, status: 'active' })
        }

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

