import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  getCompetition,
  getActiveStage,
  previewCompetitionResults,
  advanceStageOrFinalize,
  finalizeCurrentStageAsResults,
  cancelCompetition,
} from '@/lib/academy/competitions'

const ALLOWED = ['admin', 'student_supervisor', 'reciter_supervisor']

// GET: preview the active stage's ranking + cutoff (no writes).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const competition = await getCompetition(id)
    if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    const stage = await getActiveStage(id)
    const preview = await previewCompetitionResults(id)
    return NextResponse.json({ stage, ...preview })
  } catch (error) {
    console.error('Error previewing stage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: perform a stage action (advance | finalize_now | cancel).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const competition = await getCompetition(id)
    if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const action = body?.action || 'advance'

    const result =
      action === 'finalize_now' ? await finalizeCurrentStageAsResults(id)
      : action === 'cancel' ? await cancelCompetition(id)
      : await advanceStageOrFinalize(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error performing stage action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
