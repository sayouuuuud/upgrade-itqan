import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

async function loadHalaqaShort(id: string) {
  const rows = await query<{
    id: string
    teacher_id: string | null
    max_students: number
    gender: string
    platform: HalaqaPlatform
  }>(
    `SELECT id, teacher_id, max_students, gender, platform FROM halaqat WHERE id = $1`,
    [id]
  )
  return rows[0] || null
}

/**
 * GET /api/halaqat/[id]/students
 * List the students currently enrolled in this halaqa, with their attendance
 * counts. Visible to host, admins of the platform, and the enrolled student
 * themselves (limited fields).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    // Allow enrolled students to see their classmates (read-only)
    const enr = await query<{ id: string }>(
      `SELECT id FROM halaqat_students WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
      [id, session.sub]
    )
    if (enr.length === 0) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
  }

  const students = await query<any>(
    `SELECT
       hs.id AS enrollment_id,
       hs.joined_at,
       hs.is_active,
       u.id AS student_id,
       u.name AS student_name,
       u.email AS student_email,
       u.avatar_url,
       (
         SELECT COUNT(*) FROM halaqat_attendance ha
         WHERE ha.student_id = u.id AND ha.halaqah_id = $1 AND ha.status = 'present'
       )::int AS attendance_count,
       (
         SELECT COUNT(*) FROM halaqat_attendance ha
         WHERE ha.student_id = u.id AND ha.halaqah_id = $1
       )::int AS total_sessions
     FROM halaqat_students hs
     JOIN users u ON u.id = hs.student_id
     WHERE hs.halaqah_id = $1
     ORDER BY hs.is_active DESC, hs.joined_at DESC`,
    [id]
  )

  return NextResponse.json({ students })
}

/**
 * POST /api/halaqat/[id]/students
 * Body: { student_id }
 *
 * Enroll a student. Owner or platform admin only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const studentId = body.student_id
  if (!studentId) {
    return NextResponse.json({ error: 'student_id مطلوب' }, { status: 400 })
  }

  // Capacity check (only count active enrollments)
  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM halaqat_students WHERE halaqah_id = $1 AND is_active = TRUE`,
    [id]
  )
  if (parseInt(countRows[0].count, 10) >= halaqa.max_students) {
    return NextResponse.json({ error: 'الحلقة ممتلئة' }, { status: 400 })
  }

  const existing = await query<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM halaqat_students WHERE halaqah_id = $1 AND student_id = $2`,
    [id, studentId]
  )
  if (existing.length > 0) {
    if (!existing[0].is_active) {
      await query(
        `UPDATE halaqat_students SET is_active = TRUE, joined_at = NOW() WHERE id = $1`,
        [existing[0].id]
      )
    }
    return NextResponse.json({ success: true, message: 'تم تفعيل الطالب في الحلقة' })
  }

  await query(
    `INSERT INTO halaqat_students (halaqah_id, student_id, joined_at, is_active)
     VALUES ($1, $2, NOW(), TRUE)`,
    [id, studentId]
  )
  return NextResponse.json({ success: true, message: 'تمت إضافة الطالب' }, { status: 201 })
}

/**
 * DELETE /api/halaqat/[id]/students
 * Body: { student_id }
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const studentId = body.student_id
  if (!studentId) {
    return NextResponse.json({ error: 'student_id مطلوب' }, { status: 400 })
  }

  await query(
    `UPDATE halaqat_students SET is_active = FALSE WHERE halaqah_id = $1 AND student_id = $2`,
    [id, studentId]
  )
  return NextResponse.json({ success: true })
}
