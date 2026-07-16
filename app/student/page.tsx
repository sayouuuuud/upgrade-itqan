"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Mic, FileText, Clock, CheckCircle, Calendar, Award,
  ChevronLeft, Sun, Sunrise, Sunset, Moon, MoonStar,
  BookOpen, Plus, Sparkles, TrendingUp, Loader2,
  Flame, Target, BarChart3, PenLine, Save, Map,
  Trophy, Star, Medal, Route,
} from "lucide-react"
import { SURAHS } from "@/lib/quran-data"
import { useI18n } from "@/lib/i18n/context"
import { AdhkarWidget } from "@/components/adhkar-widget"
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"


type Recitation = {
  id: string
  surah_name: string
  status: string
  created_at: string
  audio_duration_seconds: number | null
}

type PrayerTimes = {
  timings: {
    fajr: string
    sunrise: string
    dhuhr: string
    asr: string
    maghrib: string
    isha: string
  }
  date: { readable: string; gregorian?: any; hijri?: any }
  location: { city: string; country: string }
  nextPrayer: { name: string; time: string; remainingMinutes?: number } | null
}

type WirdItem = { id: string; label: string; detail?: string }

type PointsInfo = {
  total_points: number
  level_label: string
  streak_days: number
  next_level: { label: string; min: number } | null
  points_to_next_level: number
}

type RankInfo = { rank: number; total_points: number } | null

type StudentPath = {
  id: string
  title: string
  enrollment_status?: string | null
  stages_completed?: number | null
  total_stages?: number | null
  subject?: string | null
}

type DailyChartItem = { date: string; day: string; newVerses: number; revisedVerses: number }
type WeeklyChartItem = { weekStart: string; newVerses: number; revisedVerses: number }

type ProgressReport = {
  dailyChart: DailyChartItem[]
  weeklyChart: WeeklyChartItem[]
  totals: {
    masteredAyahs: number
    reviewingAyahs: number
    totalAyahs: number
    completedJuz: number
    totalJuz: number
    overallPercentage: number
    totalNewFromLog: number
    totalRevFromLog: number
  }
  streak: { current: number; longest: number; lastSubmission: string | null }
  thisWeek: { newVerses: number; revisedVerses: number; activeDays: number }
  consistency: { activeDays30: number; percentage: number }
}

function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

const PRAYER_META: Record<string, { labelKey: string; icon: any }> = {
  fajr: { labelKey: "prayerFajr", icon: Sunrise },
  sunrise: { labelKey: "prayerSunrise", icon: Sun },
  dhuhr: { labelKey: "prayerDhuhr", icon: Sun },
  asr: { labelKey: "prayerAsr", icon: Sunset },
  maghrib: { labelKey: "prayerMaghrib", icon: Moon },
  isha: { labelKey: "prayerIsha", icon: MoonStar },
}

