import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
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
      WHERE s.is_published = true
      GROUP BY s.id, u.name
      ORDER BY s.display_order ASC, s.created_at DESC
    `)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching published series:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
