import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const courseId = (await params).id;

        // Validate if teacher owns the course
        const courseCheck = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
        if (courseCheck.length === 0 && session.role === 'teacher') {
            return NextResponse.json({ error: 'Unauthorized to view these students' }, { status: 403 })
        }

        const studentsQuery = `
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        u.name,
        u.email,
        u.phone,
        u.avatar_url,
        e.progress_percentage as progress,
        e.status,
        e.enrolled_at,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.enrollment_id = e.id AND lp.is_completed = true) as completed_lessons
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = $1
      ORDER BY e.enrolled_at DESC
    `
        const students = await query(studentsQuery, [courseId])

        return NextResponse.json({ data: students })
    } catch (error) {
        console.error('[API] Error fetching enrolled students:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
