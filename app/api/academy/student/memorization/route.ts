import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['student', 'teacher', 'parent', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        ml.*,
        c.title as course_name,
        l.title as lesson_name
      FROM memorization_log ml
      LEFT JOIN courses c ON ml.course_id = c.id
      LEFT JOIN lessons l ON ml.lesson_id = l.id
      WHERE ml.user_id = $1
      ORDER BY ml.created_at DESC
      LIMIT 50
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching memorization log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['student'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { course_id, lesson_id, verses_memorized, quality, duration_minutes, notes } = body

    if (!course_id || !lesson_id || !verses_memorized || !quality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO memorization_log (user_id, course_id, lesson_id, verses_memorized, quality, duration_minutes, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [session.sub, course_id, lesson_id, verses_memorized, quality, duration_minutes || 0, notes || null])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating memorization log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
