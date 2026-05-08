import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
  }

  const invitations = await query<any>(
    `SELECT i.*, c.title AS plan_title
     FROM invitations i
     LEFT JOIN courses c ON c.id = i.plan_id
     WHERE i.token = $1`,
    [inviteCode]
  )

  if (!invitations.length) {
    return NextResponse.json({ error: 'رابط الدعوة غير صالح' }, { status: 404 })
  }

  const inv = invitations[0]

  if (inv.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'تم قبول هذه الدعوة مسبقاً' }, { status: 400 })
  }
  if (inv.status === 'CANCELLED') {
    return NextResponse.json({ error: 'تم إلغاء هذه الدعوة' }, { status: 400 })
  }
  if (inv.status === 'EXPIRED' || (inv.expires_at && new Date(inv.expires_at) < new Date())) {
    await query(`UPDATE invitations SET status = 'EXPIRED' WHERE id = $1`, [inv.id])
    return NextResponse.json({ error: 'انتهت صلاحية هذه الدعوة' }, { status: 410 })
  }

  // Assign the invited role to the user if different from current role
  if (inv.role_to_assign && inv.role_to_assign !== session.role) {
    await query(
      `UPDATE users SET role = $1 WHERE id = $2`,
      [inv.role_to_assign, session.sub]
    )
  }

  // Enroll in plan (plan_id is a course/plan in the courses table)
  let enrolledPlanId: string | null = null
  if (inv.plan_id) {
    try {
      await query(
        `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
        [session.sub, inv.plan_id]
      )
      enrolledPlanId = inv.plan_id
    } catch (e: any) {
      if (e.code !== '23505') throw e
    }
  }

  // Legacy: also enroll in target_course_id if present
  if (inv.target_course_id && inv.target_course_id !== inv.plan_id) {
    try {
      await query(
        `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
        [session.sub, inv.target_course_id]
      )
    } catch (e: any) {
      if (e.code !== '23505') throw e
    }
  }

  // Mark accepted
  await query(
    `UPDATE invitations
     SET status = 'ACCEPTED', accepted_at = NOW(), accepted_by_user_id = $1
     WHERE id = $2`,
    [session.sub, inv.id]
  )

  // Audit history — best effort
  await query(
    `INSERT INTO invitation_history (invitation_id, previous_status, new_status, changed_by)
     VALUES ($1, $2, 'ACCEPTED', $3)`,
    [inv.id, inv.status, session.sub]
  ).catch(() => {})

  return NextResponse.json({
    success: true,
    enrolledPlanId,
    planTitle: inv.plan_title || null,
    role: inv.role_to_assign,
    // Frontend uses this to redirect appropriately
    redirect: enrolledPlanId
      ? `/academy/student/courses/${enrolledPlanId}`
      : '/academy/student',
  })
}
