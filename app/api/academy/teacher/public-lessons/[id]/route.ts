import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

async function loadLesson(id: string) {
  const rows = await query<{
    id: string; teacher_id: string; public_slug: string; title: string;
    description: string | null; cover_image_url: string | null;
    meeting_link: string | null; meeting_provider: string | null;
    meeting_password: string | null; scheduled_at: string;
    duration_minutes: number; status: string; is_published: boolean;
    view_count: number; signup_count: number;
    created_at: string; updated_at: string;
  }>(`SELECT * FROM public_lessons WHERE id = $1`, [id])
  return rows[0] || null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const lesson = await loadLesson(id)
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lesson.teacher_id !== session.sub && !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Aggregate view/signup stats live (don't trust the cached counters)
  const stats = await query<{ views: number; uniques: number; signups: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM public_lesson_views v WHERE v.lesson_id = $1) AS views,
       (SELECT COUNT(DISTINCT visitor_token)::int FROM public_lesson_views v WHERE v.lesson_id = $1) AS uniques,
       (SELECT COUNT(*)::int FROM public_lesson_signup_referrals r WHERE r.lesson_id = $1) AS signups`,
    [id]
  )
  return NextResponse.json({ data: lesson, stats: stats[0] })
}

interface PatchBody {
  title?: string
  description?: string | null
  cover_image_url?: string | null
  scheduled_at?: string
  duration_minutes?: number
  meeting_link?: string | null
  meeting_provider?: 'zoom' | 'google_meet' | 'other' | null
  meeting_password?: string | null
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled'
  is_published?: boolean
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const lesson = await loadLesson(id)
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lesson.teacher_id !== session.sub && !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: PatchBody
  try { body = (await req.json()) as PatchBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sets: string[] = []
  const values: unknown[] = []
  const push = (col: string, v: unknown) => { sets.push(`${col} = $${values.length + 1}`); values.push(v) }

  if (body.title !== undefined) push('title', body.title.slice(0, 255))
  if (body.description !== undefined) push('description', body.description)
  if (body.cover_image_url !== undefined) push('cover_image_url', body.cover_image_url)
  if (body.scheduled_at !== undefined) push('scheduled_at', body.scheduled_at)
  if (body.duration_minutes !== undefined) push('duration_minutes', body.duration_minutes)
  if (body.meeting_link !== undefined) push('meeting_link', body.meeting_link)
  if (body.meeting_provider !== undefined) {
    const v = body.meeting_provider
    push('meeting_provider', v && ['zoom', 'google_meet', 'other'].includes(v) ? v : null)
  }
  if (body.meeting_password !== undefined) push('meeting_password', body.meeting_password)
  if (body.status !== undefined) push('status', body.status)
  if (body.is_published !== undefined) push('is_published', !!body.is_published)
  sets.push('updated_at = NOW()')

  if (sets.length === 1) {
    return NextResponse.json({ error: 'لا توجد حقول للتحديث' }, { status: 400 })
  }

  values.push(id)
  const result = await query(
    `UPDATE public_lessons SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  )
  return NextResponse.json({ data: result[0] })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const lesson = await loadLesson(id)
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lesson.teacher_id !== session.sub && !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await query(`DELETE FROM public_lessons WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
