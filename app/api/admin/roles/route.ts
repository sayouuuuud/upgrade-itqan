import { NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query } from "@/lib/db"
import { ROLE_CATALOG } from "@/lib/admin/roles"

// GET /api/admin/roles — role catalogue + live user counts per role.
export async function GET() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const counts: Record<string, number> = {}
  try {
    const primary = await query<{ role: string; count: string }>(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`
    )
    for (const r of primary) counts[r.role] = Number(r.count)

    // Count secondary academy roles too (e.g. someone whose primary is admin but
    // also holds maqraa_admin), so the overview reflects effective reach.
    const secondary = await query<{ role: string; count: string }>(
      `SELECT UNNEST(academy_roles) AS role, COUNT(*)::int AS count
         FROM users
        WHERE academy_roles IS NOT NULL AND array_length(academy_roles, 1) > 0
        GROUP BY UNNEST(academy_roles)`
    )
    for (const r of secondary) {
      counts[`secondary:${r.role}`] = Number(r.count)
    }
  } catch (e) {
    console.error("[admin/roles] count error:", e)
  }

  return NextResponse.json({ catalog: ROLE_CATALOG, counts })
}
