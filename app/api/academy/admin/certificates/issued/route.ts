import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

// GET — list of issued certificates.  Source-of-truth is
// certificate_issuance_requests with status='issued'.  We join the source
// label and the student for a complete admin table.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get("kind")
  const search = searchParams.get("search")?.trim()

  const filters: string[] = [`r.scope = $1`, `r.status = 'issued'`]
  const params: unknown[] = [SCOPE]

  if (kind && kind !== "all") {
    params.push(kind)
    filters.push(`r.kind = $${params.length}`)
  }

  if (search) {
    params.push(`%${search}%`)
    filters.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR r.certificate_number ILIKE $${params.length})`)
  }

  const rows = await query(
    `SELECT r.id,
            r.kind,
            r.language,
            r.certificate_number,
            r.serial_code,
            r.pdf_url,
            r.issued_at,
            r.source_label,
            r.source_table,
            r.source_id,
            u.id   AS student_id,
            u.name AS student_name,
            u.email AS student_email,
            t.id   AS template_id,
            t.name AS template_name
       FROM certificate_issuance_requests r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN certificate_templates t ON t.id = r.template_id
      WHERE ${filters.join(" AND ")}
      ORDER BY r.issued_at DESC NULLS LAST, r.created_at DESC
      LIMIT 500`,
    params,
  )

  return NextResponse.json({ certificates: rows })
}
