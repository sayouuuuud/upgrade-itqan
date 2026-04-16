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

        const reportsData = [];
        let reportIdCounter = 1;

        for (const child of childrenQuery) {
            // For now, we will just return mock reports since there are no actual grades/reports
            // table to query from the given minimal schema. In a full implementation, you would query
            // a submissions or grades table.

            reportsData.push(
                {
                    id: reportIdCounter++,
                    childName: child.child_name,
                    course: 'الفقه الميسر - المستوى الأول',
                    item: 'الواجب الأول: أحكام الطهارة',
                    type: 'assignment',
                    status: 'completed',
                    grade: '95/100',
                    date: '2026-04-10'
                },
                {
                    id: reportIdCounter++,
                    childName: child.child_name,
                    course: 'تلاوة وتجويد',
                    item: 'جلسة التسميع الأسبوعية',
                    type: 'session',
                    status: 'absent',
                    grade: '-',
                    date: '2026-04-12'
                }
            )
        }

        return NextResponse.json(reportsData)
    } catch (error) {
        console.error("Parent reports error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
