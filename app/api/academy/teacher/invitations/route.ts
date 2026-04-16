import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'teacher' && session.role !== 'academy_admin')) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const codes = await query(
      `SELECT i.*, c.title as course_title
       FROM invitation_codes i
       LEFT JOIN courses c ON c.id = i.course_id
       WHERE i.created_by = $1
       ORDER BY i.created_at DESC`,
      [session.sub]
    )

    // Get teacher courses for dropdown
    const courses = await query(
      `SELECT id, title FROM courses WHERE teacher_id = $1`,
      [session.sub]
    )

    return NextResponse.json({ codes, courses })
  } catch (error) {
    console.error("Invitations GET error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'teacher' && session.role !== 'academy_admin')) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { courseId, maxUses, expiresAt } = await req.json()

    // Generate random code (6 alphanumeric)
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    const newCode = await query(
      `INSERT INTO invitation_codes (code, created_by, course_id, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        code, 
        session.sub, 
        courseId || null, 
        maxUses || 10, 
        expiresAt || null
      ]
    )

    return NextResponse.json({ code: newCode[0] })
  } catch (error) {
    console.error("Invitations POST error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
