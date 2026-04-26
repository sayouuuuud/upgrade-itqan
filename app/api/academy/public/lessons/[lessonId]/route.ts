import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const rows = await query(`
      SELECT 
        l.*,
        c.title as course_title,
        c.description as course_description,
        c.teacher_id,
        u.name as teacher_name,
        u.bio as teacher_bio
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE l.id = $1 AND l.is_public = true
    `, [lessonId])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ data: rows[0] })
  } catch (error) {
    console.error('Error fetching public lesson:', error)
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
}
