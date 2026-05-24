import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        // 1. Unread notifications
        const notifRes = await query<{ count: string }>(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [session.sub]
        )
        const notifications = parseInt(notifRes[0]?.count || "0")

        // 2. Unread messages
        let messageCount = 0
        if (session.role === "student") {
            const msgRes = await query<{ sum: string }>(
                `SELECT SUM(unread_count_student) as sum FROM conversations WHERE student_id = $1`,
                [session.sub]
            )
            messageCount = parseInt(msgRes[0]?.sum || "0")
        } else if (session.role === "reader") {
            const msgRes = await query<{ sum: string }>(
                `SELECT SUM(unread_count_reader) as sum FROM conversations WHERE reader_id = $1`,
                [session.sub]
            )
            messageCount = parseInt(msgRes[0]?.sum || "0")
        } else if (session.role === "admin" || session.role === "student_supervisor" || session.role === "reciter_supervisor") {
            const msgRes = await query<{ sum: string }>(
                `SELECT COUNT(*) as sum FROM messages WHERE recipient_id = $1 AND is_read = false`,
                [session.sub]
            )
            messageCount = parseInt(msgRes[0]?.sum || "0")
        }

        // 3. Unread academy messages
        const academyMsgRes = await query<{ sum: string }>(
            `SELECT COUNT(*) as sum FROM academy_messages m
             JOIN academy_conversations c ON c.id = m.conversation_id
             WHERE m.is_read = false 
               AND m.sender_id != $1
               AND (c.student_id = $1 OR c.teacher_id = $1 OR c.parent_id = $1 OR c.admin_id = $1)`,
            [session.sub]
        )
        const academyMessages = parseInt(academyMsgRes[0]?.sum || "0")
        messageCount += academyMessages

        return NextResponse.json({
            notifications,
            messages: messageCount
        })
    } catch (error) {
        console.error("Unread counts error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
