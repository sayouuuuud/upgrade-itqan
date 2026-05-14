import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { buildParentWeeklyReport, getPreviousWeekWindow } from "@/lib/academy/parent-reports"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || (session.role !== 'parent' && session.role !== 'admin')) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const weekStartParam = searchParams.get("weekStart")
        const weekEndParam = searchParams.get("weekEnd")
        const { weekStart, weekEnd } = weekStartParam && weekEndParam
            ? { weekStart: weekStartParam, weekEnd: weekEndParam }
            : getPreviousWeekWindow()

        const childrenQuery = await query<{
            parent_id: string
            child_id: string
            parent_child_id: string
            parent_name: string
            parent_email: string
            child_name: string
        }>(
            `SELECT pc.parent_id,
                    pc.child_id,
                    pc.id AS parent_child_id,
                    p.name AS parent_name,
                    p.email AS parent_email,
                    u.name AS child_name
       FROM parent_children pc
       JOIN users p ON p.id = pc.parent_id
       JOIN users u ON u.id = pc.child_id
       WHERE pc.parent_id = $1 AND pc.status IN ('active', 'approved')`,
            [session.sub]
        )

        const reportsData = []
        let reportIdCounter = 1;

        for (const child of childrenQuery) {
            const weekly = await buildParentWeeklyReport(child, weekStart, weekEnd)

            reportsData.push({
                id: reportIdCounter++,
                childName: child.child_name,
                course: 'ملخص أسبوعي',
                item: `تلاوات: ${weekly.recitationsCount}، حضور جلسات: ${weekly.sessionsAttended}، شارات جديدة: ${weekly.badgesEarned}`,
                type: 'weekly_summary',
                status: 'completed',
                grade: weekly.currentLevel,
                date: weekEnd,
                summary: weekly
            })

            for (const recitation of weekly.recitations) {
                reportsData.push({
                    id: reportIdCounter++,
                    childName: child.child_name,
                    course: 'التلاوات',
                    item: recitation.surahName,
                    type: 'recitation',
                    status: recitation.status === 'rejected' ? 'absent' : 'completed',
                    grade: recitation.status,
                    date: recitation.createdAt
                })
            }

            for (const sessionRow of weekly.sessions) {
                reportsData.push({
                    id: reportIdCounter++,
                    childName: child.child_name,
                    course: sessionRow.courseTitle,
                    item: sessionRow.title,
                    type: 'session',
                    status: 'completed',
                    grade: 'حاضر',
                    date: sessionRow.attendedAt
                })
            }

            for (const badge of weekly.newBadges) {
                reportsData.push({
                    id: reportIdCounter++,
                    childName: child.child_name,
                    course: 'الشارات',
                    item: badge.name,
                    type: 'badge',
                    status: 'completed',
                    grade: 'جديد',
                    date: badge.awardedAt
                })
            }
        }

        return NextResponse.json(reportsData)
    } catch (error) {
        console.error("Parent reports error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
