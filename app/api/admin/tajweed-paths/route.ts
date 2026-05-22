import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { seedDefaultStages, SUBJECTS, type Subject } from "@/lib/tajweed-paths"

const ADMIN_ROLES = ["admin", "student_supervisor", "reciter_supervisor", "teacher", "academy_admin"] as const
const ACADEMY_SUBJECTS: Subject[] = ["fiqh", "aqeedah", "seerah", "tafsir"]
const LEARNING_PATH_SUBJECTS = ["fiqh", "aqeedah", "seerah", "tafsir", "tafseer"]

type DbRecord = Record<string, unknown>
type PathStats = { enrolled: string; active: string; completed: string; avg_progress: string }
type LearningPathRow = DbRecord & { id: string; stats?: PathStats }
type PathSource = {
  kind: "tajweed" | "learning"
  table: "tajweed_paths" | "learning_paths"
  columns: Set<string>
}

function isSubject(value: unknown): value is Subject {
  return typeof value === "string" && SUBJECTS.includes(value as Subject)
}

function selectedSubject(value: unknown, fallback: Subject) {
  return isSubject(value) ? value : fallback
}

function toDbSubject(subject: Subject, source: PathSource) {
  return source.kind === "learning" && subject === "tafsir" ? "tafseer" : subject
}

