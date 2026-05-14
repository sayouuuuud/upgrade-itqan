import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { lessonStateAt } from '@/lib/public-lessons'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await query<{
    id: string
    teacher_id: string
    title: string
    description: string | null
    cover_image_url: string | null
    public_slug: string
    meeting_link: string | null
    meeting_provider: string | null
    meeting_password: string | null
    scheduled_at: string
    duration_minutes: number
    status: string
    is_published: boolean
    teacher_name: string | null
    teacher_bio: string | null
    teacher_avatar: string | null
  }>(
    `SELECT pl.id, pl.teacher_id, pl.title, pl.description, pl.cover_image_url, pl.public_slug,
            pl.meeting_link, pl.meeting_provider, pl.meeting_password,
            pl.scheduled_at, pl.duration_minutes, pl.status, pl.is_published,
            u.name AS teacher_name, u.bio AS teacher_bio, u.avatar_url AS teacher_avatar
     FROM public_lessons pl
     LEFT JOIN users u ON u.id = pl.teacher_id
     WHERE pl.public_slug = $1 AND pl.is_published = true
     LIMIT 1`,
    [slug]
  )
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  const lesson = rows[0]
  const state = lessonStateAt(lesson.scheduled_at, lesson.duration_minutes)
  // Hide the meeting link until the lesson actually goes live
  const exposeLink = state === 'live' || lesson.status === 'live' || lesson.status === 'completed'

  return NextResponse.json({
    data: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      cover_image_url: lesson.cover_image_url,
      slug: lesson.public_slug,
      scheduled_at: lesson.scheduled_at,
      duration_minutes: lesson.duration_minutes,
      status: lesson.status,
      state,
      teacher: {
        name: lesson.teacher_name,
        bio: lesson.teacher_bio,
        avatar: lesson.teacher_avatar,
      },
      meeting: exposeLink && lesson.meeting_link ? {
        link: lesson.meeting_link,
        provider: lesson.meeting_provider,
        password: lesson.meeting_password,
      } : null,
    },
  })
}
