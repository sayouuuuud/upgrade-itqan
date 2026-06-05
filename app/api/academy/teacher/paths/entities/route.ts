import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || !["teacher", "admin", "academy_admin"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const courses = await query(
      `SELECT id, title FROM courses WHERE teacher_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
      [session.sub]
    )
    
    // There are halaqat in `halaqat` table, let's fetch those owned by the teacher
    let halaqat: any[] = []
    try {
      halaqat = await query(
        `SELECT id, name as title FROM halaqat WHERE teacher_id = $1 ORDER BY created_at DESC`,
        [session.sub]
      )
    } catch {
      // Table might not exist or schema differs, ignore
    }

    // Lessons from the courses
    let lessons: any[] = []
    try {
      lessons = await query(
        `SELECT l.id, l.title, c.title as course_title, l.course_id
         FROM lessons l
         JOIN courses c ON l.course_id = c.id
         WHERE c.teacher_id = $1 
         ORDER BY l.order_index ASC`,
        [session.sub]
      )
    } catch {
      // Ignore
    }

    return NextResponse.json({ data: { courses, halaqat, lessons } })
  } catch (error) {
    console.error("[entities GET]", error)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
