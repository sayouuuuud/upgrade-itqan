import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

interface Ctx {
  params: Promise<{ id: string }>
}

// GET single
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const template = await queryOne(
    `SELECT * FROM certificate_templates WHERE id = $1 AND scope = $2`,
    [id, SCOPE],
  )
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ template })
}

// PATCH update
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const existing = await queryOne<{
    id: string
    kind: string
    language: string
    is_default: boolean
  }>(
    `SELECT id, kind, language, is_default FROM certificate_templates
       WHERE id = $1 AND scope = $2`,
    [id, SCOPE],
  )
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Handle is_default mutation: clear siblings first
  if (body.is_default === true && !existing.is_default) {
    await query(
      `UPDATE certificate_templates
         SET is_default = FALSE
         WHERE scope = $1 AND kind = $2 AND language = $3 AND id <> $4`,
      [SCOPE, existing.kind, existing.language, id],
    )
  }

  const allowed = [
    "name",
    "description",
    "template_url",
    "field_positions",
    "background_color",
    "is_default",
    "is_active",
    "language",
  ] as const

  const updates: string[] = []
  const values: unknown[] = []
  for (const key of allowed) {
    if (body[key] !== undefined) {
      values.push(
        key === "field_positions" ? JSON.stringify(body[key]) : body[key],
      )
      const cast = key === "field_positions" ? "::jsonb" : ""
      updates.push(`${key} = $${values.length}${cast}`)
    }
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  values.push(id, SCOPE)
  const result = await query(
    `UPDATE certificate_templates
        SET ${updates.join(", ")}
      WHERE id = $${values.length - 1} AND scope = $${values.length}
      RETURNING *`,
    values,
  )
  return NextResponse.json({ template: result[0] })
}

// DELETE — soft (is_active=false) by default, hard with ?hard=1
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const hard = searchParams.get("hard") === "1"

  if (hard) {
    await query(
      `DELETE FROM certificate_templates WHERE id = $1 AND scope = $2`,
      [id, SCOPE],
    )
  } else {
    await query(
      `UPDATE certificate_templates SET is_active = FALSE
         WHERE id = $1 AND scope = $2`,
      [id, SCOPE],
    )
  }
  return NextResponse.json({ ok: true })
}
