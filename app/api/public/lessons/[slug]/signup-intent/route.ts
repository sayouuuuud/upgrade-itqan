import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateVisitorToken, getRequestIp, hashIp } from '@/lib/public-lessons'
import { cookies } from 'next/headers'

const VISITOR_COOKIE = 'devin_lesson_visitor'
const REFERRAL_COOKIE = 'devin_lesson_referral'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const lessons = await query<{ id: string }>(
    `SELECT id FROM public_lessons WHERE public_slug = $1 AND is_published = true LIMIT 1`,
    [slug]
  )
  if (lessons.length === 0) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  const lessonId = lessons[0].id

  const jar = await cookies()
  let token = jar.get(VISITOR_COOKIE)?.value
  if (!token) {
    token = generateVisitorToken()
    jar.set(VISITOR_COOKIE, token, {
      httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/',
    })
  }

  const ipHash = hashIp(getRequestIp(req.headers))
  const result = await query<{ id: string }>(
    `INSERT INTO public_lesson_signup_referrals (lesson_id, visitor_token, ip_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [lessonId, token, ipHash]
  )

  // Set the referral cookie so when the user finishes /register, we can attribute them.
  jar.set(REFERRAL_COOKIE, result[0].id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return NextResponse.json({
    success: true,
    redirect: `/register?ref=lesson&slug=${encodeURIComponent(slug)}`,
  })
}
