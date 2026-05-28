const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'api', 'academy', 'conversations', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The new GET and POST logic for academy/conversations/route.ts
const newContent = `import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    if (session.role === "parent") {
      const conversations = await query<{
        id: string
        student_id: string
        teacher_id: string
        parent_id: string
        last_message: string | null
        last_message_at: string | null
        other_user_id: string
        other_user_name: string
        other_user_avatar: string | null
        other_user_role: string
        unread_count: number
        is_ticket: boolean
        ticket_status: string
      }>(
        \`SELECT
           c.id, c.student_id, c.teacher_id, c.parent_id, c.last_message, c.last_message_at, c.is_ticket, c.ticket_status,
           COALESCE(u.id, a.id) as other_user_id, 
           COALESCE(u.name, a.name) as other_user_name, 
           COALESCE(u.avatar_url, a.avatar_url) as other_user_avatar,
           COALESCE(u.role, a.role) as other_user_role,
           (SELECT COUNT(*) FROM academy_messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
         FROM academy_conversations c
         LEFT JOIN users u ON u.id = c.teacher_id
         LEFT JOIN users a ON a.id = c.admin_id
         WHERE (c.student_id IN (
           SELECT child_id FROM parent_children
           WHERE parent_id = $1 AND status IN ('active', 'approved')
         )) OR c.parent_id = $1
         ORDER BY c.last_message_at DESC NULLS LAST\`,
        [session.sub]
      )

      return NextResponse.json({ conversations })
    }

    const isStudent = session.role === "student" || session.role === "academy_student"
    
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
      is_ticket: boolean
      ticket_status: string
    }>(
      \`SELECT 
         c.id, c.student_id, c.teacher_id, c.last_message, c.last_message_at, c.is_ticket, c.ticket_status,
         COALESCE(u.id, a.id) as other_user_id, 
         COALESCE(u.name, a.name, 'إدارة الأكاديمية') as other_user_name, 
         COALESCE(u.avatar_url, a.avatar_url) as other_user_avatar,
         (SELECT COUNT(*) FROM academy_messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
       FROM academy_conversations c
       LEFT JOIN users u ON u.id = CASE WHEN $2 THEN c.teacher_id ELSE c.student_id END
       LEFT JOIN users a ON a.id = c.admin_id
       WHERE CASE WHEN $2 THEN c.student_id = $1 ELSE c.teacher_id = $1 END
       ORDER BY c.last_message_at DESC NULLS LAST\`,
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
    const body = await req.json()
    const isTicket = body.isTicket || body.is_ticket

    if (isTicket) {
      const isParent = session.role === "parent"
      const isTeacher = session.role === "teacher"
      const isStudent = session.role === "student" || session.role === "academy_student"

      const result = await query(
          \`INSERT INTO academy_conversations (student_id, teacher_id, parent_id, is_ticket, ticket_status) VALUES ($1, $2, $3, true, 'open') RETURNING id\`,
          [isStudent ? session.sub : null, isTeacher ? session.sub : null, isParent ? session.sub : null]
      )

      try {
          const { createNotificationForAdmins } = await import('@/lib/notifications')
          const userType = isStudent ? 'طالب الأكاديمية' : (isTeacher ? 'مدرس الأكاديمية' : 'ولي الأمر')
          await createNotificationForAdmins({
              type: 'new_contact_message',
              title: 'تذكرة دعم جديدة (الأكاديمية)',
              message: \`قام \${userType} بإنشاء تذكرة دعم فني جديدة في الأكاديمية\`,
              category: 'message',
              link: '/academy/admin/conversations?tab=tickets'
          })
      } catch (notifyErr) {
          console.error("Failed to notify admins of new ticket:", notifyErr)
      }

      return NextResponse.json({ conversationId: result[0].id }, { status: 201 })
    }

    const { otherUserId, childId, userRole } = body
    
    // Admin creating a conversation
    if (session.role === "admin" || session.role === "supervisor") {
      if (otherUserId && userRole) {
          const targetStudentId = (userRole === "student" || userRole === "academy_student") ? otherUserId : null
          const targetTeacherId = userRole === "teacher" ? otherUserId : null
          const targetParentId = userRole === "parent" ? otherUserId : null

          const existingQuery = \`SELECT id FROM academy_conversations WHERE admin_id = $1 AND student_id \${targetStudentId ? '= $2' : 'IS NULL'} AND teacher_id \${targetTeacherId ? '= $3' : 'IS NULL'} AND parent_id \${targetParentId ? '= $4' : 'IS NULL'}\`
          
          const params = [session.sub]
          if (targetStudentId) params.push(targetStudentId)
          if (targetTeacherId) params.push(targetTeacherId)
          if (targetParentId) params.push(targetParentId)

          // simplifying the existing check for admin:
          const existing = await query(\`SELECT id FROM academy_conversations WHERE admin_id = $1 AND (student_id = $2 OR teacher_id = $3 OR parent_id = $4)\`, [session.sub, targetStudentId, targetTeacherId, targetParentId])
          if (existing.length > 0) {
              return NextResponse.json({ conversationId: existing[0].id }, { status: 201 })
          } else {
              const result: any = await query(
                  \`INSERT INTO academy_conversations (admin_id, student_id, teacher_id, parent_id) VALUES ($1, $2, $3, $4) RETURNING id\`,
                  [session.sub, targetStudentId, targetTeacherId, targetParentId]
              )
              return NextResponse.json({ conversationId: result[0].id }, { status: 201 })
          }
      } else {
          return NextResponse.json({ error: "userId and userRole are required" }, { status: 400 })
      }
    }

    if (!otherUserId) {
      return NextResponse.json({ error: "مطلوب معرف المستخدم الآخر" }, { status: 400 })
    }

    if (session.role === "parent") {
      if (!childId) {
        return NextResponse.json({ error: "مطلوب اختيار الابن" }, { status: 400 })
      }

      const link = await queryOne<{ id: string }>(
        \`SELECT id FROM parent_children
         WHERE parent_id = $1 AND child_id = $2 AND status IN ('active', 'approved')\`,
        [session.sub, childId]
      )
      if (!link) {
        return NextResponse.json({ error: "هذا الابن غير مرتبط بحسابك" }, { status: 403 })
      }

      const teacher = await queryOne<{ id: string }>(
        \`SELECT id FROM users WHERE id = $1 AND role IN ('teacher', 'reader')\`,
        [otherUserId]
      )
      if (!teacher) {
        return NextResponse.json({ error: "الشيخ غير موجود أو غير متاح للمحادثة" }, { status: 404 })
      }

      const existing = await queryOne<{ id: string }>(
        \`SELECT id FROM academy_conversations WHERE student_id = $1 AND teacher_id = $2 AND admin_id IS NULL\`,
        [childId, otherUserId]
      )

      if (existing) {
        return NextResponse.json({ conversationId: existing.id })
      }

      const newConv = await query<{ id: string }>(
        \`INSERT INTO academy_conversations (student_id, teacher_id)
         VALUES ($1, $2)
         RETURNING id\`,
        [childId, otherUserId]
      )

      return NextResponse.json({ conversationId: newConv[0].id })
    }

    const isStudent = session.role === "student" || session.role === "academy_student"
    const studentId = isStudent ? session.sub : otherUserId
    const teacherId = isStudent ? otherUserId : session.sub

    // Verify other user exists and has correct role
    const otherRole = isStudent ? 'teacher' : 'student' // Note: in real DB student might be 'student' or 'academy_student'
    const otherUser = await queryOne<{ id: string }>(
      \`SELECT id FROM users WHERE id = $1 AND role IN ('teacher', 'reader', 'student', 'academy_student')\`,
      [otherUserId]
    )

    if (!otherUser) {
      return NextResponse.json({ error: "المستخدم غير موجود أو غير متاح للمحادثة" }, { status: 404 })
    }

    // Check if conversation already exists
    const existing = await queryOne<{ id: string }>(
      \`SELECT id FROM academy_conversations WHERE student_id = $1 AND teacher_id = $2 AND admin_id IS NULL\`,
      [studentId, teacherId]
    )

    if (existing) {
      return NextResponse.json({ conversationId: existing.id })
    }

    // Create new conversation
    const newConv = await query<{ id: string }>(
      \`INSERT INTO academy_conversations (student_id, teacher_id) 
       VALUES ($1, $2)
       RETURNING id\`,
      [studentId, teacherId]
    )

    return NextResponse.json({ conversationId: newConv[0].id })
  } catch (error) {
    console.error("Conversations POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
`;

fs.writeFileSync(filePath, newContent);
console.log('Updated academy API');
