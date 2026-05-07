import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ['teacher', 'admin', 'academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const q = `
      SELECT 
        c.id, c.title, c.description, c.thumbnail_url, c.level, c.status,
        c.category_id, COALESCE(cat.name, '') as category_name,
        COUNT(DISTINCT l.id)::int as total_lessons,
        COUNT(DISTINCT e.id)::int as total_enrolled,
        COUNT(DISTINCT CASE WHEN e.status = 'pending' THEN e.id END)::int as pending_requests,
        c.created_at
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.teacher_id = $1
      GROUP BY c.id, c.title, c.description, c.thumbnail_url, c.level, c.status, c.category_id, cat.name, c.created_at
      ORDER BY c.created_at DESC
    `
    const rows = await query<any>(q, [session.sub])
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching teacher courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ['teacher', 'admin', 'academy_admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    const { title, description, thumbnail_url, level, category_id } = body

    if (!title || !level) {
      return NextResponse.json({ error: 'Title and level are required' }, { status: 400 })
    }

    // Fetch teacher's specializations — use the first one (primary)
    const teacherSpecs = await query<{ specialization: string }>(
      `SELECT specialization FROM user_specializations WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [session.sub]
    )
    const courseSpecialization = teacherSpecs.length > 0 ? teacherSpecs[0].specialization : null

    const q = `
      INSERT INTO courses (title, description, thumbnail_url, level, status, category_id, teacher_id, specialization, created_at)
      VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, NOW())
      RETURNING *
    `
    const params = [title, description || null, thumbnail_url || null, level, category_id || null, session.sub, courseSpecialization]
    const rows = await query<any>(q, params)
    
    return NextResponse.json({ data: rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
