// Weekly report builder for parents
import { query, queryOne } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export interface WeeklyReportSummary {
  recitations_count: number
  sessions_attended: number
  sessions_upcoming: number
  badges_earned: number
  current_level: string | null
  recitations: Array<{
    surah_name: string
    surah_number: number
    status: string
    created_at: string
  }>
  sessions: Array<{
    title: string
    scheduled_at: string
    status: string
    counterpart_name: string | null
  }>
  badges: Array<{
    badge_name: string
    badge_description: string | null
    awarded_at: string
  }>
}

export interface WeekRange {
  start: Date
  end: Date
}

export function lastFullWeekRange(now: Date = new Date()): WeekRange {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setDate(now.getDate() - 7)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

export async function buildWeeklySummary(
  childId: string,
  range: WeekRange
): Promise<WeeklyReportSummary> {
  const [recitationRows, sessionsRows, badgesRows, memPath, tajPath] = await Promise.all([
    query<{
      surah_name: string
      surah_number: number
      status: string
      created_at: string
    }>(
      `SELECT surah_name, surah_number, status, created_at
       FROM recitations
       WHERE student_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at DESC`,
      [childId, range.start.toISOString(), range.end.toISOString()]
    ),
    query<{
      title: string
      scheduled_at: string
      status: string
      counterpart_name: string | null
      attended: boolean
      upcoming: boolean
    }>(
      `SELECT
         CONCAT('جلسة تسميع مع ', COALESCE(u.name, 'مقرئ')) AS title,
         b.scheduled_at,
         b.status,
         u.name AS counterpart_name,
         (b.student_joined_at IS NOT NULL OR b.status = 'completed') AS attended,
         (b.status = 'confirmed' AND b.scheduled_at > NOW()) AS upcoming
       FROM bookings b
       LEFT JOIN users u ON u.id = b.reader_id
       WHERE b.student_id = $1
         AND b.scheduled_at >= $2 AND b.scheduled_at <= $3
       ORDER BY b.scheduled_at DESC`,
      [childId, range.start.toISOString(), range.end.toISOString()]
    ),
    query<{
      badge_name: string
      badge_description: string | null
      awarded_at: string
    }>(
      `SELECT badge_name, badge_description, awarded_at
       FROM badges
       WHERE user_id = $1 AND awarded_at >= $2 AND awarded_at <= $3
       ORDER BY awarded_at DESC`,
      [childId, range.start.toISOString(), range.end.toISOString()]
    ),
    queryOne<{ title: string; units_completed: number; total_units: number }>(
      `SELECT mp.title, mpe.units_completed, mp.total_units
       FROM memorization_path_enrollments mpe
       JOIN memorization_paths mp ON mp.id = mpe.path_id
       WHERE mpe.student_id = $1 AND mpe.status = 'in_progress'
       ORDER BY mpe.last_activity_at DESC NULLS LAST
       LIMIT 1`,
      [childId]
    ),
    queryOne<{ title: string; stages_completed: number; total_stages: number }>(
      `SELECT tp.title, tpe.stages_completed, tp.total_stages
       FROM tajweed_path_enrollments tpe
       JOIN tajweed_paths tp ON tp.id = tpe.path_id
       WHERE tpe.student_id = $1 AND tpe.status = 'in_progress'
       ORDER BY tpe.last_activity_at DESC NULLS LAST
       LIMIT 1`,
      [childId]
    ),
  ])

  const sessions_attended = sessionsRows.filter((s) => s.attended).length
  const sessions_upcoming = sessionsRows.filter((s) => s.upcoming).length

  let level: string | null = null
  if (memPath) {
    level = `${memPath.title} (${memPath.units_completed}/${memPath.total_units} وحدة)`
  } else if (tajPath) {
    level = `${tajPath.title} (${tajPath.stages_completed}/${tajPath.total_stages} مرحلة)`
  }

  return {
    recitations_count: recitationRows.length,
    sessions_attended,
    sessions_upcoming,
    badges_earned: badgesRows.length,
    current_level: level,
    recitations: recitationRows,
    sessions: sessionsRows.map((s) => ({
      title: s.title,
      scheduled_at: s.scheduled_at,
      status: s.status,
      counterpart_name: s.counterpart_name,
    })),
    badges: badgesRows,
  }
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "قيد المراجعة",
    in_review: "قيد المراجعة",
    mastered: "متقن",
    needs_session: "بحاجة لجلسة",
    rejected: "مرفوض",
    completed: "مكتمل",
    confirmed: "مؤكد",
    cancelled: "ملغي",
  }
  return map[status] || status
}

