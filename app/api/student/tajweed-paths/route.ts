import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { getStudentRestrictions } from "@/lib/academy/parent-controls"

// GET /api/student/tajweed-paths
//   ?scope=all (default) — list all published paths
//   ?scope=enrolled       — list paths the student is enrolled in
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["student"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { searchParams } = new URL(req.url)
    const scope = (searchParams.get("scope") || "all").toLowerCase()
    const subjectFilter = searchParams.get("subject") || null
    const subjectScope = (searchParams.get("subject_scope") || "").toLowerCase()
    const academySubjects = ["fiqh", "aqeedah", "seerah", "tafsir"]
    const scopeSubjects =
      subjectScope === "tajweed" ? ["tajweed"]
      : subjectScope === "academy" ? academySubjects
      : null
    const restrictions = await getStudentRestrictions(session!.sub, "tajweed_path")

    let paths: any[]
    try {
      const restrictionParams: unknown[] = []
      let restrictionWhere = ""
      if (restrictions.blockedIds.size > 0) {
        restrictionParams.push(Array.from(restrictions.blockedIds))
        restrictionWhere += ` AND NOT (p.id::text = ANY($${3 + restrictionParams.length}::text[]))`
      }
      if (restrictions.hasAllowList) {
        restrictionParams.push(Array.from(restrictions.allowedIds))
        restrictionWhere += ` AND p.id::text = ANY($${3 + restrictionParams.length}::text[])`
      }

      if (scope === "enrolled") {
        paths = (await query(
          `SELECT
             p.*, e.id AS enrollment_id, e.status AS enrollment_status,
             e.stages_completed, e.last_activity_at, e.completed_at, e.started_at
           FROM tajweed_path_enrollments e
           JOIN tajweed_paths p ON p.id = e.path_id
           WHERE e.student_id = $1
             AND ($2::text IS NULL OR p.subject = $2)
             AND ($3::text[] IS NULL OR p.subject = ANY($3::text[]))
             ${restrictionWhere}
           ORDER BY e.last_activity_at DESC`,
          [session!.sub, subjectFilter, scopeSubjects, ...restrictionParams],
        )) as any[]
      } else {
        paths = (await query(
          `SELECT
             p.*,
             e.id AS enrollment_id, e.status AS enrollment_status,
             e.stages_completed, e.last_activity_at, e.completed_at
           FROM tajweed_paths p
           LEFT JOIN tajweed_path_enrollments e
             ON e.path_id = p.id AND e.student_id = $1
           WHERE p.is_published = TRUE AND p.is_active = TRUE
             AND ($2::text IS NULL OR p.subject = $2)
             AND ($3::text[] IS NULL OR p.subject = ANY($3::text[]))
             ${restrictionWhere}
           ORDER BY p.created_at DESC`,
          [session!.sub, subjectFilter, scopeSubjects, ...restrictionParams],
        )) as any[]
      }
    } catch (err: any) {
      if (err?.code === "42P01") return NextResponse.json({ paths: [], notice: "migration_not_applied" })
      throw err
    }

    return NextResponse.json({ paths })
  } catch (err) {
    console.error("[student tajweed paths GET]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
