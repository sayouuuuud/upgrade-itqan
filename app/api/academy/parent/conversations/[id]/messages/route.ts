import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// Verify the user is part of the conversation; returns the conversation row.
async function getAuthorizedConversation(userId: string, conversationId: string) {
  return queryOne<{
    id: string
    parent_id: string
    teacher_id: string
    child_id: string | null
  }>(
    `SELECT id, parent_id, teacher_id, child_id FROM parent_teacher_conversations
     WHERE id = $1 AND (parent_id = $2 OR teacher_id = $2)`,
    [conversationId, userId]
  )
}

// GET messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params
  const conv = await getAuthorizedConversation(session.sub, id)
  if (!conv) {
    return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 })
  }

  const messages = await query<{
    id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
    sender_name: string | null
  }>(
    `SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at, u.name AS sender_name
     FROM parent_teacher_messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [id]
  )

  // Mark inbound messages as read for the current user
  const isParent = conv.parent_id === session.sub
  await query(
    `UPDATE parent_teacher_messages
     SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
    [id, session.sub]
  )
  await query(
    `UPDATE parent_teacher_conversations
     SET ${isParent ? 'unread_count_parent' : 'unread_count_teacher'} = 0,
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  )

  return NextResponse.json({ messages, conversation: conv })
}

// POST a new message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params
  const conv = await getAuthorizedConversation(session.sub, id)
  if (!conv) {
    return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 })
  }

  const { content } = await req.json()
  if (!content || !content.toString().trim()) {
    return NextResponse.json({ error: 'محتوى الرسالة مطلوب' }, { status: 400 })
  }

  const trimmed = content.toString().trim()

  const inserted = await queryOne<{ id: string; created_at: string }>(
    `INSERT INTO parent_teacher_messages (conversation_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [id, session.sub, trimmed]
  )

  // Update conversation
  const isParent = conv.parent_id === session.sub
  const otherId = isParent ? conv.teacher_id : conv.parent_id

  await query(
    `UPDATE parent_teacher_conversations
     SET last_message = $2, last_message_at = NOW(),
         ${isParent ? 'unread_count_teacher' : 'unread_count_parent'} =
           ${isParent ? 'unread_count_teacher' : 'unread_count_parent'} + 1,
         updated_at = NOW()
     WHERE id = $1`,
    [id, trimmed]
  )

  // Notify recipient
  const sender = await queryOne<{ name: string }>(
    `SELECT name FROM users WHERE id = $1`,
    [session.sub]
  )
  await createNotification({
    userId: otherId,
    type: 'new_message',
    title: isParent ? 'رسالة جديدة من ولي أمر' : 'رسالة جديدة من المعلم',
    message: `${sender?.name || 'مستخدم'}: ${trimmed.slice(0, 80)}${trimmed.length > 80 ? '…' : ''}`,
    category: 'message',
    link: isParent ? '/academy/teacher/parent-messages' : '/academy/parent/messages',
  })

  return NextResponse.json({ success: true, id: inserted?.id, created_at: inserted?.created_at })
}
