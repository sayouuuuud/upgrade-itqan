import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

const ADMIN_ROLES = new Set([
  "admin",
  "academy_admin",
  "supervisor",
  "student_supervisor",
])

async function canAccessConversation(conversationId: string, userId: string, role: string) {
  if (ADMIN_ROLES.has(role)) {
    return queryOne<{ id: string, student_id: string, teacher_id: string, admin_id: string | null }>(
      `SELECT id, student_id, teacher_id, admin_id FROM academy_conversations WHERE id = $1`,
      [conversationId]
    )
  }

  if (role === "parent") {
    return queryOne<{ id: string, student_id: string, teacher_id: string, admin_id: string | null }>(
      `SELECT c.id, c.student_id, c.teacher_id, c.admin_id
         FROM academy_conversations c
         LEFT JOIN parent_children pc
           ON pc.child_id = c.student_id
          AND pc.status IN ('active', 'approved')
        WHERE c.id = $1
          AND (c.parent_id = $2 OR pc.parent_id = $2)`,
      [conversationId, userId]
    )
  }

  return queryOne<{ id: string, student_id: string, teacher_id: string, admin_id: string | null }>(
    `SELECT id, student_id, teacher_id, admin_id FROM academy_conversations 
     WHERE id = $1 AND (student_id = $2 OR teacher_id = $2 OR admin_id = $2)`,
    [conversationId, userId]
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const conv = await canAccessConversation(conversationId, session.sub, session.role)

    if (!conv) {
      return NextResponse.json({ error: "محادثة غير موجودة أو غير مصرح بها" }, { status: 404 })
    }

    const messages = await query<{
      id: string
      sender_id: string
      content: string
      message_text: string
      is_read: boolean
      created_at: string
      sender_name: string | null
      sender_role: string | null
      sender_avatar: string | null
    }>(
      `SELECT
         m.id,
         m.sender_id,
         m.content,
         m.content AS message_text,
         m.is_read,
         m.created_at,
         u.name AS sender_name,
         u.role AS sender_role,
         u.avatar_url AS sender_avatar
       FROM academy_messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conv.id]
    )

    // Mark unread messages from the other user as read
    await query(
      `UPDATE academy_messages SET is_read = TRUE 
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
      [conv.id, session.sub]
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Messages GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const raw = body?.content ?? body?.text ?? body?.message_text
    const content = typeof raw === "string" ? raw.trim() : ""

    if (!content) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 })
    }

    const conv = await canAccessConversation(conversationId, session.sub, session.role)

    if (!conv) {
      return NextResponse.json({ error: "محادثة غير موجودة أو غير مصرح بها" }, { status: 404 })
    }

    const newMsg = await query<{
      id: string
      sender_id: string
      content: string
      created_at: string
    }>(
      `INSERT INTO academy_messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, content, created_at`,
      [conv.id, session.sub, content]
    )

    // Update conversation last_message
    await query(
      `UPDATE academy_conversations 
       SET last_message = $1, last_message_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [content, conv.id]
    )

    // Notify recipient
    let recipientId = null;
    let link = '/academy/chat';

    if (session.sub === conv.student_id) {
        recipientId = conv.teacher_id || conv.admin_id;
        link = recipientId === conv.teacher_id ? '/academy/teacher/chat' : '/academy/admin/conversations';
    } else if (session.sub === conv.teacher_id) {
        recipientId = conv.student_id || conv.admin_id;
        link = recipientId === conv.student_id ? '/academy/student/chat' : '/academy/admin/conversations';
    } else if (session.sub === conv.admin_id) {
        recipientId = conv.student_id || conv.teacher_id;
        link = recipientId === conv.student_id ? '/academy/student/chat' : '/academy/teacher/chat';
    }

    if (recipientId) {
        const { createNotification } = await import('@/lib/notifications')
        const sender = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [session.sub])
        
        await createNotification({
            userId: recipientId,
            type: "new_message",
            title: "رسالة جديدة",
            message: `لديك رسالة جديدة من ${sender?.name || "مستخدم"} في الأكاديمية`,
            category: "message",
            link
        })
    }

    const enriched = {
      ...newMsg[0],
      message_text: newMsg[0].content,
    }

    return NextResponse.json({ message: enriched })
  } catch (error) {
    console.error("Message POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
