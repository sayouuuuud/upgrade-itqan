import { query } from '@/lib/db'
import { sendEmail } from '@/lib/email'

type Period = 'weekly' | 'monthly'

export function getActivityReportWindow(period: Period, now = new Date()) {
  const end = new Date(now)
  const start = new Date(now)
  start.setDate(start.getDate() - (period === 'weekly' ? 7 : 30))
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export async function buildAdminActivityReport(period: Period) {
  const { start, end } = getActivityReportWindow(period)
  const params = [start, end]

  const [studentsByCountry, dailyActivity, topSurahs, growth, recitations, academyActivity] = await Promise.all([
    query<{ country: string; region: string; students: number }>(`
      SELECT
        COALESCE(NULLIF(country, ''), 'غير محدد') AS country,
        COALESCE(NULLIF(region, ''), 'غير محدد') AS region,
        COUNT(*)::int AS students
      FROM users
      WHERE role = 'student'
      GROUP BY COALESCE(NULLIF(country, ''), 'غير محدد'), COALESCE(NULLIF(region, ''), 'غير محدد')
      ORDER BY students DESC
      LIMIT 20
    `),
    query<{ day: string; active_students: number; points: number }>(`
      SELECT
        TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT user_id)::int AS active_students,
        COALESCE(SUM(points), 0)::int AS points
      FROM points_log
      WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz
      GROUP BY created_at::date
      ORDER BY created_at::date ASC
    `, params),
    query<{ surah_name: string; recordings: number; unique_students: number }>(`
      SELECT
        COALESCE(surah_name, 'غير محدد') AS surah_name,
        COUNT(*)::int AS recordings,
        COUNT(DISTINCT student_id)::int AS unique_students
      FROM recitations
      WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz
      GROUP BY COALESCE(surah_name, 'غير محدد')
      ORDER BY recordings DESC, unique_students DESC
      LIMIT 10
    `, params),
    query<{ new_students: number; new_readers: number }>(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'student')::int AS new_students,
        COUNT(*) FILTER (WHERE role = 'reader')::int AS new_readers
      FROM users
      WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz
    `, params),
    query<{ total: number; mastered: number; pending: number }>(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'mastered')::int AS mastered,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
      FROM recitations
      WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz
    `, params),
    query<{ enrollments: number; completed_tasks: number }>(`
      SELECT
        (SELECT COUNT(*)::int FROM enrollments WHERE enrolled_at >= $1::timestamp AND enrolled_at < $2::timestamp) AS enrollments,
        (SELECT COUNT(*)::int FROM task_submissions WHERE submitted_at >= $1::timestamptz AND submitted_at < $2::timestamptz AND status = 'graded') AS completed_tasks
    `, params),
  ])

  return {
    period,
    window: { start, end },
    summary: {
      newStudents: growth[0]?.new_students || 0,
      newReaders: growth[0]?.new_readers || 0,
      recitations: recitations[0]?.total || 0,
      masteredRecitations: recitations[0]?.mastered || 0,
      pendingRecitations: recitations[0]?.pending || 0,
      academyEnrollments: academyActivity[0]?.enrollments || 0,
      completedTasks: academyActivity[0]?.completed_tasks || 0,
      averageDailyActiveStudents: dailyActivity.length
        ? Math.round(dailyActivity.reduce((sum, item) => sum + Number(item.active_students || 0), 0) / dailyActivity.length)
        : 0,
    },
    studentsByCountry,
    dailyActivity,
    topSurahs,
  }
}

function renderReportHtml(report: Awaited<ReturnType<typeof buildAdminActivityReport>>) {
  const periodLabel = report.period === 'weekly' ? 'الأسبوعي' : 'الشهري'
  const countries = report.studentsByCountry.map((item) => `<li>${item.country} / ${item.region}: ${item.students} طالب</li>`).join('')
  const surahs = report.topSurahs.map((item) => `<li>${item.surah_name}: ${item.recordings} تسجيل (${item.unique_students} طالب)</li>`).join('')
  const activity = report.dailyActivity.map((item) => `<li>${item.day}: ${item.active_students} طالب نشط، ${item.points} نقطة</li>`).join('')

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937;">
      <h2>تقرير النشاط ${periodLabel}</h2>
      <p>الفترة: ${report.window.start.slice(0, 10)} إلى ${report.window.end.slice(0, 10)}</p>
      <h3>الملخص</h3>
      <ul>
        <li>طلاب جدد: ${report.summary.newStudents}</li>
        <li>قراء جدد: ${report.summary.newReaders}</li>
        <li>تسجيلات المقرأة: ${report.summary.recitations}</li>
        <li>تسجيلات متقنة: ${report.summary.masteredRecitations}</li>
        <li>تسجيلات بانتظار المراجعة: ${report.summary.pendingRecitations}</li>
        <li>تسجيلات الأكاديمية: ${report.summary.academyEnrollments}</li>
        <li>مهام مكتملة: ${report.summary.completedTasks}</li>
        <li>متوسط النشاط اليومي: ${report.summary.averageDailyActiveStudents} طالب</li>
      </ul>
      <h3>توزيع الطلاب جغرافياً</h3>
      <ul>${countries || '<li>لا توجد بيانات</li>'}</ul>
      <h3>أكثر السور تسجيلاً</h3>
      <ul>${surahs || '<li>لا توجد بيانات</li>'}</ul>
      <h3>النشاط اليومي</h3>
      <ul>${activity || '<li>لا توجد بيانات</li>'}</ul>
    </div>
  `
}

export async function sendAdminActivityReport(period: Period, dryRun = false) {
  const report = await buildAdminActivityReport(period)
  const admins = await query<{ email: string; name: string | null }>(`
    SELECT email, name
    FROM users
    WHERE role = 'admin' AND email IS NOT NULL AND COALESCE(is_active, TRUE) = TRUE
  `)

  if (dryRun) {
    return { report, recipients: admins.map((admin) => admin.email), sent: 0, dryRun: true }
  }

  const subject = period === 'weekly' ? 'تقرير إتقان الأسبوعي للنشاط والنمو' : 'تقرير إتقان الشهري للنشاط والنمو'
  const html = renderReportHtml(report)
  let sent = 0
  for (const admin of admins) {
    const ok = await sendEmail({ to: admin.email, subject, body: subject, html })
    if (ok) sent += 1
  }

  return { report, recipients: admins.map((admin) => admin.email), sent, dryRun: false }
}
