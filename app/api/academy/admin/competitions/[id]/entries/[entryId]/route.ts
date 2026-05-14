import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { awardCompetitionWinner } from '@/lib/academy/competitions'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin', 'reader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, entryId } = await params
  const body = await req.json()
  const score = body.score == null ? null : Number(body.score)
  const rank = body.rank == null ? null : Number(body.rank)

  if (score != null && (!Number.isFinite(score) || score < 0 || score > 100)) {
    return NextResponse.json({ error: 'Score must be between 0 and 100' }, { status: 400 })
  }

  const rows = await query<{
    id: string
    student_id: string
    rank: number | null
  }>(
    `UPDATE competition_entries
        SET score = COALESCE($1, score),
            rank = COALESCE($2, rank),
            notes = COALESCE($3, notes),
            feedback = COALESCE($4, feedback),
            tajweed_scores = COALESCE($5, tajweed_scores),
            status = COALESCE($6, status),
            evaluated_by = $7,
            evaluated_at = NOW()
      WHERE id = $8 AND competition_id = $9
      RETURNING id, student_id, rank`,
    [
      score,
      rank,
      body.notes || null,
      body.feedback || null,
      body.tajweed_scores ? JSON.stringify(body.tajweed_scores) : null,
      body.status || 'evaluated',
      session.sub,
      entryId,
      id,
    ]
  )

  if (!rows.length) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  if (body.mark_winner === true || rows[0].rank === 1) {
    await awardCompetitionWinner(id, rows[0].student_id)
  }

  return NextResponse.json({ data: rows[0] })
}
