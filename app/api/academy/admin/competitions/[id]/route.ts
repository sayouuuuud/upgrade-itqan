import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { awardCompetitionWinner } from '@/lib/academy/competitions'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const winnerId = body.winner_id || null
    const result = await query(`
      UPDATE competitions SET title = COALESCE($1, title), description = COALESCE($2, description),
        type = COALESCE($3, type), start_date = COALESCE($4, start_date), 
        end_date = COALESCE($5, end_date), max_participants = COALESCE($6, max_participants),
        prizes_description = COALESCE($7, prizes_description), status = COALESCE($8, status),
        rules = COALESCE($10, rules), tajweed_rules = COALESCE($11, tajweed_rules),
        badge_key = COALESCE($12, badge_key), points_multiplier = COALESCE($13, points_multiplier),
        halqa_id = COALESCE($14, halqa_id), min_verses = COALESCE($15, min_verses),
        is_featured = COALESCE($16, is_featured), winner_id = COALESCE($17, winner_id),
        updated_at = NOW() WHERE id = $9 RETURNING *
    `, [
      body.title || null,
      body.description || null,
      body.type || null,
      body.start_date || null,
      body.end_date || null,
      body.max_participants || null,
      body.prizes_description || null,
      body.status || null,
      id,
      body.rules || null,
      Array.isArray(body.tajweed_rules)
        ? body.tajweed_rules
        : typeof body.tajweed_rules === 'string' && body.tajweed_rules.trim()
          ? body.tajweed_rules.split(',').map((item: string) => item.trim()).filter(Boolean)
          : null,
      body.badge_key || null,
      Number(body.points_multiplier) > 0 ? Number(body.points_multiplier) : null,
      body.halqa_id || null,
      Number(body.min_verses) > 0 ? Number(body.min_verses) : null,
      typeof body.is_featured === 'boolean' ? body.is_featured : null,
      winnerId,
    ])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    if (winnerId) {
      await awardCompetitionWinner(id, winnerId)
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await query(`DELETE FROM competitions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
