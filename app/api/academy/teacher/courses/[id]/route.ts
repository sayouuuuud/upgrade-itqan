import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;

    // Course Data
    const courseQuery = `
      SELECT c.*, cat.name as category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1 AND c.teacher_id = $2
    `
    const courses = await query<any>(courseQuery, [courseId, session.sub])
    if (courses.length === 0) {
       return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
    }

    // Lessons
    const lessonsQuery = `
      SELECT id, title, description, video_url, order_index, duration_minutes, created_at
      FROM lessons
      WHERE course_id = $1
      ORDER BY order_index ASC
    `
    const lessons = await query<any>(lessonsQuery, [courseId])

    // Pending requests count
    const pendingQuery = `
      SELECT COUNT(*)::int as pending_count 
      FROM enrollments
      WHERE course_id = $1 AND status = 'pending'
    `
    const pending = await query<any>(pendingQuery, [courseId])

    return NextResponse.json({
      course: courses[0],
      lessons,
      pending_requests: pending[0]?.pending_count || 0
    })
  } catch (error) {
    console.error('[API] Error fetching teacher course detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;
    const body = await req.json()
    const { title, description, thumbnail_url, level, category_id, status } = body

    const updateQuery = `
      UPDATE courses SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        thumbnail_url = COALESCE($3, thumbnail_url),
        level = COALESCE($4, level),
        category_id = COALESCE($5, category_id),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $7 AND teacher_id = $8
      RETURNING *
    `
    const result = await query(updateQuery, [
      title, 
      description, 
      thumbnail_url, 
      level, 
      category_id, 
      status, 
      courseId, 
      session.sub
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Update failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('[API] Error updating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
