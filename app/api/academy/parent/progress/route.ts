import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || (session.role !== 'parent' && session.role !== 'admin')) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        // Get linked children of this parent (active links)
        const childrenQuery = await query<{ child_id: string, child_name: string }>(
            `SELECT pc.child_id, u.name as child_name
             FROM parent_children pc
             JOIN users u ON u.id = pc.child_id
             WHERE pc.parent_id = $1 AND pc.status = 'active'`,
            [session.sub]
        )

        const progressData = []

        for (const child of childrenQuery) {
            // Get enrolled courses with real progress
            const courses = await query<any>(
                `SELECT 
                    e.course_id,
                    c.title as name,
                    e.status,
                    COALESCE(e.progress_percentage, 0) as progress
                 FROM enrollments e
                 JOIN courses c ON c.id = e.course_id
                 WHERE e.student_id = $1`,
                [child.child_id]
            )

            // Calculate overall progress (average across all enrolled courses)
            const overallProgress = courses.length > 0
                ? Math.round(courses.reduce((sum, c) => sum + Number(c.progress || 0), 0) / courses.length)
                : 0

            // Get real weekly activity (last 7 days of recitations + task submissions + lesson completions)
            const weeklyActivityRows = await query<{ day_offset: number; count: number }>(
                `WITH days AS (
                    SELECT generate_series(0, 6) as day_offset
                ),
                activity AS (
                    SELECT EXTRACT(DAY FROM NOW() - created_at)::int as day_offset, COUNT(*) as cnt
                    FROM recitations
                    WHERE student_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY EXTRACT(DAY FROM NOW() - created_at)
                    UNION ALL
                    SELECT EXTRACT(DAY FROM NOW() - submitted_at)::int as day_offset, COUNT(*) as cnt
                    FROM task_submissions
                    WHERE student_id = $1 AND submitted_at >= NOW() - INTERVAL '7 days'
                    GROUP BY EXTRACT(DAY FROM NOW() - submitted_at)
                    UNION ALL
                    SELECT EXTRACT(DAY FROM NOW() - completed_at)::int as day_offset, COUNT(*) as cnt
                    FROM lesson_progress lp
                    JOIN enrollments e ON e.id = lp.enrollment_id
                    WHERE e.student_id = $1 AND lp.completed_at >= NOW() - INTERVAL '7 days'
                    GROUP BY EXTRACT(DAY FROM NOW() - completed_at)
                )
                SELECT d.day_offset, COALESCE(SUM(a.cnt), 0)::int as count
                FROM days d
                LEFT JOIN activity a ON a.day_offset = d.day_offset
                GROUP BY d.day_offset
                ORDER BY d.day_offset DESC`,
                [child.child_id]
            ).catch(() => [])

            // Map to 7-day array (oldest to newest)
            const weeklyActivity = Array(7).fill(0)
            for (const row of weeklyActivityRows) {
                const idx = 6 - row.day_offset
                if (idx >= 0 && idx < 7) weeklyActivity[idx] = Number(row.count)
            }

            progressData.push({
                id: child.child_id,
                name: child.child_name,
                overallProgress,
                courses: courses.map(c => ({
                    name: c.name,
                    progress: Number(c.progress || 0),
                    status: c.status
                })),
                weeklyActivity
            })
        }

        return NextResponse.json(progressData)
    } catch (error) {
        console.error("Parent progress error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
