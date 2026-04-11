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
  
  if (!session || !requireRole(session, ['teacher', 'academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get teacher's courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .eq('teacher_id', session.sub)

    if (coursesError) throw coursesError

    const courseIds = courses?.map(c => c.id) || []

    // Get students enrolled in those courses
    const { data, error } = await supabase
      .from('user_enrollments')
      .select(`
        *,
        users (id, name, email),
        courses (name)
      `)
      .in('course_id', courseIds)

    if (error) throw error

    // Aggregate stats per student
    const studentStats = new Map()
    data?.forEach(enrollment => {
      if (!studentStats.has(enrollment.user_id)) {
        studentStats.set(enrollment.user_id, {
          id: enrollment.user_id,
          name: enrollment.users?.name,
          email: enrollment.users?.email,
          courses_count: 0,
          tasks_completed: 0,
          tasks_total: 0,
          progress_percentage: 0,
          total_points: 0,
          last_activity: new Date(),
          badges_count: 0
        })
      }
      const student = studentStats.get(enrollment.user_id)
      student.courses_count++
    })

    return NextResponse.json(Array.from(studentStats.values()))
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
