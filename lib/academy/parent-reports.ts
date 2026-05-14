import { query, queryOne } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export interface WeeklyReportSummary {
  parentName: string
  parentEmail: string
  childName: string
  weekStart: string
  weekEnd: string
  recitationsCount: number
  sessionsAttended: number
  currentLevel: string
  badgesEarned: number
  newBadges: Array<{ name: string; awardedAt: string }>
  recitations: Array<{ surahName: string; status: string; createdAt: string }>
  sessions: Array<{ title: string; courseTitle: string; attendedAt: string }>
}

interface ParentChildRow {
  parent_id: string
  child_id: string
  parent_child_id: string
  parent_name: string
  parent_email: string
  child_name: string
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getPreviousWeekWindow(now = new Date()): { weekStart: string; weekEnd: string } {
  const day = now.getUTCDay()
  const thisWeekMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diffFromMonday = day === 0 ? 6 : day - 1
  thisWeekMonday.setUTCDate(thisWeekMonday.getUTCDate() - diffFromMonday)

  const previousMonday = new Date(thisWeekMonday)
  previousMonday.setUTCDate(previousMonday.getUTCDate() - 7)
  const previousSunday = new Date(thisWeekMonday)
  previousSunday.setUTCDate(previousSunday.getUTCDate() - 1)

  return {
    weekStart: toDateOnly(previousMonday),
    weekEnd: toDateOnly(previousSunday),
  }
}

export async function buildParentWeeklyReport(
  row: ParentChildRow,
  weekStart: string,
  weekEnd: string,
): Promise<WeeklyReportSummary> {
  const recitations = await query<{ surah_name: string; status: string; created_at: string }>(
    `SELECT surah_name, status, created_at
       FROM recitations
      WHERE student_id = $1
        AND created_at::date BETWEEN $2::date AND $3::date
      ORDER BY created_at DESC`,
    [row.child_id, weekStart, weekEnd],
  )

  const sessions = await query<{ title: string; course_title: string; attended_at: string }>(
    `SELECT cs.title,
            COALESCE(c.title, 'جلسة مباشرة') AS course_title,
            COALESCE(sa.joined_at, cs.scheduled_at) AS attended_at
       FROM session_attendance sa
       JOIN course_sessions cs ON cs.id = sa.session_id
       LEFT JOIN courses c ON c.id = cs.course_id
      WHERE sa.student_id = $1
        AND COALESCE(sa.joined_at, cs.scheduled_at)::date BETWEEN $2::date AND $3::date
        AND COALESCE(sa.attendance_status, 'present') IN ('present', 'attended')
      ORDER BY attended_at DESC`,
    [row.child_id, weekStart, weekEnd],
  ).catch(() => [])

  const badges = await query<{ badge_name: string | null; badge_type: string; awarded_at: string }>(
    `SELECT badge_name, badge_type, COALESCE(awarded_at, earned_at) AS awarded_at
       FROM badges
      WHERE user_id = $1
        AND COALESCE(awarded_at, earned_at)::date BETWEEN $2::date AND $3::date
      ORDER BY COALESCE(awarded_at, earned_at) DESC`,
    [row.child_id, weekStart, weekEnd],
  )

  const points = await queryOne<{ level: string | null }>(
    `SELECT level FROM user_points WHERE user_id = $1 LIMIT 1`,
    [row.child_id],
  ).catch(() => null)

  return {
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    childName: row.child_name,
    weekStart,
    weekEnd,
    recitationsCount: recitations.length,
    sessionsAttended: sessions.length,
    currentLevel: points?.level || "beginner",
    badgesEarned: badges.length,
    newBadges: badges.map((badge) => ({
      name: badge.badge_name || badge.badge_type,
      awardedAt: badge.awarded_at,
    })),
    recitations: recitations.map((recitation) => ({
      surahName: recitation.surah_name,
      status: recitation.status,
      createdAt: recitation.created_at,
    })),
    sessions: sessions.map((session) => ({
      title: session.title,
      courseTitle: session.course_title,
      attendedAt: session.attended_at,
    })),
  }
}

function renderWeeklyReportHtml(report: WeeklyReportSummary): string {
  const recitationItems = report.recitations.length
    ? report.recitations.map((item) => `<li>${item.surahName} — ${item.status}</li>`).join("")
    : "<li>لا توجد تلاوات هذا الأسبوع.</li>"

  const sessionItems = report.sessions.length
    ? report.sessions.map((item) => `<li>${item.title} — ${item.courseTitle}</li>`).join("")
    : "<li>لا توجد جلسات حضور مسجلة هذا الأسبوع.</li>"

  const badgeItems = report.newBadges.length
    ? report.newBadges.map((item) => `<li>${item.name}</li>`).join("")
    : "<li>لا توجد شارات جديدة هذا الأسبوع.</li>"

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 640px; margin: auto; color: #1f2937;">
      <h2 style="color:#0B3D2E;">تقرير ${report.childName} الأسبوعي</h2>
      <p>السلام عليكم ${report.parentName}، هذا ملخص أداء ${report.childName} من ${report.weekStart} إلى ${report.weekEnd}.</p>
      <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin: 20px 0;">
        <div style="padding:12px; border:1px solid #e5e7eb; border-radius:12px;"><strong>تلاوات الأسبوع</strong><br />${report.recitationsCount}</div>
        <div style="padding:12px; border:1px solid #e5e7eb; border-radius:12px;"><strong>جلسات حُضرت</strong><br />${report.sessionsAttended}</div>
        <div style="padding:12px; border:1px solid #e5e7eb; border-radius:12px;"><strong>المستوى الحالي</strong><br />${report.currentLevel}</div>
        <div style="padding:12px; border:1px solid #e5e7eb; border-radius:12px;"><strong>الشارات الجديدة</strong><br />${report.badgesEarned}</div>
      </div>
      <h3>التلاوات</h3>
      <ul>${recitationItems}</ul>
      <h3>الجلسات</h3>
      <ul>${sessionItems}</ul>
      <h3>الشارات</h3>
      <ul>${badgeItems}</ul>
    </div>
  `
}

function renderWeeklyReportText(report: WeeklyReportSummary): string {
  return [
    `تقرير ${report.childName} الأسبوعي`,
    `الفترة: ${report.weekStart} إلى ${report.weekEnd}`,
    `تلاوات الأسبوع: ${report.recitationsCount}`,
    `جلسات حُضرت: ${report.sessionsAttended}`,
    `المستوى الحالي: ${report.currentLevel}`,
    `الشارات الجديدة: ${report.badgesEarned}`,
  ].join("\n")
}

export async function generateAndSendParentWeeklyReports(
  weekStart: string,
  weekEnd: string,
): Promise<{ processed: number; sent: number; failed: number }> {
  const links = await query<ParentChildRow>(
    `SELECT pc.parent_id,
            pc.child_id,
            pc.id AS parent_child_id,
            p.name AS parent_name,
            p.email AS parent_email,
            c.name AS child_name
       FROM parent_children pc
       JOIN users p ON p.id = pc.parent_id
       JOIN users c ON c.id = pc.child_id
      WHERE pc.status IN ('active', 'approved')
        AND p.email IS NOT NULL`,
  )

  let sent = 0
  let failed = 0

  for (const link of links) {
    const report = await buildParentWeeklyReport(link, weekStart, weekEnd)
    const summary = {
      recitations: report.recitations,
      sessions: report.sessions,
      badges: report.newBadges,
    }

    const saved = await query<{ id: string }>(
      `INSERT INTO parent_weekly_reports (
         parent_id, child_id, parent_child_id, week_start, week_end,
         recitations_count, sessions_attended, badges_earned, current_level, summary
       )
       VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8, $9, $10::jsonb)
       ON CONFLICT (parent_child_id, week_start, week_end)
       DO UPDATE SET
         recitations_count = EXCLUDED.recitations_count,
         sessions_attended = EXCLUDED.sessions_attended,
         badges_earned = EXCLUDED.badges_earned,
         current_level = EXCLUDED.current_level,
         summary = EXCLUDED.summary
       RETURNING id`,
      [
        link.parent_id,
        link.child_id,
        link.parent_child_id,
        weekStart,
        weekEnd,
        report.recitationsCount,
        report.sessionsAttended,
        report.badgesEarned,
        report.currentLevel,
        JSON.stringify(summary),
      ],
    )

    const sentOk = await sendEmail({
      to: report.parentEmail,
      subject: `تقرير ${report.childName} الأسبوعي - منصة إتقان`,
      body: renderWeeklyReportText(report),
      html: renderWeeklyReportHtml(report),
    })

    if (sentOk) {
      sent++
      await query(
        `UPDATE parent_weekly_reports
            SET email_sent = TRUE, email_error = NULL, sent_at = NOW()
          WHERE id = $1`,
        [saved[0].id],
      )
    } else {
      failed++
      await query(
        `UPDATE parent_weekly_reports
            SET email_sent = FALSE, email_error = 'sendEmail returned false'
          WHERE id = $1`,
        [saved[0].id],
      )
    }
  }

  return {
    processed: links.length,
    sent,
    failed,
  }
}
