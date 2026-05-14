import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateVisitorToken, getRequestIp, hashIp, lessonStateAt } from '@/lib/public-lessons'
import { cookies } from 'next/headers'

const VISITOR_COOKIE = 'devin_lesson_visitor'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const lessons = await query<{
    id: string
    scheduled_at: string
    duration_minutes: number
    meeting_link: string | null
    meeting_provider: string | null
    meeting_password: string | null
    status: string
  }>(
    `SELECT id, scheduled_at, duration_minutes, meeting_link, meeting_provider, meeting_password, status
     FROM public_lessons WHERE public_slug = $1 AND is_published = true LIMIT 1`,
    [slug]
  )
  if (lessons.length === 0) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  const lesson = lessons[0]
  const state = lessonStateAt(lesson.scheduled_at, lesson.duration_minutes)

  const jar = await cookies()
  let token = jar.get(VISITOR_COOKIE)?.value
  if (!token) {
    token = generateVisitorToken()
    jar.set(VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
  }

  const ipHash = hashIp(getRequestIp(req.headers))
  const ua = req.headers.get('user-agent') || null
  const referrer = req.headers.get('referer') || null

  await query(
    `INSERT INTO public_lesson_views (lesson_id, visitor_token, ip_hash, user_agent, referrer)
     VALUES ($1, $2, $3, $4, $5)`,
    [lesson.id, token, ipHash, ua, referrer]
  )
  await query(`UPDATE public_lessons SET view_count = view_count + 1 WHERE id = $1`, [lesson.id])

  const exposeLink = state === 'live' || lesson.status === 'live' || lesson.status === 'completed'

  return NextResponse.json({
    success: true,
    state,
    meeting: exposeLink && lesson.meeting_link ? {
      link: lesson.meeting_link,
      provider: lesson.meeting_provider,
      password: lesson.meeting_password,
    } : null,
  })
}
