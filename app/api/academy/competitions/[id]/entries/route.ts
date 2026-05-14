import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const entries = await query(
    `SELECT
       ce.*,
       u.name AS student_name,
       u.avatar_url AS student_avatar_url,
       evaluator.name AS evaluated_by_name
     FROM competition_entries ce
     JOIN users u ON u.id = ce.student_id
     LEFT JOIN users evaluator ON evaluator.id = ce.evaluated_by
     WHERE ce.competition_id = $1
       AND ($2::uuid IS NULL OR ce.student_id = $2::uuid OR $3 = true)
     ORDER BY ce.rank ASC NULLS LAST, ce.score DESC NULLS LAST, ce.submitted_at DESC`,
    [id, session.role === 'student' ? session.sub : null, ['admin', 'academy_admin', 'reader'].includes(session.role)]
  )

  return NextResponse.json({ data: entries })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Only students can submit competition entries' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const competition = await queryOne<{
    id: string
    status: string
    max_participants: number | null
    halqa_id: string | null
    min_verses: number | null
  }>(
    `SELECT id, status, max_participants, halqa_id, min_verses
       FROM competitions
      WHERE id = $1`,
    [id]
  )

  if (!competition) {
    return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
  }
  if (competition.status !== 'active') {
    return NextResponse.json({ error: 'Competition is not active' }, { status: 400 })
  }

  if (competition.max_participants) {
    const count = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM competition_entries WHERE competition_id = $1`,
      [id]
    )
    if ((count?.count || 0) >= competition.max_participants) {
      return NextResponse.json({ error: 'Competition is full' }, { status: 400 })
    }
  }

  const versesCount = Number(body.verses_count || 0)
  if (competition.min_verses && versesCount < competition.min_verses) {
    return NextResponse.json({ error: 'Minimum verses requirement not met' }, { status: 400 })
  }

  const result = await query(
    `INSERT INTO competition_entries (
       competition_id, student_id, recitation_id, submission_url, notes,
       verses_count, halqa_id, status, submitted_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
     ON CONFLICT (competition_id, student_id)
     DO UPDATE SET
       recitation_id = EXCLUDED.recitation_id,
       submission_url = EXCLUDED.submission_url,
       notes = EXCLUDED.notes,
       verses_count = EXCLUDED.verses_count,
       halqa_id = EXCLUDED.halqa_id,
       status = 'pending',
       submitted_at = NOW()
     RETURNING *`,
    [
      id,
      session.sub,
      body.recitation_id || null,
      body.submission_url || null,
      body.notes || null,
      Number.isFinite(versesCount) ? versesCount : 0,
      body.halqa_id || competition.halqa_id || null,
    ]
  )

  return NextResponse.json({ data: result[0] }, { status: 201 })
}
