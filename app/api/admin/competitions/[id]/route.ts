import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['admin', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const competition = await queryOne(
      `SELECT c.*, u.name as created_by_name FROM competitions c LEFT JOIN users u ON u.id = c.created_by WHERE c.id = $1 AND c.scope = 'library'`,
      [id]
    )
    if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: competition })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['admin', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const {
      title, description, type, start_date, end_date,
      max_participants, prizes_description, rules, tajweed_rules,
      badge_key, points_multiplier, min_verses, is_featured, status,
      certificate_enabled, award_top_n, certificate_template_id,
    } = await req.json()

    const result = await query(`
      UPDATE competitions SET
        title = COALESCE($1, title),
        description = $2,
        type = COALESCE($3, type),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date),
        max_participants = COALESCE($6, max_participants),
        prizes_description = $7,
        rules = $8,
        tajweed_rules = $9,
        badge_key = COALESCE($10, badge_key),
        points_multiplier = COALESCE($11, points_multiplier),
        min_verses = COALESCE($12, min_verses),
        is_featured = COALESCE($13, is_featured),
        status = COALESCE($14, status),
        certificate_enabled = COALESCE($15, certificate_enabled),
        award_top_n = $16,
        certificate_template_id = $17,
        updated_at = NOW()
      WHERE id = $18 AND scope = 'library'
      RETURNING *
    `, [
      title, description || null, type, start_date, end_date,
      max_participants || null, prizes_description || null, rules || null,
      Array.isArray(tajweed_rules) ? tajweed_rules
        : typeof tajweed_rules === 'string' && tajweed_rules.trim()
          ? tajweed_rules.split(',').map((s: string) => s.trim()).filter(Boolean)
          : null,
      badge_key, points_multiplier ? Number(points_multiplier) : null,
      min_verses !== undefined ? Number(min_verses) : null,
      is_featured !== undefined ? Boolean(is_featured) : null,
      status || null,
      certificate_enabled !== undefined ? Boolean(certificate_enabled) : null,
      award_top_n ? Number(award_top_n) : null,
      certificate_template_id || null,
      id,
    ])

    if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await query(`DELETE FROM competition_entries WHERE competition_id = $1`, [id])
    await query(`DELETE FROM competitions WHERE id = $1 AND scope = 'library'`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
