import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

/**
 * GET / POST  /api/cron/academy-reminders
 *
 * Idempotent reminder job for the academy.  Generates four kinds of
 * notifications:
 *
 *   1. session_60min   – live session starts in ≈60 minutes
 *   2. session_10min   – live session starts in ≈10 minutes
 *   3. task_morning    – tasks due today (morning summary, runs once per
 *                        student per day)
 *   4. task_overdue    – tasks past their deadline with no submission
 *                        (runs once per task per student)
 *   5. streak_break_warning – students active yesterday but not today near
 *                        the end of day
 *
 * Authorization: pass `?secret=$CRON_SECRET` or send the
 * `x-cron-secret: $CRON_SECRET` header.  Designed to be called every
 * 5–15 minutes by Vercel Cron / GitHub Actions / etc.  All inserts use
 * a per-user dedup_key so re-running the cron is safe.
 */

interface SessionRow {
  id: string
  course_id: string
  course_title: string
  title: string
  scheduled_at: string
  student_id: string
}

interface TaskRow {
  id: string
  title: string
  due_date: string
  course_id: string
  course_title: string
  student_id: string
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return true // No secret configured → allow (dev / preview)
  const fromHeader =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const fromQuery = new URL(req.url).searchParams.get("secret")
  return fromHeader === expected || fromQuery === expected
}

