import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const q = `
      SELECT 
        c.id, c.title, c.description, c.thumbnail_url, c.level, c.status,
        COALESCE(cat.name, 'غير محدد') as category_name,
        COALESCE(u.name, 'غير محدد') as teacher_name,
        COUNT(DISTINCT l.id)::int as total_lessons,
        COUNT(DISTINCT e.id)::int as total_enrolled,
        c.created_at
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      WHERE c.status = 'published'
      GROUP BY c.id, c.title, c.description, c.thumbnail_url, c.level, c.status, cat.name, u.name, c.created_at
      ORDER BY c.created_at DESC
    `
    const rows = await query<any>(q, [])
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching all courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
