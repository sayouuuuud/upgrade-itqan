import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['academy_admin', 'student'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        up.*,
        u.name,
        u.email
      FROM user_points up
      JOIN users u ON up.user_id = u.id
      ORDER BY up.points DESC
      LIMIT 100
    `)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
