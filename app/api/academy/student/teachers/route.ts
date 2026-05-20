import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/student/teachers
 *
 * Returns the list of teachers the current student is allowed to chat with —
 * specifically the teachers of every course they're enrolled in (active /
 * accepted / completed). This is used by the chat page's "Start a new
 * conversation" dialog and by buttons that initiate a message from a course
 * page.
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await query<{
    id: string
    name: string
    avatar_url: string | null
    bio: string | null
    courses: string[]
  }>(
    `SELECT u.id,
            u.name,
            u.avatar_url,
            u.bio,
            ARRAY_AGG(DISTINCT c.title) FILTER (WHERE c.title IS NOT NULL) AS courses
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users   u ON u.id = c.teacher_id
       WHERE e.student_id = $1
         AND LOWER(e.status) IN ('active', 'completed', 'accepted')
         AND u.is_active = true
       GROUP BY u.id
       ORDER BY u.name ASC`,
    [session.sub]
  )

  return NextResponse.json({ teachers: rows })
}
