import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// POST: admin (re)assigns a question to a specific officer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { officer_user_id } = await req.json()
  if (!officer_user_id) {
    return NextResponse.json({ error: 'officer_user_id مطلوب' }, { status: 400 })
  }

  // verify officer is registered & active
  const officer = await queryOne<{ id: string }>(
    `SELECT id FROM fiqh_officers WHERE user_id = $1 AND is_active = TRUE`,
    [officer_user_id]
  )
  if (!officer) {
    return NextResponse.json({ error: 'هذا المستخدم ليس مسؤولاً نشطاً' }, { status: 400 })
  }

  await query(
    `UPDATE fiqh_questions
        SET assigned_to = $1,
            status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END,
            updated_at = NOW()
      WHERE id = $2`,
    [officer_user_id, id]
  )

  await createNotification({
    userId: officer_user_id,
    type: 'general',
    category: 'fiqh',
    title: 'تم تعيين سؤال فقهي لك',
    message: 'قام المسؤول الإداري بتعيين سؤال فقهي لك للإجابة عليه.',
    link: `/academy/officer/fiqh/${id}`,
  })

  return NextResponse.json({ ok: true })
}
