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
  
  if (!session || !requireRole(session, ['student', 'teacher', 'parent', 'academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', session.sub)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    const points = data || { user_id: session.sub, total_points: 0 }

    // Get points log
    const { data: pointsLog, error: logError } = await supabase
      .from('points_log')
      .select('*')
      .eq('user_id', session.sub)
      .order('created_at', { ascending: false })
      .limit(20)

    if (logError) throw logError

    return NextResponse.json({ points, log: pointsLog })
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
