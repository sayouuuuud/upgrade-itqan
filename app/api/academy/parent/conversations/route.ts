import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'
import { createNotification } from '@/lib/notifications'

// GET: list conversations for the logged-in parent OR teacher
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  if (session.role !== 'parent' && session.role !== 'teacher' && session.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const isParent = session.role === 'parent'

  const conversations = await query<{
    id: string
    parent_id: string
    teacher_id: string
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
    `SELECT c.id, c.parent_id, c.teacher_id, c.child_id, c.subject,
            c.last_message, c.last_message_at,
            CASE WHEN $2 THEN c.unread_count_parent ELSE c.unread_count_teacher END AS unread_count,
            CASE WHEN $2 THEN c.teacher_id ELSE c.parent_id END AS other_user_id,
            other_u.name AS other_user_name,
            other_u.avatar_url AS other_user_avatar,
            child_u.name AS child_name
     FROM parent_teacher_conversations c
     JOIN users other_u ON other_u.id = CASE WHEN $2 THEN c.teacher_id ELSE c.parent_id END
     LEFT JOIN users child_u ON child_u.id = c.child_id
     WHERE CASE WHEN $2 THEN c.parent_id = $1 ELSE c.teacher_id = $1 END
     ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
    [session.sub, isParent]
  )

  return NextResponse.json({ conversations })
}

// POST: parent starts a new conversation with a teacher (about a child)
// body: { teacher_id, child_id, subject?, content? }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { teacher_id, child_id, subject, content } = await req.json()

  if (!teacher_id || !child_id) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
  }

  // Verify parent-child link is active
  const link = await getActiveParentChild(session.sub, child_id)
  if (!link) {
    return NextResponse.json({ error: 'الطالب غير مربوط بحسابك' }, { status: 403 })
  }

  // Verify the teacher actually teaches a course the child is enrolled in
  const teach = await queryOne<{ id: string; name: string }>(
    `SELECT u.id, u.name FROM users u
     WHERE u.id = $1
       AND u.role = 'teacher'
       AND EXISTS (
         SELECT 1 FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = $2 AND e.status = 'active' AND c.teacher_id = u.id
       )
     LIMIT 1`,
    [teacher_id, child_id]
  )

  if (!teach) {
    return NextResponse.json(
      { error: 'لا يمكنك مراسلة هذا المعلم. الطالب غير مسجل في إحدى دوراته.' },
      { status: 403 }
    )
  }

  // Upsert conversation
  let conv = await queryOne<{ id: string }>(
    `INSERT INTO parent_teacher_conversations (parent_id, teacher_id, child_id, subject)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (parent_id, teacher_id, child_id) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [session.sub, teacher_id, child_id, subject || null]
  )

  if (!conv) {
    return NextResponse.json({ error: 'فشل في إنشاء المحادثة' }, { status: 500 })
  }

  // Optionally include a first message
  if (content && content.toString().trim()) {
    const trimmed = content.toString().trim()
    await query(
      `INSERT INTO parent_teacher_messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)`,
      [conv.id, session.sub, trimmed]
    )
    await query(
      `UPDATE parent_teacher_conversations
       SET last_message = $2, last_message_at = NOW(), unread_count_teacher = unread_count_teacher + 1, updated_at = NOW()
       WHERE id = $1`,
      [conv.id, trimmed]
    )

    const parent = await queryOne<{ name: string }>(
      `SELECT name FROM users WHERE id = $1`,
      [session.sub]
    )
    await createNotification({
      userId: teacher_id,
      type: 'new_message',
      title: 'رسالة جديدة من ولي أمر',
      message: `وصلتك رسالة جديدة من ${parent?.name || 'ولي أمر'}`,
      category: 'message',
      link: '/academy/teacher/parent-messages',
    })
  }

  return NextResponse.json({ success: true, conversation_id: conv.id })
}
