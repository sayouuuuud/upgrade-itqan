import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { generatePathUnits, isValidUnitType, type PathDirection } from "@/lib/memorization-paths"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor"] as const

// GET /api/admin/memorization-paths
//   ?include_stats=1 → also returns enrollment counts + completion rate per path
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const includeStats = searchParams.get("include_stats") === "1"

    let paths: any[] = []
    try {
      paths = (await query(
        `SELECT
           p.*,
           u.name AS created_by_name
         FROM memorization_paths p
         LEFT JOIN users u ON u.id = p.created_by
         ORDER BY p.is_published DESC, p.created_at DESC`,
      )) as any[]
    } catch (err: any) {
      // Table doesn't exist yet (migration not run)
      if (err?.code === "42P01") {
        return NextResponse.json({ paths: [], notice: "migration_not_applied" })
      }
      throw err
    }

    if (includeStats && paths.length > 0) {
      const ids = paths.map(p => p.id)
      const stats = (await query<{
        path_id: string
        enrolled: string
        active: string
        completed: string
        avg_progress: string
      }>(
        `SELECT
           e.path_id,
           COUNT(*)::text AS enrolled,
           COUNT(*) FILTER (WHERE e.status = 'active')::text AS active,
           COUNT(*) FILTER (WHERE e.status = 'completed')::text AS completed,
           ROUND(AVG(
             CASE WHEN p.total_units > 0
               THEN (e.units_completed::numeric / p.total_units::numeric) * 100
               ELSE 0
             END
           ), 1)::text AS avg_progress
         FROM memorization_path_enrollments e
         JOIN memorization_paths p ON p.id = e.path_id
         WHERE e.path_id = ANY($1::uuid[])
         GROUP BY e.path_id`,
        [ids],
      )) as any[]

      const byId: Record<string, any> = {}
      for (const s of stats) byId[s.path_id] = s
      paths = paths.map(p => ({
        ...p,
        stats: byId[p.id] || { enrolled: "0", active: "0", completed: "0", avg_progress: "0" },
      }))
    }

    return NextResponse.json({ paths })
  } catch (err) {
    console.error("[admin paths GET]", err)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// POST /api/admin/memorization-paths
// Body: {
//   title, description?,
//   unit_type: 'juz'|'surah'|'hizb'|'page'|'custom',
//   range_from?, range_to?, direction?: 'asc'|'desc',
//   level?, thumbnail_url?, estimated_days?, require_audio?,
//   is_published?: boolean
// }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const body = await req.json()
    const title = (body.title || "").toString().trim()
    if (!title) {
      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })
    }

    const unitType = (body.unit_type || "surah").toString()
    if (!isValidUnitType(unitType)) {
      return NextResponse.json({ error: "نوع المسار غير صحيح" }, { status: 400 })
    }

    const direction: PathDirection = body.direction === "asc" ? "asc" : "desc"
    const rangeFrom = body.range_from != null ? parseInt(String(body.range_from), 10) : null
    const rangeTo = body.range_to != null ? parseInt(String(body.range_to), 10) : null

    // Generate units locally so we know total_units before insert.
    const units = unitType === "custom"
      ? []
      : generatePathUnits({
          type: unitType,
          rangeFrom,
          rangeTo,
          direction,
        })

    const totalUnits = units.length

    let pathRow: any
    try {
      const inserted = (await query<any>(
        `INSERT INTO memorization_paths (
            title, description, unit_type,
            range_from, range_to, direction,
            level, thumbnail_url, total_units, estimated_days,
            require_audio, is_published, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ) RETURNING *`,
        [
          title,
          body.description || null,
          unitType,
          rangeFrom,
          rangeTo,
          direction,
          body.level || "beginner",
          body.thumbnail_url || null,
          totalUnits,
          body.estimated_days || null,
          !!body.require_audio,
          !!body.is_published,
          session!.sub,
        ],
      )) as any[]
      pathRow = inserted[0]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      }
      throw err
    }

    // Bulk insert units
    if (units.length > 0) {
      const values: any[] = []
      const placeholders: string[] = []
      let i = 1
      for (const u of units) {
        placeholders.push(
          `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`,
        )
        values.push(
          pathRow.id,
          u.position,
          u.unit_type,
          u.juz_number,
          u.surah_number,
          u.hizb_number,
          u.page_from,
          u.page_to,
          u.ayah_from,
          u.ayah_to,
          u.surah_name,
          u.total_ayahs,
          u.title,
          u.description,
          u.estimated_minutes,
        )
      }
      await query(
        `INSERT INTO memorization_path_units (
            path_id, position, unit_type,
            juz_number, surah_number, hizb_number,
            page_from, page_to, ayah_from, ayah_to,
            surah_name, total_ayahs, title, description, estimated_minutes
          ) VALUES ${placeholders.join(", ")}`,
        values,
      )
    }

    return NextResponse.json({ path: pathRow, total_units: totalUnits }, { status: 201 })
  } catch (err: any) {
    console.error("[admin paths POST]", err)
    return NextResponse.json(
      { error: err?.message || "حدث خطأ في الخادم" },
      { status: 500 },
    )
  }
}
