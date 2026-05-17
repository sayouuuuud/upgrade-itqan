import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

type ColumnRow = { column_name: string }

async function hasColumn(tableName: string, columnName: string) {
  const rows = await query<ColumnRow>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [tableName, columnName]
  )
  return rows.length > 0
}

/**
 * POST /api/auth/reapply
 * Allows a rejected user to reapply (reset their approval_status to pending).
 * Will be blocked if the admin has set reapply_blocked = TRUE on the user.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const hasReapplyBlocked = await hasColumn('users', 'reapply_blocked')
    const user = await query<{ approval_status: string; role: string; reapply_blocked: boolean }>(
      `SELECT approval_status, role, ${hasReapplyBlocked ? 'reapply_blocked' : 'FALSE AS reapply_blocked'} FROM users WHERE id = $1`,
      [session.sub]
    )

    if (user.length === 0) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (user[0].approval_status !== 'rejected') {
      return NextResponse.json({ error: 'لا يمكن إعادة التقديم - حالة الحساب ليست مرفوضة' }, { status: 400 })
    }

    // Admin has explicitly blocked this applicant from reapplying
    if (user[0].reapply_blocked === true) {
      return NextResponse.json({
        error: 'تم إيقاف إمكانية إعادة التقديم على هذا الحساب من قبل الإدارة. يرجى التواصل مع الإدارة مباشرة.',
        blocked: true,
      }, { status: 403 })
    }

    // Reset approval status to pending
    await query(
      `UPDATE users SET approval_status = 'pending_approval', updated_at = NOW() WHERE id = $1`,
      [session.sub]
    )

    // If they're a teacher, also reset teacher_applications if exists
    if (user[0].role === 'teacher') {
      await query(
        `UPDATE teacher_applications SET status = 'pending', reviewed_at = NULL WHERE user_id = $1`,
        [session.sub]
      ).catch(() => {}) // Ignore if no application exists
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
