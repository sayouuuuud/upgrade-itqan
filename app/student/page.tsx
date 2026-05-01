"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Mic, FileText, Clock, CheckCircle, Calendar, Award,
  ChevronLeft, Sun, Sunrise, Sunset, Moon, MoonStar,
  BookOpen, Plus, Sparkles, TrendingUp, Loader2
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Progress } from "@/components/ui/progress"

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

const DEFAULT_WIRD = [
  { id: "fajr-azkar", label: "أذكار الصباح" },
  { id: "wird-quran", label: "ورد قرآني (نصف جزء)" },
  { id: "isha-azkar", label: "أذكار المساء" },
  { id: "witr", label: "صلاة الوتر" },
]

const PRAYER_META: Record<string, { label: string; icon: any }> = {
  fajr: { label: "الفجر", icon: Sunrise },
  sunrise: { label: "الشروق", icon: Sun },
  dhuhr: { label: "الظهر", icon: Sun },
  asr: { label: "العصر", icon: Sunset },
  maghrib: { label: "المغرب", icon: Moon },
  isha: { label: "العشاء", icon: MoonStar },
}

export default function StudentDashboard() {
  const { t, locale } = useI18n()
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [loadingRecitations, setLoadingRecitations] = useState(true)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [loadingPrayer, setLoadingPrayer] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [wirdDone, setWirdDone] = useState<Record<string, boolean>>({})

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

    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const total = recitations.length
    const mastered = recitations.filter((r) => r.status === "mastered" || r.status === "approved").length
    const inReview = recitations.filter((r) => r.status === "pending" || r.status === "in_review").length
    const last = recitations[0] || null
    return { total, mastered, inReview, last }
  }, [recitations])

  const level = useMemo(() => {
    if (stats.mastered >= 10) return { name: "متقدم", color: "from-emerald-500 to-teal-600" }
    if (stats.mastered >= 5) return { name: "متوسط", color: "from-amber-500 to-orange-600" }
    if (stats.mastered >= 1) return { name: "مبتدئ", color: "from-sky-500 to-blue-600" }
    return { name: "جديد", color: "from-slate-400 to-slate-600" }
  }, [stats.mastered])

  const progressValue = useMemo(() => {
    const target = stats.mastered >= 10 ? 100 : stats.mastered >= 5 ? Math.min(100, ((stats.mastered - 5) / 5) * 100 + 50) : Math.min(50, (stats.mastered / 5) * 50)
    return Math.round(target)
  }, [stats.mastered])

  const lastStatusLabel = useMemo(() => {
    if (!stats.last) return t.student.noRecitationTitle || "لا توجد تلاوات بعد"
    const map: Record<string, string> = {
      pending: t.student.statusPending || "قيد المراجعة",
      in_review: t.student.statusInReview || "قيد المراجعة",
      mastered: t.student.statusMastered || "متقن",
      approved: t.student.statusMastered || "متقن",
      needs_session: t.student.statusNeedsSession || "تحتاج جلسة",
      session_booked: t.student.statusBooked || "تم الحجز",
    }
    return map[stats.last.status] || stats.last.status
  }, [stats.last, t])

  const formatRelative = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1) return t.now || "الآن"
    if (m < 60) return `${t.minutesAgo || "منذ"} ${m} د`
    if (h < 24) return `${t.hoursAgo || "منذ"} ${h} س`
    return `${t.daysAgo || "منذ"} ${d} يوم`
  }

  const completedWird = Object.values(wirdDone).filter(Boolean).length
  const wirdProgress = Math.round((completedWird / DEFAULT_WIRD.length) * 100)

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6 md:space-y-8">
      {/* Header / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">
            {t.student.welcome || "مرحباً"}
          </p>
          <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">
            {userName ? `${t.student.welcome || "مرحباً"}، ${userName}` : (t.student.dashboard || "لوحة الطالب")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t.student.welcomeDesc || "تابع تقدمك في تلاوة القرآن الكريم"}
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
          <span className="text-sm md:text-base">{t.student.newRecitation || "تسميع جديد"}</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={FileText}
          label={t.student.totalSubmissions || "إجمالي التسميعات"}
          value={loadingRecitations ? "…" : stats.total.toString()}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={CheckCircle}
          label={t.student.masteredSurahs || "متقنة"}
          value={loadingRecitations ? "…" : stats.mastered.toString()}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Clock}
          label={t.student.underReview || "قيد المراجعة"}
          value={loadingRecitations ? "…" : stats.inReview.toString()}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Award}
          label="المستوى الحالي"
          value={level.name}
          accent={`bg-gradient-to-br ${level.color} text-white`}
          gradient
        />
      </div>

      {/* Progress Card */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground">{t.student.progressTitle || "تقدمك"}</h3>
              <p className="text-xs text-muted-foreground">{progressValue}% {locale === "ar" ? "من الرحلة" : "of the journey"}</p>
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
          <span>{stats.mastered} {locale === "ar" ? "تلاوة متقنة" : "mastered"}</span>
          <span>{lastStatusLabel}</span>
        </div>
      </div>

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
                <h3 className="text-base md:text-lg font-bold text-foreground">مواقيت الصلاة</h3>
                {prayerTimes?.location && (
                  <p className="text-xs text-muted-foreground">{prayerTimes.location.city}</p>
                )}
              </div>
            </div>
            {prayerTimes?.nextPrayer && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">القادمة</p>
                <p className="text-sm font-bold text-primary">
                  {PRAYER_META[prayerTimes.nextPrayer.name?.toLowerCase()]?.label || prayerTimes.nextPrayer.name}
                </p>
              </div>
            )}
          </div>

          {loadingPrayer ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                        {meta.label}
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
              تعذر جلب مواقيت الصلاة
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
                <h3 className="text-base md:text-lg font-bold text-foreground">الورد اليومي</h3>
                <p className="text-xs text-muted-foreground">
                  {completedWird}/{DEFAULT_WIRD.length} مكتمل
                </p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>

          {/* Wird progress bar with smooth animation */}
          <div className="bg-muted rounded-full h-2 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-500 ease-in-out"
              style={{ width: `${wirdProgress}%` }}
            />
          </div>

          <div className="space-y-2">
            {DEFAULT_WIRD.map((item) => {
              const checked = wirdDone[item.id] || false
              return (
                <button
                  key={item.id}
                  onClick={() => setWirdDone((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 md:px-4 py-3 transition-all border ${checked
                    ? "bg-emerald-500/5 border-emerald-500/30 text-foreground"
                    : "bg-muted/30 border-transparent hover:bg-muted/60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"
                      }`}>
                      {checked && <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-medium ${checked ? "line-through opacity-70" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            يتم إعادة تعيين الورد كل يوم تلقائياً
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-3">
            <Mic className="w-5 h-5 text-primary" />
            {t.student.recentActivity || "النشاط الأخير"}
          </h3>
          <Link
            href="/student/recitations"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            {t.viewAll || "عرض الكل"}
            <ChevronLeft className={`w-3.5 h-3.5 ${locale === "ar" ? "" : "rotate-180"}`} />
          </Link>
        </div>

        {loadingRecitations ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : recitations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-3">
              {t.student.noRecitationTitle || "لم تسجّل تلاوتك بعد"}
            </p>
            <Link
              href="/student/submit"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Mic className="w-4 h-4" />
              {t.student.recordNowBtn || "ابدأ التسميع"}
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
                <ChevronLeft className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ${locale === "ar" ? "" : "rotate-180"}`} />
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
