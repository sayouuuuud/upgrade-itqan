import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// GET /api/academy/supervisor/quality
// Returns quality metrics: avg grades per teacher, task response rates, complaint counts
export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !['admin', 'academy_admin', 'supervisor'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Teacher metrics: avg grade given, number of courses, number of students
        const teacherStats = await query<any>(`
      SELECT 
        u.id as teacher_id,
        u.name as teacher_name,
        COUNT(DISTINCT c.id)::int as total_courses,
        COUNT(DISTINCT e.student_id)::int as total_students,
        COALESCE(AVG(ts.score), 0)::numeric(5,2) as avg_grade,
        COUNT(DISTINCT ts.id)::int as total_graded_submissions
      FROM users u
      JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      LEFT JOIN tasks t ON t.course_id = c.id
      LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.status = 'graded'
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name
      ORDER BY total_students DESC
    `, [])

        // Task submission rates
        const taskStats = await query<any>(`
      SELECT
        COUNT(DISTINCT t.id)::int as total_tasks,
        COUNT(DISTINCT ts.id)::int as total_submissions,
        COUNT(DISTINCT CASE WHEN ts.status = 'graded' THEN ts.id END)::int as graded_submissions,
        COALESCE(AVG(ts.score), 0)::numeric(5,2) as avg_score
      FROM tasks t
      LEFT JOIN task_submissions ts ON ts.task_id = t.id
    `, [])

        // Enrollment funnel
        const enrollmentStats = await query<any>(`
      SELECT
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int as rejected
      FROM enrollments
    `, [])

        return NextResponse.json({
            teacherStats,
            taskStats: taskStats[0] || {},
            enrollmentStats: enrollmentStats[0] || {}
        })
    } catch (error) {
        console.error('[API] Error fetching quality stats:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
