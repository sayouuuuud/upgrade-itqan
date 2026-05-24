import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { query } from '@/lib/db'

const ALLOWED_ROLES: ("admin" | "academy_admin" | "supervisor" | "student_supervisor")[] = [
    "admin",
    "academy_admin",
    "supervisor",
    "student_supervisor",
]

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const searchCondition = search
        ? `WHERE s.name ILIKE $1 OR r.name ILIKE $1 OR p.name ILIKE $1 OR a.name ILIKE $1`
        : ''
    const params: any[] = search ? [`%${search}%`, limit, offset] : [limit, offset]
    const limitIdx = search ? 2 : 1

    const q = `
    SELECT
      c.id,
      c.last_message_at,
      c.last_message AS last_message_preview,
      c.unread_count_student, c.unread_count_teacher, c.unread_count_parent, c.unread_count_admin,
      c.is_active,
      c.created_at, c.is_ticket, c.ticket_status, c.assigned_supervisor_id,
      s.id AS student_id, s.name AS student_name, s.email AS student_email, s.avatar_url AS student_avatar,
      r.id AS teacher_id, r.name AS teacher_name, r.email AS teacher_email, r.avatar_url AS teacher_avatar,
      p.id AS parent_id, p.name AS parent_name, p.email AS parent_email, p.avatar_url AS parent_avatar,
      a.id AS admin_id, a.name AS admin_name, a.avatar_url AS admin_avatar,
      sup.name AS supervisor_name,
      (SELECT COUNT(*) FROM academy_messages m WHERE m.conversation_id = c.id) AS message_count
    FROM academy_conversations c
    LEFT JOIN users s ON c.student_id = s.id
    LEFT JOIN users r ON c.teacher_id = r.id
    LEFT JOIN users p ON c.parent_id = p.id
    LEFT JOIN users a ON c.admin_id = a.id
    LEFT JOIN users sup ON c.assigned_supervisor_id = sup.id
    ${searchCondition}
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT $${limitIdx} OFFSET $${limitIdx + 1}
  `

    const countQuery = `
    SELECT COUNT(*) AS total FROM academy_conversations c
    LEFT JOIN users s ON c.student_id = s.id
    LEFT JOIN users r ON c.teacher_id = r.id
    LEFT JOIN users p ON c.parent_id = p.id
    LEFT JOIN users a ON c.admin_id = a.id
    ${searchCondition}
  `

    const [convos, countResult] = await Promise.all([
        query(q, params),
        query(countQuery, search ? [`%${search}%`] : []),
    ])

    return NextResponse.json({
        conversations: convos,
        total: parseInt((countResult[0] as any)?.total || '0'),
        page,
        limit,
    })
}

export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!requireRole(session, ALLOWED_ROLES)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, is_active, ticket_status, assigned_supervisor_id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (assigned_supervisor_id !== undefined) {
        await query(`UPDATE academy_conversations SET assigned_supervisor_id = $1, updated_at = NOW() WHERE id = $2`, [assigned_supervisor_id, id])
    } else if (ticket_status !== undefined) {
        await query(`UPDATE academy_conversations SET ticket_status = $1, updated_at = NOW() WHERE id = $2`, [ticket_status, id])
    } else if (is_active !== undefined) {
        await query(`UPDATE academy_conversations SET is_active = $1, updated_at = NOW() WHERE id = $2`, [is_active, id])
    }

    return NextResponse.json({ ok: true })
}
