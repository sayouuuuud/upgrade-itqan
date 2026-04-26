import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get invitation
    const invitations = await query(`
      SELECT * FROM invitations WHERE code = $1
    `, [inviteCode])

    if (invitations.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const invitation = invitations[0] as any

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 })
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }

    // If it's a course invitation, enroll in course
    if (invitation.course_id) {
      try {
        await query(`
          INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
          VALUES ($1, $2, 'active', NOW())
        `, [session.sub, invitation.course_id])
      } catch (e: any) {
        // Ignore if already enrolled
        if (e.code !== '23505') throw e
      }
    }

    // Mark invitation as accepted
    await query(`
      UPDATE invitations SET accepted_at = NOW(), accepted_by = $1 WHERE code = $2
    `, [session.sub, inviteCode])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