export function renderWeeklyReportHtml(opts: {
  childName: string
  parentName: string
  range: WeekRange
  summary: WeeklyReportSummary
  reportUrl?: string
}): string {
  const { childName, parentName, range, summary, reportUrl } = opts
  const rangeStr = `${fmtDate(range.start.toISOString())} - ${fmtDate(range.end.toISOString())}`

  const recItems = summary.recitations
    .slice(0, 8)
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; font-weight:bold;">${r.surah_name}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569;">${statusLabel(r.status)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#94a3b8; font-size:12px;">${fmtDate(r.created_at)}</td>
      </tr>`
    )
    .join("")

  const sessItems = summary.sessions
    .slice(0, 8)
    .map(
      (s) => `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; font-weight:bold;">${s.title}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569;">${statusLabel(s.status)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#94a3b8; font-size:12px;">${fmtDate(s.scheduled_at)}</td>
      </tr>`
    )
    .join("")

  const badgeItems = summary.badges
    .slice(0, 8)
    .map(
      (b) => `
      <li style="margin-bottom:10px; color:#475569;">
        <strong style="color:#0B3D2E;">${b.badge_name}</strong>
        ${b.badge_description ? `<div style="font-size:13px; color:#64748b;">${b.badge_description}</div>` : ""}
      </li>`
    )
    .join("")

  return `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color:#0f172a;">
      <div style="text-align:center; padding:24px 0; border-bottom: 2px solid #0B3D2E;">
        <h1 style="margin:0; color:#0B3D2E; font-size:24px;">إتقان التعليمية</h1>
        <p style="margin:6px 0 0; color:#64748b; font-size:13px;">التقرير الأسبوعي</p>
      </div>

      <div style="margin: 24px 0;">
        <p style="color:#64748b; font-size:14px; margin: 0;">السلام عليكم، ${parentName}</p>
        <h2 style="color:#0B3D2E; margin: 8px 0 0;">تقرير ${childName} لهذا الأسبوع</h2>
        <p style="color:#94a3b8; font-size:13px; margin-top:4px;">${rangeStr}</p>
      </div>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-bottom: 24px;">
        <tr>
          <td style="padding: 14px; background:#f0fdf4; border-radius:10px; text-align:center; width:25%;">
            <div style="font-size:24px; font-weight:bold; color:#166534;">${summary.recitations_count}</div>
            <div style="font-size:12px; color:#475569;">تلاوة</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding: 14px; background:#eff6ff; border-radius:10px; text-align:center; width:25%;">
            <div style="font-size:24px; font-weight:bold; color:#1d4ed8;">${summary.sessions_attended}</div>
            <div style="font-size:12px; color:#475569;">جلسة حضرها</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding: 14px; background:#fef3c7; border-radius:10px; text-align:center; width:25%;">
            <div style="font-size:24px; font-weight:bold; color:#b45309;">${summary.badges_earned}</div>
            <div style="font-size:12px; color:#475569;">شارة جديدة</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding: 14px; background:#fef2f2; border-radius:10px; text-align:center; width:25%;">
            <div style="font-size:24px; font-weight:bold; color:#b91c1c;">${summary.sessions_upcoming}</div>
            <div style="font-size:12px; color:#475569;">جلسة قادمة</div>
          </td>
        </tr>
      </table>

      ${
        summary.current_level
          ? `<div style="background:#0B3D2E; color:white; padding:18px; border-radius:12px; margin-bottom:24px; text-align:center;">
              <div style="font-size:13px; opacity:0.85;">المستوى الحالي</div>
              <div style="font-size:18px; font-weight:bold; margin-top:6px;">${summary.current_level}</div>
            </div>`
          : ""
      }

      ${
        recItems
          ? `<h3 style="color:#0B3D2E; margin: 24px 0 12px; font-size:16px;">📖 التلاوات</h3>
            <table style="width:100%; border-collapse: collapse; background:#fff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
              ${recItems}
            </table>`
          : `<p style="color:#94a3b8; font-size:14px;">لم يتم تقديم تلاوات هذا الأسبوع.</p>`
      }

      ${
        sessItems
          ? `<h3 style="color:#0B3D2E; margin: 24px 0 12px; font-size:16px;">🎙️ الجلسات</h3>
            <table style="width:100%; border-collapse: collapse; background:#fff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
              ${sessItems}
            </table>`
          : ""
      }

      ${
        badgeItems
          ? `<h3 style="color:#0B3D2E; margin: 24px 0 12px; font-size:16px;">🏅 الشارات الجديدة</h3>
             <ul style="padding-right:18px; margin: 0;">${badgeItems}</ul>`
          : ""
      }

      ${
        reportUrl
          ? `<div style="text-align:center; margin: 28px 0;">
              <a href="${reportUrl}" style="display:inline-block; background:#0B3D2E; color:white; text-decoration:none; padding:12px 28px; border-radius:10px; font-weight:bold;">
                عرض التقرير الكامل في المنصة
              </a>
            </div>`
          : ""
      }

      <hr style="border:none; border-top:1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color:#94a3b8; text-align:center;">
        منصة إتقان التعليمية — جميع الحقوق محفوظة
      </p>
    </div>
  `
}

export async function sendWeeklyReport(opts: {
  parentId: string
  childId: string
  parentChildId: string
  range?: WeekRange
}): Promise<{ ok: boolean; error?: string; week_start: string; summary: WeeklyReportSummary }> {
  const range = opts.range || lastFullWeekRange()

  const [parent, child, existing] = await Promise.all([
    queryOne<{ id: string; name: string; email: string }>(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [opts.parentId]
    ),
    queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM users WHERE id = $1`,
      [opts.childId]
    ),
    queryOne<{ id: string; email_sent: boolean }>(
      `SELECT id, email_sent FROM parent_weekly_reports
       WHERE parent_id = $1 AND child_id = $2 AND week_start = $3`,
      [opts.parentId, opts.childId, range.start.toISOString().split("T")[0]]
    ),
  ])

  if (!parent || !child || !parent.email) {
    return {
      ok: false,
      error: "Parent or child not found, or no email",
      week_start: range.start.toISOString().split("T")[0],
      summary: {
        recitations_count: 0,
        sessions_attended: 0,
        sessions_upcoming: 0,
        badges_earned: 0,
        current_level: null,
        recitations: [],
        sessions: [],
        badges: [],
      },
    }
  }

  if (existing?.email_sent) {
    return {
      ok: true,
      week_start: range.start.toISOString().split("T")[0],
      summary: {
        recitations_count: 0,
        sessions_attended: 0,
        sessions_upcoming: 0,
        badges_earned: 0,
        current_level: null,
        recitations: [],
        sessions: [],
        badges: [],
      },
    }
  }

  const summary = await buildWeeklySummary(opts.childId, range)

  const html = renderWeeklyReportHtml({
    childName: child.name,
    parentName: parent.name,
    range,
    summary,
  })

  const subject = `تقرير ${child.name} الأسبوعي — إتقان التعليمية`
  const text = `تقرير الأسبوع: ${summary.recitations_count} تلاوة، ${summary.sessions_attended} جلسة حضرها، ${summary.badges_earned} شارة جديدة`

  let ok = false
  let errMsg: string | null = null
  try {
    ok = await sendEmail({ to: parent.email, subject, body: text, html })
  } catch (err: unknown) {
    errMsg = err instanceof Error ? err.message : String(err)
  }

  await query(
    `INSERT INTO parent_weekly_reports
       (parent_id, child_id, parent_child_id, week_start, week_end,
        recitations_count, sessions_attended, badges_earned, current_level,
        summary, email_sent, email_error)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (parent_id, child_id, week_start) DO UPDATE SET
       recitations_count = EXCLUDED.recitations_count,
       sessions_attended = EXCLUDED.sessions_attended,
       badges_earned = EXCLUDED.badges_earned,
       current_level = EXCLUDED.current_level,
       summary = EXCLUDED.summary,
       email_sent = EXCLUDED.email_sent,
       email_error = EXCLUDED.email_error,
       sent_at = NOW()`,
    [
      opts.parentId,
      opts.childId,
      opts.parentChildId,
      range.start.toISOString().split("T")[0],
      range.end.toISOString().split("T")[0],
      summary.recitations_count,
      summary.sessions_attended,
      summary.badges_earned,
      summary.current_level,
      JSON.stringify(summary),
      ok,
      errMsg,
    ]
  )

  return {
    ok,
    error: errMsg || undefined,
    week_start: range.start.toISOString().split("T")[0],
    summary,
  }
}
