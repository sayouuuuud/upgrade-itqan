import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await query(`
      SELECT * FROM badge_definitions ORDER BY created_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { badge_type, badge_name, badge_description, badge_icon, points_required } = await req.json()
    if (!badge_name) return NextResponse.json({ error: 'Badge name required' }, { status: 400 })
    
    const result = await query(`
      INSERT INTO badge_definitions (badge_type, badge_name, badge_description, badge_icon, points_required, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *
    `, [badge_type || 'achievement', badge_name, badge_description || null, badge_icon || '🏆', points_required || 0])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
