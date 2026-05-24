import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { canAccessQuestion } from '@/lib/fiqh-helpers'
import { createNotification } from '@/lib/notifications'

// GET: full conversation thread for a question, oldest first.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const { id } = await params
  const access = await canAccessQuestion(session.sub, session.role, id)
  if (!access.allowed) {
    return NextResponse.json({ error: 'لا تملك صلاحية' }, { status: 403 })
  }

  const messages = await query<{
    id: string
    question_id: string
    sender_id: string
    sender_role: string
    sender_name: string | null
    sender_avatar: string | null
    content: string
    is_read: boolean
    created_at: string
  }>(
    `SELECT m.id, m.question_id, m.sender_id, m.sender_role,
            u.name AS sender_name, u.avatar_url AS sender_avatar,
            m.content, m.is_read, m.created_at
       FROM fiqh_messages m
       LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.question_id = $1
      ORDER BY m.created_at ASC`,
    [id]
  )

  // Mark messages addressed to current user as read.
  await query(
    `UPDATE fiqh_messages
        SET is_read = TRUE
      WHERE question_id = $1
        AND sender_id <> $2
        AND is_read = FALSE`,
    [id, session.sub]
  ).catch(() => {})

  return NextResponse.json({ messages })
}

// POST: send a message in the asker<->officer thread
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const { id } = await params
  const { content } = await req.json()
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'محتوى الرسالة مطلوب' }, { status: 400 })
  }

  const access = await canAccessQuestion(session.sub, session.role, id)
  if (!access.allowed || !access.perspective) {
    return NextResponse.json({ error: 'لا تملك صلاحية' }, { status: 403 })
  }

  const senderRole =
    access.perspective === 'admin' ? 'admin' : access.perspective // 'asker' | 'officer'

  const inserted = await query<{ id: string }>(
    `INSERT INTO fiqh_messages (question_id, sender_id, sender_role, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [id, session.sub, senderRole, content.trim()]
  )

  // Move status to in_progress if it was assigned and officer just spoke / asker replied
  await query(
    `UPDATE fiqh_questions
        SET status = CASE
              WHEN status = 'assigned' THEN 'in_progress'
              ELSE status
            END
      WHERE id = $1`,
    [id]
  )

  // Notify the other party
  const q = await queryOne<{ asked_by: string; assigned_to: string | null; title: string | null }>(
    `SELECT asked_by, assigned_to, title FROM fiqh_questions WHERE id = $1`,
    [id]
  )
  if (q) {
    const recipientId =
      session.sub === q.asked_by ? q.assigned_to : q.asked_by
    if (recipientId) {
      const isOfficerSide = session.sub === q.assigned_to
      await createNotification({
        userId: recipientId,
        type: 'general',
        category: 'fiqh',
        title: isOfficerSide ? 'رد جديد من المسؤول' : 'رسالة جديدة من السائل',
        message: content.trim().slice(0, 120),
        link: `/academy/fiqh/${id}`,
      })
    }
  }

  return NextResponse.json({ ok: true, id: inserted[0]?.id })
}
