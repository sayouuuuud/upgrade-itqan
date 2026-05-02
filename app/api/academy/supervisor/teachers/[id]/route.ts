import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

const SUPERVISOR_ROLES = [
  'admin',
  'academy_admin',
  'supervisor',
  'content_supervisor',
  'fiqh_supervisor',
  'quality_supervisor',
  'student_supervisor',
  'reciter_supervisor',
]

function isSupervisor(session: any): boolean {
  if (!session) return false
  if (SUPERVISOR_ROLES.includes(session.role)) return true
  if (Array.isArray(session.academy_roles)) {
    return session.academy_roles.some((r: string) => SUPERVISOR_ROLES.includes(r))
  }
  return false
}

/**
 * PATCH /api/academy/supervisor/teachers/[id]
 *
 * Body: { action: 'verify' | 'unverify' }
 *
 * Toggles the `academy_teachers.is_verified` flag for the teacher with
 * the given user id, creating the row if needed. Sends an in-app
 * notification to the teacher about the change.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: teacherId } = await params
  let body: { action?: string } = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const action = body.action
  if (action !== 'verify' && action !== 'unverify') {
    return NextResponse.json(
      { error: 'action must be "verify" or "unverify"' },
      { status: 400 },
    )
  }

  try {
    const teacher = await queryOne<{ id: string; name: string; role: string }>(
      `SELECT id, name, role FROM users WHERE id = $1`,
      [teacherId],
    )
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'User is not a teacher' },
        { status: 400 },
      )
    }

    const isVerified = action === 'verify'

    // Upsert the academy_teachers row with the new verification flag.
    await query(
      `
      INSERT INTO academy_teachers (user_id, is_verified, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        is_verified = EXCLUDED.is_verified,
        updated_at  = NOW()
      `,
      [teacherId, isVerified],
    )

    // Notify the teacher (best effort).
    try {
      await createNotification({
        userId: teacherId,
        type: 'general',
        title: isVerified
          ? 'تم اعتماد ملفك كأستاذ موثّق'
          : 'تم سحب علامة التوثيق من ملفك',
        message: isVerified
          ? 'مبارك! قام المشرف باعتمادك كأستاذ موثّق في الأكاديمية، أصبح ملفك مرئياً للطلاب بشارة التوثيق.'
          : 'قام المشرف بسحب علامة التوثيق من ملفك. يمكنك مراجعة ملفك وتحديث بياناتك ثم طلب التوثيق مجدداً.',
        category: 'account',
        link: '/academy/teacher/profile',
      })
    } catch (notifErr) {
      console.error('[API] supervisor verify notify error:', notifErr)
    }

    return NextResponse.json({
      success: true,
      data: { teacher_id: teacherId, is_verified: isVerified },
    })
  } catch (error) {
    console.error('[API] supervisor/teachers/[id] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
