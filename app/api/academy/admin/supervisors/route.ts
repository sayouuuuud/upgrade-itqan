import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Roles considered supervisors in this admin endpoint
const SUPERVISOR_ROLES = ['supervisor', 'fiqh_supervisor', 'content_supervisor']
const ADMIN_ROLES = ['admin', 'academy_admin']

/**
 * GET /api/academy/admin/supervisors?type=fiqh|content|all
 * List all supervisors in the academy, optionally filtered by type.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'all'

  const roleFilter =
    type === 'fiqh'    ? ['fiqh_supervisor'] :
    type === 'content' ? ['content_supervisor'] :
                         SUPERVISOR_ROLES

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
    WHERE u.role = ANY($1::text[])
    ORDER BY u.created_at DESC`,
    [roleFilter]
  )

  return NextResponse.json({ supervisors })
}

/**
 * POST /api/academy/admin/supervisors
 * Create a new supervisor account.
 * Body: { name, email, password, gender, type: 'fiqh' | 'content' }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, password, gender, type } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
  }

  const supervisorRole =
    type === 'content' ? 'content_supervisor' :
    type === 'fiqh'    ? 'fiqh_supervisor'    :
                         'fiqh_supervisor' // default

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
     VALUES ($1, $2, $3, $4, $5, true, true, false, NOW())
     RETURNING id, name, email, role, gender, is_active, created_at`,
    [name, email.toLowerCase().trim(), hashedPassword, supervisorRole, gender || 'male']
  )

  return NextResponse.json({ data: result[0] }, { status: 201 })
}

/**
 * DELETE /api/academy/admin/supervisors
 * Deactivate a supervisor account.
 */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { supervisorId } = body

  if (!supervisorId) {
    return NextResponse.json({ error: 'معرف المشرف مطلوب' }, { status: 400 })
  }

  await query(
    `UPDATE users SET is_active = false WHERE id = $1 AND role = ANY($2::text[])`,
    [supervisorId, SUPERVISOR_ROLES]
  )

  return NextResponse.json({ success: true })
}
