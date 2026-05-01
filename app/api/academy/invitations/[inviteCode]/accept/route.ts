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
    // Schema column is `token` (not `code`); status uses uppercase values.
    const invitations = await query<any>(
      `SELECT * FROM invitations WHERE token = $1`,
      [inviteCode]
    )

    if (invitations.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const invitation = invitations[0]

    // Already used / cancelled?
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }
    if (invitation.status === 'CANCELLED' || invitation.status === 'EXPIRED') {
      return NextResponse.json({ error: 'Invitation no longer valid' }, { status: 400 })
    }

    // Check if expired by date
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await query(`UPDATE invitations SET status = 'EXPIRED' WHERE id = $1`, [invitation.id])
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 })
    }

    // If it's a course invitation, enroll in course (column is `target_course_id`)
    if (invitation.target_course_id) {
      try {
        await query(
          `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
           VALUES ($1, $2, 'active', NOW())
           ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
          [session.sub, invitation.target_course_id]
        )
      } catch (e: any) {
        // Ignore duplicate key violations
        if (e.code !== '23505') throw e
      }
    }

    // Mark invitation as accepted (column is `accepted_by_user_id`)
    await query(
      `UPDATE invitations
         SET status = 'ACCEPTED',
             accepted_at = NOW(),
             accepted_by_user_id = $1,
             updated_at = NOW()
       WHERE id = $2`,
      [session.sub, invitation.id]
    )

    // Audit history
    try {
      await query(
        `INSERT INTO invitation_history (invitation_id, previous_status, new_status, changed_by)
         VALUES ($1, $2, 'ACCEPTED', $3)`,
        [invitation.id, invitation.status, session.sub]
      )
    } catch {
      // history table may not exist in some envs
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
