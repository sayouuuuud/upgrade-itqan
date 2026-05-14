import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateToken, sendMailingListVerificationEmail } from '@/lib/lesson-mailing-list'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let body: { email?: string; name?: string; source?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
  }
  const name = body.name?.trim().slice(0, 255) || null
  const source = (body.source || 'public_lesson').slice(0, 40)

  const lessons = await query<{ teacher_id: string; teacher_name: string | null }>(
    `SELECT pl.teacher_id, u.name AS teacher_name
     FROM public_lessons pl LEFT JOIN users u ON u.id = pl.teacher_id
     WHERE pl.public_slug = $1 AND pl.is_published = true LIMIT 1`,
    [slug]
  )
  if (lessons.length === 0) {
    return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 })
  }
  const { teacher_id, teacher_name } = lessons[0]

  // Check existing record (unique on email+teacher_id)
  const existing = await query<{
    id: string; is_verified: boolean | null; unsubscribed_at: string | null;
    verification_token: string | null; unsubscribe_token: string | null;
  }>(
    `SELECT id, is_verified, unsubscribed_at, verification_token, unsubscribe_token
     FROM public_lesson_subscribers
     WHERE email = $1 AND teacher_id = $2`,
    [email, teacher_id]
  )

  let verificationToken: string
  let unsubscribeToken: string

  if (existing.length === 0) {
    verificationToken = generateToken()
    unsubscribeToken = generateToken()
    await query(
      `INSERT INTO public_lesson_subscribers
         (email, name, teacher_id, is_verified, source, verification_token, unsubscribe_token, verification_sent_at)
       VALUES ($1, $2, $3, false, $4, $5, $6, NOW())`,
      [email, name, teacher_id, source, verificationToken, unsubscribeToken]
    )
  } else {
    const row = existing[0]
    if (row.is_verified && !row.unsubscribed_at) {
      return NextResponse.json({
        success: true, alreadySubscribed: true,
        message: 'إنت مشترك بالفعل في القائمة البريدية. لو عايز تلغي الاشتراك استخدم اللينك في آخر إيميل.',
      })
    }
    // Resend verification (re-subscribe / never verified)
    verificationToken = generateToken()
    unsubscribeToken = row.unsubscribe_token || generateToken()
    await query(
      `UPDATE public_lesson_subscribers
       SET name = COALESCE($1, name),
           verification_token = $2,
           unsubscribe_token = $3,
           verification_sent_at = NOW(),
           unsubscribed_at = NULL,
           source = $4
       WHERE id = $5`,
      [name, verificationToken, unsubscribeToken, source, row.id]
    )
  }

  await sendMailingListVerificationEmail({
    email,
    name,
    teacherName: teacher_name || 'منصة إتقان',
    verificationToken,
    unsubscribeToken,
  })

  return NextResponse.json({
    success: true,
    message: 'بعتنالك إيميل تأكيد. افتحه واضغط على "تأكيد الاشتراك".',
  })
}
