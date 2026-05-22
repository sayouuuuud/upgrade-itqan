import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_STATUSES = ['draft', 'pending_review', 'published', 'archived', 'rejected'] as const
const ALLOWED_LEVELS = ['beginner', 'intermediate', 'advanced'] as const

export async function GET(req: NextRequest) {
  const session = await getSession()

  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query<any>(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        c.level,
        c.category_id,
        c.teacher_id,
        c.is_published,
        c.is_active,
        c.specialization,
        c.archived_at,
        c.rejection_reason,
        c.reviewed_at,
        c.submitted_for_review_at,
        c.created_at,
        c.updated_at,
        COALESCE(cat.name, '') AS category_name,
        COALESCE(u.name, '') AS teacher_name,
        COUNT(DISTINCT l.id)::int AS total_lessons,
        COUNT(DISTINCT e.id)::int AS total_enrolled,
        COUNT(DISTINCT CASE WHEN LOWER(e.status) = 'pending' THEN e.id END)::int AS pending_requests
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id, cat.name, u.name
      ORDER BY c.created_at DESC
    `)

    return NextResponse.json({ data: rows })
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const description = typeof body.description === 'string' ? body.description.trim() : null
    const thumbnail_url = typeof body.thumbnail_url === 'string' && body.thumbnail_url.trim() ? body.thumbnail_url.trim() : null

    const category_id = typeof body.category_id === 'string' && UUID_RE.test(body.category_id) ? body.category_id : null
    const teacher_id = typeof body.teacher_id === 'string' && UUID_RE.test(body.teacher_id) ? body.teacher_id : null

    if (!teacher_id) {
      return NextResponse.json({ error: 'Teacher is required' }, { status: 400 })
    }

    const status = typeof body.status === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(body.status)
      ? body.status
      : 'draft'
    const level = typeof body.level === 'string' && (ALLOWED_LEVELS as readonly string[]).includes(body.level)
      ? body.level
      : 'beginner'

    // Look up the teacher's primary specialization (matches teacher flow).
    const specRows = await query<{ specialization: string }>(
      `SELECT specialization FROM user_specializations WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [teacher_id]
    )
    const specialization = specRows.length > 0 ? specRows[0].specialization : null

    const result = await query<any>(
      `
      INSERT INTO courses (
        title, description, category_id, status, teacher_id,
        thumbnail_url, level, specialization, is_published, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
      `,
      [title, description, category_id, status, teacher_id, thumbnail_url, level, specialization, status === 'published']
    )

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating course:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}
