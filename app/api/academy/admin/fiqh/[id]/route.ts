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
    const answered_at = body.answer && !body.answered_at ? new Date().toISOString() : body.answered_at || null

    const result = await query(`
      UPDATE fiqh_questions SET question = COALESCE($1, question), answer = COALESCE($2, answer),
        category = COALESCE($3, category), is_published = COALESCE($4, is_published),
        answered_at = COALESCE($5, answered_at) WHERE id = $6 RETURNING *
    `, [body.question || null, body.answer || null, body.category || null, body.is_published !== undefined ? body.is_published : null, answered_at, id])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
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
    await query(`DELETE FROM fiqh_questions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
