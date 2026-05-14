import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { generatePublicSlug } from '@/lib/public-lessons'
import { sendNewLessonNotificationEmail } from '@/lib/lesson-mailing-list'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const isAdmin = ['academy_admin', 'admin'].includes(session.role)
  const params: unknown[] = []
  let where = ''
  if (!isAdmin) { where = 'WHERE teacher_id = $1'; params.push(session.sub) }
  const rows = await query(
    `SELECT id, teacher_id, title, description, cover_image_url, public_slug,
            meeting_link, meeting_provider, meeting_password,
            scheduled_at, duration_minutes, status, is_published,
            view_count, signup_count, created_at, updated_at
       FROM public_lessons ${where}
       ORDER BY scheduled_at DESC`,
    params
  )
  return NextResponse.json({ data: rows })
}

interface CreateBody {
  title: string
  description?: string
  scheduled_at: string
  duration_minutes?: number
  cover_image_url?: string | null
  meeting_link?: string | null
  meeting_provider?: 'zoom' | 'google_meet' | 'other' | null
  meeting_password?: string | null
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: CreateBody
  try {
    body = (await req.json()) as CreateBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.title?.trim() || !body.scheduled_at) {
    return NextResponse.json({ error: 'العنوان والموعد مطلوبان' }, { status: 400 })
  }

  // Generate a unique slug (retry on extremely unlikely collision)
  let slug = generatePublicSlug()
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await query<{ id: string }>(`SELECT id FROM public_lessons WHERE public_slug = $1 LIMIT 1`, [slug])
    if (exists.length === 0) break
    slug = generatePublicSlug()
  }

  const provider = body.meeting_provider && ['zoom', 'google_meet', 'other'].includes(body.meeting_provider)
    ? body.meeting_provider : null

  const result = await query<{
    id: string; teacher_id: string; title: string; description: string | null;
    public_slug: string; scheduled_at: string;
  }>(
    `INSERT INTO public_lessons
       (teacher_id, title, description, cover_image_url, public_slug,
        meeting_link, meeting_provider, meeting_password,
        scheduled_at, duration_minutes, status, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled', true)
     RETURNING *`,
    [
      session.sub,
      body.title.trim().slice(0, 255),
      body.description?.trim() || null,
      body.cover_image_url || null,
      slug,
      body.meeting_link?.trim() || null,
      provider,
      body.meeting_password?.trim() || null,
      body.scheduled_at,
      body.duration_minutes || 60,
    ]
  )

  // Notify the teacher's mailing list subscribers and platform followers
  // (fire-and-forget; we don't block the response on delivery).
  notifyMailingList(result[0]).catch(err => {
    console.error('[public-lessons] failed to notify mailing list:', err)
  })
  notifyTeacherFollowers(result[0]).catch(err => {
    console.error('[public-lessons] failed to notify followers:', err)
  })

  return NextResponse.json({ data: result[0] }, { status: 201 })
}

async function notifyTeacherFollowers(lesson: {
  id: string; teacher_id: string; title: string; public_slug: string;
}) {
  const teacher = await query<{ name: string | null }>(
    `SELECT name FROM users WHERE id = $1`,
    [lesson.teacher_id]
  )
  const teacherName = teacher[0]?.name || 'مدرّس'
  await query(
    `INSERT INTO notifications (user_id, type, title, message, action_url, action_label, priority, category, link, dedup_key)
     SELECT tf.user_id,
            'new_public_lesson',
            $1,
            $2,
            $3,
            'افتح الدرس',
            'normal',
            'session',
            $3,
            $4
     FROM teacher_followers tf
     WHERE tf.teacher_id = $5
     ON CONFLICT DO NOTHING`,
    [
      `درس عام جديد من ${teacherName}`,
      `أعلن ${teacherName} عن درس عام جديد: ${lesson.title}`,
      `/lessons/${lesson.public_slug}`,
      `public_lesson:${lesson.id}`,
      lesson.teacher_id,
    ]
  )
}

async function notifyMailingList(lesson: {
  id: string; teacher_id: string; title: string;
  description: string | null; public_slug: string; scheduled_at: string;
}) {
  const teacher = await query<{ name: string | null }>(
    `SELECT name FROM users WHERE id = $1`,
    [lesson.teacher_id]
  )
  const teacherName = teacher[0]?.name || 'منصة إتقان'

  const subscribers = await query<{
    email: string; name: string | null; unsubscribe_token: string;
  }>(
    `SELECT email, name, unsubscribe_token
     FROM public_lesson_subscribers
     WHERE teacher_id = $1
       AND is_verified = true
       AND unsubscribed_at IS NULL
       AND unsubscribe_token IS NOT NULL`,
    [lesson.teacher_id]
  )
  if (subscribers.length === 0) return

  const base = process.env.NEXT_PUBLIC_APP_URL
    || process.env.APP_URL
    || 'https://itqan.community'
  const lessonUrl = `${base}/lessons/${lesson.public_slug}`

  // Send sequentially to avoid swamping the SMTP transport
  for (const s of subscribers) {
    try {
      await sendNewLessonNotificationEmail({
        to: s.email,
        name: s.name,
        teacherName,
        lessonTitle: lesson.title,
        lessonDescription: lesson.description,
        lessonScheduledAt: lesson.scheduled_at,
        lessonUrl,
        unsubscribeToken: s.unsubscribe_token,
      })
    } catch (e) {
      console.error('[public-lessons] failed to email subscriber', s.email, e)
    }
  }
}
