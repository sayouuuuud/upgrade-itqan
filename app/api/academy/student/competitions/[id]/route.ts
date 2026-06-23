import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { getStudentStageContext } from '@/lib/academy/competitions'

// GET a single academy competition with the student's stage context (rounds,
// active stage, their per-stage entries, and whether they can submit now).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const competition = await queryOne(
      `SELECT * FROM competitions WHERE id = $1 AND scope = 'academy'`,
      [id],
    )
    if (!competition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const ctx = await getStudentStageContext(id, session.sub)
    return NextResponse.json({
      competition,
      entry: ctx.activeEntry || null,
      stages: ctx.stages,
      activeStage: ctx.activeStage,
      entries: ctx.entries,
      canSubmit: ctx.canSubmit,
    })
  } catch (error) {
    console.error('Error fetching academy competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
