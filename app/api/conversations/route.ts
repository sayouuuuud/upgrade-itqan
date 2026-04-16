import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/conversations - list all conversations for the user
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        let queryStr = `
      SELECT c.id, c.student_id, c.reader_id, c.admin_id, c.last_message_at, c.last_message_preview,
             c.unread_count_student, c.unread_count_reader, c.is_ticket, c.ticket_status,
             s.name as student_name, s.avatar_url as student_avatar,
             r.name as reader_name, r.avatar_url as reader_avatar,
             a.name as admin_name, a.avatar_url as admin_avatar
      FROM conversations c
      LEFT JOIN users s ON c.student_id = s.id
      LEFT JOIN users r ON c.reader_id = r.id
      LEFT JOIN users a ON c.admin_id = a.id
    `
        const params: unknown[] = [session.sub]

        if (session.role === "student") {
            queryStr += " WHERE c.student_id = $1"
        } else if (session.role === "reader") {
            queryStr += " WHERE c.reader_id = $1"
        } else if (session.role === "admin") {
            queryStr += " WHERE c.admin_id = $1 OR c.is_ticket = true"
        } else if (session.role === "student_supervisor" || session.role === "reciter_supervisor") {
            queryStr += " WHERE c.admin_id = $1 OR c.assigned_supervisor_id = $1"
        } else {
            return NextResponse.json({ conversations: [] })
        }

        queryStr += " ORDER BY c.last_message_at DESC NULLS LAST"

        const conversations = await query(queryStr, params)

        return NextResponse.json({ conversations })
    } catch (error) {
        console.error("Get conversations error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// POST /api/conversations - find or create a conversation
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const body = await req.json()
        const isTicket = body.isTicket || body.is_ticket

        let conversationId: string;

        // Create a ticket (Support Ticket)
        if (isTicket) {
            const result = await query(
                `INSERT INTO conversations (student_id, reader_id, is_ticket, ticket_status) VALUES ($1, $2, true, 'open') RETURNING id`,
                [session.role === "student" ? session.sub : null, session.role === "reader" ? session.sub : null]
            )

            // Notify admins about the new ticket
            try {
                const { createNotificationForAdmins } = await import('@/lib/notifications')
                const userType = session.role === 'student' ? 'طالب' : (session.role === 'reader' ? 'مقرئ' : 'مستخدم')
                await createNotificationForAdmins({
                    type: 'new_contact_message',
                    title: 'تذكرة دعم جديدة',
                    message: `قام ${userType} بإنشاء تذكرة دعم فني جديدة`,
                    category: 'message',
                    link: '/admin/chat?tab=visitor'
                })
            } catch (notifyErr) {
                console.error("Failed to notify admins of new ticket:", notifyErr)
            }

            conversationId = result[0].id as string;
        } else if (session.role === "admin") {
            // Admin creating a conversation with a user
            const { userId, userRole } = body
            if (userId && userRole) {
                const targetStudentId = userRole === "student" ? userId : null
                const targetReaderId = userRole === "reader" ? userId : null

                const existingQuery = targetStudentId
                    ? `SELECT id FROM conversations WHERE admin_id = $1 AND student_id = $2 AND reader_id IS NULL`
                    : `SELECT id FROM conversations WHERE admin_id = $1 AND reader_id = $2 AND student_id IS NULL`

                const existing = await query(existingQuery, [session.sub, userId])
                if (existing.length > 0) {
                    conversationId = existing[0].id as string;
                } else {
                    const result: any = await query(
                        `INSERT INTO conversations (admin_id, student_id, reader_id) VALUES ($1, $2, $3) RETURNING id`,
                        [session.sub, targetStudentId, targetReaderId]
                    )
                    conversationId = result[0].id as string;
                }
            } else {
                return NextResponse.json({ error: "userId and userRole are required" }, { status: 400 })
            }
        } else {
            let finalStudentId = body.studentId;
            let finalReaderId = body.readerId;

            if (body.participantId) {
                if (body.otherRole === "student") finalStudentId = body.participantId;
                if (body.otherRole === "reader") finalReaderId = body.participantId;
            }

            if (session.role === "student" && !finalStudentId) finalStudentId = session.sub;
            if (session.role === "reader" && !finalReaderId) finalReaderId = session.sub;

            if (!finalStudentId || !finalReaderId) {
                return NextResponse.json({ error: "معرف الطالب والمقرئ مطلوبان" }, { status: 400 })
            }

            if (session.role === "student" && finalStudentId !== session.sub) {
                return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
            }
            if (session.role === "reader" && finalReaderId !== session.sub) {
                return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
            }

            const existing = await query(
                `SELECT id FROM conversations WHERE student_id = $1 AND reader_id = $2 AND admin_id IS NULL`,
                [finalStudentId, finalReaderId]
            )

            if (existing.length > 0) {
                conversationId = existing[0].id as string;
            } else {
                const result = await query(
                    `INSERT INTO conversations (student_id, reader_id) VALUES ($1, $2) RETURNING id`,
                    [finalStudentId, finalReaderId]
                )
                conversationId = result[0].id as string;
            }
        }

        const fullConversation = await query(`
            SELECT c.id, c.student_id, c.reader_id, c.admin_id, c.last_message_at, c.last_message_preview,
                   c.unread_count_student, c.unread_count_reader, c.is_ticket, c.ticket_status,
                   s.name as student_name, s.avatar_url as student_avatar,
                   r.name as reader_name, r.avatar_url as reader_avatar,
                   a.name as admin_name, a.avatar_url as admin_avatar
            FROM conversations c
            LEFT JOIN users s ON c.student_id = s.id
            LEFT JOIN users r ON c.reader_id = r.id
            LEFT JOIN users a ON c.admin_id = a.id
            WHERE c.id = $1
        `, [conversationId])

        return NextResponse.json({ conversation: fullConversation[0] }, { status: 201 })
    } catch (error) {
        console.error("Create conversation error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
