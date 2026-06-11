import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const ALLOWED_ROLES = ["teacher", "reader", "admin"]

// Ensure the caller owns / manages this path (admins bypass ownership).
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

// GET /api/academy/teacher/paths/[id]/stages — list stages of a path
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id } = await params
  const auth = await authorizePath(id, session)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const stages = await query(
      `SELECT s.id, s.position, s.title, s.description, s.content,
              s.video_url, s.pdf_url, s.passage_text, s.estimated_minutes, s.created_at,
              s.stage_type, s.course_id, s.halaqa_id, s.lesson_id,
              s.require_audio, s.require_file, s.task_instructions,
              c.title as course_title,
              h.name as halaqa_title,
              l.title as lesson_title
         FROM tajweed_path_stages s
         LEFT JOIN courses c ON s.course_id = c.id
         LEFT JOIN halaqat h ON s.halaqa_id = h.id
         LEFT JOIN lessons l ON s.lesson_id = l.id
        WHERE s.path_id = $1
        ORDER BY s.position ASC`,
      [id],
    )
    return NextResponse.json({ data: stages })
  } catch (error) {
    console.error("[teacher stages GET]", error)
    return NextResponse.json({ error: "حدث خطأ في جلب المراحل" }, { status: 500 })
  }
}

// POST /api/academy/teacher/paths/[id]/stages — append a new stage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id } = await params
  const auth = await authorizePath(id, session)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await req.json()
    const title = (body.title || "").toString().trim()
    if (!title) return NextResponse.json({ error: "عنوان المرحلة مطلوب" }, { status: 400 })

    const max = await query<{ m: number }>(
      `SELECT COALESCE(MAX(position), 0)::int AS m FROM tajweed_path_stages WHERE path_id = $1`,
      [id],
    )
    const position = (max[0]?.m || 0) + 1

    const inserted = await query(
      `INSERT INTO tajweed_path_stages (
          path_id, position, title, description, content,
          video_url, pdf_url, passage_text, estimated_minutes,
          stage_type, course_id, halaqa_id, lesson_id,
          require_audio, require_file, task_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, position, title, description, content,
                  video_url, pdf_url, passage_text, estimated_minutes, created_at,
                  stage_type, course_id, halaqa_id, lesson_id,
                  require_audio, require_file, task_instructions`,
      [
        id,
        position,
        title,
        body.description || null,
        body.content || null,
        body.video_url || null,
        body.pdf_url || null,
        body.passage_text || null,
        body.estimated_minutes || 30,
        body.stage_type || 'custom',
        body.course_id || null,
        body.halaqa_id || null,
        body.lesson_id || null,
        body.require_audio === true,
        body.require_file === true,
        body.task_instructions || null,
      ],
    )

    await query(
      `UPDATE tajweed_paths
          SET total_stages = (SELECT COUNT(*) FROM tajweed_path_stages WHERE path_id = $1)
        WHERE id = $1`,
      [id],
    )

    return NextResponse.json({ data: inserted[0] }, { status: 201 })
  } catch (error) {
    console.error("[teacher stages POST]", error)
    return NextResponse.json({ error: "حدث خطأ في إضافة المرحلة" }, { status: 500 })
  }
}
