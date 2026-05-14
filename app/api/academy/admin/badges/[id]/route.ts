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
    // badge_type in DB is the primary key, we don't update it, but we can update other fields
    const result = await query(`
      UPDATE badge_definitions SET 
        name = COALESCE($1, name), 
        description = COALESCE($2, description),
        icon = COALESCE($3, icon), 
        points_reward = COALESCE($4, points_reward),
        category = COALESCE($5, category),
        criteria_type = COALESCE($6, criteria_type),
        criteria_value = COALESCE($7, criteria_value),
        display_order = COALESCE($8, display_order)
      WHERE badge_type = $9 
      RETURNING *
    `, [
      body.name ?? null, 
      body.description ?? null, 
      body.icon ?? null, 
      body.points_reward ?? null, 
      body.category ?? null,
      body.criteria_type ?? null,
      body.criteria_value ?? null,
      body.display_order ?? null,
      id
    ])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error: any) {
    console.error("Error updating badge:", error)
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
    await query(`DELETE FROM badge_definitions WHERE badge_type = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting badge:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
