import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()

  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        cs.*,
        c.title as course_name,
        COUNT(DISTINCT sa.id)::int as attendance_count
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN session_attendance sa ON cs.id = sa.session_id
      WHERE c.teacher_id = $1
      GROUP BY cs.id, c.title
      ORDER BY cs.scheduled_at DESC
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()

  if (!session || !['teacher', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { course_id, title, description, scheduled_at, duration_minutes } = body

    if (!course_id || !title || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify teacher owns this course
    const courseCheck = await query('SELECT id FROM courses WHERE id = $1 AND teacher_id = $2', [course_id, session.sub])
    if (courseCheck.length === 0) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 })
    }

    const result = await query(`
      INSERT INTO course_sessions (course_id, title, description, session_type, scheduled_at, duration_minutes, status, created_at)
      VALUES ($1, $2, $3, 'live', $4, $5, 'scheduled', NOW())
      RETURNING *
    `, [course_id, title, description || null, scheduled_at, duration_minutes || 60])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
