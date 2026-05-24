import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

async function canAccessConversation(conversationId: string, userId: string, role: string) {
  if (role === "parent") {
    return queryOne<{ id: string, student_id: string, teacher_id: string, admin_id: string | null }>(
      `SELECT c.id, c.student_id, c.teacher_id, c.admin_id
         FROM academy_conversations c
         JOIN parent_children pc ON pc.child_id = c.student_id
        WHERE c.id = $1
          AND pc.parent_id = $2
          AND pc.status IN ('active', 'approved')`,
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

    // Get messages
    const messages = await query<{
      id: string
      sender_id: string
      content: string
      is_read: boolean
      created_at: string
    }>(
      `SELECT id, sender_id, content, is_read, created_at
       FROM academy_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
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
    const { content } = await req.json()

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 })
    }

    const conv = await canAccessConversation(conversationId, session.sub, session.role)

    if (!conv) {
      return NextResponse.json({ error: "محادثة غير موجودة أو غير مصرح بها" }, { status: 404 })
    }

    // Insert message
    const newMsg = await query<{
      id: string
      sender_id: string
      content: string
      created_at: string
    }>(
      `INSERT INTO academy_messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, content, created_at`,
      [conv.id, session.sub, content.trim()]
    )

    // Update conversation last_message
    await query(
      `UPDATE academy_conversations 
       SET last_message = $1, last_message_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [content.trim(), conv.id]
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

    return NextResponse.json({ message: newMsg[0] })
  } catch (error) {
    console.error("Message POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
