import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { SURAHS, JUZ_BOUNDS } from "@/lib/quran-data"

const TOTAL_PAGES = 604
const TOTAL_AYAHS = 6236

/**
 * Maps a (surah, ayah) to an approximate Mushaf page number
 * using linear interpolation within each surah's page range.
 */
function ayahToPage(surahNumber: number, ayah: number): number {
  const idx = surahNumber - 1
  if (idx < 0 || idx >= SURAHS.length) return 1
  const surah = SURAHS[idx]
  const nextStartPage = surahNumber < 114 ? SURAHS[surahNumber].startPage : TOTAL_PAGES + 1
  if (nextStartPage <= surah.startPage) return surah.startPage
  const span = nextStartPage - surah.startPage
  return Math.min(surah.startPage + Math.floor((ayah - 1) * span / surah.ayahs), TOTAL_PAGES)
}

type RecitationRow = {
  surah_number: number
  ayah_from: number
  ayah_to: number
  status: string
}

type MemLogRow = {
  surah_number: number
  juz_number: number
  new_verses: number
  revised_verses: number
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studentId = session.sub

  // Fetch recitations
  const recitations = await query<RecitationRow>(
    `SELECT surah_number, ayah_from, ayah_to, status
     FROM recitations
     WHERE student_id = $1 AND status IN ('mastered','in_review','pending','needs_session','session_booked')
     ORDER BY surah_number, ayah_from`,
    [studentId]
  )

  // Fetch memorization log
  const memLog = await query<MemLogRow>(
    `SELECT surah_number, juz_number, new_verses, revised_verses
     FROM memorization_log
     WHERE student_id = $1`,
    [studentId]
  )

  // Build per-page status: 'mastered' | 'reviewing' | 'none'
  // Priority: mastered > reviewing > none
  const pageStatus: Record<number, "mastered" | "reviewing"> = {}

  for (const r of recitations) {
    const fromPage = ayahToPage(r.surah_number, r.ayah_from)
    const toPage = ayahToPage(r.surah_number, r.ayah_to)
    const status = r.status === "mastered" ? "mastered" : "reviewing"

    for (let p = fromPage; p <= toPage; p++) {
      const current = pageStatus[p]
      if (!current) {
        pageStatus[p] = status
      } else if (current === "reviewing" && status === "mastered") {
        pageStatus[p] = "mastered"
      }
    }
  }

  // Mark pages covered by memorization log entries
  for (const m of memLog) {
    if (m.new_verses > 0 && m.surah_number) {
      const startPage = SURAHS[m.surah_number - 1]?.startPage
      if (startPage && !pageStatus[startPage]) {
        pageStatus[startPage] = "reviewing"
      }
    }
  }

  // Build pages array (1..604)
  const pages: Array<{ page: number; status: "mastered" | "reviewing" | "none" }> = []
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    pages.push({ page: p, status: pageStatus[p] || "none" })
  }

  // Compute stats
  const masteredPages = pages.filter(p => p.status === "mastered").length
  const reviewingPages = pages.filter(p => p.status === "reviewing").length

  // Surah-level stats
  const surahProgress: Array<{
    number: number
    name: string
    totalAyahs: number
    masteredAyahs: number
    reviewingAyahs: number
    startPage: number
  }> = SURAHS.map(s => {
    let mastered = 0
    let reviewing = 0
    for (const r of recitations) {
      if (r.surah_number === s.number) {
        const count = r.ayah_to - r.ayah_from + 1
        if (r.status === "mastered") mastered += count
        else reviewing += count
      }
    }
    return {
      number: s.number,
      name: s.name,
      totalAyahs: s.ayahs,
      masteredAyahs: Math.min(mastered, s.ayahs),
      reviewingAyahs: Math.min(reviewing, s.ayahs),
      startPage: s.startPage,
    }
  })

  // Juz-level stats
  const juzProgress = JUZ_BOUNDS.map((juz, i) => {
    const fromPage = juz.page
    const toPage = i < 29 ? JUZ_BOUNDS[i + 1].page - 1 : TOTAL_PAGES
    let mastered = 0
    let reviewing = 0
    let total = 0
    for (let p = fromPage; p <= toPage; p++) {
      total++
      const s = pageStatus[p]
      if (s === "mastered") mastered++
      else if (s === "reviewing") reviewing++
    }
    return {
      juz: i + 1,
      fromPage,
      toPage,
      totalPages: total,
      masteredPages: mastered,
      reviewingPages: reviewing,
      percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    }
  })

  // Total mastered ayahs
  let totalMasteredAyahs = 0
  let totalReviewingAyahs = 0
  for (const s of surahProgress) {
    totalMasteredAyahs += s.masteredAyahs
    totalReviewingAyahs += s.reviewingAyahs
  }

  const completedSurahs = surahProgress.filter(s => s.masteredAyahs >= s.totalAyahs).length
  const completedJuz = juzProgress.filter(j => j.percentage === 100).length

  // Recent activity (last 10 recitations)
  const recentActivity = await query<{
    surah_name: string
    surah_number: number
    ayah_from: number
    ayah_to: number
    status: string
    created_at: string
  }>(
    `SELECT surah_name, surah_number, ayah_from, ayah_to, status, created_at
     FROM recitations
     WHERE student_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [studentId]
  )

  // Milestones
  const milestones: Array<{ label: string; achieved: boolean; icon: string }> = [
    { label: "حفظ أول صفحة", achieved: masteredPages >= 1, icon: "page" },
    { label: "حفظ أول جزء", achieved: completedJuz >= 1, icon: "juz" },
    { label: "حفظ ٥ أجزاء", achieved: completedJuz >= 5, icon: "star" },
    { label: "حفظ ١٠ أجزاء", achieved: completedJuz >= 10, icon: "trophy" },
    { label: "حفظ نصف القرآن", achieved: completedJuz >= 15, icon: "half" },
    { label: "حفظ القرآن كاملاً", achieved: completedJuz >= 30, icon: "crown" },
  ]

  return NextResponse.json({
    pages,
    juzProgress,
    surahProgress,
    stats: {
      totalPages: TOTAL_PAGES,
      masteredPages,
      reviewingPages,
      totalAyahs: TOTAL_AYAHS,
      totalMasteredAyahs,
      totalReviewingAyahs,
      completedSurahs,
      totalSurahs: 114,
      completedJuz,
      totalJuz: 30,
      overallPercentage: Math.round((masteredPages / TOTAL_PAGES) * 100),
    },
    recentActivity,
    milestones,
  })
}
