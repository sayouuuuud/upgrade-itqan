import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCompetition, getStages, getActiveStage } from '@/lib/academy/competitions'

const ALLOWED = ['academy_admin', 'admin', 'teacher', 'reader']

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
    // Return the full active stage object (the StageManager UI needs its
    // order_index/advance_count/name), plus activeStageId for any simpler caller.
    return NextResponse.json({ stages, activeStage: active ?? null, activeStageId: active?.id ?? null })
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
