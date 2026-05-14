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
    const { badge_type, name, description, category, icon, criteria_type, criteria_value, points_reward, display_order } = await req.json()
    if (!name || !badge_type) return NextResponse.json({ error: 'Badge name and type required' }, { status: 400 })
    
    // تأكد من عدم تكرار الـ badge_type لأنه المفتاح الأساسي
    const check = await query(`SELECT badge_type FROM badge_definitions WHERE badge_type = $1`, [badge_type])
    if (check.length > 0) {
      return NextResponse.json({ error: 'Badge type already exists' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO badge_definitions (badge_type, name, description, category, icon, criteria_type, criteria_value, points_reward, display_order, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
      RETURNING *
    `, [
      badge_type, 
      name, 
      description || null, 
      category || 'عام', 
      icon || '🏆', 
      criteria_type || 'custom',
      criteria_value || 0, 
      points_reward || 0, 
      display_order || 0
    ])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating badge:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
