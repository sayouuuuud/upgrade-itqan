import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'

/**
 * GET /api/halaqat/[id]/eligible-students
 *
 * Returns students that may be added to this halaqa.
 *  - If the halaqa is linked to a learning path, only students enrolled in
 *    that path are returned (path-scoped).
 *  - Otherwise falls back to all academy students.
 * Already-enrolled students are excluded.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await queryOne<{
    id: string
    teacher_id: string | null
    platform: HalaqaPlatform
    path_id: string | null
    path_type: string | null
  }>(
    `SELECT id, teacher_id, platform, path_id, path_type FROM halaqat WHERE id = $1`,
    [id]
  )
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  let rows: any[]
  if (halaqa.path_id && (halaqa.path_type === 'tajweed' || halaqa.path_type === 'memorization')) {
    const enrollTable =
      halaqa.path_type === 'tajweed' ? 'tajweed_path_enrollments' : 'memorization_path_enrollments'
    rows = await query<any>(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar_url, u.gender
         FROM ${enrollTable} e
         JOIN users u ON u.id = e.student_id
        WHERE e.path_id = $1
          AND COALESCE(e.status, 'active') NOT IN ('dropped', 'cancelled')
          AND NOT EXISTS (
            SELECT 1 FROM halaqat_students hs
            WHERE hs.halaqah_id = $2 AND hs.student_id = u.id AND hs.is_active = TRUE
          )
        ORDER BY u.name`,
      [halaqa.path_id, id]
    )
  } else {
    rows = await query<any>(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.gender
         FROM users u
        WHERE u.role = 'student'
          AND NOT EXISTS (
            SELECT 1 FROM halaqat_students hs
            WHERE hs.halaqah_id = $1 AND hs.student_id = u.id AND hs.is_active = TRUE
          )
        ORDER BY u.name`,
      [id]
    )
  }

  return NextResponse.json({ data: rows, path_scoped: !!halaqa.path_id })
}
