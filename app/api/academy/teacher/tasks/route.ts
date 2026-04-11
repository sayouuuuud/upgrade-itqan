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
      .from('tasks')
      .select(`
        *,
        courses (name)
      `)
      .eq('teacher_id', session.sub)
      .order('due_date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tasks:', error)
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
    const { course_id, title, description, task_type, due_date } = body

    if (!course_id || !title || !task_type || !due_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          course_id,
          teacher_id: session.sub,
          title,
          description,
          task_type,
          due_date,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
