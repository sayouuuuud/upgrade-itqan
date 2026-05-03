import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * GET /api/academy/admin/supervisors
 * List all supervisors in the academy
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const supervisors = await query<any>(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.is_active,
      u.created_at,
      u.avatar_url,
      (SELECT COUNT(*) FROM academy_courses WHERE supervisor_id = u.id) as courses_count,
      (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND supervised_by = u.id) as teachers_count
    FROM users u
    WHERE u.role = 'supervisor' AND u.has_academy_access = true
    ORDER BY u.created_at DESC`
  )

  return NextResponse.json({ supervisors })
}

/**
 * POST /api/academy/admin/supervisors
 * Create a new supervisor account
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, password, phone } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
  }

  // Check if email already exists
  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  )

  if (existing.length > 0) {
    return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create supervisor
  const result = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role, phone, is_active, has_academy_access, has_quran_access)
     VALUES ($1, $2, $3, 'supervisor', $4, true, true, false)
     RETURNING id`,
    [name, email, hashedPassword, phone || null]
  )

  return NextResponse.json({ 
    success: true, 
    message: 'تم إنشاء حساب المشرف بنجاح',
    supervisorId: result[0].id
  })
}

/**
 * DELETE /api/academy/admin/supervisors
 * Remove a supervisor (deactivate account)
 */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { supervisorId } = body

  if (!supervisorId) {
    return NextResponse.json({ error: 'معرف المشرف مطلوب' }, { status: 400 })
  }

  // Deactivate the supervisor account
  await query(
    `UPDATE users SET is_active = false WHERE id = $1 AND role = 'supervisor'`,
    [supervisorId]
  )

  return NextResponse.json({ success: true, message: 'تم إلغاء تفعيل حساب المشرف' })
}
