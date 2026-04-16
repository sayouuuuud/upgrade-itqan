import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || (session.role !== 'parent' && session.role !== 'admin')) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        // Get children of this parent
        const childrenQuery = await query<{ child_id: string, child_name: string }>(
            `SELECT pc.child_id, u.name as child_name
       FROM parent_children pc
       JOIN users u ON u.id = pc.child_id
       WHERE pc.parent_id = $1 AND pc.status = 'approved'`,
            [session.sub]
        )

        const progressData = [];

        for (const child of childrenQuery) {
            // Get enrolled courses for this child
            const courses = await query<{ course_id: string, name: string, status: string }>(
                `SELECT ue.course_id, c.name, ue.status
         FROM user_enrollments ue
         JOIN courses c ON c.id = ue.course_id
         WHERE ue.user_id = $1`,
                [child.child_id]
            )

            progressData.push({
                id: child.child_id,
                name: child.child_name,
                overallProgress: 0, // Mocked for now, needs tasks implementation
                courses: courses.map(c => ({
                    name: c.name,
                    progress: c.status === 'completed' ? 100 : 30, // Mock progress based on status
                    status: c.status
                })),
                weeklyActivity: [4, 5, 2, 6, 8, 3, 5] // Mocked for now
            })
        }

        return NextResponse.json(progressData)
    } catch (error) {
        console.error("Parent progress error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
