const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'api', 'academy', 'conversations', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the GET function entirely to handle admin/supervisor
const getFnStart = content.indexOf('export async function GET');
const postFnStart = content.indexOf('export async function POST');

const newGet = `export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    if (session.role === "admin" || session.role === "supervisor") {
      const conversations = await query<{
        id: string
        student_id: string | null
        teacher_id: string | null
        parent_id: string | null
        admin_id: string | null
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
           c.id, c.student_id, c.teacher_id, c.parent_id, c.admin_id, c.last_message, c.last_message_at, c.is_ticket, c.ticket_status,
           COALESCE(s.id, t.id, p.id) as other_user_id, 
           COALESCE(s.name, t.name, p.name, 'مستخدم') as other_user_name, 
           COALESCE(s.avatar_url, t.avatar_url, p.avatar_url) as other_user_avatar,
           COALESCE(s.role, t.role, p.role) as other_user_role,
           (SELECT COUNT(*) FROM academy_messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
         FROM academy_conversations c
         LEFT JOIN users s ON s.id = c.student_id
         LEFT JOIN users t ON t.id = c.teacher_id
         LEFT JOIN users p ON p.id = c.parent_id
         WHERE c.admin_id = $1 OR c.is_ticket = true
         ORDER BY c.last_message_at DESC NULLS LAST\`,
        [session.sub]
      )
      return NextResponse.json({ conversations })
    }

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
    const isTeacher = session.role === "teacher"
    
    // We join to get the "other person's" details
    // If student: join teacher or admin. If teacher: join student or admin.
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

`;

const newContent = content.substring(0, getFnStart) + newGet + content.substring(postFnStart);
fs.writeFileSync(filePath, newContent);
console.log('Updated academy API GET');
