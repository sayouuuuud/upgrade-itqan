import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'
import { createNotification } from '@/lib/notifications'

// GET: list conversations for the logged-in parent OR reader
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  if (session.role !== 'parent' && session.role !== 'reader' && session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const isParent = session.role === 'parent'

  const conversations = await query<{
    id: string
    parent_id: string
    reader_id: string
    child_id: string | null
    subject: string | null
    last_message: string | null
    last_message_at: string | null
    unread_count: number
    other_user_id: string
    other_user_name: string
    other_user_avatar: string | null
    child_name: string | null
  }>(
    `SELECT c.id, c.parent_id, c.reader_id, c.child_id, c.subject,
            c.last_message, c.last_message_at,
            CASE WHEN $2 THEN c.unread_count_parent ELSE c.unread_count_reader END AS unread_count,
            CASE WHEN $2 THEN c.reader_id ELSE c.parent_id END AS other_user_id,
            other_u.name AS other_user_name,
            other_u.avatar_url AS other_user_avatar,
            child_u.name AS child_name
     FROM parent_reader_conversations c
     JOIN users other_u ON other_u.id = CASE WHEN $2 THEN c.reader_id ELSE c.parent_id END
     LEFT JOIN users child_u ON child_u.id = c.child_id
     WHERE CASE WHEN $2 THEN c.parent_id = $1 ELSE c.reader_id = $1 END
     ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
    [session.sub, isParent]
  )

  return NextResponse.json({ conversations })
}

// POST: parent starts a new conversation with a reader (about a child)
// body: { reader_id, child_id, subject?, content? }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { reader_id, child_id, subject, content } = await req.json()

  if (!reader_id || !child_id) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
  }

  const link = await getActiveParentChild(session.sub, child_id)
  if (!link) {
    return NextResponse.json({ error: 'الطالب غير مربوط بحسابك' }, { status: 403 })
  }

  // Verify the reader actually interacted with the child
  const reader = await queryOne<{ id: string; name: string }>(
    `SELECT u.id, u.name FROM users u
     WHERE u.id = $1 AND u.role = 'reader'
       AND (
         EXISTS (SELECT 1 FROM recitations r WHERE r.assigned_reader_id = u.id AND r.student_id = $2)
         OR EXISTS (SELECT 1 FROM bookings b WHERE b.reader_id = u.id AND b.student_id = $2)
       )
     LIMIT 1`,
    [reader_id, child_id]
  )

  if (!reader) {
    return NextResponse.json(
      { error: 'لا يمكنك مراسلة هذا المقرئ. الطالب ليس له معه تلاوات أو جلسات.' },
      { status: 403 }
    )
  }

  const conv = await queryOne<{ id: string }>(
    `INSERT INTO parent_reader_conversations (parent_id, reader_id, child_id, subject)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (parent_id, reader_id, child_id) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [session.sub, reader_id, child_id, subject || null]
  )

  if (!conv) {
    return NextResponse.json({ error: 'فشل في إنشاء المحادثة' }, { status: 500 })
  }

  if (content && content.toString().trim()) {
    const trimmed = content.toString().trim()
    await query(
      `INSERT INTO parent_reader_messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)`,
      [conv.id, session.sub, trimmed]
    )
    await query(
      `UPDATE parent_reader_conversations
       SET last_message = $2, last_message_at = NOW(),
           unread_count_reader = unread_count_reader + 1, updated_at = NOW()
       WHERE id = $1`,
      [conv.id, trimmed]
    )

    const parent = await queryOne<{ name: string }>(
      `SELECT name FROM users WHERE id = $1`,
      [session.sub]
    )
    await createNotification({
      userId: reader_id,
      type: 'new_message',
      title: 'رسالة جديدة من ولي أمر',
      message: `وصلتك رسالة جديدة من ${parent?.name || 'ولي أمر'}`,
      category: 'message',
      link: '/reader/parent-messages',
    })
  }

  return NextResponse.json({ success: true, conversation_id: conv.id })
}
