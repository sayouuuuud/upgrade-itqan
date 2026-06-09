"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, GraduationCap, CheckCircle2, ChevronDown, ChevronUp, Loader2,
  Lock, Mic, Play, Trophy, Unlock, FileText, Video, Target, BookOpen
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import AudioRecorder from "@/components/applicant/audio-recorder"
import TajweedPdfViewer from "@/components/tajweed/pdf-viewer"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { SURAHS } from "@/lib/data/surahs"
import { juzName, juzPageRange } from "@/lib/quran-data"

const toAr = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])

// Build the Arabic label describing what a recitation stage requires.
function recitationTarget(stage: {
  recitation_mode?: string | null
  surah_number?: number | null
  ayah_from?: number | null
  ayah_to?: number | null
  juz_number?: number | null
  page_from?: number | null
  page_to?: number | null
}): string {
  const surah = SURAHS.find((s) => s.number === stage.surah_number)
  switch (stage.recitation_mode) {
    case "surah":
      return surah ? `سورة ${surah.name} كاملة` : "سورة كاملة"
    case "ayah":
      return surah ? `سورة ${surah.name} — الآيات ${toAr(stage.ayah_from || 1)} إلى ${toAr(stage.ayah_to || 1)}` : "آيات محددة"
    case "juz":
      return juzName(stage.juz_number || 1)
    case "page":
      return stage.page_from === stage.page_to ? `صفحة ${toAr(stage.page_from || 1)}` : `الصفحات ${toAr(stage.page_from || 1)} إلى ${toAr(stage.page_to || 1)}`
    default:
      return "تلاوة"
  }
}

// Fetches and displays the required ayah text for a recitation stage.
type AyahData = { numberInSurah: number; text: string; surahNumber: number }

