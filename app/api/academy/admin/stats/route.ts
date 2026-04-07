import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireRole, JWTPayload } from '@/lib/auth'
import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'

async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    return jwtDecode<JWTPayload>(sessionCookie)
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !requireRole(session, ['academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get total students
    const { count: studentCount, error: studentError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('role', 'student')

    // Get total teachers
    const { count: teacherCount, error: teacherError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('role', 'teacher')

    // Get total courses
    const { count: courseCount, error: courseError } = await supabase
      .from('courses')
      .select('id', { count: 'exact' })

    // Get total points distributed
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points')

    const totalPoints = pointsData?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0

    if (studentError || teacherError || courseError || pointsError) {
      throw new Error('Failed to fetch stats')
    }

    return NextResponse.json({
      total_students: studentCount || 0,
      total_teachers: teacherCount || 0,
      total_courses: courseCount || 0,
      total_points_distributed: totalPoints
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
