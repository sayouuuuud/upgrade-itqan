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

    // Publishing routes through content-supervisor review instead of going live directly.
    // Un-publishing is still a direct admin action.
    if (body.is_published === true) {
      try {
        const submitted = await query(
          `UPDATE learning_paths
              SET status = 'pending_review', is_published = FALSE,
                  submitted_for_review_at = NOW()
            WHERE id = $1 RETURNING *`,
          [id],
        )
        if (submitted.length === 0) return NextResponse.json({ error: 'Path not found' }, { status: 404 })
        return NextResponse.json({ data: submitted[0], submitted_for_review: true })
      } catch (err: any) {
        if (err?.code !== '42703') throw err
        // columns not yet migrated → fall through to legacy update
      }
    }

    const result = await query(`
      UPDATE learning_paths SET title = COALESCE($1, title), description = COALESCE($2, description),
        subject = COALESCE($3, subject), level = COALESCE($4, level), 
        estimated_hours = COALESCE($5, estimated_hours), updated_at = NOW() WHERE id = $6 RETURNING *
    `, [body.title || null, body.description || null, body.subject || null, body.level || null, body.estimated_hours || null, id])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
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
    await query(`DELETE FROM learning_paths WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
