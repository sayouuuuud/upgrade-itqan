import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { isCommunityAdmin } from "@/lib/community/permissions"
import type { Community } from "@/lib/community/types"

async function loadRule(id: string) {
  return queryOne<{ id: string; community: Community }>(
    `SELECT id, community FROM community_rules WHERE id = $1`,
    [id]
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id } = await params
  const rule = await loadRule(id)
  if (!rule) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 })
  }
  if (!isCommunityAdmin(session, rule.community)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 })
  }
  let body: { title?: string; body?: string | null; position?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 })
  }
  const updates: string[] = []
  const values: unknown[] = []
  if (typeof body.title === "string" && body.title.trim()) {
    values.push(body.title.trim())
    updates.push(`title = $${values.length}`)
  }
  if (body.body !== undefined) {
    values.push(body.body || null)
    updates.push(`body = $${values.length}`)
  }
  if (Number.isFinite(body.position)) {
    values.push(Number(body.position))
    updates.push(`position = $${values.length}`)
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: "لا يوجد ما يتم تحديثه" }, { status: 400 })
  }
  values.push(id)
  try {
    const rows = await query(
      `UPDATE community_rules SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    )
    return NextResponse.json({ rule: rows[0] })
  } catch (err) {
    console.error("[community/admin/rules/[id] PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }
  const { id } = await params
  const rule = await loadRule(id)
  if (!rule) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 })
  }
  if (!isCommunityAdmin(session, rule.community)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 })
  }
  try {
    await query(`DELETE FROM community_rules WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[community/admin/rules/[id] DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
