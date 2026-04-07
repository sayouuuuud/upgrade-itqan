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
    const { data, error } = await supabase
      .from('course_sessions')
      .select(`
        *,
        courses (name),
        session_attendance(count)
      `)
      .eq('teacher_id', session.sub)
      .order('scheduled_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !requireRole(session, ['teacher', 'academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { course_id, title, description, scheduled_at, duration_minutes } = body

    if (!course_id || !title || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('course_sessions')
      .insert([
        {
          course_id,
          teacher_id: session.sub,
          title,
          description,
          scheduled_at,
          duration_minutes: duration_minutes || 60,
          status: 'scheduled',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
