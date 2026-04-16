import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query<any>(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.gender,
        u.created_at,
        COUNT(DISTINCT e.course_id)::int as courses_count,
        COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.course_id END)::int as active_courses
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id
      WHERE u.role IN ('student', 'academy_student', 'dual_student')
      GROUP BY u.id, u.name, u.email, u.gender, u.created_at
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching academy students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
