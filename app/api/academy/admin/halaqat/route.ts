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
      SELECT * FROM halaqat ORDER BY created_at DESC
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
    const { name, description, teacher_id, gender, max_students, meeting_link } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    
    const result = await query(`
      INSERT INTO halaqat (name, description, teacher_id, gender, max_students, meeting_link, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      RETURNING *
    `, [name, description || null, teacher_id || null, gender || 'both', max_students || 20, meeting_link || null])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
