import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCompetition, getStages, getActiveStage } from '@/lib/academy/competitions'

const ALLOWED = ['admin', 'student_supervisor', 'reciter_supervisor', 'reader']

// GET: all stages of a competition + which one is active.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const competition = await getCompetition(id)
    if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    const [stages, active] = await Promise.all([getStages(id), getActiveStage(id)])
    return NextResponse.json({ stages, activeStageId: active?.id ?? null })
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
