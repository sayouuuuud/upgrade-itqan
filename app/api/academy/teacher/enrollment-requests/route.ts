import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const q = `
      SELECT 
        e.id,
        e.status,
        e.enrolled_at,
        u.name as student_name,
        u.email as student_email,
        c.title as course_title,
        c.id as course_id
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = $1
      ORDER BY e.enrolled_at DESC
    `
    const rows = await query(q, [session.sub])
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
