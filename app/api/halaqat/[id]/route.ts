import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import {
  ADMIN_ROLES,
  HOST_ROLES,
  type HalaqaPlatform,
} from '@/lib/halaqat'
import { assertTeacherAssignable } from '@/lib/teachers'

const ALLOWED_GENDERS = new Set(['male', 'female', 'both', 'mixed'])

async function loadHalaqa(id: string) {
  const rows = await query<any>(
    `SELECT
       h.*,
       u.name AS teacher_name,
       COALESCE((
         SELECT COUNT(*) FROM halaqat_students hs
         WHERE hs.halaqah_id = h.id AND hs.is_active = TRUE
       ), 0)::int AS current_students,
       EXISTS (
         SELECT 1 FROM halaqat_live_sessions hls
         WHERE hls.halaqah_id = h.id AND hls.ended_at IS NULL
       ) AS is_live
     FROM halaqat h
     LEFT JOIN users u ON u.id = h.teacher_id
     WHERE h.id = $1`,
    [id]
  )
  return rows[0] || null
}

/**
 * GET /api/halaqat/[id]
 *
 * Returns the halaqa details. Hosts/admins/admins-of-the-platform can read
 * any halaqa on their platform. Students can only read halaqat they're
 * enrolled in.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqa(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const platform = halaqa.platform as HalaqaPlatform
  const isAdmin = ADMIN_ROLES[platform].includes(session.role)
  const isHost = HOST_ROLES[platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub

  let isEnrolled = false
  if (!isAdmin && !isOwner) {
    const enr = await query<{ id: string }>(
      `SELECT id FROM halaqat_students
       WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
      [id, session.sub]
    )
    isEnrolled = enr.length > 0
  }

  if (!isAdmin && !isOwner && !isEnrolled && !isHost) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  return NextResponse.json({
    data: halaqa,
    permissions: {
      can_manage: isAdmin || isOwner,
      can_host: isAdmin || isOwner,
      is_enrolled: isEnrolled,
      role: isAdmin || isOwner ? 'host' : 'participant',
    },
  })
}

/**
 * PATCH /api/halaqat/[id]
 * Body: partial halaqa update. Only owner/admin allowed.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqa(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const platform = halaqa.platform as HalaqaPlatform
  const isAdmin = ADMIN_ROLES[platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.teacher_id && body.teacher_id !== halaqa.teacher_id) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'تغيير المدرس يتطلب صلاحيات إدارية' }, { status: 403 })
    }
    if (platform === 'academy') {
      const check = await assertTeacherAssignable(body.teacher_id)
      if (!check.ok) {
        return NextResponse.json({ error: check.message }, { status: 400 })
      }
    }
  }

  if (body.gender && !ALLOWED_GENDERS.has(String(body.gender).toLowerCase())) {
    return NextResponse.json({ error: 'قيمة الجنس غير صحيحة' }, { status: 400 })
  }

  const updates: string[] = []
  const values: unknown[] = []
  let i = 1
  const fields: Array<[string, any]> = [
    ['name', body.name],
    ['description', body.description],
    ['teacher_id', body.teacher_id],
    ['gender', body.gender ? String(body.gender).toLowerCase() : undefined],
    ['max_students', body.max_students],
    ['meeting_link', body.meeting_link],
    ['scheduled_at', body.scheduled_at],
    ['duration_minutes', body.duration_minutes],
    ['is_active', body.is_active],
  ]
  for (const [col, val] of fields) {
    if (val !== undefined) {
      updates.push(`${col} = $${i++}`)
      values.push(val)
    }
  }
  if (updates.length === 0) {
    return NextResponse.json({ data: halaqa })
  }
  updates.push(`updated_at = NOW()`)
  values.push(id)
  const rows = await query<any>(
    `UPDATE halaqat SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  return NextResponse.json({ data: rows[0] })
}

/**
 * DELETE /api/halaqat/[id] - owner/admin only.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqa(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })
  const platform = halaqa.platform as HalaqaPlatform
  const isAdmin = ADMIN_ROLES[platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await query(`DELETE FROM halaqat WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
