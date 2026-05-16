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
    const { name, email, gender, is_active } = body

    const result = await query(`
      UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        gender = COALESCE($3, gender),
        is_active = CASE WHEN $4::boolean IS NOT NULL THEN $4 ELSE is_active END,
        updated_at = NOW()
      WHERE id = $5 AND role = 'teacher'
      RETURNING id, name, email, role, gender, is_active, created_at
    `, [
      name || null, 
      email ? email.toLowerCase().trim() : null, 
      gender || null, 
      is_active !== undefined ? is_active : null, 
      id
    ])

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
    // Hard delete the user row. Most teacher-related tables reference users(id)
    // with ON DELETE CASCADE (teacher_applications, sessions, enrollments, …),
    // so they get cleaned up automatically. The only ON DELETE RESTRICT FK is
    // courses.teacher_id — if the teacher still owns courses, the DELETE will
    // fail with Postgres error code 23503 and we surface that to the admin so
    // they can reassign or archive the courses first.
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
