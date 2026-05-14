import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

// GET: list teachers (or readers) the child is currently engaged with
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id: childId } = await params
  const link = await getActiveParentChild(session.sub, childId)
  if (!link) {
    return NextResponse.json({ error: 'الطالب غير مربوط بحسابك' }, { status: 403 })
  }

  // Teachers from active enrollments
  const teachers = await query<{
    id: string
    name: string
    email: string
    avatar_url: string | null
    course_count: number
  }>(
    `SELECT u.id, u.name, u.email, u.avatar_url, COUNT(DISTINCT c.id)::int AS course_count
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = c.teacher_id
     WHERE e.student_id = $1 AND e.status = 'active' AND u.role = 'teacher'
     GROUP BY u.id, u.name, u.email, u.avatar_url
     ORDER BY u.name`,
    [childId]
  )

  return NextResponse.json({ teachers })
}
