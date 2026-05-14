import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    const body = await req.json()
    const result = await query(`
      UPDATE badge_definitions SET
        badge_name = COALESCE($1, badge_name),
        badge_description = COALESCE($2, badge_description),
        badge_icon = COALESCE($3, badge_icon),
        badge_image_url = COALESCE($4, badge_image_url),
        badge_color = COALESCE($5, badge_color),
        points_awarded = COALESCE($6, points_awarded),
        criteria_type = COALESCE($7, criteria_type),
        criteria_value = COALESCE($8, criteria_value),
        is_active = COALESCE($9, is_active),
        category = COALESCE($10, category),
        display_order = COALESCE($11, display_order),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      body.badge_name ?? null, body.badge_description ?? null,
      body.badge_icon ?? null, body.badge_image_url ?? null,
      body.badge_color ?? null, body.points_awarded ?? null,
      body.criteria_type ?? null, body.criteria_value ?? null,
      body.is_active ?? null, body.category ?? null,
      body.display_order ?? null, id,
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    await query(`DELETE FROM badge_definitions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
