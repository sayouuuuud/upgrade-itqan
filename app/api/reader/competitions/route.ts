import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getJudgeAssignments, getCompetitions } from '@/lib/academy/competitions'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['reader', 'teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const assigned = await getJudgeAssignments(session.sub)

    if (assigned.length === 0) {
      const active = await getCompetitions({ status: 'active' })
      return NextResponse.json({ data: active, mode: 'all' })
    }

    return NextResponse.json({ data: assigned, mode: 'assigned' })
  } catch (error) {
    console.error('Error fetching reader competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
