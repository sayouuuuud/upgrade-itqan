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
    const { name, gender, is_active } = body

    const result = await query(`
      UPDATE users SET 
        name = COALESCE($1, name),
        gender = COALESCE($2, gender),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE id = $4 AND role = 'teacher'
      RETURNING *
    `, [name || null, gender || null, is_active !== undefined ? is_active : null, id])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating teacher:', error)
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
    await query(`UPDATE users SET is_active = false WHERE id = $1 AND role = 'teacher'`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deactivating teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
