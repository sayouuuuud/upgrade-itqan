import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * POST /api/auth/reapply
 * Allows a rejected user to reapply (reset their approval_status to pending)
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    // Check if user is actually rejected
    const user = await query<{ approval_status: string; role: string }>(
      `SELECT approval_status, role FROM users WHERE id = $1`,
      [session.sub]
    )

    if (user.length === 0) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (user[0].approval_status !== 'rejected') {
      return NextResponse.json({ error: 'لا يمكن إعادة التقديم - حالة الحساب ليست مرفوضة' }, { status: 400 })
    }

    // Reset approval status to pending
    await query(
      `UPDATE users SET approval_status = 'pending_approval', updated_at = NOW() WHERE id = $1`,
      [session.sub]
    )

    // If they're a teacher, also update teacher_applications if exists
    if (user[0].role === 'teacher' || user[0].role === 'student') {
      await query(
        `UPDATE teacher_applications SET status = 'pending', reviewed_at = NULL WHERE user_id = $1`,
        [session.sub]
      ).catch(() => {}) // Ignore if no application exists
    }

    // If they're a reader, also update their reader application
    if (user[0].role === 'reader') {
      // Reader applications are in the users table itself (approval_status)
      // Already updated above
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم إعادة تقديم طلبك بنجاح. سيتم مراجعته من قبل الإدارة.' 
    })
  } catch (error) {
    console.error('Reapply error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
