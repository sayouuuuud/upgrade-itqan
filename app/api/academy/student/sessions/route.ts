import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const rows = await query(`
            SELECT 
                cs.*,
                c.title as course_title,
                COALESCE(u.name, 'غير محدد') as teacher_name
            FROM course_sessions cs
            JOIN courses c ON cs.course_id = c.id
            JOIN enrollments e ON c.id = e.course_id AND e.student_id = $1
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY cs.scheduled_at ASC
        `, [session.sub])

        return NextResponse.json({ data: rows })
    } catch (error) {
        console.error('[API] Error fetching student sessions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
