import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const { inviteCode } = await params
    const rows = await query(`
      SELECT 
        i.*,
        u.name as invited_by_name,
        c.title as course_title
      FROM invitations i
      LEFT JOIN users u ON i.invited_by = u.id
      LEFT JOIN courses c ON i.course_id = c.id
      WHERE i.code = $1
    `, [inviteCode])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    return NextResponse.json({ data: rows[0] })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
}
