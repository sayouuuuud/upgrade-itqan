import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// POST: asker grants/denies consent to publish the answered question
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const { id } = await params
  const { decision, anonymous } = await req.json() // decision: 'grant' | 'deny'
  if (decision !== 'grant' && decision !== 'deny') {
    return NextResponse.json({ error: 'قيمة غير صالحة' }, { status: 400 })
  }

  const q = await queryOne<{
    asked_by: string
    assigned_to: string | null
    answer: string | null
    status: string
  }>(`SELECT asked_by, assigned_to, answer, status FROM fiqh_questions WHERE id = $1`, [id])
  if (!q) {
    return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 })
  }
  if (q.asked_by !== session.sub) {
    return NextResponse.json({ error: 'فقط صاحب السؤال يستطيع منح الموافقة' }, { status: 403 })
  }
  if (q.status !== 'awaiting_consent') {
    return NextResponse.json({ error: 'لا توجد طلب موافقة قيد الانتظار' }, { status: 400 })
  }

  if (decision === 'grant') {
    await query(
      `UPDATE fiqh_questions
          SET publish_consent = 'granted',
              publish_consent_responded_at = NOW(),
              is_anonymous = COALESCE($2, is_anonymous),
              is_published = TRUE,
              published_at = NOW(),
              status = 'published',
              updated_at = NOW()
        WHERE id = $1`,
      [id, typeof anonymous === 'boolean' ? anonymous : null]
    )
    // notify officer
    if (q.assigned_to) {
      await createNotification({
        userId: q.assigned_to,
        type: 'general',
        category: 'fiqh',
        title: 'تم نشر إجابتك',
        message: 'وافق صاحب السؤال على نشر الإجابة في المكتبة العامة.',
        link: `/academy/officer/fiqh/${id}`,
      })
    }
    return NextResponse.json({ ok: true, status: 'published' })
  }

  // deny
  await query(
    `UPDATE fiqh_questions
        SET publish_consent = 'denied',
            publish_consent_responded_at = NOW(),
            is_published = FALSE,
            status = 'closed',
            updated_at = NOW()
      WHERE id = $1`,
    [id]
  )
  if (q.assigned_to) {
    await createNotification({
      userId: q.assigned_to,
      type: 'general',
      category: 'fiqh',
      title: 'لم يوافق السائل على النشر',
      message: 'تم إغلاق السؤال دون نشره.',
      link: `/academy/officer/fiqh/${id}`,
    })
  }
  return NextResponse.json({ ok: true, status: 'closed' })
}
