import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get students enrolled in teacher's courses with aggregated stats
    const q = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT e.id)::int as courses_count,
        COALESCE(SUM(CASE WHEN ts.status = 'submitted' THEN 1 ELSE 0 END), 0)::int as tasks_completed,
        COALESCE(SUM(CASE WHEN ts.id IS NOT NULL THEN 1 ELSE 0 END), 0)::int as tasks_total,
        COALESCE(SUM(up.points), 0)::int as total_points,
        MAX(e.enrolled_at) as last_activity,
        COUNT(DISTINCT b.id)::int as badges_count
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN tasks t ON c.id = t.course_id
      LEFT JOIN task_submissions ts ON u.id = ts.student_id AND t.id = ts.task_id
      LEFT JOIN user_points up ON u.id = up.user_id
      LEFT JOIN badges b ON u.id = b.user_id
      WHERE c.teacher_id = $1 AND e.status IN ('active', 'pending')
      GROUP BY u.id, u.name, u.email
      ORDER BY MAX(e.enrolled_at) DESC
    `
    const rows = await query(q, [session.sub])
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
