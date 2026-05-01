"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Mic, FileText, Clock, CheckCircle, Calendar, Loader2, ChevronLeft, Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useMemo } from "react"

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
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.student.myRecitations}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.student.myRecitationsDesc}</p>
        </div>
        <Link
          href="/student/submit"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary-foreground/15">
            <Plus className="w-3.5 h-3.5" />
          </span>
          {t.student.newRecitation || "تسميع جديد"}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === f.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <FileText className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-medium">{t.noResults}</p>
          <p className="text-muted-foreground/60 text-sm mt-1">{t.student.noRecitationDesc}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rec => {
            const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.pending
            const Icon = cfg.icon
            return (
              <div key={rec.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{rec.surah_name || t.student.surahFatiha}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(rec.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: "numeric", month: "short", day: "numeric" })}</span>
                        {rec.audio_duration_seconds && <span>• {formatDuration(rec.audio_duration_seconds)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>

                    <Link
                      href={`/student/recitations/${rec.id}`}
                      className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                      {t.student.viewRecitation}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
