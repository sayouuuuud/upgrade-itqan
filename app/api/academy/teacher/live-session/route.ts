import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT cs.*, COUNT(sa.id)::int as participant_count
      FROM course_sessions cs
      LEFT JOIN session_attendance sa ON cs.id = sa.session_id
      WHERE cs.teacher_id = $1 AND cs.status = 'live'
      GROUP BY cs.id
      LIMIT 1
    `, [session.sub])

    if (rows.length === 0) {
      return NextResponse.json(null)
    }

    const session_id = rows[0].id
    const participants = await query(`
      SELECT sa.* FROM session_attendance sa WHERE sa.session_id = $1
    `, [session_id])

    return NextResponse.json({ ...rows[0], participants })
  } catch (error) {
    console.error('Error fetching live session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
