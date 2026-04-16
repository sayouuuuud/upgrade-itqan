import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    // If user is student, get their conversations with teachers
    // If user is teacher, get their conversations with students
    const isStudent = session.role === "student"
    
    // We join to get the "other person's" details
    const conversations = await query<{
      id: string
      student_id: string
      teacher_id: string
      last_message: string | null
      last_message_at: string | null
      other_user_id: string
      other_user_name: string
      other_user_avatar: string | null
      unread_count: number
    }>(
      `SELECT 
         c.id, c.student_id, c.teacher_id, c.last_message, c.last_message_at,
         u.id as other_user_id, u.name as other_user_name, u.avatar_url as other_user_avatar,
         (SELECT COUNT(*) FROM academy_messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
       FROM academy_conversations c
       JOIN users u ON u.id = CASE WHEN $2 THEN c.teacher_id ELSE c.student_id END
       WHERE CASE WHEN $2 THEN c.student_id = $1 ELSE c.teacher_id = $1 END
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [session.sub, isStudent]
    )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Conversations GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { otherUserId } = await req.json()
    if (!otherUserId) {
      return NextResponse.json({ error: "مطلوب معرف المستخدم الآخر" }, { status: 400 })
    }

    const isStudent = session.role === "student"
    const studentId = isStudent ? session.sub : otherUserId
    const teacherId = isStudent ? otherUserId : session.sub

    // Verify other user exists and has correct role
    const otherRole = isStudent ? 'teacher' : 'student'
    const otherUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE id = $1 AND role = $2`,
      [otherUserId, otherRole]
    )

    if (!otherUser) {
      return NextResponse.json({ error: "المستخدم غير موجود أو غير متاح للمحادثة" }, { status: 404 })
    }

    // Check if conversation already exists
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM academy_conversations WHERE student_id = $1 AND teacher_id = $2`,
      [studentId, teacherId]
    )

    if (existing) {
      return NextResponse.json({ conversationId: existing.id })
    }

    // Create new conversation
    const newConv = await query<{ id: string }>(
      `INSERT INTO academy_conversations (student_id, teacher_id) 
       VALUES ($1, $2)
       RETURNING id`,
      [studentId, teacherId]
    )

    return NextResponse.json({ conversationId: newConv[0].id })
  } catch (error) {
    console.error("Conversations POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
