import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { canAccessQuestion } from '@/lib/fiqh-helpers'
import { createNotification } from '@/lib/notifications'

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
        link: isOfficerSide
          ? `/academy/student/fiqh/${id}`
          : `/academy/officer/fiqh/${id}`,
      })
    }
  }

  return NextResponse.json({ ok: true, id: inserted[0]?.id })
}
