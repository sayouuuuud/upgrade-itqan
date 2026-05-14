import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface TeacherInfo {
  id: string
  name: string | null
  bio: string | null
  avatar_url: string | null
}

interface OtherLesson {
  id: string
  slug: string
  title: string
  cover_image_url: string | null
  scheduled_at: string
  status: string
}

interface Course {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
}

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const me = await query<{ welcome_referral_id: string | null }>(
    `SELECT welcome_referral_id FROM users WHERE id = $1`,
    [session.sub]
  )
  const refId = me[0]?.welcome_referral_id
  if (!refId) return NextResponse.json({ data: null })

  // Resolve referral → lesson → teacher
  const teacherRow = await query<{
    teacher_id: string
    teacher_name: string | null
    teacher_bio: string | null
    teacher_avatar: string | null
    lesson_title: string
    lesson_slug: string
  }>(
    `SELECT pl.teacher_id,
            u.name AS teacher_name,
            u.bio AS teacher_bio,
            u.avatar_url AS teacher_avatar,
            pl.title AS lesson_title,
            pl.public_slug AS lesson_slug
     FROM public_lesson_signup_referrals r
     JOIN public_lessons pl ON pl.id = r.lesson_id
     LEFT JOIN users u ON u.id = pl.teacher_id
     WHERE r.id = $1
     LIMIT 1`,
    [refId]
  )
  if (teacherRow.length === 0) {
    // Stale referral — clear it silently
    await query(`UPDATE users SET welcome_referral_id = NULL WHERE id = $1`, [session.sub])
    return NextResponse.json({ data: null })
  }
  const t = teacherRow[0]

  // Other public lessons by the same teacher (upcoming first)
  const otherLessons = await query<OtherLesson>(
    `SELECT id, public_slug AS slug, title, cover_image_url, scheduled_at, status
     FROM public_lessons
     WHERE teacher_id = $1 AND is_published = true AND public_slug <> $2
     ORDER BY
       CASE WHEN scheduled_at >= NOW() THEN 0 ELSE 1 END,
       scheduled_at ASC
     LIMIT 6`,
    [t.teacher_id, t.lesson_slug]
  )

  // Published courses by the teacher (best-effort — table may be sparse)
  let courses: Course[] = []
  try {
    courses = await query<Course>(
      `SELECT id, title, slug, thumbnail_url
       FROM courses
       WHERE teacher_id = $1 AND is_published = true AND archived_at IS NULL
       ORDER BY created_at DESC
       LIMIT 6`,
      [t.teacher_id]
    )
  } catch (e) {
    console.warn('[welcome] could not load courses:', e)
  }

  // Is the user already following the teacher?
  const follow = await query(
    `SELECT 1 FROM teacher_followers WHERE user_id = $1 AND teacher_id = $2`,
    [session.sub, t.teacher_id]
  )

  const teacher: TeacherInfo = {
    id: t.teacher_id,
    name: t.teacher_name,
    bio: t.teacher_bio,
    avatar_url: t.teacher_avatar,
  }

  return NextResponse.json({
    data: {
      teacher,
      from_lesson: { title: t.lesson_title, slug: t.lesson_slug },
      other_lessons: otherLessons,
      courses,
      is_following: follow.length > 0,
    },
  })
}
