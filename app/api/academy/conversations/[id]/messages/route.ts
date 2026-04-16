import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

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
    // Verify user is part of the conversation
    const conv = await queryOne<{ id: string }>(
      `SELECT id FROM academy_conversations 
       WHERE id = $1 AND (student_id = $2 OR teacher_id = $2)`,
      [conversationId, session.sub]
    )

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

    // Verify conversation access
    const conv = await queryOne<{ id: string }>(
      `SELECT id FROM academy_conversations 
       WHERE id = $1 AND (student_id = $2 OR teacher_id = $2)`,
      [conversationId, session.sub]
    )

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

    return NextResponse.json({ message: newMsg[0] })
  } catch (error) {
    console.error("Message POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