export default function StudentDashboard() {
  const { t, locale } = useI18n()
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [loadingRecitations, setLoadingRecitations] = useState(true)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [loadingPrayer, setLoadingPrayer] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [wirdItems, setWirdItems] = useState<WirdItem[]>([])
  const [loadingWird, setLoadingWird] = useState(true)
  const [wirdDone, setWirdDone] = useState<Record<string, boolean>>({})

  // Progress report state
  const [progress, setProgress] = useState<ProgressReport | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(true)

  // Gamification + paths
  const [points, setPoints] = useState<PointsInfo | null>(null)
  const [rank, setRank] = useState<RankInfo>(null)
  const [paths, setPaths] = useState<StudentPath[]>([])

  // Daily log form state
  const [logNewVerses, setLogNewVerses] = useState("")
  const [logRevisedVerses, setLogRevisedVerses] = useState("")
  const [logSurah, setLogSurah] = useState("")
  const [logNotes, setLogNotes] = useState("")
  const [logSaving, setLogSaving] = useState(false)
  const [logSaved, setLogSaved] = useState(false)

  // Chart view toggle
  const [chartView, setChartView] = useState<"week" | "month">("week")

  const formatDigits = (n: number | string) => {
    if (locale === "en") return String(n)
    return toArabicDigits(n)
  }

  useEffect(() => {
    let cancelled = false

    fetch("/api/recitations")
      .then((r) => (r.ok ? r.json() : { recitations: [] }))
      .then((d) => {
        if (!cancelled) setRecitations(d.recitations || [])
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingRecitations(false) })

    fetch("/api/prayer-times")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.success) setPrayerTimes(d.data)
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingPrayer(false) })

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.user?.name) setUserName(d.user.name) })
      .catch(() => { })

    fetch("/api/student/wird-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.wird_items) {
          setWirdItems(d.wird_items)
          // Restore today's check state from localStorage
          const todayKey = `wird-done-${new Date().toISOString().split("T")[0]}`
          try {
            const stored = localStorage.getItem(todayKey)
            if (stored) setWirdDone(JSON.parse(stored))
          } catch { }
        }
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingWird(false) })

    fetch("/api/student/progress-report")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ProgressReport | null) => {
        if (!cancelled && d) setProgress(d)
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingProgress(false) })

    fetch("/api/student/points")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) {
          setPoints({
            total_points: d.total_points ?? 0,
            level_label: d.level_label ?? ('مبتدئ'),
            streak_days: d.streak_days ?? 0,
            next_level: d.next_level ? { label: d.next_level.label, min: d.next_level.min } : null,
            points_to_next_level: d.points_to_next_level ?? 0,
          })
        }
      })
      .catch(() => { })

    fetch("/api/academy/leaderboard?period=all_time&limit=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.current_user) {
          setRank({ rank: d.current_user.rank, total_points: d.current_user.total_points })
        }
      })
      .catch(() => { })

    fetch("/api/student/tajweed-paths?scope=enrolled")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.paths)) setPaths(d.paths.slice(0, 3))
      })
      .catch(() => { })

    return () => { cancelled = true }
  }, [locale])

  const stats = useMemo(() => {
    const total = recitations.length
    const mastered = recitations.filter((r) => r.status === "mastered" || r.status === "approved").length
    const inReview = recitations.filter((r) => r.status === "pending" || r.status === "in_review").length
    const last = recitations[0] || null
    return { total, mastered, inReview, last }
  }, [recitations])

  const level = useMemo(() => {
    if (stats.mastered >= 10) return { name: t.student.levelAdvanced || t.addedTranslations_2026?.["متقدم"] || "متقدم", color: "from-emerald-500 to-teal-600" }
    if (stats.mastered >= 5) return { name: t.student.levelIntermediate || t.addedTranslations_2026?.["متوسط"] || "متوسط", color: "from-amber-500 to-orange-600" }
    if (stats.mastered >= 1) return { name: t.student.levelBeginner || t.addedTranslations_2026?.["مبتدئ"] || "مبتدئ", color: "from-sky-500 to-blue-600" }
    return { name: t.student.levelNew || t.addedTranslations_2026?.["جديد"] || "جديد", color: "from-slate-400 to-slate-600" }
  }, [stats.mastered, t])

  const progressValue = useMemo(() => {
    const target = stats.mastered >= 10 ? 100 : stats.mastered >= 5 ? Math.min(100, ((stats.mastered - 5) / 5) * 100 + 50) : Math.min(50, (stats.mastered / 5) * 50)
    return Math.round(target)
  }, [stats.mastered])

  const lastStatusLabel = useMemo(() => {
    if (!stats.last) return t.student.noRecitationTitle || t.addedTranslations_2026?.["لا توجد تلاوات بعد"] || "لا توجد تلاوات بعد"
    const map: Record<string, string> = {
      pending: t.student.statusPending || t.addedTranslations_2026?.["قيد المراجعة"] || "قيد المراجعة",
      in_review: t.student.statusInReview || t.addedTranslations_2026?.["قيد المراجعة"] || "قيد المراجعة",
      mastered: t.student.statusMastered || t.addedTranslations_2026?.["متقن"] || "متقن",
      approved: t.student.statusMastered || t.addedTranslations_2026?.["متقن"] || "متقن",
      needs_session: t.student.statusNeedsSession || t.addedTranslations_2026?.["تحتاج جلسة"] || "تحتاج جلسة",
      session_booked: t.student.statusBooked || t.addedTranslations_2026?.["تم الحجز"] || "تم الحجز",
    }
    return map[stats.last.status] || stats.last.status
  }, [stats.last, t])

  const formatRelative = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1) return 'الآن'
    if (m < 60) return locale === "ar" ? `منذ ${m} د` : `${m}m ago`
    if (h < 24) return locale === "ar" ? `منذ ${h} س` : `${h}h ago`
    return locale === "ar" ? `منذ ${d} يوم` : `${d}d ago`
  }

  const completedWird = Object.values(wirdDone).filter(Boolean).length
  const wirdTotal = wirdItems.length || 1
  const wirdProgress = Math.round((completedWird / wirdTotal) * 100)

  const toggleWirdItem = (id: string) => {
    const next = { ...wirdDone, [id]: !wirdDone[id] }
    setWirdDone(next)
    const todayKey = `wird-done-${new Date().toISOString().split("T")[0]}`
    try { localStorage.setItem(todayKey, JSON.stringify(next)) } catch { }
  }

  const handleLogSubmit = async () => {
    const newV = parseInt(logNewVerses || "0", 10)
    const revV = parseInt(logRevisedVerses || "0", 10)
    if (newV === 0 && revV === 0) return

    setLogSaving(true)
    try {
      const surahNum = logSurah ? parseInt(logSurah, 10) : null
      const surahData = surahNum ? SURAHS.find(s => s.number === surahNum) : null
      const res = await fetch("/api/student/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_verses: newV,
          revised_verses: revV,
          surah_number: surahNum,
          surah_name: surahData?.name || null,
          notes: logNotes.trim() || null,
        }),
      })
      if (res.ok) {
        setLogSaved(true)
        setLogNewVerses("")
        setLogRevisedVerses("")
        setLogSurah("")
        setLogNotes("")
        setTimeout(() => setLogSaved(false), 3000)
        // Refresh progress
        fetch("/api/student/progress-report")
          .then(r => r.ok ? r.json() : null)
          .then((d: ProgressReport | null) => { if (d) setProgress(d) })
          .catch(() => { })
      }
    } catch { }
    setLogSaving(false)
  }

  // Chart data
  const chartData = useMemo(() => {
    if (!progress) return []
    if (chartView === "week") return progress.dailyChart.slice(-7)
    return progress.dailyChart
  }, [progress, chartView])

  const chartMax = useMemo(() => {
    return Math.max(1, ...chartData.map(d => d.newVerses + d.revisedVerses))
  }, [chartData])

  if (loadingRecitations && loadingProgress) {
    return (
      <div className="max-w-6xl mx-auto pb-12">
        <PageLoadingSkeleton />
      </div>
    )
  }

  return (

    <div className="max-w-6xl mx-auto pb-12 space-y-6 md:space-y-8">
      {/* Header / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">
            {t.student.welcome || t.addedTranslations_2026?.["مرحباً"] || "مرحباً"}
          </p>
          <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">
            {userName ? `${t.student.welcome || t.addedTranslations_2026?.["مرحباً"] || "مرحباً"}، ${userName}` : (t.student.dashboard || t.addedTranslations_2026?.["لوحة الطالب"] || "لوحة الطالب")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t.student.welcomeDesc || t.addedTranslations_2026?.["تابع تقدمك في تلاوة القرآن الكريم"] || "تابع تقدمك في تلاوة القرآن الكريم"}
          </p>
        </div>

        {/* Prominent CTA */}
        <Link
          href="/student/submit"
          className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-6 md:px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 group"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-foreground/10 group-hover:rotate-90 transition-transform duration-500">
            <Plus className="w-5 h-5" />
          </span>
          <span className="text-sm md:text-base">{t.student.newRecitation || t.addedTranslations_2026?.["تسميع جديد"] || "تسميع جديد"}</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={FileText}
          label={t.student.totalSubmissions || t.addedTranslations_2026?.["إجمالي التسميعات"] || "إجمالي التسميعات"}
          value={loadingRecitations ? "…" : stats.total.toString()}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={CheckCircle}
          label={t.student.masteredSurahs || t.addedTranslations_2026?.["متقنة"] || "متقنة"}
          value={loadingRecitations ? "…" : stats.mastered.toString()}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Clock}
          label={t.student.underReview || t.addedTranslations_2026?.["قيد المراجعة"] || "قيد المراجعة"}
          value={loadingRecitations ? "…" : stats.inReview.toString()}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Award}
          label={t.student.currentLevel || t.addedTranslations_2026?.["المستوى الحالي"] || "المستوى الحالي"}
          value={level.name}
          accent={`bg-gradient-to-br ${level.color} text-white`}
          gradient
        />
      </div>

      {/* ═══ GAMIFICATION STRIP (points / rank / streak / next level) ═══ */}
      {points && (
        <div className="bg-gradient-to-l from-primary/10 via-card to-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/student/points" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-foreground leading-none">{formatDigits(points.total_points)}</p>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">{t.student.point || t.addedTranslations_2026?.["نقطة"] || "نقطة"}</p>
              </div>
            </Link>

            <Link href="/student/leaderboard" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-foreground leading-none">
                  {rank ? `#${formatDigits(rank.rank)}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">{t.student.yourRank || t.addedTranslations_2026?.["ترتيبك"] || "ترتيبك"}</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-foreground leading-none">{formatDigits(points.streak_days)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.student.streakDays || t.addedTranslations_2026?.["يوم متتالي"] || "يوم متتالي"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Medal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-foreground leading-tight truncate">
                  {points.level_label === 'مبتدئ' || points.level_label === "Beginner" ? t.student.levelBeginner :
                   points.level_label === 'متوسط' || points.level_label === "Intermediate" ? t.student.levelIntermediate :
                   points.level_label === 'متقدم' || points.level_label === "Advanced" ? t.student.levelAdvanced :
                   points.level_label === 'جديد' || points.level_label === "New" ? t.student.levelNew :
                   points.level_label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {points.next_level
                    ? (t.student.remainingToLevel
                        ? t.student.remainingToLevel.replace('{points}', formatDigits(points.points_to_next_level)).replace('{level}', points.next_level.label)
                        : `باقي ${formatDigits(points.points_to_next_level)} لـ${points.next_level.label}`)
                    : (t.student.maxLevel || t.addedTranslations_2026?.["أعلى مستوى"] || "أعلى مستوى")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground">{t.student.progressTitle || t.addedTranslations_2026?.["تقدمك"] || "تقدمك"}</h3>
              <p className="text-xs text-muted-foreground">{progressValue}% {'من الرحلة'}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${level.color} text-white shadow-sm`}>
            {level.name}
          </span>
        </div>
        <div className="bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-primary to-primary/70 transition-all duration-500 ease-in-out"
            style={{ width: `${progressValue}%` }}
            role="progressbar"
            aria-valuenow={progressValue}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{stats.mastered} {'تلاوة متقنة'}</span>
          <span>{lastStatusLabel}</span>
        </div>
      </div>

      {/* ═══ MEMORIZATION OVERVIEW ═══ */}
      {!loadingProgress && progress && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t.student.masteredVerses || t.addedTranslations_2026?.["آيات محفوظة"] || "آيات محفوظة"}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">
              {formatDigits(progress.totals.masteredAyahs)}
              <span className="text-sm font-bold text-muted-foreground mr-1">/ {formatDigits(progress.totals.totalAyahs)}</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t.student.completedJparts || t.addedTranslations_2026?.["أجزاء مكتملة"] || "أجزاء مكتملة"}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">
              {formatDigits(progress.totals.completedJuz)}
              <span className="text-sm font-bold text-muted-foreground mr-1">/ {formatDigits(progress.totals.totalJuz)}</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t.student.consistencyDays || t.addedTranslations_2026?.["أيام الانتظام"] || "أيام الانتظام"}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">
              {formatDigits(progress.streak.current)}
              <span className="text-xs font-bold text-muted-foreground mr-1">{(t.student.streakDaysLabel || t.addedTranslations_2026?.["يوم متتالي"] || "يوم متتالي")}</span>
            </p>
            {progress.streak.longest > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t.student.highestStreak ? t.student.highestStreak.replace('{days}', formatDigits(progress.streak.longest)) : (locale === "ar" ? `أعلى: ${formatDigits(progress.streak.longest)} يوم` : `Highest: ${formatDigits(progress.streak.longest)} days`)}
              </p>
            )}
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t.student.completionRate || t.addedTranslations_2026?.["نسبة الإنجاز"] || "نسبة الإنجاز"}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">
              {formatDigits(progress.totals.overallPercentage)}{'٪'}
                                      </p>
          </div>
        </div>
      )}

      {/* ═══ OVERALL PROGRESS BAR ═══ */}
      {!loadingProgress && progress && (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Map className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{t.student.totalHifz || t.addedTranslations_2026?.["إجمالي الحفظ"] || "إجمالي الحفظ"}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDigits(progress.totals.masteredAyahs)} {'آية محفوظة من'} {formatDigits(progress.totals.totalAyahs)}
                </p>
              </div>
            </div>
            <Link
              href="/student/mushaf-progress"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              {t.student.mushafMap || t.addedTranslations_2026?.["خريطة المصحف"] || "خريطة المصحف"}
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex" dir="ltr">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${(progress.totals.masteredAyahs / progress.totals.totalAyahs) * 100}%` }}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-700"
              style={{ width: `${(progress.totals.reviewingAyahs / progress.totals.totalAyahs) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">{t.student.saved || t.addedTranslations_2026?.["محفوظ"] || "محفوظ"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-400" />
              <span className="text-xs text-muted-foreground font-medium">{t.student.underReviewState || t.addedTranslations_2026?.["قيد المراجعة"] || "قيد المراجعة"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <span className="text-xs text-muted-foreground font-medium">{t.student.remaining || t.addedTranslations_2026?.["متبقي"] || "متبقي"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROGRESS CHART + DAILY LOG ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Weekly/Monthly Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t.student.progressChart || t.addedTranslations_2026?.["مخطط التقدم"] || "مخطط التقدم"}</h3>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-lg p-0.5">
              <button
                onClick={() => setChartView("week")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${chartView === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {t.student.weekly || t.addedTranslations_2026?.["أسبوعي"] || "أسبوعي"}
              </button>
              <button
                onClick={() => setChartView("month")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${chartView === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {t.student.monthly || t.addedTranslations_2026?.["شهري"] || "شهري"}
              </button>
            </div>
          </div>

          {loadingProgress ? (
            <div className="flex items-end gap-[3px] h-40 animate-pulse" dir="ltr">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 bg-muted rounded-t-sm" style={{ height: `${20 + (i * 10) % 70}%` }} />
              ))}
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">{t.student.noChartData || t.addedTranslations_2026?.["لا توجد بيانات بعد"] || "لا توجد بيانات بعد"}</div>
          ) : (
            <>
              <div className="flex items-end gap-[3px] h-40" dir="ltr">
                {chartData.map((d, i) => {
                  const total = d.newVerses + d.revisedVerses
                  const heightPct = (total / chartMax) * 100
                  const newPct = total > 0 ? (d.newVerses / total) * 100 : 0
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end group relative"
                      title={t.student.chartTooltip ? t.student.chartTooltip.replace('{new}', formatDigits(d.newVerses)).replace('{rev}', formatDigits(d.revisedVerses)) : (locale === "ar" ? `${d.date}: حفظ ${d.newVerses} + مراجعة ${d.revisedVerses}` : `${d.date}: New ${d.newVerses} · Review ${d.revisedVerses}`)}
                    >
                      <div
                        className="w-full rounded-t-sm overflow-hidden transition-all hover:opacity-80 cursor-pointer min-h-[2px]"
                        style={{ height: `${Math.max(heightPct, 1)}%` }}
                      >
                        <div className="w-full bg-emerald-500" style={{ height: `${newPct}%` }} />
                        <div className="w-full bg-amber-400" style={{ height: `${100 - newPct}%` }} />
                      </div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2 py-1 text-[9px] font-bold text-foreground shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                        {t.student.chartTooltip
                          ? t.student.chartTooltip.replace('{new}', formatDigits(d.newVerses)).replace('{rev}', formatDigits(d.revisedVerses))
                          : (locale === "ar"
                              ? `${formatDigits(d.newVerses)} حفظ · ${formatDigits(d.revisedVerses)} مراجعة`
                              : `${formatDigits(d.newVerses)} New · ${formatDigits(d.revisedVerses)} Rev`
                            )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">{t.student.chartNewHifz || t.addedTranslations_2026?.["حفظ جديد"] || "حفظ جديد"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                  <span className="text-[10px] text-muted-foreground">{t.student.chartReview || t.addedTranslations_2026?.["مراجعة"] || "مراجعة"}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Daily Memorization Log Form */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{t.student.dailyHifzLog || t.addedTranslations_2026?.["سجل الحفظ اليومي"] || "سجل الحفظ اليومي"}</h3>
              <p className="text-xs text-muted-foreground">{t.student.dailyLogDesc || t.addedTranslations_2026?.["سجّل كم آية حفظت وراجعت اليوم"] || "سجّل كم آية حفظت وراجعت اليوم"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.student.newHifzVerses || t.addedTranslations_2026?.["آيات حفظ جديدة"] || "آيات حفظ جديدة"}</label>
                <input
                  type="number"
                  min={0}
                  value={logNewVerses}
                  onChange={e => setLogNewVerses(e.target.value)}
                  placeholder={'٠'}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.student.reviewVerses || t.addedTranslations_2026?.["آيات مراجعة"] || "آيات مراجعة"}</label>
                <input
                  type="number"
                  min={0}
                  value={logRevisedVerses}
                  onChange={e => setLogRevisedVerses(e.target.value)}
                  placeholder={'٠'}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.student.surahOptional || 'السورة (اختياري)'}</label>
              <select
                value={logSurah}
                onChange={e => setLogSurah(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
              >
                <option value="">{t.student.selectSurahPlaceholder || '— اختر سورة —'}</option>
                {SURAHS.map(s => (
                  <option key={s.number} value={s.number}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.student.notesOptional || 'ملاحظات (اختياري)'}</label>
              <input
                type="text"
                value={logNotes}
                onChange={e => setLogNotes(e.target.value)}
                placeholder={t.student.notesPlaceholderLog || ('مثلاً: حفظت من سورة البقرة...')}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleLogSubmit}
              disabled={logSaving || (logNewVerses === "" && logRevisedVerses === "")}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {logSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : logSaved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t.student.logSavedSuccess || t.addedTranslations_2026?.["تم الحفظ"] || "تم الحفظ"}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t.student.saveLogBtn || t.addedTranslations_2026?.["تسجيل اليوم"] || "تسجيل اليوم"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ STUDENT PROGRESS REPORT ═══ */}
      {!loadingProgress && progress && (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">{t.student.progressReportTitle || t.addedTranslations_2026?.["تقرير التقدم"] || "تقرير التقدم"}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-muted/30">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {formatDigits(progress.consistency.activeDays30)}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{t.student.activeDayLast30 || 'يوم نشط (آخر ٣٠)'}</div>
              <div className="text-[10px] text-muted-foreground">{formatDigits(progress.consistency.percentage)}{t.student.consistencyRate || t.addedTranslations_2026?.["٪ انتظام"] || "٪ انتظام"}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatDigits(progress.thisWeek.newVerses)}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{t.student.versesThisWeek || t.addedTranslations_2026?.["آية حفظ هذا الأسبوع"] || "آية حفظ هذا الأسبوع"}</div>
              <div className="text-[10px] text-muted-foreground">{formatDigits(progress.thisWeek.activeDays)} {t.student.activeDaysUnit || t.addedTranslations_2026?.["أيام نشطة"] || "أيام نشطة"}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatDigits(progress.thisWeek.revisedVerses)}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{t.student.reviewVersesThisWeek || t.addedTranslations_2026?.["آية مراجعة هذا الأسبوع"] || "آية مراجعة هذا الأسبوع"}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {formatDigits(progress.totals.totalNewFromLog + progress.totals.totalRevFromLog)}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{t.student.totalLoggedVerses || t.addedTranslations_2026?.["إجمالي آيات مسجلة"] || "إجمالي آيات مسجلة"}</div>
              <div className="text-[10px] text-muted-foreground">
                {formatDigits(progress.totals.totalNewFromLog)} {t.student.chartNewHifz || ('حفظ')} + {formatDigits(progress.totals.totalRevFromLog)} {t.student.chartReview || ('مراجعة')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Prayer Times Widget */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sun className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-foreground">{t.student.prayerTimesTitle || t.addedTranslations_2026?.["مواقيت الصلاة"] || "مواقيت الصلاة"}</h3>
                {prayerTimes?.location && (
                  <p className="text-xs text-muted-foreground">{prayerTimes.location.city}</p>
                )}
              </div>
            </div>
            {prayerTimes?.nextPrayer && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t.student.upcomingPrayer || t.addedTranslations_2026?.["القادمة"] || "القادمة"}</p>
                <p className="text-sm font-bold text-primary">
                  {t.student[PRAYER_META[prayerTimes.nextPrayer.name?.toLowerCase()]?.labelKey as keyof typeof t.student] || prayerTimes.nextPrayer.name}
                </p>
              </div>
            )}
          </div>

          {loadingPrayer ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-3 md:px-4 py-2.5 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-muted" />
                    <div className="h-4 w-12 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-10 bg-muted rounded font-mono" />
                </div>
              ))}
            </div>
          ) : prayerTimes ? (
            <div className="space-y-2">
              {(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const).map((key) => {
                const meta = PRAYER_META[key]
                const Icon = meta.icon
                const isNext = prayerTimes.nextPrayer?.name?.toLowerCase() === key
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-xl px-3 md:px-4 py-2.5 transition-colors ${isNext
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "bg-muted/30 hover:bg-muted/60"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isNext ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-bold ${isNext ? "text-primary" : "text-foreground"}`}>
                        {t.student[meta.labelKey as keyof typeof t.student] || key}
                      </span>
                    </div>
                    <span className={`text-sm font-mono ${isNext ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {prayerTimes.timings[key]}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t.student.failedToGetPrayers || t.addedTranslations_2026?.["تعذر جلب مواقيت الصلاة"] || "تعذر جلب مواقيت الصلاة"}
            </div>
          )}
        </div>

        {/* Daily Wird Widget */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-foreground">{t.student.dailyWirdTitle || t.addedTranslations_2026?.["الورد اليومي"] || "الورد اليومي"}</h3>
                <p className="text-xs text-muted-foreground">
                  {loadingWird ? "…" : (t.student.wirdCompletedCount ? t.student.wirdCompletedCount.replace('{completed}', formatDigits(completedWird)).replace('{total}', formatDigits(wirdItems.length)) : (locale === "ar" ? `${completedWird}/${wirdItems.length} مكتمل` : `${completedWird}/${wirdItems.length} completed`))}
                </p>
              </div>
            </div>
            <Link href="/student/wird" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              {t.student.editWird || t.addedTranslations_2026?.["تعديل"] || "تعديل"}
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-muted rounded-full h-2 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-500 ease-in-out"
              style={{ width: `${wirdProgress}%` }}
            />
          </div>

          {loadingWird ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full flex items-center gap-3 rounded-xl px-3 md:px-4 py-3 bg-muted/30 border border-transparent">
                  <div className="w-5 h-5 rounded-md bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : wirdItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">{t.student.noWirdSet || t.addedTranslations_2026?.["لم تحدد ورداً يومياً بعد"] || "لم تحدد ورداً يومياً بعد"}</p>
              <Link
                href="/student/wird"
                className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.student.addWirdBtn || t.addedTranslations_2026?.["إضافة ورد يومي"] || "إضافة ورد يومي"}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {wirdItems.map((item) => {
                const checked = wirdDone[item.id] || false
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleWirdItem(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 md:px-4 py-3 transition-all border text-right ${checked
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-muted/30 border-transparent hover:bg-muted/60"
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"}`}>
                      {checked && <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <span className={`text-sm font-medium ${checked ? "line-through opacity-60" : ""}`}>
                        {item.label}
                      </span>
                      {item.detail && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            {t.student.wirdAutoResetNote || t.addedTranslations_2026?.["يتم إعادة تعيين الورد كل يوم تلقائياً"] || "يتم إعادة تعيين الورد كل يوم تلقائياً"}
          </p>
        </div>
      </div>

      {/* ═══ ADHKAR + ENROLLED PATHS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Morning/Evening Adhkar */}
        <AdhkarWidget />

        {/* My Learning Paths */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Route className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-foreground">{t.student.myLearningPaths || t.addedTranslations_2026?.["مساراتي التعليمية"] || "مساراتي التعليمية"}</h3>
                <p className="text-xs text-muted-foreground">
                  {t.student.activePathsCount ? t.student.activePathsCount.replace('{count}', formatDigits(paths.length)) : `${formatDigits(paths.length)} مسار نشط`}
                </p>
              </div>
            </div>
            <Link href="/student/tajweed-paths" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              {t.student.allPaths || t.all || t.addedTranslations_2026?.["الكل"] || "الكل"}
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          {paths.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">{t.student.noPathsJoined || t.addedTranslations_2026?.["لم تنضم إلى أي مسار بعد"] || "لم تنضم إلى أي مسار بعد"}</p>
              <Link
                href="/student/tajweed-paths"
                className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.student.browsePathsBtn || t.addedTranslations_2026?.["تصفّح المسارات"] || "تصفّح المسارات"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {paths.map((p) => {
                const total = p.total_stages || 0
                const done = p.stages_completed || 0
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <Link
                    key={p.id}
                    href={`/student/tajweed-paths/${p.id}`}
                    className="block p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {p.title}
                      </h4>
                      <span className="text-xs font-bold text-muted-foreground shrink-0">{formatDigits(pct)}{'٪'}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-indigo-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {total > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {t.student.fromStages
                          ? t.student.fromStages.replace('{done}', formatDigits(done)).replace('{total}', formatDigits(total))
                          : (locale === "ar" ? `من ${formatDigits(done)} مرحلة` : `out of ${formatDigits(done)} stage(s)`)}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-3">
            <Mic className="w-5 h-5 text-primary" />
            {t.student.recentActivity || t.addedTranslations_2026?.["النشاط الأخير"] || "النشاط الأخير"}
          </h3>
          <Link
            href="/student/recitations"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            {t.viewAll || t.addedTranslations_2026?.["عرض الكل"] || "عرض الكل"}
            <ChevronLeft className={`w-3.5 h-3.5 ${''}`} />
          </Link>
        </div>

        {loadingRecitations ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : recitations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-3">
              {t.student.noRecitationTitle || t.addedTranslations_2026?.["لم تسجّل تلاوتك بعد"] || "لم تسجّل تلاوتك بعد"}
            </p>
            <Link
              href="/student/submit"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Mic className="w-4 h-4" />
              {t.student.recordNowBtn || t.addedTranslations_2026?.["ابدأ التسميع"] || "ابدأ التسميع"}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recitations.slice(0, 4).map((rec) => (
              <Link
                key={rec.id}
                href={`/student/recitations/${rec.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{rec.surah_name || t.student.surahFatiha}</p>
                    <p className="text-[11px] text-muted-foreground">{formatRelative(rec.created_at)}</p>
                  </div>
                </div>
                <ChevronLeft className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ${''}`} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  gradient = false,
}: {
  icon: any
  label: string
  value: string
  accent: string
  gradient?: boolean
}) {
  const { t } = useI18n();
  const student = (t as any).student as Record<string, string> | undefined

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className={`text-xl md:text-2xl font-black ${gradient ? "text-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
