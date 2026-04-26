import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : null

    try {
        let q = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.thumbnail_url, 
        c.teacher_id, 
        COALESCE(c.difficulty_level, 'beginner') as level, 
        c.total_lessons,
        COALESCE(u.name, 'غير محدد') as teacher_name,
        e.progress_percentage as progress_percent,
        LOWER(e.status) as status,
        e.enrolled_at,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.enrollment_id = e.id AND lp.is_completed = true) as completed_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
    `

        const params: any[] = [session.sub]

        if (limit && limit > 0) {
            q += ` LIMIT $2`
            params.push(limit)
        }

        const rows = await query<any>(q, params)
        return NextResponse.json({ data: rows })
    } catch (error) {
        console.error('[API] Error fetching student courses:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
