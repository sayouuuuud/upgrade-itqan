import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getUserPointsSummary } from '@/lib/academy/gamification'

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

        const points = await getUserPointsSummary(session.sub)
        const pendingTasks = await query<{ count: string }>(
            `SELECT COUNT(*) as count
             FROM tasks t
             LEFT JOIN enrollments e ON e.course_id = t.course_id AND e.student_id = $1
             WHERE (t.assigned_to = $1 OR e.student_id = $1)
               AND COALESCE(t.status, 'pending') <> 'graded'
               AND NOT EXISTS (
                 SELECT 1 FROM task_submissions ts
                 WHERE ts.task_id = t.id
                   AND ts.student_id = $1
                   AND ts.status IN ('submitted', 'graded')
               )`,
            [session.sub]
        )
        const upcomingSessions = await query<{ count: string }>(
            `SELECT COUNT(*) as count
             FROM course_sessions cs
             JOIN enrollments e ON e.course_id = cs.course_id AND e.student_id = $1
             WHERE cs.status IN ('scheduled', 'live', 'in_progress')
               AND cs.scheduled_at >= NOW() - INTERVAL '30 minutes'`,
            [session.sub]
        )

        const stats = {
            enrolled_courses,
            completed_courses,
            pending_tasks: parseInt(pendingTasks[0]?.count || '0'),
            total_points: points.total_points,
            current_level: points.level,
            streak_days: points.streak_days,
            upcoming_sessions: parseInt(upcomingSessions[0]?.count || '0'),
            badges_earned: points.badges_earned,
            unlocked_features: points.unlocked_features,
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('[API] Error fetching student stats:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