function fromDbSubject(value: unknown): Subject {
  if (value === "tafseer") return "tafsir"
  return isSubject(value) ? value : "fiqh"
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
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

async function resolvePathSource(scope: string): Promise<PathSource | null> {
  const tajweedColumns = await getTableColumns("tajweed_paths")
  if (tajweedColumns.has("id") && tajweedColumns.has("title")) {
    if (scope !== "academy" || tajweedColumns.has("subject")) {
      return { kind: "tajweed", table: "tajweed_paths", columns: tajweedColumns }
    }
  }

  if (scope === "academy") {
    const learningColumns = await getTableColumns("learning_paths")
    if (learningColumns.has("id") && learningColumns.has("title")) {
      return { kind: "learning", table: "learning_paths", columns: learningColumns }
    }
  }

  return null
}

/**
 * For the academy admin manager we want a *unified* view that includes
 * both the newer tajweed_paths-style rows AND any legacy rows that may
 * still live in the older learning_paths table. Returns every source
 * that is queryable so the caller can merge results.
 */
async function resolveAcademyPathSources(): Promise<PathSource[]> {
  const sources: PathSource[] = []

  const tajweedColumns = await getTableColumns("tajweed_paths")
  if (tajweedColumns.has("id") && tajweedColumns.has("title") && tajweedColumns.has("subject")) {
    sources.push({ kind: "tajweed", table: "tajweed_paths", columns: tajweedColumns })
  }

  const learningColumns = await getTableColumns("learning_paths")
  if (learningColumns.has("id") && learningColumns.has("title")) {
    sources.push({ kind: "learning", table: "learning_paths", columns: learningColumns })
  }

  return sources
}

function selectColumn(source: PathSource, column: string, fallback: string, alias = column) {
  return source.columns.has(column) ? `p.${column}` : `${fallback} AS ${alias}`
}

function sourceSubjectList(source: PathSource) {
  return source.kind === "learning" ? LEARNING_PATH_SUBJECTS : ACADEMY_SUBJECTS
}

function defaultStats(): PathStats {
  return { enrolled: "0", active: "0", completed: "0", avg_progress: "0" }
}

function buildPathWhere(source: PathSource, subjectFilter: string | null, scope: string) {
  const where: string[] = []
  const params: unknown[] = []

  if (source.columns.has("is_active")) where.push("p.is_active = TRUE")

  if (source.columns.has("subject")) {
    if (subjectFilter && (isSubject(subjectFilter) || subjectFilter === "tafseer")) {
      params.push(subjectFilter === "tafsir" && source.kind === "learning" ? "tafseer" : subjectFilter)
      where.push(`p.subject = $${params.length}`)
    }

    if (scope === "tajweed") {
      params.push(["tajweed"])
      where.push(`p.subject = ANY($${params.length}::text[])`)
    }

    if (scope === "academy") {
      params.push(sourceSubjectList(source))
      where.push(`p.subject = ANY($${params.length}::text[])`)
    }
  }

  return {
    clause: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  }
}

function normalizePathRow(row: LearningPathRow, source: PathSource): LearningPathRow {
  if (source.kind === "tajweed") {
    return { ...row, subject: fromDbSubject(row.subject), kind: "tajweed" }
  }

  return {
    ...row,
    subject: fromDbSubject(row.subject),
    total_stages: typeof row.total_courses === "number" ? row.total_courses : 0,
    estimated_days: typeof row.estimated_hours === "number" ? row.estimated_hours : null,
    require_audio: false,
    is_active: true,
    manager_id: null,
    manager_name: null,
    manager_email: null,
    kind: "learning",
  }
}

function selectColumnsForSource(source: PathSource, usersAvailable: boolean) {
  if (source.kind === "learning") {
    return [
      "p.id",
      selectColumn(source, "title", "''::text"),
      selectColumn(source, "description", "NULL::text"),
      selectColumn(source, "level", "'beginner'::text"),
      selectColumn(source, "thumbnail_url", "NULL::text"),
      source.columns.has("total_courses") ? "p.total_courses AS total_stages" : "0::int AS total_stages",
      source.columns.has("estimated_hours") ? "p.estimated_hours AS estimated_days" : "NULL::int AS estimated_days",
      "FALSE::boolean AS require_audio",
      selectColumn(source, "is_published", "FALSE::boolean"),
      "TRUE::boolean AS is_active",
      source.columns.has("subject")
        ? "CASE WHEN p.subject = 'tafseer' THEN 'tafsir' ELSE p.subject END AS subject"
        : "'fiqh'::text AS subject",
      "NULL::uuid AS manager_id",
      selectColumn(source, "created_at", "NULL::timestamptz"),
      usersAvailable && source.columns.has("created_by") ? "u.name AS created_by_name" : "NULL::text AS created_by_name",
      "NULL::text AS manager_name",
      "NULL::text AS manager_email",
    ]
  }

  return [
    "p.id",
    selectColumn(source, "title", "''::text"),
    selectColumn(source, "description", "NULL::text"),
    selectColumn(source, "level", "'beginner'::text"),
    selectColumn(source, "thumbnail_url", "NULL::text"),
    selectColumn(source, "total_stages", "0::int"),
    selectColumn(source, "estimated_days", "NULL::int"),
    selectColumn(source, "require_audio", "FALSE::boolean"),
    selectColumn(source, "is_published", "FALSE::boolean"),
    selectColumn(source, "is_active", "TRUE::boolean"),
    selectColumn(source, "subject", "'tajweed'::text"),
    selectColumn(source, "manager_id", "NULL::uuid"),
    selectColumn(source, "created_at", "NULL::timestamptz"),
    usersAvailable && source.columns.has("created_by") ? "u.name AS created_by_name" : "NULL::text AS created_by_name",
    usersAvailable && source.columns.has("manager_id") ? "m.name AS manager_name" : "NULL::text AS manager_name",
    usersAvailable && source.columns.has("manager_id") ? "m.email AS manager_email" : "NULL::text AS manager_email",
  ]
}

async function readFromSource(
  source: PathSource,
  subjectFilter: string | null,
  scope: string,
  usersAvailable: boolean,
) {
  const joins: string[] = []
  if (usersAvailable && source.columns.has("created_by")) {
    joins.push("LEFT JOIN users u ON u.id = p.created_by")
  }
  if (source.kind === "tajweed" && usersAvailable && source.columns.has("manager_id")) {
    joins.push("LEFT JOIN users m ON m.id = p.manager_id")
  }

  const selectColumns = selectColumnsForSource(source, usersAvailable)
  const { clause, params } = buildPathWhere(source, subjectFilter, scope)
  const order = [
    source.columns.has("is_published") ? "p.is_published DESC" : null,
    source.columns.has("created_at") ? "p.created_at DESC" : null,
    source.columns.has("title") ? "p.title ASC" : null,
  ].filter(Boolean).join(", ")

  const rows = await query<LearningPathRow>(
    `SELECT ${selectColumns.join(",\n              ")}
       FROM ${source.table} p
       ${joins.join("\n       ")}
       ${clause}
      ${order ? `ORDER BY ${order}` : ""}`,
    params,
  )
  return rows.map(row => normalizePathRow(row, source))
}

async function readLearningPaths(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeStats = searchParams.get("include_stats") === "1"
  const subjectFilter = searchParams.get("subject") || null
  const scope = (searchParams.get("scope") || "").toLowerCase()

  const usersAvailable = await tableExists("users")

  // For the academy admin manager we merge both tables so legacy rows are
  // visible alongside the newer stage-based paths.
  if (scope === "academy") {
    const sources = await resolveAcademyPathSources()
    if (sources.length === 0) {
      return { paths: [], warning: "learning_paths_unavailable" }
    }

    const tajweedSource = sources.find(s => s.kind === "tajweed")
    if (!tajweedSource && sources[0] && !sources[0].columns.has("subject")) {
      return { paths: [], warning: "learning_paths_subject_unavailable" }
    }

    let merged: LearningPathRow[] = []
    for (const source of sources) {
      try {
        const rows = await readFromSource(source, subjectFilter, scope, usersAvailable)
        merged = merged.concat(rows)
      } catch (error) {
        console.error(`[admin tajweed paths] failed to read from ${source.table}`, error)
      }
    }

    if (includeStats) {
      const bySource = new Map<PathSource, LearningPathRow[]>()
      for (const source of sources) bySource.set(source, [])
      for (const path of merged) {
        const source = sources.find(s => s.kind === (path.kind === "learning" ? "learning" : "tajweed"))
        if (source) bySource.get(source)?.push(path)
      }
      const enriched: LearningPathRow[] = []
      for (const [source, list] of bySource) {
        enriched.push(...(await withStats(list, source)))
      }
      merged = enriched
    }

    merged.sort((a, b) => {
      const pa = a.is_published === true ? 0 : 1
      const pb = b.is_published === true ? 0 : 1
      if (pa !== pb) return pa - pb
      const ca = (a.created_at as string | null) || ""
      const cb = (b.created_at as string | null) || ""
      return cb.localeCompare(ca)
    })

    return { paths: merged }
  }

  const source = await resolvePathSource(scope)
  if (!source) return { paths: [], warning: "learning_paths_unavailable" }

  let paths = await readFromSource(source, subjectFilter, scope, usersAvailable)

  if (includeStats) {
    paths = await withStats(paths, source)
  }

  return { paths }
}

async function withStats(paths: LearningPathRow[], source: PathSource) {
  if (paths.length === 0) return paths

  if (source.kind === "learning") {
    const hasProgress = await tableExists("student_path_progress")
    if (!hasProgress) return paths.map(path => ({ ...path, stats: defaultStats() }))

    try {
      const ids = paths.map(path => path.id)
      const stats = await query<{ path_id: string } & PathStats>(
        `SELECT
           path_id,
           COUNT(*)::text AS enrolled,
           COUNT(*) FILTER (WHERE completed_at IS NULL)::text AS active,
           COUNT(*) FILTER (WHERE completed_at IS NOT NULL OR progress_percentage >= 100)::text AS completed,
           ROUND(AVG(COALESCE(progress_percentage, 0)), 1)::text AS avg_progress
         FROM student_path_progress
         WHERE path_id = ANY($1::uuid[])
         GROUP BY path_id`,
        [ids],
      )
      const byId = new Map(stats.map(row => [row.path_id, row]))
      return paths.map(path => ({ ...path, stats: byId.get(path.id) || defaultStats() }))
    } catch (error) {
      console.error("[admin learning paths stats]", error)
      return paths.map(path => ({ ...path, stats: defaultStats() }))
    }
  }

  const hasEnrollments = await tableExists("tajweed_path_enrollments")
  if (!hasEnrollments) return paths.map(path => ({ ...path, stats: defaultStats() }))

  try {
    const ids = paths.map(path => path.id)
    const stats = await query<{ path_id: string } & PathStats>(
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
    )
    const byId = new Map(stats.map(row => [row.path_id, row]))
    return paths.map(path => ({ ...path, stats: byId.get(path.id) || defaultStats() }))
  } catch (error) {
    console.error("[admin tajweed paths stats]", error)
    return paths.map(path => ({ ...path, stats: defaultStats() }))
  }
}

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    return NextResponse.json(await readLearningPaths(req))
  } catch (err) {
    console.error("[admin tajweed paths GET]", err)
    return NextResponse.json({ paths: [], warning: "learning_paths_load_failed" })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, [...ADMIN_ROLES])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const body = await req.json() as DbRecord
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 })

    const source = await resolvePathSource("academy")
    if (!source || !source.columns.has("title")) {
      return NextResponse.json({ error: "جدول مسارات التعلم غير جاهز" }, { status: 409 })
    }
    if (!source.columns.has("subject")) {
      return NextResponse.json({ error: "حقل التخصص غير متاح في جدول مسارات التعلم" }, { status: 409 })
    }

    const subjectCandidate = selectedSubject(body.subject, "fiqh")
    const subject = ACADEMY_SUBJECTS.includes(subjectCandidate) ? subjectCandidate : "fiqh"
    const seed = body.seed_default_stages !== false
    const estimated = numericValue(body.estimated_days)

    const insertColumns = ["title"]
    const values: unknown[] = [title]
    if (source.columns.has("description")) {
      insertColumns.push("description")
      values.push(typeof body.description === "string" && body.description.trim() ? body.description.trim() : null)
    }
    if (source.columns.has("level")) {
      insertColumns.push("level")
      values.push(typeof body.level === "string" ? body.level : "beginner")
    }
    if (source.columns.has("thumbnail_url")) {
      insertColumns.push("thumbnail_url")
      values.push(typeof body.thumbnail_url === "string" ? body.thumbnail_url : null)
    }
    if (source.kind === "tajweed" && source.columns.has("total_stages")) {
      insertColumns.push("total_stages")
      values.push(0)
    }
    if (source.kind === "learning" && source.columns.has("total_courses")) {
      insertColumns.push("total_courses")
      values.push(0)
    }
    if (source.kind === "tajweed" && source.columns.has("estimated_days")) {
      insertColumns.push("estimated_days")
      values.push(estimated)
    }
    if (source.kind === "learning" && source.columns.has("estimated_hours")) {
      insertColumns.push("estimated_hours")
      values.push(estimated || 0)
    }
    if (source.kind === "tajweed" && source.columns.has("require_audio")) {
      insertColumns.push("require_audio")
      values.push(body.require_audio === true)
    }
    if (source.columns.has("is_published")) {
      insertColumns.push("is_published")
      values.push(body.is_published === true)
    }
    if (source.columns.has("created_by")) {
      insertColumns.push("created_by")
      values.push(session!.sub)
    }
    insertColumns.push("subject")
    values.push(toDbSubject(subject, source))
    if (source.kind === "tajweed" && source.columns.has("manager_id")) {
      insertColumns.push("manager_id")
      values.push(typeof body.manager_id === "string" && body.manager_id ? body.manager_id : null)
    }

    const placeholders = values.map((_, index) => `$${index + 1}`)
    const inserted = await query<LearningPathRow>(
      `INSERT INTO ${source.table} (${insertColumns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *`,
      values,
    )
    const pathRow = normalizePathRow(inserted[0], source)
    let totalStages = 0

    if (source.kind === "tajweed" && seed && pathRow?.id) {
      try {
        totalStages = await seedDefaultStages(pathRow.id, subject)
        if (source.columns.has("total_stages")) {
          await query(`UPDATE tajweed_paths SET total_stages = $1 WHERE id = $2`, [totalStages, pathRow.id])
          pathRow.total_stages = totalStages
        }
      } catch (seedError) {
        console.error("[admin tajweed paths seed]", seedError)
      }
    }

    return NextResponse.json({ path: pathRow, total_stages: totalStages }, { status: 201 })
  } catch (err) {
    console.error("[admin tajweed paths POST]", err)
    return NextResponse.json({ error: "حدث خطأ في حفظ المسار" }, { status: 500 })
  }
}
