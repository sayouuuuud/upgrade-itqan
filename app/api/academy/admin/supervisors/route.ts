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
      u.gender,
      u.is_active,
      u.created_at,
      u.avatar_url
    FROM users u
    WHERE u.role IN ('supervisor', 'fiqh_supervisor')
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
  if (!session || (session.role !== 'admin' && session.role !== 'academy_admin')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, password, gender } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
  }

  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  )
  if (existing.length > 0) {
    return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const result = await query<any>(
    `INSERT INTO users (name, email, password_hash, role, gender, is_active, has_academy_access, has_quran_access, created_at)
     VALUES ($1, $2, $3, 'fiqh_supervisor', $4, true, true, false, NOW())
     RETURNING id, name, email, role, gender, is_active, created_at`,
    [name, email.toLowerCase().trim(), hashedPassword, gender || 'male']
  )

  return NextResponse.json({ data: result[0] }, { status: 201 })
}

/**
 * DELETE /api/academy/admin/supervisors
 * Remove a supervisor (deactivate account)
 */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.role !== 'academy_admin')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { supervisorId } = body

  if (!supervisorId) {
    return NextResponse.json({ error: 'معرف المشرف مطلوب' }, { status: 400 })
  }

  await query(
    `UPDATE users SET is_active = false WHERE id = $1 AND role IN ('fiqh_supervisor','supervisor')`,
    [supervisorId]
  )

  return NextResponse.json({ success: true })
}
