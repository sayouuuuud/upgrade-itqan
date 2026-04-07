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
      .select('*')
      .eq('teacher_id', session.sub)
      .eq('status', 'live')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return NextResponse.json(null)
    }

    // Get session participants
    const { data: participants, error: partError } = await supabase
      .from('session_attendance')
      .select('*')
      .eq('session_id', data.id)

    if (partError) throw partError

    return NextResponse.json({ ...data, participants })
  } catch (error) {
    console.error('Error fetching live session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
