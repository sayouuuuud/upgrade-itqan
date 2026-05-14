import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { canAccessQuestion } from '@/lib/fiqh-helpers'
import { createNotification } from '@/lib/notifications'
import { sendEmail } from '@/lib/email'

// POST: officer submits the final answer + asks asker for publish consent
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const { id } = await params
  const access = await canAccessQuestion(session.sub, session.role, id)
  if (!access.allowed || access.perspective === 'asker') {
    return NextResponse.json({ error: 'لا تملك صلاحية الإجابة' }, { status: 403 })
  }

  const { answer } = await req.json()
  if (!answer || typeof answer !== 'string' || answer.trim().length < 10) {
    return NextResponse.json({ error: 'الإجابة مطلوبة (10 أحرف على الأقل)' }, { status: 400 })
  }

  await query(
    `UPDATE fiqh_questions
        SET answer = $1,
            answered_by = $2,
            answered_at = NOW(),
            status = 'awaiting_consent',
            publish_consent = 'requested',
            publish_consent_requested_at = NOW(),
            updated_at = NOW()
      WHERE id = $3`,
    [answer.trim(), session.sub, id]
  )

  // Notify asker for consent
  const q = await queryOne<{ asked_by: string; title: string | null }>(
    `SELECT asked_by, title FROM fiqh_questions WHERE id = $1`,
    [id]
  )
  if (q) {
    await createNotification({
      userId: q.asked_by,
      type: 'general',
      category: 'fiqh',
      title: 'تمت الإجابة على سؤالك',
      message:
        'استلمت إجابة المسؤول على سؤالك الفقهي. الرجاء إبداء موافقتك على نشر السؤال والإجابة في المكتبة العامة.',
      link: `/academy/student/fiqh/${id}`,
    })

    const asker = await queryOne<{ name: string; email: string }>(
      `SELECT name, email FROM users WHERE id = $1`,
      [q.asked_by]
    )
    if (asker?.email) {
      try {
        await sendEmail({
          to: asker.email,
          subject: 'تمت الإجابة على سؤالك الفقهي — موافقتك على النشر',
          body:
            'تمت الإجابة على سؤالك الفقهي. يمكنك الاطلاع على الإجابة وإبداء موافقتك على نشرها من حسابك.',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color:#0B3D2E;">تمت الإجابة على سؤالك الفقهي</h2>
              <p style="color:#475569; line-height: 1.7;">
                مرحباً ${asker.name}،<br/>
                قام المسؤول الشرعي بالإجابة على سؤالك. يمكنك الاطلاع على الإجابة من صفحة "أسئلتي الفقهية" في حسابك.
              </p>
              <p style="color:#475569; line-height: 1.7;">
                نطلب موافقتك على نشر السؤال والإجابة في المكتبة العامة لينتفع بها الآخرون.
                <strong>لن يتم نشر اسمك أو أي بيانات شخصية إذا اخترت السؤال كمجهول.</strong>
              </p>
              <p style="color:#94a3b8; font-size:12px;">يمكنك القبول أو الرفض من حسابك في المنصة.</p>
            </div>`,
        })
      } catch (err) {
        console.warn('[fiqh] consent email failed:', err)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
