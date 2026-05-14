import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ALLOWED_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "reader"] as const

// POST /api/admin/tajweed-paths/[id]/stages/[stageId]/reorder
// Body: { direction: "up" | "down" }
// Swaps the position with the adjacent stage. Used by both admin and reader (with ownership check).
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; stageId: string }> },
) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ALLOWED_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id, stageId } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const direction = body?.direction === "up" ? "up" : "down"

    // Authorize path ownership for readers
    const pathRows = (await query<any>(
      `SELECT id, created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1`,
      [id],
    )) as any[]
    const path = pathRows[0]
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })
    if (
      session!.role === "reader" &&
      path.created_by !== session!.sub &&
      path.manager_id !== session!.sub
    ) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const currentRows = (await query<any>(
      `SELECT id, position FROM tajweed_path_stages WHERE id = $1 AND path_id = $2 LIMIT 1`,
      [stageId, id],
    )) as any[]
    const current = currentRows[0]
    if (!current) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 })

    const op = direction === "up" ? "<" : ">"
    const order = direction === "up" ? "DESC" : "ASC"
    const neighborRows = (await query<any>(
      `SELECT id, position FROM tajweed_path_stages
         WHERE path_id = $1 AND position ${op} $2
         ORDER BY position ${order} LIMIT 1`,
      [id, current.position],
    )) as any[]
    const neighbor = neighborRows[0]
    if (!neighbor) return NextResponse.json({ ok: false, reason: "no_neighbor" })

    // Swap positions using a temp value to avoid unique-constraint conflicts
    const TEMP = 1_000_000
    await query(`UPDATE tajweed_path_stages SET position = $1 WHERE id = $2`, [TEMP, current.id])
    await query(`UPDATE tajweed_path_stages SET position = $1 WHERE id = $2`, [current.position, neighbor.id])
    await query(`UPDATE tajweed_path_stages SET position = $1 WHERE id = $2`, [neighbor.position, current.id])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[tajweed stage reorder]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
