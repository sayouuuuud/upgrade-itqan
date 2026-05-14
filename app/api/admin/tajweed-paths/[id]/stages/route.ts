import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "reader"] as const

// Helper: ensure caller can manage this path. Admins can manage any,
// readers can manage paths they created OR were assigned to manage.
async function authorizePath(pathId: string, sessionSub: string, isReaderOnly: boolean) {
  const rows = (await query<any>(
    `SELECT id, created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1`,
    [pathId],
  )) as any[]
  const p = rows[0]
  if (!p) return null
  if (isReaderOnly && p.created_by !== sessionSub && p.manager_id !== sessionSub) return null
  return p
}

// POST /api/admin/tajweed-paths/[id]/stages
// Body: { title, description?, content?, video_url?, pdf_url?, passage_text?, estimated_minutes?, position? }
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const body = await req.json()
    const isReaderOnly = session!.role === "reader"
    const owned = await authorizePath(id, session!.sub, isReaderOnly)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const title = (body.title || "").toString().trim()
    if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })

    // Determine position: explicit value or append to end
    let position: number
    if (body.position && typeof body.position === "number") {
      position = body.position
    } else {
      const max = (await query<any>(
        `SELECT COALESCE(MAX(position), 0) AS m FROM tajweed_path_stages WHERE path_id = $1`,
        [id],
      )) as any[]
      position = (parseInt(max[0]?.m || "0", 10) || 0) + 1
    }

    const inserted = (await query<any>(
      `INSERT INTO tajweed_path_stages (
          path_id, position, title, description, content,
          video_url, pdf_url, passage_text, estimated_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        id, position, title,
        body.description || null,
        body.content || null,
        body.video_url || null,
        body.pdf_url || null,
        body.passage_text || null,
        body.estimated_minutes || 30,
      ],
    )) as any[]

    // Update total_stages
    await query(
      `UPDATE tajweed_paths
          SET total_stages = (SELECT COUNT(*) FROM tajweed_path_stages WHERE path_id = $1)
        WHERE id = $1`,
      [id],
    )

    return NextResponse.json({ stage: inserted[0] }, { status: 201 })
  } catch (err) {
    console.error("[admin tajweed stages POST]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
