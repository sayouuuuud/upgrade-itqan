import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { evaluateEntry } from '@/lib/academy/competitions'

export async function POST(req: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await getSession()
  if (!session || !['reader', 'teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await params

  try {
    const body = await req.json()
    const { score, tajweed_scores, feedback } = body

    if (score === undefined || score === null) {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 })
    }

    const result = await evaluateEntry(entryId, session.sub, {
      score: Number(score),
      tajweedScores: tajweed_scores || {},
      feedback: feedback || null,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error evaluating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
