import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const teachers = await query(
      `SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          pc.child_id,
          child.name AS child_name,
          source.source_type
       FROM parent_children pc
       JOIN users child ON child.id = pc.child_id
       JOIN LATERAL (
         SELECT c.teacher_id AS teacher_id, 'course'::text AS source_type
           FROM enrollments e
           JOIN courses c ON c.id = e.course_id
          WHERE e.student_id = pc.child_id
         UNION
         SELECT b.reader_id AS teacher_id, 'session'::text AS source_type
           FROM bookings b
          WHERE b.student_id = pc.child_id
         UNION
         SELECT r.assigned_reader_id AS teacher_id, 'recitation'::text AS source_type
           FROM recitations r
          WHERE r.student_id = pc.child_id AND r.assigned_reader_id IS NOT NULL
       ) source ON TRUE
       JOIN users u ON u.id = source.teacher_id
      WHERE pc.parent_id = $1
        AND pc.status IN ('active', 'approved')
        AND u.role IN ('teacher', 'reader')
      ORDER BY child.name, u.name`,
      [session.sub],
    )

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error("[API] parent teachers error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
