import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['student', 'teacher', 'parent', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT * FROM badges WHERE user_id = $1 ORDER BY earned_at DESC
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
