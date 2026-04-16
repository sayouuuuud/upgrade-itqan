import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// GET /api/academy/supervisor/content
// Returns lessons with status = 'pending_review' for the content supervisor to review
export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || !['admin', 'academy_admin', 'supervisor'].includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const rows = await query<any>(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.video_url,
        l.order_index,
        l.duration_minutes,
        l.status,
        l.created_at,
        c.id as course_id,
        c.title as course_title,
        u.name as teacher_name,
        u.id as teacher_id
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE l.status = 'pending_review'
      ORDER BY l.created_at ASC
    `, [])

        return NextResponse.json({ data: rows })
    } catch (error) {
        console.error('[API] Error fetching content for review:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
