import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { getStudentRestrictions } from "@/lib/academy/parent-controls"

// GET /api/student/memorization-paths
//   ?scope=all|enrolled (default: all)
//
// Returns: list of paths the student can browse + their enrollment row
// (if any).  When scope=enrolled, only returns paths the student has
// joined.
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get("scope") || "all"
    const restrictions = await getStudentRestrictions(session.sub, "memorization_path")
    const restrictionParams: unknown[] = []
    let restrictionWhere = ""
    if (restrictions.blockedIds.size > 0) {
      restrictionParams.push(Array.from(restrictions.blockedIds))
      restrictionWhere += ` AND NOT (p.id::text = ANY($${1 + restrictionParams.length}::text[]))`
    }
    if (restrictions.hasAllowList) {
      restrictionParams.push(Array.from(restrictions.allowedIds))
      restrictionWhere += ` AND p.id::text = ANY($${1 + restrictionParams.length}::text[])`
    }

    let rows: any[]
    try {
      if (scope === "enrolled") {
        rows = (await query(
          `SELECT
             p.*,
             e.id          AS enrollment_id,
             e.status      AS enrollment_status,
             e.units_completed,
             e.current_unit_id,
             e.started_at  AS enrollment_started_at,
             e.last_activity_at,
             e.completed_at AS enrollment_completed_at
           FROM memorization_paths p
           INNER JOIN memorization_path_enrollments e
             ON e.path_id = p.id AND e.student_id = $1
           WHERE p.is_active = TRUE
             ${restrictionWhere}
           ORDER BY e.last_activity_at DESC`,
          [session.sub, ...restrictionParams],
        )) as any[]
      } else {
        rows = (await query(
          `SELECT
             p.*,
             e.id          AS enrollment_id,
             e.status      AS enrollment_status,
             e.units_completed,
             e.current_unit_id,
             e.started_at  AS enrollment_started_at,
             e.last_activity_at,
             e.completed_at AS enrollment_completed_at
           FROM memorization_paths p
           LEFT JOIN memorization_path_enrollments e
             ON e.path_id = p.id AND e.student_id = $1
           WHERE p.is_active = TRUE AND p.is_published = TRUE
             ${restrictionWhere}
           ORDER BY (e.id IS NOT NULL) DESC, p.created_at DESC`,
          [session.sub, ...restrictionParams],
        )) as any[]
      }
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ paths: [], notice: "migration_not_applied" })
      }
      throw err
    }

    return NextResponse.json({ paths: rows })
  } catch (err) {
    console.error("[student paths GET]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
