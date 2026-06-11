import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const ALLOWED_ROLES = ["teacher", "reader", "admin"]

async function authorizePath(pathId: string, session: { sub: string; role: string }) {
  const rows = await query<{ created_by: string; manager_id: string | null }>(
    `SELECT created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1`,
    [pathId],
  )
  if (rows.length === 0) return { ok: false as const, status: 404, error: "المسار غير موجود" }
  const p = rows[0]
  const isManager =
    session.role === "admin" || p.created_by === session.sub || p.manager_id === session.sub
  if (!isManager) return { ok: false as const, status: 403, error: "غير مصرح بإدارة هذا المسار" }
  return { ok: true as const }
}

// PATCH /api/academy/teacher/paths/[id]/stages/[stageId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> },
) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id, stageId } = await params
  const auth = await authorizePath(id, session)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await req.json()
    const allowed = [
      "title", "description", "content", "video_url",
      "pdf_url", "passage_text", "estimated_minutes",
      "stage_type", "course_id", "halaqa_id", "lesson_id",
      "require_audio", "require_file", "task_instructions"
    ] as const
    const sets: string[] = []
    const values: unknown[] = []
    let i = 1
    for (const key of allowed) {
      if (key in body) {
        sets.push(`${key} = $${i++}`)
        const v = body[key]
        if (key === "require_audio" || key === "require_file") {
          values.push(v === true)
        } else {
          values.push(v === "" ? null : v)
        }
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: "لا تعديلات" }, { status: 400 })
    values.push(stageId, id)
    const updated = await query(
      `UPDATE tajweed_path_stages SET ${sets.join(", ")}
         WHERE id = $${i++} AND path_id = $${i}
       RETURNING id, position, title, description, content,
                 video_url, pdf_url, passage_text, estimated_minutes, created_at,
                 stage_type, course_id, halaqa_id, lesson_id,
                 require_audio, require_file, task_instructions`,
      values,
    )
    if (updated.length === 0) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 })
    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    console.error("[teacher stage PATCH]", error)
    return NextResponse.json({ error: "حدث خطأ في تعديل المرحلة" }, { status: 500 })
  }
}

// DELETE /api/academy/teacher/paths/[id]/stages/[stageId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> },
) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id, stageId } = await params
  const auth = await authorizePath(id, session)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    await query(`DELETE FROM tajweed_path_stages WHERE id = $1 AND path_id = $2`, [stageId, id])
    await query(
      `UPDATE tajweed_paths
          SET total_stages = (SELECT COUNT(*) FROM tajweed_path_stages WHERE path_id = $1)
        WHERE id = $1`,
      [id],
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teacher stage DELETE]", error)
    return NextResponse.json({ error: "حدث خطأ في حذف المرحلة" }, { status: 500 })
  }
}
