import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'
import { JWTPayload } from '@/lib/auth'

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

export async function POST(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', params.lessonId)
      .eq('is_public', true)
      .single()

    if (lessonError) throw lessonError

    // Subscribe user to the course
    const { error: enrollError } = await supabase
      .from('user_enrollments')
      .insert([
        {
          user_id: session.sub,
          course_id: lesson.course_id,
          status: 'active',
          enrolled_at: new Date().toISOString()
        }
      ])

    if (enrollError && enrollError.code !== '23505') throw enrollError // 23505 = already enrolled

    // Track subscription
    const { error: subError } = await supabase
      .from('public_lesson_subscribers')
      .insert([
        {
          lesson_id: params.lessonId,
          user_id: session.sub,
          subscribed_at: new Date().toISOString()
        }
      ])

    if (subError && subError.code !== '23505') throw subError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error subscribing to lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
