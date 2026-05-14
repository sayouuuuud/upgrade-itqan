import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

const TOTAL_AYAHS = 6236
const TOTAL_JUZ = 30

type DailyAgg = { log_date: string; new_v: number; rev_v: number }
type StatsRow = {
  current_streak_days: number
  longest_streak_days: number
  last_submission_at: string | null
}
type RecSummary = { mastered_ayahs: number; reviewing_ayahs: number }
type JuzRow = { juz_number: number }

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studentId = session.sub

  // 1. Daily aggregates for last 30 days
  const dailyData = await query<DailyAgg>(
    `SELECT log_date::text AS log_date,
            COALESCE(SUM(new_verses), 0)::int AS new_v,
            COALESCE(SUM(revised_verses), 0)::int AS rev_v
     FROM memorization_log
     WHERE student_id = $1 AND log_date >= CURRENT_DATE - 30
     GROUP BY log_date
     ORDER BY log_date ASC`,
    [studentId]
  )

  // 2. Weekly aggregates for last 12 weeks
  const weeklyData = await query<{ week_start: string; new_v: number; rev_v: number }>(
    `SELECT date_trunc('week', log_date)::date::text AS week_start,
            COALESCE(SUM(new_verses), 0)::int AS new_v,
            COALESCE(SUM(revised_verses), 0)::int AS rev_v
     FROM memorization_log
     WHERE student_id = $1 AND log_date >= CURRENT_DATE - 84
     GROUP BY date_trunc('week', log_date)
     ORDER BY week_start ASC`,
    [studentId]
  )

  // 3. Student stats (streak)
  const statsRows = await query<StatsRow>(
    `SELECT current_streak_days, longest_streak_days, last_submission_at
     FROM student_stats
     WHERE student_id = $1`,
    [studentId]
  )
  const statsRow = statsRows[0] || { current_streak_days: 0, longest_streak_days: 0, last_submission_at: null }

  // 4. Total mastered ayahs from recitations
  const recSummaryRows = await query<RecSummary>(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'mastered' THEN (ayah_to - ayah_from + 1) ELSE 0 END), 0)::int AS mastered_ayahs,
       COALESCE(SUM(CASE WHEN status IN ('in_review','pending','needs_session','session_booked') THEN (ayah_to - ayah_from + 1) ELSE 0 END), 0)::int AS reviewing_ayahs
     FROM recitations
     WHERE student_id = $1`,
    [studentId]
  )
  const recSummary = recSummaryRows[0] || { mastered_ayahs: 0, reviewing_ayahs: 0 }

  // 5. Completed juz (all pages mastered)
  // Approximate: count distinct juz from mastered recitations
  const juzRows = await query<JuzRow>(
    `SELECT DISTINCT
       CASE
         WHEN surah_number >= 78 THEN 30
         WHEN surah_number >= 67 THEN 29
         WHEN surah_number >= 58 THEN 28
         WHEN surah_number >= 51 THEN 27
         WHEN surah_number >= 46 THEN 26
         WHEN surah_number >= 41 THEN 25
         WHEN surah_number >= 39 THEN 24
         WHEN surah_number >= 36 THEN 23
         WHEN surah_number >= 33 THEN 22
         WHEN surah_number >= 29 THEN 21
         WHEN surah_number >= 27 THEN 20
         WHEN surah_number >= 25 THEN 19
         WHEN surah_number >= 23 THEN 18
         WHEN surah_number >= 21 THEN 17
         WHEN surah_number >= 18 THEN 16
         WHEN surah_number >= 17 THEN 15
         WHEN surah_number >= 15 THEN 14
         WHEN surah_number >= 12 THEN 13
         WHEN surah_number >= 11 THEN 12
         WHEN surah_number >= 9 THEN 11
         WHEN surah_number >= 8 THEN 10
         WHEN surah_number >= 7 THEN 9
         WHEN surah_number >= 6 THEN 8
         WHEN surah_number >= 5 THEN 7
         WHEN surah_number >= 4 THEN 5
         WHEN surah_number >= 3 THEN 4
         WHEN surah_number >= 2 THEN 2
         ELSE 1
       END AS juz_number
     FROM recitations
     WHERE student_id = $1 AND status = 'mastered'`,
    [studentId]
  )

  // 6. This week's totals
  const thisWeekRows = await query<{ new_v: number; rev_v: number; active_days: number }>(
    `SELECT
       COALESCE(SUM(new_verses), 0)::int AS new_v,
       COALESCE(SUM(revised_verses), 0)::int AS rev_v,
       COUNT(DISTINCT log_date)::int AS active_days
     FROM memorization_log
     WHERE student_id = $1 AND log_date >= date_trunc('week', CURRENT_DATE)`,
    [studentId]
  )
  const thisWeek = thisWeekRows[0] || { new_v: 0, rev_v: 0, active_days: 0 }

  // 7. Consistency: active days in last 30 days
  const consistencyRows = await query<{ active_days: number }>(
    `SELECT COUNT(DISTINCT log_date)::int AS active_days
     FROM memorization_log
     WHERE student_id = $1 AND log_date >= CURRENT_DATE - 30`,
    [studentId]
  )
  const activeDays30 = consistencyRows[0]?.active_days || 0

  // 8. Total from memorization log
  const totalLogRows = await query<{ total_new: number; total_rev: number }>(
    `SELECT COALESCE(SUM(new_verses), 0)::int AS total_new,
            COALESCE(SUM(revised_verses), 0)::int AS total_rev
     FROM memorization_log
     WHERE student_id = $1`,
    [studentId]
  )
  const totalLog = totalLogRows[0] || { total_new: 0, total_rev: 0 }

  // Build daily chart data (fill gaps with zeros)
  const dailyChart: Array<{ date: string; day: string; newVerses: number; revisedVerses: number }> = []
  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  const dailyMap = new Map(dailyData.map(d => [d.log_date, d]))

  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const entry = dailyMap.get(key)
    dailyChart.push({
      date: key,
      day: dayNames[d.getDay()],
      newVerses: entry?.new_v || 0,
      revisedVerses: entry?.rev_v || 0,
    })
  }

  return NextResponse.json({
    dailyChart,
    weeklyChart: weeklyData.map(w => ({
      weekStart: w.week_start,
      newVerses: w.new_v,
      revisedVerses: w.rev_v,
    })),
    totals: {
      masteredAyahs: Math.min(recSummary.mastered_ayahs, TOTAL_AYAHS),
      reviewingAyahs: Math.min(recSummary.reviewing_ayahs, TOTAL_AYAHS),
      totalAyahs: TOTAL_AYAHS,
      completedJuz: juzRows.length,
      totalJuz: TOTAL_JUZ,
      overallPercentage: Math.round((recSummary.mastered_ayahs / TOTAL_AYAHS) * 100),
      totalNewFromLog: totalLog.total_new,
      totalRevFromLog: totalLog.total_rev,
    },
    streak: {
      current: statsRow.current_streak_days,
      longest: statsRow.longest_streak_days,
      lastSubmission: statsRow.last_submission_at,
    },
    thisWeek: {
      newVerses: thisWeek.new_v,
      revisedVerses: thisWeek.rev_v,
      activeDays: thisWeek.active_days,
    },
    consistency: {
      activeDays30,
      percentage: Math.round((activeDays30 / 30) * 100),
    },
  })
}
