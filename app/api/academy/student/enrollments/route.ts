import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query<any>(`
      SELECT 
        e.id,
        e.status,
        e.enrolled_at,
        c.id as course_id,
        c.title as course_title,
        c.level,
        c.thumbnail_url,
        u.name as teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching student enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
