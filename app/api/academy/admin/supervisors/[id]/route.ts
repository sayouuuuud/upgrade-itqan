import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

const SUPERVISOR_ROLES = ['supervisor', 'fiqh_supervisor', 'content_supervisor']
const ADMIN_ROLES = ['admin', 'academy_admin']

/**
 * PATCH /api/academy/admin/supervisors/[id]
 * Update a supervisor account (details, status, password).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { name, email, password, gender, type, is_active } = body

    // 1. If email is provided, validate format and uniqueness
    let emailToUpdate: string | undefined = undefined
    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 })
      }

      const existing = await query<{ id: string }>(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [trimmedEmail, id]
      )
      if (existing.length > 0) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
      }
      emailToUpdate = trimmedEmail
    }

    // 2. Map supervisor role if type is passed
    let supervisorRole: string | undefined = undefined
    if (type !== undefined) {
      supervisorRole =
        type === 'content' ? 'content_supervisor' :
        type === 'fiqh'    ? 'fiqh_supervisor'    :
                             'fiqh_supervisor'
    }

    // 3. Hash password if a new one is set
    let hashedPassword: string | undefined = undefined
    if (password !== undefined && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // 4. Build dynamic query
    const fieldsToUpdate: { [key: string]: any } = {}
    if (name !== undefined) fieldsToUpdate.name = name
    if (emailToUpdate !== undefined) fieldsToUpdate.email = emailToUpdate
    if (supervisorRole !== undefined) fieldsToUpdate.role = supervisorRole
    if (gender !== undefined) fieldsToUpdate.gender = gender
    if (is_active !== undefined) fieldsToUpdate.is_active = is_active
    if (hashedPassword !== undefined) fieldsToUpdate.password_hash = hashedPassword

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json({ error: 'لم يتم تحديد أي حقول لتحديثها' }, { status: 400 })
    }

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const [key, val] of Object.entries(fieldsToUpdate)) {
      sets.push(`${key} = $${i}`)
      values.push(val)
      i++
    }
    values.push(id)

    const result = await query<any>(`
      UPDATE users 
      SET ${sets.join(', ')} 
      WHERE id = $${i} AND role = ANY($${i+1}::text[])
      RETURNING id, name, email, role, gender, is_active, created_at, avatar_url
    `, [...values, SUPERVISOR_ROLES])

    if (result.length === 0) {
      return NextResponse.json({ error: 'المشرف غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Error updating supervisor:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم الداخلي' }, { status: 500 })
  }
}

/**
 * DELETE /api/academy/admin/supervisors/[id]
 * Hard delete a supervisor account.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await query<any>(`
      DELETE FROM users 
      WHERE id = $1 AND role = ANY($2::text[])
      RETURNING id
    `, [id, SUPERVISOR_ROLES])

    if (result.length === 0) {
      return NextResponse.json({ error: 'المشرف غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error hard deleting supervisor:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم الداخلي' }, { status: 500 })
  }
}
