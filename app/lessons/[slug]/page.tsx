import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { query } from '@/lib/db'
import { lessonStateAt } from '@/lib/public-lessons'
import { LessonViewer } from './lesson-viewer'

interface LessonRow {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  public_slug: string
  scheduled_at: string
  duration_minutes: number
  status: string
  is_published: boolean
  teacher_name: string | null
  teacher_bio: string | null
  teacher_avatar: string | null
  meeting_link: string | null
  meeting_provider: string | null
  meeting_password: string | null
}

async function loadLesson(slug: string): Promise<LessonRow | null> {
  const rows = await query<LessonRow>(
    `SELECT pl.id, pl.title, pl.description, pl.cover_image_url, pl.public_slug,
            pl.scheduled_at, pl.duration_minutes, pl.status, pl.is_published,
            pl.meeting_link, pl.meeting_provider, pl.meeting_password,
            u.name AS teacher_name, u.bio AS teacher_bio, u.avatar_url AS teacher_avatar
     FROM public_lessons pl
     LEFT JOIN users u ON u.id = pl.teacher_id
     WHERE pl.public_slug = $1 AND pl.is_published = true
     LIMIT 1`,
    [slug]
  )
  return rows[0] || null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const lesson = await loadLesson(slug)
  if (!lesson) {
    return { title: 'الدرس غير موجود — منصة إتقان', robots: 'noindex' }
  }
  const description = lesson.description?.slice(0, 200) || `درس مفتوح مع ${lesson.teacher_name || 'منصة إتقان'}`
  const ogImages = lesson.cover_image_url ? [{ url: lesson.cover_image_url }] : undefined
  return {
    title: `${lesson.title} — منصة إتقان`,
    description,
    openGraph: {
      title: lesson.title,
      description,
      type: 'article',
      images: ogImages,
      siteName: 'منصة إتقان',
      locale: 'ar_EG',
    },
    twitter: {
      card: lesson.cover_image_url ? 'summary_large_image' : 'summary',
      title: lesson.title,
      description,
      images: ogImages?.map(i => i.url),
    },
  }
}

export default async function PublicLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = await loadLesson(slug)
  if (!lesson) notFound()

  const state = lessonStateAt(lesson.scheduled_at, lesson.duration_minutes)
  const exposeLink = state === 'live' || lesson.status === 'live' || lesson.status === 'completed'

  return (
    <LessonViewer
      lesson={{
        id: lesson.id,
        slug: lesson.public_slug,
        title: lesson.title,
        description: lesson.description,
        cover_image_url: lesson.cover_image_url,
        scheduled_at: lesson.scheduled_at,
        duration_minutes: lesson.duration_minutes,
        status: lesson.status as 'scheduled' | 'live' | 'completed' | 'cancelled',
        teacher: {
          name: lesson.teacher_name,
          bio: lesson.teacher_bio,
          avatar: lesson.teacher_avatar,
        },
        meeting: exposeLink && lesson.meeting_link
          ? { link: lesson.meeting_link, provider: lesson.meeting_provider, password: lesson.meeting_password }
          : null,
      }}
      initialState={state}
    />
  )
}
