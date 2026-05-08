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
    const { title, description, category_id, status, teacher_id, thumbnail_url, price, is_free, duration_hours, level, is_featured } = body

    const result = await query(`
      UPDATE courses SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        status = COALESCE($4, status),
        teacher_id = COALESCE($5, teacher_id),
        thumbnail_url = COALESCE($6, thumbnail_url),
        price = COALESCE($7, price),
        is_free = COALESCE($8, is_free),
        duration_hours = COALESCE($9, duration_hours),
        level = COALESCE($10, level),
        is_featured = COALESCE($11, is_featured),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      title || null, 
      description !== undefined ? description : null, 
      category_id !== undefined ? category_id : null, 
      status || null, 
      teacher_id || null,
      thumbnail_url || null,
      price !== undefined ? price : null,
      is_free !== undefined ? is_free : null,
      duration_hours !== undefined ? duration_hours : null,
      level || null,
      is_featured !== undefined ? is_featured : null,
      id
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating course:', error)
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
    await query(`DELETE FROM courses WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
