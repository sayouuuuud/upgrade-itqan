const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres' 
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

// Mimic functions from route.ts
const ACADEMY_SUBJECTS = ["fiqh", "aqeedah", "seerah", "tafsir"];
const LEARNING_PATH_SUBJECTS = ["fiqh", "aqeedah", "seerah", "tafsir", "tafseer"];

async function getTableColumns(tableName) {
  const rows = await query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  )
  return new Set(rows.map(row => row.column_name))
}

async function tableExists(tableName) {
  const rows = await query(
    `SELECT EXISTS (
       SELECT 1
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  )
  return rows[0]?.exists === true
}

async function resolveAcademyPathSources() {
  const sources = []
  const tajweedColumns = await getTableColumns("tajweed_paths")
  if (tajweedColumns.has("id") && tajweedColumns.has("title") && tajweedColumns.has("subject")) {
    sources.push({ kind: "tajweed", table: "tajweed_paths", columns: tajweedColumns })
  }
  return sources
}

function selectColumn(source, column, fallback, alias = column) {
  return source.columns.has(column) ? `p.${column}` : `${fallback} AS ${alias}`
}

function selectColumnsForSource(source, usersAvailable) {
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

function sourceSubjectList(source) {
  return source.kind === "learning" ? LEARNING_PATH_SUBJECTS : ACADEMY_SUBJECTS
}

function buildPathWhere(source, subjectFilter, scope) {
  const where = []
  const params = []

  if (source.columns.has("is_active")) where.push("p.is_active = TRUE")

  if (source.columns.has("subject")) {
    if (subjectFilter && (subjectFilter === "tafsir" || subjectFilter === "fiqh" || subjectFilter === "aqeedah" || subjectFilter === "seerah" || subjectFilter === "tafseer")) {
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

function fromDbSubject(value) {
  if (value === "tafseer") return "tafsir"
  return value
}

function normalizePathRow(row, source) {
  if (source.kind === "tajweed") {
    return { ...row, subject: fromDbSubject(row.subject), kind: "tajweed" }
  }
  return row
}

async function readFromSource(source, subjectFilter, scope, usersAvailable) {
  const joins = []
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

  const queryText = `SELECT ${selectColumns.join(",\n              ")}
       FROM ${source.table} p
       ${joins.join("\n       ")}
       ${clause}
      ${order ? `ORDER BY ${order}` : ""}`
  
  console.log("Running query for source:", source.table)
  console.log("SQL:", queryText)
  console.log("Params:", params)
  const rows = await query(queryText, params)
  return rows.map(row => normalizePathRow(row, source))
}

async function test() {
  try {
    const scope = "academy"
    const subjectFilter = null
    const usersAvailable = await tableExists("users")
    console.log("usersAvailable:", usersAvailable)

    const sources = await resolveAcademyPathSources()
    console.log("sources count:", sources.length)

    let merged = []
    for (const source of sources) {
      const rows = await readFromSource(source, subjectFilter, scope, usersAvailable)
      merged = merged.concat(rows)
    }

    console.log("Merged Paths:", merged)
  } catch (err) {
    console.error(err)
  }
  pool.end()
}

test()
