import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { assertTeacherAssignable } from '@/lib/teachers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const rows = await query(`
      SELECT 
        s.*,
        u.name as teacher_name
      FROM series s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.id = $1
    `, [id])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }
    return NextResponse.json({ data: rows[0] })
  } catch (error) {
    console.error('Error fetching series:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()

    if (body.teacher_id) {
      // Reject assignment to pending / rejected / suspended teachers.
      const teacherCheck = await assertTeacherAssignable(body.teacher_id)
      if (!teacherCheck.ok) {
        return NextResponse.json({ error: teacherCheck.message }, { status: 400 })
      }
    }

    // Publishing a series routes it through content-supervisor review instead
    // of going live directly. Un-publishing stays a direct action.
    if (body.is_published === true) {
      try {
        const submitted = await query(
          `UPDATE series
              SET status = 'pending_review', is_published = FALSE,
                  submitted_for_review_at = NOW(), updated_at = NOW()
            WHERE id = $1 RETURNING *`,
          [id],
        )
        if (submitted.length === 0) {
          return NextResponse.json({ error: 'Series not found' }, { status: 404 })
        }
        return NextResponse.json({ data: submitted[0], submitted_for_review: true })
      } catch (err: any) {
        if (err?.code !== '42703') throw err
        // review columns not migrated yet → fall through to legacy publish
      }
    }

    const result = await query(`
      UPDATE series SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        subject = COALESCE($3, subject),
        teacher_id = COALESCE($4, teacher_id),
        thumbnail_url = COALESCE($5, thumbnail_url),
        is_published = COALESCE($6, is_published),
        display_order = COALESCE($7, display_order),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [
      body.title || null,
      body.description || null,
      body.subject || null,
      body.teacher_id || null,
      body.thumbnail_url || null,
      body.is_published !== undefined ? body.is_published : null,
      body.display_order !== undefined ? body.display_order : null,
      id
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating series:', error)
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
    await query(`DELETE FROM series WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting series:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
