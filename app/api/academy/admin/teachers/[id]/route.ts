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
    const { name, email, gender, is_active, reapply_blocked, approval_status } = body

    const VALID_STATUSES = ['pending_approval', 'approved', 'rejected']

    // Build SET clauses dynamically so we only touch fields that were sent
    const setClauses: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (name) { setClauses.push(`name = $${idx++}`); params.push(name) }
    if (email) { setClauses.push(`email = $${idx++}`); params.push(email.toLowerCase().trim()) }
    if (gender) { setClauses.push(`gender = $${idx++}`); params.push(gender) }
    if (typeof is_active === 'boolean') { setClauses.push(`is_active = $${idx++}`); params.push(is_active) }
    if (typeof reapply_blocked === 'boolean') { setClauses.push(`reapply_blocked = $${idx++}`); params.push(reapply_blocked) }
    if (approval_status && VALID_STATUSES.includes(approval_status)) {
      setClauses.push(`approval_status = $${idx++}`); params.push(approval_status)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    setClauses.push(`updated_at = NOW()`)
    params.push(id)

    const result = await query(`
      UPDATE users SET ${setClauses.join(', ')}
      WHERE id = $${idx} AND role = 'teacher'
      RETURNING id, name, email, role, gender, is_active, reapply_blocked, approval_status, created_at
    `, params)

    if (result.length === 0) {
      return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 })
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
    const result = await query<{ id: string }>(
      `DELETE FROM users WHERE id = $1 AND role = 'teacher' RETURNING id`,
      [id]
    )
    if (result.length === 0) {
      return NextResponse.json({ error: 'المدرس غير موجود' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting teacher:', error)
    if (error?.code === '23503') {
      return NextResponse.json(
        {
          error:
            'لا يمكن حذف هذا المدرس لأنه مرتبط بكورسات أو حلقات. يرجى نقل أو أرشفة الكورسات أولاً ثم إعادة المحاولة.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
