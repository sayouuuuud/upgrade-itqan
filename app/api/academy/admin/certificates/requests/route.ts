import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const SCOPE = "academy" as const

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "academy_admin"
}

// GET — list issuance requests
//   ?status=pending|submitted|approved|rejected|issued|all (default: all)
//   ?kind=course|...
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const kind = searchParams.get("kind")

  const filters: string[] = ["r.scope = $1"]
  const params: unknown[] = [SCOPE]

  if (status && status !== "all") {
    params.push(status)
    filters.push(`r.status = $${params.length}`)
  }
  if (kind && kind !== "all") {
    params.push(kind)
    filters.push(`r.kind = $${params.length}`)
  }

  const rows = await query(
    `SELECT r.*,
            u.name AS student_name,
            u.email AS student_email,
            t.name AS template_name,
            t.template_url AS template_url
       FROM certificate_issuance_requests r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN certificate_templates t ON t.id = r.template_id
       WHERE ${filters.join(" AND ")}
       ORDER BY
         CASE r.status
           WHEN 'submitted' THEN 0
           WHEN 'data_required' THEN 1
           WHEN 'approved' THEN 2
           WHEN 'issued' THEN 3
           WHEN 'rejected' THEN 4
           ELSE 5
         END,
         r.created_at DESC`,
    params,
  )

  // Summary counts
  const counts = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
       FROM certificate_issuance_requests
       WHERE scope = $1
       GROUP BY status`,
    [SCOPE],
  )

  return NextResponse.json({
    requests: rows,
    counts: counts.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = Number(c.count)
      return acc
    }, {}),
  })
}
