import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const { inviteCode } = await params
    // Schema columns are `token` and `target_course_id` (not `code`/`course_id`)
    // Auto-expire pending invitations
    await query(
      `UPDATE invitations SET status = 'EXPIRED'
       WHERE status = 'PENDING' AND expires_at < NOW()`
    )

    const rows = await query<any>(
      `SELECT
         i.email, i.invited_name, i.role_to_assign, i.status,
         i.expires_at, i.plan_id,
         u.name  AS inviter_name,
         p.title AS plan_title
       FROM invitations i
       LEFT JOIN users   u ON u.id = i.invited_by
       LEFT JOIN courses p ON p.id = i.plan_id
       WHERE i.token = $1`,
      [inviteCode]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const inv = rows[0]
    // Surface expired to caller
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ ...inv, status: 'EXPIRED' }, { status: 410 })
    }

    return NextResponse.json(inv)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
}
