import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;
    
    // Check if teacher owns course
    const ownCheck = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
    if (ownCheck.length === 0 && session.role === 'teacher') {
      return NextResponse.json({ error: 'Unauthorized course' }, { status: 403 })
    }

    const lessonsResult = await query(`SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC`, [courseId])
    
    return NextResponse.json({ lessons: lessonsResult })
  } catch (error) {
    console.error('[API] Error fetching lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courseId = (await params).id;
    
    // Check if teacher owns course
    const ownCheck = await query(`SELECT id FROM courses WHERE id = $1 AND teacher_id = $2`, [courseId, session.sub])
    if (ownCheck.length === 0) {
      return NextResponse.json({ error: 'Unauthorized course' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, video_url, duration_minutes } = body

    if (!title) {
       return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get next order index
    const orderQuery = `SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM lessons WHERE course_id = $1`
    const orderResult = await query<any>(orderQuery, [courseId])
    const orderIndex = orderResult[0]?.next_order || 1

    // Insert
    const insertQuery = `
      INSERT INTO lessons (course_id, title, description, video_url, order_index, duration_minutes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `
    const result = await query(insertQuery, [
      courseId, title, description || null, video_url || null, orderIndex, duration_minutes || null
    ])

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
