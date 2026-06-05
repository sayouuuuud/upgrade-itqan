"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Mic, FileText, Clock, CheckCircle, Calendar, Loader2, ChevronLeft, Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

type Recitation = {
  id: string
  surah_name: string
  status: string
  created_at: string
  audio_duration_seconds: number | null
  audio_url: string | null
}

// Status config moved inside component to use translations

export default function StudentRecitationsPage() {
  const { t, locale } = useI18n()
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/recitations")
      .then(r => r.json())
      .then(d => setRecitations(d.recitations || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = useMemo(() => ({
    pending: { label: t.student.statusPending, color: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20", icon: Clock },
    in_review: { label: t.student.statusInReview, color: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20", icon: Clock },
    mastered: { label: t.student.statusMastered, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle },
    needs_session: { label: t.student.statusNeedsSession, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Calendar },
    session_booked: { label: t.student.statusBooked, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: Calendar },
  }), [t])

  const filters = [
    { value: "all", label: t.all },
    { value: "pending", label: t.student.statusPending },
    { value: "mastered", label: t.student.statusMastered },
    { value: "needs_session", label: t.student.statusNeedsSession },
    { value: "session_booked", label: t.student.statusBooked },
  ]

  const filtered = filter === "all" ? recitations : recitations.filter(r =>
    filter === "pending" ? (r.status === "pending" || r.status === "in_review") : r.status === filter
  )

  const formatDuration = (secs: number | null) => {
    if (!secs) return ""
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 text-white p-8 sm:p-10 shadow-xl border border-emerald-500/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Mic className="w-8 h-8 text-emerald-100" />
              </div>
              {t.student.myRecitations}
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              {t.student.myRecitationsDesc}
            </p>
          </div>
          
          <Link
            href="/student/submit"
            className="group relative inline-flex items-center justify-center gap-3 bg-white text-emerald-700 px-6 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 self-start sm:self-auto overflow-hidden shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 shadow-sm group-hover:rotate-90 transition-transform duration-500">
              <Plus className="w-5 h-5" />
            </span>
            <span className="relative z-10 text-base">{t.student.newRecitation || "تسميع جديد"}</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap",
              filter === f.value
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-sm"
                : "bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm">جاري تحميل التسميعات...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl py-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mic className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-bold text-foreground">{t.noResults}</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{t.student.noRecitationDesc}</p>
          <button 
            onClick={() => setFilter('all')}
            className="mt-6 px-6 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl font-bold transition-colors"
          >
            عرض الكل
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(rec => {
            const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.pending
            const Icon = cfg.icon
            return (
              <div key={rec.id} className="group bg-card border border-border/60 rounded-3xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                {/* Decorative side accent */}
                <div className={cn("absolute right-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity", cfg.color.split(' ')[0])} />

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 flex items-center justify-center shrink-0 shadow-inner border border-emerald-100 dark:border-emerald-900/50">
                    <Mic className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">{rec.surah_name || t.student.surahFatiha}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(rec.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      {rec.audio_duration_seconds && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {formatDuration(rec.audio_duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className={cn(`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm`, cfg.color)}>
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </div>

                  <Link
                    href={`/student/recitations/${rec.id}`}
                    className="flex items-center justify-center bg-muted hover:bg-emerald-600 text-foreground hover:text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-emerald-600/30"
                  >
                    {t.student.viewRecitation}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
