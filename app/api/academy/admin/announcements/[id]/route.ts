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
      UPDATE announcements SET title_ar = COALESCE($1, title_ar), content_ar = COALESCE($2, content_ar), 
        target_audience = COALESCE($3, target_audience), priority = COALESCE($4, priority), 
        is_published = COALESCE($5, is_published), updated_at = NOW() WHERE id = $6 RETURNING *
    `, [body.title_ar || null, body.content_ar || null, body.target_audience || null, body.priority || null, body.is_published !== undefined ? body.is_published : null, id])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
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
    await query(`DELETE FROM announcements WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
