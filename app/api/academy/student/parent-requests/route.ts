import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * GET /api/academy/student/parent-requests
 * Returns all pending parent link requests for the current student
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const requests = await query<{
    id: string
    parent_id: string
    parent_name: string
    parent_email: string
    parent_avatar: string | null
    relation: string
    status: string
    created_at: string
  }>(
    `SELECT 
       pc.id,
       pc.parent_id,
       u.name as parent_name,
       u.email as parent_email,
       u.avatar_url as parent_avatar,
       pc.relation,
       pc.status,
       pc.created_at
     FROM parent_children pc
     JOIN users u ON u.id = pc.parent_id
     WHERE pc.child_id = $1
     ORDER BY 
       CASE WHEN pc.status = 'pending' THEN 0 ELSE 1 END,
       pc.created_at DESC`,
    [session.sub]
  )

  return NextResponse.json({ requests })
}

/**
 * POST /api/academy/student/parent-requests
 * Approve or reject a parent link request
 * body { request_id, action: 'approve' | 'reject' }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { request_id, action } = body

  if (!request_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  }

  // Verify the request belongs to this student
  const request = await queryOne<{
    id: string
    parent_id: string
    status: string
  }>(
    `SELECT id, parent_id, status FROM parent_children WHERE id = $1 AND child_id = $2`,
    [request_id, session.sub]
  )

  if (!request) {
    return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  }

  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'تم الرد على هذا الطلب مسبقاً' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'active' : 'rejected'

  await query(
    `UPDATE parent_children 
     SET status = $1, responded_at = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [newStatus, request_id]
  )

  // Notify the parent about the decision
  const student = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [session.sub])

  const notificationTitle = action === 'approve' 
    ? 'تم قبول طلب الربط'
    : 'تم رفض طلب الربط'
  
  const notificationMessage = action === 'approve'
    ? `وافق ${student?.name || 'الطالب'} على ربط حسابه بحسابك. يمكنك الآن متابعة تقدمه.`
    : `رفض ${student?.name || 'الطالب'} طلب ربط الحساب.`

  try {
    await query(
      `INSERT INTO notifications
        (user_id, type, title, message, action_url, priority, category, related_user_id)
       VALUES ($1, 'parent_link_response', $2, $3, '/academy/parent/children', 'normal', 'system', $4)`,
      [request.parent_id, notificationTitle, notificationMessage, session.sub]
    )
  } catch (e) {
    console.warn('[parent-requests] notification insert failed (non-fatal):', e)
  }

  return NextResponse.json({
    success: true,
    message: action === 'approve' 
      ? 'تم قبول الطلب بنجاح' 
      : 'تم رفض الطلب'
  })
}
