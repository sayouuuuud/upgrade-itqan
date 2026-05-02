import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get total students with academy access
    const studentCount = await query<{ count: string }>(`
      SELECT COUNT(DISTINCT u.id)::text as count
      FROM users u
      WHERE u.role = 'student' AND u.is_active = true AND u.has_academy_access = true
    `)

    // Get total teachers
    const teacherCount = await query<{ count: string }>(`
      SELECT COUNT(DISTINCT u.id)::text as count
      FROM users u
      WHERE u.role = 'teacher' AND u.is_active = true
    `)

    // Get total courses
    const courseCount = await query<{ count: string }>(`
      SELECT COUNT(*)::text as count FROM courses
    `)

    // Get total points distributed
    const pointsData = await query<{ total: string }>(`
      SELECT COALESCE(SUM(points), 0)::text as total FROM user_points
    `)

    return NextResponse.json({
      total_students: parseInt(studentCount[0]?.count || '0'),
      total_teachers: parseInt(teacherCount[0]?.count || '0'),
      total_courses: parseInt(courseCount[0]?.count || '0'),
      total_points_distributed: parseInt(pointsData[0]?.total || '0')
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
