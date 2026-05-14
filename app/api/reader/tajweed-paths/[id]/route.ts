import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

async function loadOwnedPath(id: string, readerId: string) {
  // Reader can access path if they created it OR were assigned as manager
  const rows = (await query<any>(
    `SELECT * FROM tajweed_paths WHERE id = $1 AND (created_by = $2 OR manager_id = $2) LIMIT 1`,
    [id, readerId],
  )) as any[]
  return rows[0] || null
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params

    let path: any
    try {
      path = await loadOwnedPath(id, session!.sub)
    } catch (err: any) {
      if (err?.code === "42P01") return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      throw err
    }
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const stages = (await query(
      `SELECT * FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
      [id],
    )) as any[]

    const enrollmentStats = (await query<any>(
      `SELECT
         COUNT(*)::text AS enrolled,
         COUNT(*) FILTER (WHERE status = 'active')::text AS active,
         COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
         COUNT(*) FILTER (WHERE status = 'paused')::text AS paused,
         COUNT(*) FILTER (WHERE status = 'dropped')::text AS dropped,
         ROUND(AVG(stages_completed), 2)::text AS avg_completed_stages
       FROM tajweed_path_enrollments WHERE path_id = $1`,
      [id],
    )) as any[]

    return NextResponse.json({ path, stages, stats: enrollmentStats[0] || null })
  } catch (err) {
    console.error("[reader tajweed path GET]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const body = await req.json()
    const owned = await loadOwnedPath(id, session!.sub)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const allowed = ["title", "description", "level", "thumbnail_url", "is_published", "is_active", "require_audio", "estimated_days", "subject"] as const
    const sets: string[] = []
    const params: any[] = []
    let i = 1
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = $${i++}`); params.push((body as any)[key]) }
    }
    if (sets.length === 0) return NextResponse.json({ error: "لا تعديلات" }, { status: 400 })
    params.push(id)
    const updated = (await query(
      `UPDATE tajweed_paths SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      params,
    )) as any[]
    return NextResponse.json({ path: updated[0] })
  } catch (err) {
    console.error("[reader tajweed path PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const owned = await loadOwnedPath(id, session!.sub)
    if (!owned) return NextResponse.json({ error: "غير موجود" }, { status: 404 })
    await query(`DELETE FROM tajweed_paths WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[reader tajweed path DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
