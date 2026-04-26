import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const enrolledRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM enrollments WHERE student_id = $1`, [session.sub]);
        const enrolled_courses = parseInt(enrolledRes[0]?.count || '0');

        const completedRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM enrollments WHERE student_id = $1 AND LOWER(status) = 'completed'`, [session.sub]);
        const completed_courses = parseInt(completedRes[0]?.count || '0');

        // Return combination of real and default stats
        const stats = {
            enrolled_courses,
            completed_courses,
            pending_tasks: 0,
            total_points: 0,
            current_level: 1,
            streak_days: 0,
            upcoming_sessions: 0,
            badges_earned: 0
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('[API] Error fetching student stats:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
