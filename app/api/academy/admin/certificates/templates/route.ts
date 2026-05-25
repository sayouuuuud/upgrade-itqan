import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import {
  ALL_KINDS,
  ALL_LANGUAGES,
  type CertificateKind,
  type CertificateLanguage,
} from "@/lib/certificates"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

// GET /api/academy/admin/certificates/templates
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get("kind")
  const language = searchParams.get("language")
  const includeInactive = searchParams.get("include_inactive") === "1"

  const filters: string[] = ["scope = $1"]
  const params: unknown[] = [SCOPE]

  if (kind) {
    params.push(kind)
    filters.push(`kind = $${params.length}`)
  }
  if (language) {
    params.push(language)
    filters.push(`language = $${params.length}`)
  }
  if (!includeInactive) {
    filters.push("is_active = TRUE")
  }

  const templates = await query(
    `SELECT t.*, u.name AS created_by_name
       FROM certificate_templates t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE ${filters.join(" AND ")}
       ORDER BY t.kind ASC, t.language ASC,
                t.is_default DESC, t.created_at DESC`,
    params,
  )

  return NextResponse.json({ templates })
}

// POST /api/academy/admin/certificates/templates
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const {
    kind,
    language = "ar",
    name,
    description = null,
    template_url,
    field_positions = {},
    background_color = null,
    is_default = false,
  }: {
    kind: CertificateKind
    language?: CertificateLanguage
    name: string
    description?: string | null
    template_url: string
    field_positions?: Record<string, unknown>
    background_color?: string | null
    is_default?: boolean
  } = body

  if (!ALL_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  }
  if (!ALL_LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 })
  }
  if (!name || !template_url) {
    return NextResponse.json(
      { error: "Missing name or template_url" },
      { status: 400 },
    )
  }

  // If marking as default, clear other defaults for the same key first
  if (is_default) {
    await query(
      `UPDATE certificate_templates
         SET is_default = FALSE
         WHERE scope = $1 AND kind = $2 AND language = $3`,
      [SCOPE, kind, language],
    )
  }

  const [row] = await query(
    `INSERT INTO certificate_templates
        (scope, kind, language, name, description, template_url,
         field_positions, background_color, is_default, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
      RETURNING *`,
    [
      SCOPE,
      kind,
      language,
      name,
      description,
      template_url,
      JSON.stringify(field_positions || {}),
      background_color,
      Boolean(is_default),
      session.sub,
    ],
  )

  return NextResponse.json({ template: row }, { status: 201 })
}
