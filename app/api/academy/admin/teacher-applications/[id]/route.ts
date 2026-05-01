import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { sendTeacherApprovedEmail, sendTeacherRejectedEmail } from '@/lib/email'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const p = await params;
    const appId = p.id;
    const { status } = await req.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update application status
    const updateQ = `UPDATE teacher_applications SET status = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *`
    const res = await query<any>(updateQ, [status, appId])

    if (res.length > 0) {
      const app = res[0]

      // Get teacher user info for email
      const userRes = await query<any>(
        'SELECT name, email FROM users WHERE id = $1',
        [app.user_id]
      )
      const teacher = userRes[0]

      if (status === 'approved') {
        // A-3: Activate teacher account with proper role setup so the teacher
        // is correctly routed by middleware to /academy/teacher (not /student)
        // and the dashboard can render without a white screen.
        await query(
          `UPDATE users
           SET role = 'teacher',
               approval_status = 'approved',
               is_active = true,
               has_academy_access = true,
               platform_preference = CASE WHEN platform_preference IS NULL THEN 'academy' ELSE platform_preference END,
               academy_roles = (
                 SELECT ARRAY(
                   SELECT DISTINCT unnest(COALESCE(academy_roles, ARRAY[]::VARCHAR[]) || ARRAY['teacher']::VARCHAR[])
                 )
               )
           WHERE id = $1`,
          [app.user_id]
        )

        // A-3: Invalidate any existing sessions so the user is forced to
        // re-login and pick up the new `teacher` role in their JWT. Without
        // this they keep their old (student) role until logout, which causes
        // the white-screen-after-approval bug.
        await query(`DELETE FROM user_sessions WHERE user_id = $1`, [app.user_id])
          .catch((e) => console.log('[v0] A-3: session cleanup warning', e))
        await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [app.user_id])
          .catch(() => { /* table may not exist in some envs */ })

        // Create teacher profile in academy_teachers table if it exists.
        // The table is owned by another agent's schema; do not fail the
        // approval flow if it isn't migrated yet.
        try {
          const existingTeacher = await query(
            `SELECT id FROM academy_teachers WHERE user_id = $1`,
            [app.user_id]
          )

          if (existingTeacher.length === 0) {
            await query(
              `INSERT INTO academy_teachers (user_id, created_at)
               VALUES ($1, NOW())`,
              [app.user_id]
            )
          }
        } catch (profileErr) {
          console.log('[v0] A-3: academy_teachers profile step skipped:', profileErr)
        }

        // Send approval email
        if (teacher) {
          await sendTeacherApprovedEmail(teacher.email, teacher.name)
        }
      } else if (status === 'rejected') {
        // Mark as rejected but keep the account
        await query(
          `UPDATE users SET approval_status = 'rejected' WHERE id = $1`,
          [app.user_id]
        )
        // Send rejection email
        if (teacher) {
          await sendTeacherRejectedEmail(teacher.email, teacher.name)
        }
      }
    }

    return NextResponse.json({ success: true, data: res[0] })
  } catch (error) {
    console.error('Error updating teacher application:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
