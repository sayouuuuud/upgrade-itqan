import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const result = await query(`
      UPDATE badge_definitions SET badge_type = COALESCE($1, badge_type), 
        badge_name = COALESCE($2, badge_name), badge_description = COALESCE($3, badge_description),
        badge_icon = COALESCE($4, badge_icon), points_required = COALESCE($5, points_required),
        updated_at = NOW() WHERE id = $6 RETURNING *
    `, [body.badge_type || null, body.badge_name || null, body.badge_description || null, body.badge_icon || null, body.points_required || null, id])
    
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
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
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
