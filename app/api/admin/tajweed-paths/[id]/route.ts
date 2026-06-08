import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "teacher", "academy_admin"] as const

type DbRecord = Record<string, unknown>
type PathSource = {
  kind: "tajweed" | "learning"
  table: "tajweed_paths" | "learning_paths"
  columns: Set<string>
}

async function getTableColumns(tableName: string) {
  const rows = await query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  )
  return new Set(rows.map(row => row.column_name))
}

async function tableExists(tableName: string) {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  )
  return rows[0]?.exists === true
}

function fromDbSubject(value: unknown) {
  return value === "tafseer" ? "tafsir" : value
}

function toLearningDbSubject(value: unknown) {
  return value === "tafsir" ? "tafseer" : value
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

async function rowExists(source: PathSource, id: string) {
  const rows = await query<{ id: string }>(`SELECT id FROM ${source.table} WHERE id = $1 LIMIT 1`, [id])
  return rows.length > 0
}

async function resolveSourceForPath(id: string): Promise<PathSource | null> {
  const tajweedColumns = await getTableColumns("tajweed_paths")
  if (tajweedColumns.has("id") && await rowExists({ kind: "tajweed", table: "tajweed_paths", columns: tajweedColumns }, id)) {
    return { kind: "tajweed", table: "tajweed_paths", columns: tajweedColumns }
  }
  return null
}

function normalizeLearningPath(path: DbRecord) {
  return {
    ...path,
    subject: fromDbSubject(path.subject),
    total_stages: numericValue(path.total_stages) ?? numericValue(path.total_courses) ?? 0,
    estimated_days: numericValue(path.estimated_days) ?? numericValue(path.estimated_hours),
    require_audio: false,
    is_active: true,
    manager_id: null,
  }
}

function selectLearningPathColumns(source: PathSource) {
  return [
    "p.*",
    source.columns.has("subject")
      ? "CASE WHEN p.subject = 'tafseer' THEN 'tafsir' ELSE p.subject END AS subject"
      : "'fiqh'::text AS subject",
    source.columns.has("total_courses") ? "p.total_courses AS total_stages" : "0::int AS total_stages",
    source.columns.has("estimated_hours") ? "p.estimated_hours AS estimated_days" : "NULL::int AS estimated_days",
    "FALSE::boolean AS require_audio",
    "TRUE::boolean AS is_active",
    "NULL::uuid AS manager_id",
  ]
}

async function readPath(source: PathSource, id: string) {
  if (source.kind === "learning") {
    const rows = await query<DbRecord>(
      `SELECT ${selectLearningPathColumns(source).join(",\n              ")}
         FROM learning_paths p
        WHERE p.id = $1
        LIMIT 1`,
      [id],
    )
    return rows[0] ? normalizeLearningPath(rows[0]) : null
  }

  const rows = await query<DbRecord>(`SELECT * FROM tajweed_paths WHERE id = $1 LIMIT 1`, [id])
  return rows[0] || null
}

async function readStages(source: PathSource, id: string) {
  if (source.kind === "learning") return []
  const hasStages = await tableExists("tajweed_path_stages")
  if (!hasStages) return []
  return query<DbRecord>(`SELECT * FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`, [id])
}

async function readStats(source: PathSource, id: string) {
  if (source.kind === "learning") {
    const progressColumns = await getTableColumns("student_path_progress")
    if (!progressColumns.has("path_id")) return null

    try {
      const progressValue = progressColumns.has("progress_percentage") ? "progress_percentage" : "0"
      const completedCondition = progressColumns.has("completed_at")
        ? `completed_at IS NOT NULL OR ${progressValue} >= 100`
        : `${progressValue} >= 100`
      const activeCondition = progressColumns.has("completed_at")
        ? `completed_at IS NULL AND ${progressValue} < 100`
        : `${progressValue} < 100`
      const rows = await query<DbRecord>(
        `SELECT
           COUNT(*)::text AS enrolled,
           COUNT(*) FILTER (WHERE ${activeCondition})::text AS active,
           COUNT(*) FILTER (WHERE ${completedCondition})::text AS completed,
           ROUND(AVG(COALESCE(${progressValue}, 0)), 1)::text AS avg_progress
         FROM student_path_progress
         WHERE path_id = $1`,
        [id],
      )
      return rows[0] || null
    } catch (error) {
      console.error("[admin learning path stats]", error)
      return null
    }
  }

  const hasEnrollments = await tableExists("tajweed_path_enrollments")
  if (!hasEnrollments) return null
  const rows = await query<DbRecord>(
    `SELECT
       COUNT(*)::text AS enrolled,
       COUNT(*) FILTER (WHERE status = 'active')::text AS active,
       COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
       COUNT(*) FILTER (WHERE status = 'paused')::text AS paused,
       COUNT(*) FILTER (WHERE status = 'dropped')::text AS dropped,
       ROUND(AVG(stages_completed), 2)::text AS avg_completed_stages
     FROM tajweed_path_enrollments WHERE path_id = $1`,
    [id],
  )
  return rows[0] || null
}

function buildPatch(source: PathSource, body: DbRecord) {
  const allowed = ["title", "description", "level", "thumbnail_url", "is_published", "target_audience", "promo_video_url", "certification_type", "enrollment_type", "price"]
  const jsonbFields = ["what_you_will_learn", "prerequisites", "tags"]
  const sets: string[] = []
  const params: unknown[] = []

  for (const key of allowed) {
    if (key in body && source.columns.has(key)) {
      params.push(body[key])
      sets.push(`${key} = $${params.length}`)
    }
  }

  for (const key of jsonbFields) {
    if (key in body && source.columns.has(key)) {
      params.push(JSON.stringify(body[key] || []))
      sets.push(`${key} = $${params.length}::jsonb`)
    }
  }

  if ("subject" in body && source.columns.has("subject")) {
    params.push(source.kind === "learning" ? toLearningDbSubject(body.subject) : body.subject)
    sets.push(`subject = $${params.length}`)
  }

  if (source.kind === "tajweed") {
    for (const key of ["is_active", "require_audio", "manager_id", "certificate_enabled", "certificate_template_id"] as const) {
      if (key in body && source.columns.has(key)) {
        params.push(body[key])
        sets.push(`${key} = $${params.length}`)
      }
    }
    if ("estimated_days" in body && source.columns.has("estimated_days")) {
      params.push(numericValue(body.estimated_days))
      sets.push(`estimated_days = $${params.length}`)
    }
  } else if ("estimated_days" in body && source.columns.has("estimated_hours")) {
    params.push(numericValue(body.estimated_days) || 0)
    sets.push(`estimated_hours = $${params.length}`)
  }

  if (source.columns.has("updated_at")) sets.push("updated_at = NOW()")

  return { sets, params }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const source = await resolveSourceForPath(id)
    if (!source) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const path = await readPath(source, id)
    if (!path) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const [stages, stats] = await Promise.all([readStages(source, id), readStats(source, id)])
    return NextResponse.json({ path, stages, stats })
  } catch (err) {
    console.error("[admin tajweed path GET]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const source = await resolveSourceForPath(id)
    if (!source) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const body = await req.json() as DbRecord
    const { sets, params } = buildPatch(source, body)
    if (sets.length === 0) return NextResponse.json({ error: "لا تعديلات" }, { status: 400 })

    params.push(id)
    const updated = await query<DbRecord>(
      `UPDATE ${source.table} SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params,
    )
    if (!updated[0]) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    const path = source.kind === "learning" ? normalizeLearningPath(updated[0]) : updated[0]
    return NextResponse.json({ path })
  } catch (err) {
    console.error("[admin tajweed path PATCH]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    const { id } = await ctx.params
    const source = await resolveSourceForPath(id)
    if (!source) return NextResponse.json({ error: "غير موجود" }, { status: 404 })

    await query(`DELETE FROM ${source.table} WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin tajweed path DELETE]", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}
