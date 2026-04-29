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
        // Activate teacher account
        await query(
          `UPDATE users SET role = 'teacher', approval_status = 'approved' WHERE id = $1`,
          [app.user_id]
        )
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
