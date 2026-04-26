import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await query(`DELETE FROM invitations WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const result = await query(`
      UPDATE invitations SET email = COALESCE($1, email), role_to_assign = COALESCE($2, role_to_assign),
        status = COALESCE($3, status), updated_at = NOW() WHERE id = $4 RETURNING *
    `, [body.email || null, body.role_to_assign || null, body.status || null, id])
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
