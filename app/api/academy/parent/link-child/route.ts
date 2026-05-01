import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

/**
 * POST /api/academy/parent/link-child
 *
 * Two-step parent → child linking with explicit child approval.
 *
 *  body { action: 'search', email }   → returns { student: {...} }
 *  body { action: 'link',  child_id, relation } → creates a PENDING link
 *      and a notification for the student. The link only becomes 'active'
 *      after the student approves it (see /api/academy/student/parent-requests).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { action, email, child_id, relation } = body

  if (action === 'search') {
    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const student = await queryOne<{
      id: string
      name: string
      email: string
      avatar_url: string | null
    }>(
      `SELECT id, name, email, avatar_url
       FROM users
       WHERE email = $1 AND role = 'student'
       LIMIT 1`,
      [email.toLowerCase()]
    )

    if (!student) {
      return NextResponse.json({ error: 'لم يتم العثور على طالب بهذا البريد الإلكتروني' }, { status: 404 })
    }

    const existing = await queryOne<{ status: string }>(
      `SELECT status FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
      [session.sub, student.id]
    )

    if (existing) {
      const msg =
        existing.status === 'pending'
          ? 'لديك طلب قيد المراجعة لهذا الطالب'
          : existing.status === 'active'
          ? 'هذا الطالب مربوط بحسابك بالفعل'
          : existing.status === 'rejected'
          ? 'هذا الطالب رفض طلب الربط'
          : 'الطلب موجود بالفعل'
      return NextResponse.json({ error: msg, status: existing.status }, { status: 409 })
    }

    return NextResponse.json({ student })
  }

  if (action === 'link') {
    if (!child_id || !relation) {
      return NextResponse.json({ error: 'معرف الطالب ونوع العلاقة مطلوبان' }, { status: 400 })
    }

    const allowedRelations = ['father', 'mother', 'guardian', 'other']
    if (!allowedRelations.includes(relation)) {
      return NextResponse.json({ error: 'نوع العلاقة غير صالح' }, { status: 400 })
    }

    const student = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM users WHERE id = $1 AND role = 'student'`,
      [child_id]
    )
    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }

    const existing = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
      [session.sub, child_id]
    )

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ error: 'هذا الطالب مربوط بحسابك بالفعل' }, { status: 409 })
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'الطلب قيد المراجعة من الطالب' }, { status: 409 })
      }
      // If rejected/inactive, re-create the request as pending
      await query(
        `UPDATE parent_children
         SET status = 'pending', relation = $3, responded_at = NULL, updated_at = NOW()
         WHERE id = $1 AND parent_id = $2`,
        [existing.id, session.sub, relation]
      )
    } else {
      await query(
        `INSERT INTO parent_children (parent_id, child_id, relation, status)
         VALUES ($1, $2, $3, 'pending')`,
        [session.sub, child_id, relation]
      )
    }

    // Look up the parent name for the notification
    const parent = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [session.sub])

    // Notify the student
    try {
      await query(
        `INSERT INTO notifications
          (user_id, type, title, message, action_url, action_label, priority, category, related_user_id)
         VALUES ($1, 'parent_link_request', $2, $3, '/academy/student/parent-requests', $4, 'high', 'system', $5)`,
        [
          child_id,
          'طلب ربط من ولي أمر',
          `طلب ${parent?.name || 'ولي أمر'} ربط حسابك بحسابه. الرجاء مراجعة الطلب والموافقة أو الرفض.`,
          'مراجعة الطلب',
          session.sub,
        ]
      )
    } catch (e) {
      console.warn('[link-child] notification insert failed (non-fatal):', e)
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الربط للطالب. سيظهر في حسابك بعد موافقته.',
    })
  }

  return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
}
