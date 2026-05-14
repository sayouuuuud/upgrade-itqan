import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * PATCH /api/academy/teacher/courses/:id/archive
 * Body: { is_active: boolean }
 * Toggle archive (deactivate / reactivate) on a course.
 *
 * - Teachers may only toggle their own courses.
 * - Academy admins / admins may toggle any course.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || !requireRole(session, ['teacher', 'admin', 'academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { is_active } = body
  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active (boolean) is required' }, { status: 400 })
  }

  try {
    // Ownership check for teacher.
    if (session.role === 'teacher') {
      const owner = await query<{ teacher_id: string }>(
        `SELECT teacher_id FROM courses WHERE id = $1`,
        [id],
      )
      if (owner.length === 0) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      if (owner[0].teacher_id !== session.sub) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const archivedAt = is_active ? null : new Date()
    const archivedBy = is_active ? null : session.sub

    const result = await query<any>(
      `
      UPDATE courses
      SET is_active = $1,
          archived_at = $2,
          archived_by = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, title, is_active, archived_at, archived_by
      `,
      [is_active, archivedAt, archivedBy, id],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('[API] toggle course archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