function StageAyahText({ stage }: { stage: Stage }) {
  const [ayahs, setAyahs] = useState<AyahData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const mode = stage.recitation_mode
    if (!mode) return
    setLoading(true)
    setError(false)
    setAyahs([])
    const controller = new AbortController()

    // Resolve a list of pages to fetch (juz/page modes) or a surah ayah-range.
    if (mode === "surah" || mode === "ayah") {
      const surahNumber = stage.surah_number || 1
      const surah = SURAHS.find((s) => s.number === surahNumber)
      const from = mode === "ayah" ? (stage.ayah_from || 1) : 1
      const to = mode === "ayah" ? (stage.ayah_to || 1) : (surah?.verses || 1)
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          if (data?.data?.ayahs) {
            const slice: AyahData[] = (data.data.ayahs as Array<{ numberInSurah: number; text: string }>)
              .filter((a) => a.numberInSurah >= from && a.numberInSurah <= to)
              .map((a) => ({ numberInSurah: a.numberInSurah, text: a.text, surahNumber }))
            setAyahs(slice)
            if (slice.length === 0) setError(true)
          } else setError(true)
        })
        .catch((e) => { if (e.name !== "AbortError") setError(true) })
        .finally(() => setLoading(false))
    } else {
      let pageFrom: number, pageTo: number
      if (mode === "juz") {
        const range = juzPageRange(stage.juz_number || 1)
        pageFrom = range?.from || 1
        pageTo = range?.to || 1
      } else {
        pageFrom = stage.page_from || 1
        pageTo = stage.page_to || 1
      }
      const pages = Array.from({ length: Math.max(0, pageTo - pageFrom) + 1 }, (_, i) => pageFrom + i)
      Promise.all(
        pages.map((p) =>
          fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`, { signal: controller.signal }).then((r) => r.json())
        )
      )
        .then((results) => {
          const all: AyahData[] = []
          for (const data of results) {
            if (data?.data?.ayahs) {
              for (const a of data.data.ayahs as Array<{ numberInSurah: number; text: string; surah: { number: number } }>) {
                all.push({ numberInSurah: a.numberInSurah, text: a.text, surahNumber: a.surah.number })
              }
            }
          }
          setAyahs(all)
          if (all.length === 0) setError(true)
        })
        .catch((e) => { if (e.name !== "AbortError") setError(true) })
        .finally(() => setLoading(false))
    }
    return () => controller.abort()
  }, [stage.recitation_mode, stage.surah_number, stage.ayah_from, stage.ayah_to, stage.juz_number, stage.page_from, stage.page_to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-amber-700/70">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-bold">جاري تحميل نص الآيات...</span>
      </div>
    )
  }
  if (error) {
    return <p className="text-xs text-center text-muted-foreground py-4">تعذّر تحميل نص الآيات. تحقق من اتصالك بالإنترنت.</p>
  }
  if (ayahs.length === 0) return null
  return (
    <div className="overflow-y-auto max-h-[18rem] pr-1" style={{ direction: "rtl" }}>
      <p
        className="leading-loose text-xl sm:text-2xl text-slate-800 dark:text-slate-100 text-justify pt-1"
        style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
      >
        {ayahs.map((a, idx) => (
          <span key={`${a.surahNumber}-${a.numberInSurah}-${idx}`}>
            {idx > 0 ? " " : ""}
            {a.text}{" "}
            <span className="inline-block align-middle text-base font-black text-amber-700 dark:text-amber-500 mx-0.5" style={{ fontFamily: "system-ui, sans-serif" }}>
              ﴿{toAr(a.numberInSurah)}﴾
            </span>
          </span>
        ))}
      </p>
    </div>
  )
}

type ProgressRow = {
  id?: string
  status: "locked" | "unlocked" | "in_progress" | "completed"
  audio_url?: string | null
  recitation_id?: string | null
  notes?: string | null
  started_at?: string | null
  completed_at?: string | null
}

type Stage = {
  id: string
  position: number
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  pdf_url: string | null
  passage_text: string | null
  estimated_minutes: number
  halaqa_name?: string | null
  halaqa_id?: string | null
  stage_type?: string | null
  recitation_mode?: string | null
  surah_number?: number | null
  ayah_from?: number | null
  ayah_to?: number | null
  juz_number?: number | null
  page_from?: number | null
  page_to?: number | null
  progress?: ProgressRow
}

export default function StudentTajweedPathDetail() {
  const params = useParams<{ id: string }>()
  const pathId = params.id
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths || {}

  const [path, setPath] = useState<any>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  const [completeDialog, setCompleteDialog] = useState<Stage | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}`)
      const data = await res.json()
      if (res.ok) {
        setPath(data.path)
        setStages(data.stages || [])
        setEnrollment(data.enrollment || null)
        const next = (data.stages || []).find(
          (s: Stage) => s.progress?.status !== "completed",
        )
        if (next) setExpandedStage(next.id)
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (pathId) load() }, [pathId])

  async function enroll() {
    setEnrolling(true)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}/enroll`, { method: "POST" })
      if (res.ok) await load()
    } finally {
      setEnrolling(false)
    }
  }

  async function startStage(stage: Stage) {
    if (!enrollment) return
    if (stage.progress?.status === "locked") return
    if (stage.progress?.status === "unlocked") {
      await fetch(
        `/api/student/tajweed-paths/${pathId}/stages/${stage.id}/start`,
        { method: "POST" },
      )
      await load()
    }
  }

  function openComplete(stage: Stage) {
    setCompleteDialog(stage)
    setAudioUrl(stage.progress?.audio_url || null)
  }

  async function submitComplete() {
    if (!completeDialog) return
    setSubmitting(true)
    try {
      const body: any = {}
      if (audioUrl) body.audio_url = audioUrl
      const res = await fetch(
        `/api/student/tajweed-paths/${pathId}/stages/${completeDialog.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || tp.detail.completeFailed)
        return
      }
      setCompleteDialog(null)
      setAudioUrl(null)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!path) return <div className="p-6 text-center text-muted-foreground">{tp.notFound}</div>

  const completed = enrollment?.stages_completed || 0
  const total = path.total_stages || stages.length || 1
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="space-y-8 pb-12">
      <Link 
        href="/student/tajweed-paths"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-emerald-600 bg-muted/50 hover:bg-emerald-50 rounded-xl transition-colors w-fit border border-transparent hover:border-emerald-200"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {tp.actions.backToPaths}
      </Link>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="p-6 sm:p-8 relative z-10">
          <div className="flex items-start justify-between gap-6 flex-wrap lg:flex-nowrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                  <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                {path.level && (
                  <span className="px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border border-border/50">
                    {tp.levels[path.level] || path.level}
                  </span>
                )}
                {path.require_audio && (
                  <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-200 dark:border-amber-500/20">
                    <Mic className="h-3.5 w-3.5" /> {tp.metadata.requireAudioBadge}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-black text-foreground mb-3 leading-tight">
                {path.title}
              </h1>
              
              {path.description && (
                <p className="text-base text-muted-foreground leading-relaxed max-w-3xl mb-6">
                  {path.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold">{path.total_stages} {tp.metadata.stagesUnit}</span>
                </div>
                {path.estimated_days && (
                  <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold">{path.estimated_days} {tp.metadata.estimatedDays}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress / Action Area */}
            <div className="w-full lg:w-80 shrink-0 bg-muted/30 rounded-2xl p-6 border border-border/50">
              {!enrollment ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white dark:bg-background rounded-full flex items-center justify-center mx-auto shadow-sm border border-border">
                    <Lock className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg mb-1">جاهز للبدء؟</h3>
                    <p className="text-sm text-muted-foreground">
                      {tp.detail.enrollPrompt}
                    </p>
                  </div>
                  <Button 
                    onClick={enroll} 
                    disabled={enrolling} 
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all rounded-xl h-12 text-base font-bold"
                  >
                    {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    {tp.actions.startPath}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold text-muted-foreground">{tp.metadata.yourProgress}</span>
                      <div className="text-end">
                        <span className="text-2xl font-black text-foreground">{completed}</span>
                        <span className="text-sm font-bold text-muted-foreground">/{total} {tp.metadata.stagesUnit}</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 relative"
                        style={{ width: `${pct}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
                      </div>
                    </div>
                    <div className="mt-2 text-end text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {pct}% مكتمل
                    </div>
                  </div>

                  {enrollment.status === "completed" && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Trophy className="h-5 w-5 text-emerald-50" />
                      </div>
                      <div>
                        <div className="font-black">مبارك الإتمام!</div>
                        <div className="text-xs text-emerald-100 font-medium mt-0.5">{tp.metadata.pathCompleteCelebration}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-emerald-600" />
          محتوى المسار
        </h2>
        
        {stages.map(stage => {
          const status = stage.progress?.status || "locked"
          const isLocked = !enrollment || status === "locked"
          const isCompleted = status === "completed"
          const isExpanded = expandedStage === stage.id

          return (
            <div
              key={stage.id}
              className={cn(
                "group rounded-2xl border transition-all duration-300 relative overflow-hidden",
                isExpanded ? "bg-card shadow-md border-emerald-500/30" : "bg-card border-border/60 hover:border-border hover:shadow-sm",
                isCompleted && !isExpanded && "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30",
                isLocked && "opacity-75"
              )}
            >
              {isExpanded && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
              )}
              
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return
                  setExpandedStage(isExpanded ? null : stage.id)
                  if (!isExpanded) startStage(stage)
                }}
                disabled={isLocked}
                className="w-full text-start p-4 sm:p-5 flex items-center gap-4 disabled:cursor-not-allowed outline-none"
              >
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors border",
                    isCompleted
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                      : isLocked
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" />
                    : isLocked ? <Lock className="h-5 w-5" />
                    : <span className="font-black text-lg">{stage.position}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {!isLocked && !isCompleted && status === "unlocked" && (
                      <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-500/20">
                        <Unlock className="w-3 h-3" /> {tp.statuses.inProgress}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {tp.statuses.completed}
                      </span>
                    )}
                    {status === "in_progress" && (
                      <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-500/20">
                        <Target className="w-3 h-3" /> {tp.statuses.inProgress}
                      </span>
                    )}
                  </div>
                  <div className="font-black text-lg text-foreground truncate group-hover:text-emerald-600 transition-colors">
                    {stage.title}
                  </div>
                  {stage.description && !isExpanded && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1 opacity-80">
                      {stage.description}
                    </div>
                  )}
                </div>

                {!isLocked && (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300",
                    isExpanded ? "bg-muted rotate-180" : "bg-muted/50 group-hover:bg-muted"
                  )}>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </button>

              {isExpanded && !isLocked && (
                <div className="border-t border-border/50 bg-muted/10 p-5 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="max-w-4xl space-y-8">
                    {stage.description && (
                      <div className="text-base text-muted-foreground leading-relaxed">
                        {stage.description}
                      </div>
                    )}

                    {stage.stage_type === "recitation" && (
                      <div className="bg-[#fbf6e6] dark:bg-card border border-amber-700/25 dark:border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Mic className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                          <span className="text-sm font-bold text-amber-900 dark:text-amber-200">المطلوب تلاوته</span>
                          <span className="text-[11px] font-bold bg-amber-700/10 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                            {recitationTarget(stage)}
                          </span>
                        </div>
                        <StageAyahText stage={stage} />
                      </div>
                    )}

                    {stage.content && (
                      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <BookOpen className="w-4 h-4" />
                          {tp.detail.learningContent}
                        </h4>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {stage.content}
                        </div>
                      </div>
                    )}

                    {stage.video_url && (
                      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Video className="w-4 h-4" />
                          {tp.detail.videoTutorial}
                        </h4>
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                          <video src={stage.video_url} controls className="w-full h-full" />
                        </div>
                      </div>
                    )}

                    {stage.pdf_url && (
                      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <FileText className="w-4 h-4" />
                          {tp.detail.pdfFile}
                        </h4>
                        <div className="rounded-xl overflow-hidden border border-border/50">
                          <TajweedPdfViewer src={stage.pdf_url} label={`${tp.detail.pdfFile} — ${stage.title}`} />
                        </div>
                      </div>
                    )}

                    {stage.passage_text && (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Mic className="w-4 h-4" />
                          {tp.detail.practicePassage}
                        </h4>
                        <div className="text-lg whitespace-pre-wrap leading-loose font-serif text-foreground/90 p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                          {stage.passage_text}
                        </div>
                      </div>
                    )}

                    {stage.halaqa_name && stage.halaqa_id && (
                      <div className="relative group overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-900/10 p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30">
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-3xl rounded-full -z-10 group-hover:bg-emerald-500/20 transition-all duration-500" />
                        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md transform group-hover:scale-105 transition-transform duration-300">
                            <GraduationCap className="w-7 h-7" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 uppercase">
                                حلقة تطبيقية
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-foreground truncate mb-1">
                              {stage.halaqa_name}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              انضم إلى هذه الحلقة المباشرة لتعزيز فهمك والتطبيق العملي مع نخبة من المقرئين المعتمدين.
                            </p>
                          </div>
                          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                            <Link
                              href={`/student/halaqat/${stage.halaqa_id}`}
                              className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md hover:shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 group/btn"
                            >
                              الانضمام للحلقة
                              <ArrowRight className="w-4 h-4 ml-0 mr-2 rtl:rotate-180 transform group-hover/btn:-translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {stage.progress?.audio_url && (
                      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Mic className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-sm">{tp.detail.yourPreviousRecording}</span>
                        </div>
                        <audio src={stage.progress.audio_url} controls className="w-full h-10" />
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap gap-3">
                      {!isCompleted ? (
                        <Button 
                          onClick={() => openComplete(stage)} 
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          {tp.actions.completeStage}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => openComplete(stage)} 
                          variant="outline" 
                          className="gap-2 rounded-xl bg-background"
                        >
                          <Mic className="h-4 w-4" />
                          {tp.actions.updateRecording}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={!!completeDialog} onOpenChange={v => !v && setCompleteDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tp.detail.completeDialogTitle}: {completeDialog?.title}</DialogTitle>
            <DialogDescription>
              {path.require_audio
                ? tp.detail.requireAudioDescription
                : tp.detail.optionalAudioDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {completeDialog?.passage_text && (
              <div className="border-e-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-md text-sm whitespace-pre-wrap leading-loose font-serif">
                {completeDialog.passage_text}
              </div>
            )}
            <AudioRecorder
              value={audioUrl}
              onChange={setAudioUrl}
              maxSeconds={600}
              label={tp.detail.audioRecorderLabel}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleteDialog(null)}>{tp.actions.cancel}</Button>
            <Button
              onClick={submitComplete}
              disabled={submitting || (path.require_audio && !audioUrl)}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              {tp.actions.pass}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
