import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/student/courses/archive?search=...
 * Archive of courses the student has completed (enrollments.status = 'completed').
 * Search runs against course title + description (case-insensitive ILIKE).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const params: any[] = [session.sub]
  let searchFilter = ''
  if (search) {
    params.push(`%${search}%`)
    searchFilter = ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`
  }

  try {
    const rows = await query<any>(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        COALESCE(c.difficulty_level, c.level, 'beginner') AS level,
        COALESCE(cat.name, '') AS category_name,
        COALESCE(u.name, '') AS teacher_name,
        e.progress_percentage AS progress_percent,
        e.completed_at,
        e.enrolled_at,
        c.total_lessons,
        c.is_active
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE e.student_id = $1
        AND LOWER(e.status) = 'completed'
        ${searchFilter}
      ORDER BY e.completed_at DESC NULLS LAST, e.enrolled_at DESC
      `,
      params,
    )
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] student archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
