import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    const seriesRows = await query(`
      SELECT s.*, u.name as teacher_name
      FROM series s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.id = $1 AND s.is_published = true
    `, [id])

    if (seriesRows.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    const items = await query(`
      SELECT 
        si.*,
        CASE 
          WHEN si.item_type = 'course' THEN c.title
          WHEN si.item_type = 'path' THEN lp.title
        END as title,
        CASE 
          WHEN si.item_type = 'course' THEN c.description
          WHEN si.item_type = 'path' THEN lp.description
        END as description,
        CASE
          WHEN si.item_type = 'course' THEN c.thumbnail_url
          WHEN si.item_type = 'path' THEN lp.thumbnail_url
        END as thumbnail_url
      FROM series_items si
      LEFT JOIN courses c ON si.course_id = c.id AND si.item_type = 'course'
      LEFT JOIN learning_paths lp ON si.path_id = lp.id AND si.item_type = 'path'
      WHERE si.series_id = $1
      ORDER BY si.order_index ASC
    `, [id])

    return NextResponse.json({ data: { ...seriesRows[0], items } })
  } catch (error) {
    console.error('Error fetching series detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
