import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { seedDefaultStages, SUBJECTS, type Subject } from "@/lib/tajweed-paths"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor"] as const

// GET /api/admin/tajweed-paths
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { searchParams } = new URL(req.url)
    const includeStats = searchParams.get("include_stats") === "1"
    const subjectFilter = searchParams.get("subject") || null
    // scope = "tajweed" -> only subject=tajweed (Maqra'ah)
    // scope = "academy" -> subjects in fiqh/aqeedah/seerah/tafsir
    const scope = (searchParams.get("scope") || "").toLowerCase()
    const academySubjects = ["fiqh", "aqeedah", "seerah", "tafsir"]
    const scopeSubjects =
      scope === "tajweed" ? ["tajweed"]
      : scope === "academy" ? academySubjects
      : null

    let paths: any[] = []
    try {
      paths = (await query(
        `SELECT p.*, u.name AS created_by_name, m.name AS manager_name, m.email AS manager_email
           FROM tajweed_paths p
           LEFT JOIN users u ON u.id = p.created_by
           LEFT JOIN users m ON m.id = p.manager_id
          WHERE ($1::text IS NULL OR p.subject = $1)
            AND ($2::text[] IS NULL OR p.subject = ANY($2::text[]))
          ORDER BY p.is_published DESC, p.created_at DESC`,
        [subjectFilter, scopeSubjects],
      )) as any[]
    } catch (err: any) {
      if (err?.code === "42P01") {
        return NextResponse.json({ paths: [], notice: "migration_not_applied" })
      }
      throw err
    }

    if (includeStats && paths.length > 0) {
      const ids = paths.map(p => p.id)
      const stats = (await query<any>(
        `SELECT
           e.path_id,
           COUNT(*)::text AS enrolled,
           COUNT(*) FILTER (WHERE e.status = 'active')::text AS active,
           COUNT(*) FILTER (WHERE e.status = 'completed')::text AS completed,
           ROUND(AVG(
             CASE WHEN p.total_stages > 0
               THEN (e.stages_completed::numeric / p.total_stages::numeric) * 100
               ELSE 0
             END
           ), 1)::text AS avg_progress
         FROM tajweed_path_enrollments e
         JOIN tajweed_paths p ON p.id = e.path_id
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
    console.error("[admin tajweed paths GET]", err)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// POST /api/admin/tajweed-paths
// Body: { title, description?, level?, estimated_days?, require_audio?, is_published?, seed_default_stages? }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const body = await req.json()
    const title = (body.title || "").toString().trim()
    if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })

    const seed = body.seed_default_stages !== false  // default TRUE
    const subject: Subject = SUBJECTS.includes(body.subject) ? body.subject : "tajweed"
    const managerId = body.manager_id || null

    let pathRow: any
    try {
      const inserted = (await query<any>(
        `INSERT INTO tajweed_paths (
            title, description, level, thumbnail_url, total_stages,
            estimated_days, require_audio, is_published, created_by,
            subject, manager_id
          ) VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          title,
          body.description || null,
          body.level || "beginner",
          body.thumbnail_url || null,
          body.estimated_days || null,
          !!body.require_audio,
          !!body.is_published,
          session!.sub,
          subject,
          managerId,
        ],
      )) as any[]
      pathRow = inserted[0]
    } catch (err: any) {
      if (err?.code === "42P01") return NextResponse.json({ error: "migration_not_applied" }, { status: 409 })
      throw err
    }

    let totalStages = 0
    if (seed) {
      totalStages = await seedDefaultStages(pathRow.id, subject)
      await query(`UPDATE tajweed_paths SET total_stages = $1 WHERE id = $2`, [totalStages, pathRow.id])
      pathRow.total_stages = totalStages
    }

    return NextResponse.json({ path: pathRow, total_stages: totalStages }, { status: 201 })
  } catch (err: any) {
    console.error("[admin tajweed paths POST]", err)
    return NextResponse.json({ error: err?.message || "حدث خطأ" }, { status: 500 })
  }
}
