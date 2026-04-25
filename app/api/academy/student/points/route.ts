import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['student', 'teacher', 'parent', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user points
    const pointsData = await query(`
      SELECT * FROM user_points WHERE user_id = $1
    `, [session.sub])

    const points = pointsData[0] || { user_id: session.sub, points: 0 }

    // Get points log
    const pointsLog = await query(`
      SELECT * FROM points_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [session.sub])

    return NextResponse.json({ data: { points, log: pointsLog } })
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
