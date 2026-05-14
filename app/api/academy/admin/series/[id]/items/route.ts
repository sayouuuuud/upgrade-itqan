import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
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
        END as description
      FROM series_items si
      LEFT JOIN courses c ON si.course_id = c.id AND si.item_type = 'course'
      LEFT JOIN learning_paths lp ON si.path_id = lp.id AND si.item_type = 'path'
      WHERE si.series_id = $1
      ORDER BY si.order_index ASC
    `, [id])

    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('Error fetching series items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const { item_type, course_id, path_id } = await req.json()

    if (!item_type || !['course', 'path'].includes(item_type)) {
      return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
    }
    if (item_type === 'course' && !course_id) {
      return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    }
    if (item_type === 'path' && !path_id) {
      return NextResponse.json({ error: 'path_id required' }, { status: 400 })
    }

    const maxOrder = await query<{ max_order: number }>(`
      SELECT COALESCE(MAX(order_index), -1) as max_order FROM series_items WHERE series_id = $1
    `, [id])
    const nextOrder = (maxOrder[0]?.max_order ?? -1) + 1

    const result = await query(`
      INSERT INTO series_items (series_id, item_type, course_id, path_id, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      id,
      item_type,
      item_type === 'course' ? course_id : null,
      item_type === 'path' ? path_id : null,
      nextOrder
    ])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('unique')) {
      return NextResponse.json({ error: 'هذا العنصر مضاف بالفعل في السلسلة' }, { status: 409 })
    }
    console.error('Error adding series item:', error)
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
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) {
      return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    }
    await query(`DELETE FROM series_items WHERE id = $1 AND series_id = $2`, [itemId, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing series item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
