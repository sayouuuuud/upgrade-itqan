import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Columns the admin is allowed to update on a course.
// IMPORTANT: only columns that actually exist on the `courses` table.
const STRING_FIELDS = ['title', 'description', 'thumbnail_url', 'specialization'] as const
const UUID_FIELDS = ['category_id', 'teacher_id'] as const
const ENUM_FIELDS: Record<string, readonly string[]> = {
  status: ['draft', 'pending_review', 'published', 'archived', 'rejected'],
  level: ['beginner', 'intermediate', 'advanced'],
}
const BOOL_FIELDS = ['is_active', 'is_published', 'is_public'] as const

// GET /api/academy/admin/courses/[id]
// Returns full course details (incl. lessons & attachments & enrolled students)
// for the admin-side course review and management page. The teacher GET on the
// same course enforces ownership; admins go through this endpoint instead so we
// don't need to weaken the teacher endpoint.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }

  try {
    const courseRows = await query<any>(
      `
      SELECT
        c.*,
        COALESCE(cat.name, '') AS category_name,
        COALESCE(u.name, '')   AS teacher_name,
        u.email                AS teacher_email,
        rev.name               AS reviewed_by_name
      FROM courses c
      LEFT JOIN users u        ON u.id = c.teacher_id
      LEFT JOIN users rev      ON rev.id = c.reviewed_by
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [id]
    )
    if (courseRows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const lessonsRaw = await query<any>(
      `SELECT id, title, description, video_url, order_index, duration_minutes,
              status, created_at
         FROM lessons
        WHERE course_id = $1
        ORDER BY order_index ASC`,
      [id]
    )

    if (lessonsRaw.length > 0) {
      const lessonIds = lessonsRaw.map(l => l.id)
      const attachments = await query<any>(
        `SELECT id, lesson_id, file_url, file_name, file_type
           FROM lesson_attachments
          WHERE lesson_id = ANY($1)`,
        [lessonIds]
      )
      for (const l of lessonsRaw) {
        l.attachments = attachments
          .filter(a => a.lesson_id === l.id)
          .map(a => ({ id: a.id, name: a.file_name, url: a.file_url, type: a.file_type }))
      }
    }

    const enrollmentStats = await query<any>(
      `SELECT
         COUNT(*)::int AS total_enrolled,
         COUNT(*) FILTER (WHERE LOWER(status) = 'pending')::int AS pending_requests
         FROM enrollments
        WHERE course_id = $1`,
      [id]
    )

    return NextResponse.json({
      course: courseRows[0],
      lessons: lessonsRaw,
      total_enrolled: enrollmentStats[0]?.total_enrolled || 0,
      pending_requests: enrollmentStats[0]?.pending_requests || 0,
    })
  } catch (error: any) {
    console.error('[API] Admin course GET error:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sets: string[] = []
  const values: any[] = []

  const push = (column: string, value: any) => {
    values.push(value)
    sets.push(`${column} = $${values.length}`)
  }

  for (const field of STRING_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '') {
        push(field, null)
      } else if (typeof v === 'string') {
        push(field, v.trim())
      }
    }
  }

  for (const field of UUID_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '' || v === undefined) {
        push(field, null)
      } else if (typeof v === 'string' && UUID_RE.test(v)) {
        push(field, v)
      } else {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
      }
    }
  }

  for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '' || v === undefined) continue
      if (typeof v === 'string' && allowed.includes(v)) {
        push(field, v)
      } else {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
      }
    }
  }

  for (const field of BOOL_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (typeof v === 'boolean') push(field, v)
    }
  }

  // Keep is_published in sync when status changes
  if ('status' in body && body.status && !('is_published' in body)) {
    push('is_published', body.status === 'published')
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  sets.push(`updated_at = NOW()`)
  values.push(id)

  const sql = `UPDATE courses SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`

  try {
    const result = await query<any>(sql, values)
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ data: result[0] })
  } catch (error: any) {
    console.error('[API] Admin course PATCH error:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
  }
  try {
    const enrolled = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM enrollments WHERE course_id = $1`,
      [id]
    )
    const force = req.nextUrl.searchParams.get('force') === '1'
    if (!force && enrolled[0]?.count > 0) {
      return NextResponse.json(
        {
          error: 'Course has enrollments',
          enrolled_count: enrolled[0].count,
          message: 'يوجد طلاب مسجلين في هذه الدورة. استخدم ?force=1 للحذف على أي حال.',
        },
        { status: 409 }
      )
    }
    await query(`DELETE FROM courses WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Admin course DELETE error:', error)
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 })
  }
}
