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
    const result = await query(`
      UPDATE competitions SET title = COALESCE($1, title), description = COALESCE($2, description),
        type = COALESCE($3, type), start_date = COALESCE($4, start_date), 
        end_date = COALESCE($5, end_date), max_participants = COALESCE($6, max_participants),
        prizes_description = COALESCE($7, prizes_description), status = COALESCE($8, status),
        updated_at = NOW() WHERE id = $9 RETURNING *
    `, [body.title || null, body.description || null, body.type || null, body.start_date || null, body.end_date || null, body.max_participants || null, body.prizes_description || null, body.status || null, id])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
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
    await query(`DELETE FROM competitions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
