import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query<any>(`
      SELECT 
        t.*,
        c.title as course_name,
        (SELECT COUNT(*)::int FROM task_submissions ts WHERE ts.task_id = t.id) as submitted_count,
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = t.course_id AND e.status = 'active') as total_students
      FROM tasks t
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.teacher_id = $1
      ORDER BY t.due_date DESC
    `, [session.sub])

    return NextResponse.json(rows)
  } catch (error) {
    console.error('[API] Error fetching teacher tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { course_id, title, description, task_type, due_date, max_score } = body

    if (!course_id || !title || !task_type || !due_date) {
      return NextResponse.json({ error: 'Missing required fields: course_id, title, task_type, due_date' }, { status: 400 })
    }

    // Verify teacher owns this course
    const courseCheck = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [course_id, session.sub])
    if (courseCheck.length === 0) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 })
    }

    const result = await query<any>(`
      INSERT INTO tasks (course_id, teacher_id, title, description, task_type, due_date, max_score, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING *
    `, [course_id, session.sub, title, description || null, task_type, due_date, max_score || 100])

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
