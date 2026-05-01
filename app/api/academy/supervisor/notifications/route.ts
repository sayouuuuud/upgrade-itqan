import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['supervisor', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const notifications = await query(`
      SELECT id, user_id, type, title, message, category, link, is_read, created_at
        FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2
    `, [session.sub, limit])

    const unreadCount = await query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false
    `, [session.sub])

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    })
  } catch (error) {
    console.error('[Supervisor notifications]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || !['supervisor', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { notificationId, isRead, markAllAsRead } = await req.json()

    if (markAllAsRead) {
      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [session.sub]
      )
    } else if (notificationId) {
      await query(
        'UPDATE notifications SET is_read = $1 WHERE id = $2 AND user_id = $3',
        [isRead, notificationId, session.sub]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Supervisor notifications PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
