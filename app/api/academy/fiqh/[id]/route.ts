import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const SUPERVISOR_ROLES = ["fiqh_supervisor", "supervisor", "admin", "academy_admin"]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  const { id } = await params

  const rows = await query<any>(
    `SELECT
       f.*,
       CASE WHEN f.is_anonymous THEN 'مجهول الهوية' ELSE u.name END as student_name,
       ans.name as answered_by_name
     FROM fiqh_questions f
     JOIN users u ON u.id = f.asked_by
     LEFT JOIN users ans ON ans.id = f.answered_by
     WHERE f.id = $1`,
    [id]
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 })
  }

  const q = rows[0]

  // Students can only see their own questions or published answered ones
  const isSupervisor = SUPERVISOR_ROLES.includes(session.role)
  if (!isSupervisor && q.asked_by !== session.sub && !(q.is_published && q.answer)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  return NextResponse.json({ question: q })
}
