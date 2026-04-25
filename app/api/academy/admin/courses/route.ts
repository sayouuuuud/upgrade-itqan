import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        c.*,
        u.name as teacher_name,
        COUNT(DISTINCT l.id)::int as total_lessons,
        COUNT(DISTINCT e.id)::int as total_enrolled
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { title, description, category_id, status, teacher_id } = body
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const result = await query(`
      INSERT INTO courses (title, description, category_id, status, teacher_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [title, description || null, category_id || null, status || 'draft', teacher_id || null])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
