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
      SELECT 
        s.*,
        u.name as teacher_name,
        COUNT(si.id)::int as items_count,
        COUNT(si.id) FILTER (WHERE si.item_type = 'course')::int as courses_count,
        COUNT(si.id) FILTER (WHERE si.item_type = 'path')::int as paths_count
      FROM series s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN series_items si ON si.series_id = s.id
      GROUP BY s.id, u.name
      ORDER BY s.display_order ASC, s.created_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching series:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { title, description, subject, teacher_id, thumbnail_url } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const result = await query(`
      INSERT INTO series (title, description, subject, teacher_id, thumbnail_url, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [title, description || null, subject || null, teacher_id || null, thumbnail_url || null])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating series:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