async function logRun(
  kind: string,
  notificationsCreated: number,
  errors: number,
  meta: Record<string, unknown> = {},
) {
  try {
    await query(
      `INSERT INTO reminder_runs (kind, notifications_created, errors, meta)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [kind, notificationsCreated, errors, JSON.stringify(meta)],
    )
  } catch (err) {
    // reminder_runs may not exist yet (migration not run) — ignore
    console.warn("[cron academy-reminders] could not log run:", (err as any)?.message)
  }
}

/* ============================================================
 *  1.  Pre-session reminders (60 min + 10 min)
 * ============================================================ */
async function runSessionReminders(window: "60" | "10"): Promise<{ created: number; errors: number }> {
  const minutes = window === "60" ? 60 : 10
  // Look for sessions starting in the [minutes-15min, minutes+5min] window so
  // we still hit them even if the cron doesn't fire exactly on time.
  const lower = minutes === 60 ? 50 : 5
  const upper = minutes === 60 ? 75 : 15

  const rows = await query<SessionRow>(
    `SELECT
       cs.id,
       cs.course_id,
       c.title           AS course_title,
       cs.title,
       cs.scheduled_at,
       e.student_id
     FROM course_sessions cs
     JOIN courses c       ON c.id = cs.course_id
     JOIN enrollments e   ON e.course_id = cs.course_id
                          AND e.status IN ('active','enrolled','completed')
     WHERE cs.status IS DISTINCT FROM 'cancelled'
       AND cs.scheduled_at >= NOW() + ($1 || ' minutes')::interval
       AND cs.scheduled_at <  NOW() + ($2 || ' minutes')::interval`,
    [lower.toString(), upper.toString()],
  )

  let created = 0
  let errors = 0
  for (const row of rows) {
    try {
      const when = new Date(row.scheduled_at).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const title = window === "60"
        ? "تبدأ جلستك خلال ساعة"
        : "تبدأ جلستك خلال ١٠ دقائق"
      const message = window === "60"
        ? `جلسة "${row.title}" في دورة "${row.course_title}" تبدأ الساعة ${when}.`
        : `استعد! جلسة "${row.title}" تبدأ بعد ١٠ دقائق.`

      await createNotification({
        userId: row.student_id,
        type: window === "60" ? "session_60min" : "session_10min",
        title,
        message,
        category: "session",
        link: `/academy/student/sessions/${row.id}`,
        dedupKey: `session:${window}:${row.id}:${row.student_id}`,
      })
      created++
    } catch (err) {
      console.error("[cron] session reminder failed:", err)
      errors++
    }
  }
  await logRun(`session_${window}`, created, errors, { rows: rows.length })
  return { created, errors }
}

/* ============================================================
 *  2.  Daily morning task reminder
 * ============================================================ */
async function runMorningTaskReminder(): Promise<{ created: number; errors: number }> {
  // For every student, find tasks due TODAY (in the user's local timezone we
  // approximate as UTC since we don't store per-user TZ) that they haven't
  // submitted yet.  One notification per student summarizing the count.
  const rows = await query<{
    student_id: string
    pending_count: number
    sample_titles: string[]
  }>(
    `WITH due_today AS (
       SELECT t.id, t.title, t.assigned_to, t.course_id
         FROM tasks t
        WHERE t.due_date::date = CURRENT_DATE
          AND COALESCE(t.status, 'published') IS DISTINCT FROM 'draft'
     ),
     candidates AS (
       SELECT dt.id, dt.title, e.student_id
         FROM due_today dt
         JOIN enrollments e
           ON e.course_id = dt.course_id
          AND e.status IN ('active','enrolled')
        WHERE dt.assigned_to IS NULL
       UNION
       SELECT dt.id, dt.title, dt.assigned_to AS student_id
         FROM due_today dt
        WHERE dt.assigned_to IS NOT NULL
     ),
     not_submitted AS (
       SELECT c.student_id, c.id, c.title
         FROM candidates c
        WHERE NOT EXISTS (
          SELECT 1 FROM task_submissions s
           WHERE s.task_id = c.id
             AND s.student_id = c.student_id
             AND s.status IN ('submitted','graded')
        )
     )
     SELECT
       student_id,
       COUNT(*)::int                                 AS pending_count,
       COALESCE(ARRAY_AGG(title ORDER BY title), '{}') AS sample_titles
     FROM not_submitted
     GROUP BY student_id`,
  )

  const today = new Date().toISOString().split("T")[0]
  let created = 0
  let errors = 0
  for (const row of rows) {
    try {
      const sample = (row.sample_titles || []).slice(0, 2).join("، ")
      const title = "مهامك اليوم"
      const more = row.pending_count > 2 ? ` و${row.pending_count - 2} أخرى` : ""
      const message =
        row.pending_count === 1
          ? `لديك مهمة واحدة مستحقة اليوم: ${sample}.`
          : `لديك ${row.pending_count} مهام مستحقة اليوم — ${sample}${more}.`

      await createNotification({
        userId: row.student_id,
        type: "task_morning",
        title,
        message,
        category: "task",
        link: `/academy/student/tasks`,
        dedupKey: `task:morning:${row.student_id}:${today}`,
      })
      created++
    } catch (err) {
      console.error("[cron] morning reminder failed:", err)
      errors++
    }
  }
  await logRun("task_morning", created, errors, { rows: rows.length })
  return { created, errors }
}

/* ============================================================
 *  3.  Overdue task alerts
 * ============================================================ */
async function runOverdueTaskAlerts(): Promise<{ created: number; errors: number }> {
  // Tasks whose due_date has passed within the last 24h, and the student
  // still hasn't submitted.  We fire ONE alert per (task, student) using a
  // permanent dedup key so it never repeats.
  const rows = await query<TaskRow>(
    `WITH overdue AS (
       SELECT t.id, t.title, t.due_date, t.course_id, t.assigned_to
         FROM tasks t
        WHERE t.due_date < NOW()
          AND t.due_date > NOW() - INTERVAL '7 days'
          AND COALESCE(t.status, 'published') IS DISTINCT FROM 'draft'
     ),
     candidates AS (
       SELECT o.id, o.title, o.due_date, o.course_id, e.student_id
         FROM overdue o
         JOIN enrollments e
           ON e.course_id = o.course_id
          AND e.status IN ('active','enrolled')
        WHERE o.assigned_to IS NULL
       UNION
       SELECT o.id, o.title, o.due_date, o.course_id, o.assigned_to AS student_id
         FROM overdue o
        WHERE o.assigned_to IS NOT NULL
     )
     SELECT c.id, c.title, c.due_date, c.course_id,
            co.title AS course_title, c.student_id
       FROM candidates c
       LEFT JOIN courses co ON co.id = c.course_id
      WHERE NOT EXISTS (
        SELECT 1 FROM task_submissions s
         WHERE s.task_id = c.id
           AND s.student_id = c.student_id
           AND s.status IN ('submitted','graded')
      )`,
  )

  let created = 0
  let errors = 0
  for (const row of rows) {
    try {
      await createNotification({
        userId: row.student_id,
        type: "task_overdue",
        title: "مهمة متأخرة",
        message: `المهمة "${row.title}" تجاوزت موعد التسليم. سلمها الآن قبل خصم الدرجات.`,
        category: "task",
        link: `/academy/student/tasks/${row.id}`,
        dedupKey: `task:overdue:${row.id}:${row.student_id}`,
      })
      created++
    } catch (err) {
      console.error("[cron] overdue alert failed:", err)
      errors++
    }
  }
  await logRun("task_overdue", created, errors, { rows: rows.length })
  return { created, errors }
}

/* ============================================================
 *  4.  Streak break warnings
 * ============================================================ */
async function runStreakBreakWarnings(): Promise<{ created: number; errors: number }> {
  const rows = await query<{ student_id: string; streak_days: number }>(
    `SELECT up.user_id AS student_id, up.streak_days
       FROM user_points up
       JOIN users u ON u.id = up.user_id
      WHERE u.role IN ('student', 'academy_student', 'dual_student')
        AND up.streak_days > 0
        AND up.last_activity_date = CURRENT_DATE - INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1 FROM points_log pl
           WHERE pl.user_id = up.user_id
             AND pl.created_at::date = CURRENT_DATE
        )`
  )

  const today = new Date().toISOString().split("T")[0]
  let created = 0
  let errors = 0
  for (const row of rows) {
    try {
      await createNotification({
        userId: row.student_id,
        type: "general",
        title: "لا تكسر الـ Streak اليوم",
        message: `لديك ${row.streak_days} يوم متواصل. سجّل تلاوة أو أنجز نشاطاً قبل نهاية اليوم للحفاظ عليه.`,
        category: "reminder",
        link: "/student/record",
        dedupKey: `streak:break:${row.student_id}:${today}`,
      })
      created++
    } catch (err) {
      console.error("[cron] streak warning failed:", err)
      errors++
    }
  }
  await logRun("streak_break_warning", created, errors, { rows: rows.length })
  return { created, errors }
}

/* ============================================================
 *  Entry points
 * ============================================================ */
export async function GET(req: NextRequest) {
  return runAll(req)
}

export async function POST(req: NextRequest) {
  return runAll(req)
}

async function runAll(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const onlyKind = searchParams.get("kind") // optional filter: session_60 | session_10 | task_morning | task_overdue | streak_break_warning

  const results: Record<string, { created: number; errors: number }> = {}
  try {
    if (!onlyKind || onlyKind === "session_60") {
      results.session_60 = await runSessionReminders("60")
    }
    if (!onlyKind || onlyKind === "session_10") {
      results.session_10 = await runSessionReminders("10")
    }
    if (!onlyKind || onlyKind === "task_morning") {
      results.task_morning = await runMorningTaskReminder()
    }
    if (!onlyKind || onlyKind === "task_overdue") {
      results.task_overdue = await runOverdueTaskAlerts()
    }
    if (!onlyKind || onlyKind === "streak_break_warning") {
      results.streak_break_warning = await runStreakBreakWarnings()
    }
    return NextResponse.json({ success: true, results, ranAt: new Date().toISOString() })
  } catch (err: any) {
    console.error("[cron academy-reminders] fatal:", err)
    return NextResponse.json(
      { success: false, error: err?.message || "Server error", results },
      { status: 500 },
    )
  }
}
