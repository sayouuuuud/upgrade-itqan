import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "reader"] as const

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

// PATCH /api/admin/tajweed-paths/[id]/stages/[stageId]
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; stageId: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id, stageId } = await ctx.params
    const body = await req.json()
    const isReaderOnly = session!.role === "reader"
    const owned = await authorizePath(id, session!.sub, isReaderOnly)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const allowed = ["title", "description", "content", "video_url", "pdf_url", "passage_text", "estimated_minutes", "position"] as const
    const sets: string[] = []
    const params: any[] = []
    let i = 1
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = $${i++}`); params.push((body as any)[key]) }
    }
    if (sets.length === 0) return NextResponse.json({ error: "لا تعديلات" }, { status: 400 })
    params.push(stageId, id)
    const updated = (await query(
      `UPDATE tajweed_path_stages SET ${sets.join(", ")}
         WHERE id = $${i++} AND path_id = $${i} RETURNING *`,
      params,
    )) as any[]
    return NextResponse.json({ stage: updated[0] || null })
  } catch (err) {
    console.error("[admin tajweed stage PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

// DELETE /api/admin/tajweed-paths/[id]/stages/[stageId]
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; stageId: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id, stageId } = await ctx.params
    const isReaderOnly = session!.role === "reader"
    const owned = await authorizePath(id, session!.sub, isReaderOnly)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    await query(`DELETE FROM tajweed_path_stages WHERE id = $1 AND path_id = $2`, [stageId, id])
    await query(
      `UPDATE tajweed_paths
          SET total_stages = (SELECT COUNT(*) FROM tajweed_path_stages WHERE path_id = $1)
        WHERE id = $1`,
      [id],
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin tajweed stage DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
