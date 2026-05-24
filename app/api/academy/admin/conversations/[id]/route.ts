import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { query } from '@/lib/db'

const ALLOWED_ROLES: ("admin" | "academy_admin" | "supervisor" | "student_supervisor")[] = [
    "admin",
    "academy_admin",
    "supervisor",
    "student_supervisor",
]

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const messages = await query(
        `SELECT
            m.id,
            m.content AS message_text,
            m.sender_id,
            m.is_read,
            m.created_at,
            u.name AS sender_name,
            u.role AS sender_role,
            u.avatar_url AS sender_avatar
         FROM academy_messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC`,
        [id]
    )

    const convo = await query(
        `SELECT
            c.id,
            c.is_active,
            c.is_ticket,
            c.ticket_status,
            c.last_message AS last_message_preview,
            c.last_message_at,
            s.name AS student_name,
            r.name AS teacher_name,
            p.name AS parent_name,
            a.name AS admin_name
         FROM academy_conversations c
         LEFT JOIN users s ON c.student_id = s.id
         LEFT JOIN users r ON c.teacher_id = r.id
         LEFT JOIN users p ON c.parent_id = p.id
         LEFT JOIN users a ON c.admin_id = a.id
         WHERE c.id = $1`,
        [id]
    )

    return NextResponse.json({ conversation: convo[0], messages })
}
