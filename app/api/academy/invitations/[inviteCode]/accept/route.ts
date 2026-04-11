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
  { params }: { params: { inviteCode: string } }
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', params.inviteCode)
      .single()

    if (invError) throw invError

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 })
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }

    // If it's a course invitation, enroll in course
    if (invitation.course_id) {
      const { error: enrollError } = await supabase
        .from('user_enrollments')
        .insert([
          {
            user_id: session.sub,
            course_id: invitation.course_id,
            status: 'active',
            enrolled_at: new Date().toISOString()
          }
        ])

      if (enrollError && enrollError.code !== '23505') throw enrollError
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString(), accepted_by: session.sub })
      .eq('code', params.inviteCode)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
