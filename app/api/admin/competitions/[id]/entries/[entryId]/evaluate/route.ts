import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { evaluateEntry, awardCompetitionWinner } from '@/lib/academy/competitions'
import { queryOne } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'student_supervisor', 'reciter_supervisor', 'reader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, entryId } = await params

  try {
    // Verify competition belongs to library
    const competition = await queryOne(
      `SELECT id FROM competitions WHERE id = $1 AND scope = 'library'`,
      [id]
    )
    if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { score, tajweed_scores, feedback, mark_as_winner } = await req.json()

    const result = await evaluateEntry(entryId, session.sub, {
      score: Number(score) || 0,
      tajweedScores: tajweed_scores || {},
      feedback: feedback || null,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    if (mark_as_winner) {
      const entry = await queryOne<{ student_id: string }>(
        `SELECT student_id FROM competition_entries WHERE id = $1`,
        [entryId]
      )
      if (entry) {
        await awardCompetitionWinner(id, entry.student_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
