"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Loader2,
  Lock, Mic, Play, Target, Trophy, Unlock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import AudioRecorder from "@/components/applicant/audio-recorder"
import { cn } from "@/lib/utils"

type ProgressRow = {
  id: string
  status: "locked" | "unlocked" | "in_progress" | "completed"
  audio_url: string | null
  recitation_id: string | null
  attempts: number
  started_at: string | null
  completed_at: string | null
}

type Unit = {
  id: string
  position: number
  unit_type: string
  juz_number: number | null
  surah_number: number | null
  hizb_number: number | null
  page_from: number | null
  page_to: number | null
  title: string
  description: string | null
  estimated_minutes: number
  progress?: ProgressRow
}

type Recitation = {
  id: string
  surah_name: string | null
  surah_number: number | null
  ayah_from: number | null
  ayah_to: number | null
  audio_url: string | null
  status: string
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  juz: "جزء", surah: "سورة", hizb: "حزب", page: "صفحة", custom: "مخصصة",
}

export default function StudentMemorizationPathDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const pathId = params.id

  const [path, setPath] = useState<any>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)

  // Mark complete dialog
  const [completeDialog, setCompleteDialog] = useState<Unit | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [linkRecitationId, setLinkRecitationId] = useState<string>("")
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [recitationsLoading, setRecitationsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<"record" | "link">("record")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/memorization-paths/${pathId}`)
      const data = await res.json()
      if (res.ok) {
        setPath(data.path)
        setUnits(data.units || [])
        setEnrollment(data.enrollment || null)
        // Auto-expand first non-completed unit
        const next = (data.units || []).find(
          (u: Unit) => u.progress?.status !== "completed",
        )
        if (next) setExpandedUnit(next.id)
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (pathId) load() }, [pathId])

  async function loadRecitations() {
    setRecitationsLoading(true)
    try {
      const res = await fetch("/api/recitations")
      const data = await res.json()
      const list: Recitation[] = data.recitations || data || []
      setRecitations(list.filter(r => !!r.audio_url))
    } catch {
      setRecitations([])
    } finally {
      setRecitationsLoading(false)
    }
  }

  async function enroll() {
    setEnrolling(true)
    try {
      const res = await fetch(`/api/student/memorization-paths/${pathId}/enroll`, {
        method: "POST",
      })
      if (res.ok) await load()
    } finally {
      setEnrolling(false)
    }
  }

  async function startUnit(unit: Unit) {
    if (!enrollment) return
    if (unit.progress?.status === "locked") return
    if (unit.progress?.status === "unlocked") {
      await fetch(
        `/api/student/memorization-paths/${pathId}/units/${unit.id}/start`,
        { method: "POST" },
      )
      await load()
    }
  }

  function openComplete(unit: Unit) {
    setCompleteDialog(unit)
    setAudioUrl(unit.progress?.audio_url || null)
    setLinkRecitationId(unit.progress?.recitation_id || "")
    setTab("record")
    if (recitations.length === 0) loadRecitations()
  }

  async function submitComplete() {
    if (!completeDialog) return
    setSubmitting(true)
    try {
      const body: any = {}
      if (tab === "record" && audioUrl) body.audio_url = audioUrl
      if (tab === "link" && linkRecitationId) body.recitation_id = linkRecitationId

      const res = await fetch(
        `/api/student/memorization-paths/${pathId}/units/${completeDialog.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "تعذّر إتمام الوحدة")
        return
      }
      setCompleteDialog(null)
      setAudioUrl(null)
      setLinkRecitationId("")
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!path) {
    return (
      <div className="p-6 text-center text-muted-foreground">المسار غير موجود.</div>
    )
  }

  const completed = enrollment?.units_completed || 0
  const total = path.total_units || 1
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto pb-12">
      <Link 
        href="/student/memorization-paths"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-emerald-600 bg-muted/50 hover:bg-emerald-50 rounded-xl transition-colors w-fit border border-transparent hover:border-emerald-200"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع للمسارات
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
                  <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                {path.level && (
                  <span className="px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border border-border/50">
                    {path.level}
                  </span>
                )}
                {path.require_audio && (
                  <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-200 dark:border-amber-500/20">
                    <Mic className="h-3.5 w-3.5" /> يتطلب تسجيل صوتي
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
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold">{path.total_units} وحدة</span>
                </div>
                {path.estimated_days && (
                  <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold">{path.estimated_days} يوماً متوقع</span>
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
                      اشترك في المسار لتبدأ الحفظ، وستفتح الوحدة الأولى مباشرة.
                    </p>
                  </div>
                  <Button 
                    onClick={enroll} 
                    disabled={enrolling} 
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all rounded-xl h-12 text-base font-bold"
                  >
                    {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    ابدأ المسار الآن
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold text-muted-foreground">التقدم الإجمالي</span>
                      <div className="text-end">
                        <span className="text-2xl font-black text-foreground">{completed}</span>
                        <span className="text-sm font-bold text-muted-foreground">/{total} وحدة</span>
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
                        <div className="text-xs text-emerald-100 font-medium mt-0.5">لقد أتممت هذا المسار بنجاح.</div>
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
          <BookOpen className="w-5 h-5 text-emerald-600" />
          محتوى المسار
        </h2>
        
        {units.map(unit => {
          const status = unit.progress?.status || "locked"
          const isLocked = !enrollment || status === "locked"
          const isCompleted = status === "completed"
          const isExpanded = expandedUnit === unit.id

          return (
            <div
              key={unit.id}
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
                  setExpandedUnit(isExpanded ? null : unit.id)
                  if (!isExpanded) startUnit(unit)
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
                    : <span className="font-black text-lg">{unit.position}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      الوحدة {unit.position}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground border border-border/50 px-2 py-0.5 rounded-md">
                      {TYPE_LABELS[unit.unit_type] || unit.unit_type}
                    </span>
                    {isCompleted && (
                      <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> مكتمل
                      </span>
                    )}
                    {status === "in_progress" && (
                      <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-500/20">
                        <Target className="w-3 h-3" /> قيد العمل
                      </span>
                    )}
                  </div>
                  <div className="font-black text-lg text-foreground truncate group-hover:text-emerald-600 transition-colors">
                    {unit.title}
                  </div>
                  {unit.description && !isExpanded && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1 opacity-80">
                      {unit.description}
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
                  <div className="max-w-3xl space-y-6">
                    {unit.description && (
                      <div className="text-base text-muted-foreground leading-relaxed">
                        {unit.description}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                          <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-bold">المدة المتوقعة</div>
                          <div className="font-black">{unit.estimated_minutes} دقيقة</div>
                        </div>
                      </div>
                      
                      {unit.progress?.attempts ? (
                        <div className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground font-bold">المحاولات السابقة</div>
                            <div className="font-black">{unit.progress.attempts} محاولات</div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {unit.progress?.audio_url && (
                      <div className="bg-background border border-border p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Mic className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-sm">تسجيلك المعتمد لهذه الوحدة</span>
                        </div>
                        <audio src={unit.progress.audio_url} controls className="w-full h-10" />
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap gap-3">
                      {!isCompleted && (
                        <Button 
                          onClick={() => openComplete(unit)} 
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          إتمام الوحدة
                        </Button>
                      )}
                      {isCompleted && (
                        <Button 
                          onClick={() => openComplete(unit)} 
                          variant="outline" 
                          className="gap-2 rounded-xl bg-background"
                        >
                          <Mic className="h-4 w-4" />
                          تحديث التسجيل
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
            <DialogTitle>
              إتمام الوحدة: {completeDialog?.title}
            </DialogTitle>
            <DialogDescription>
              {path.require_audio
                ? "يلزم تسجيل صوتي قبل إتمام الوحدة — سجّل تسجيلاً جديداً أو اربط تسجيلاً سابقاً."
                : "يمكنك تسجيل صوت لإثبات الحفظ أو ربط تسجيل سابق (اختياري)، ثم اضغط إتمام."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2 border rounded-lg p-1 bg-muted/40">
              <button
                type="button"
                onClick={() => setTab("record")}
                className={
                  "flex-1 py-1.5 px-2 text-sm rounded-md transition " +
                  (tab === "record" ? "bg-background shadow font-semibold" : "text-muted-foreground")
                }
              >
                <Mic className="h-3.5 w-3.5 inline-block ms-1" /> تسجيل جديد
              </button>
              <button
                type="button"
                onClick={() => setTab("link")}
                className={
                  "flex-1 py-1.5 px-2 text-sm rounded-md transition " +
                  (tab === "link" ? "bg-background shadow font-semibold" : "text-muted-foreground")
                }
              >
                <Target className="h-3.5 w-3.5 inline-block ms-1" /> ربط تلاوة سابقة
              </button>
            </div>

            {tab === "record" ? (
              <AudioRecorder
                value={audioUrl}
                onChange={setAudioUrl}
                maxSeconds={600}
                label="سجّل تلاوة الوحدة"
              />
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  اختر إحدى تسجيلاتك السابقة لربطها بهذه الوحدة:
                </p>
                {recitationsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
                  </div>
                ) : recitations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    لا توجد تسجيلات سابقة لربطها — استخدم التسجيل المباشر بدلاً من ذلك.
                  </p>
                ) : (
                  <Select value={linkRecitationId} onValueChange={setLinkRecitationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر تسجيلاً..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recitations.slice(0, 50).map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.surah_name || `سورة ${r.surah_number || ""}`}
                          {r.ayah_from ? ` — آية ${r.ayah_from}${r.ayah_to ? `-${r.ayah_to}` : ""}` : ""}
                          {" — "}
                          {new Date(r.created_at).toLocaleDateString("ar-EG")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {linkRecitationId && (() => {
                  const r = recitations.find(x => x.id === linkRecitationId)
                  return r?.audio_url ? (
                    <audio src={r.audio_url} controls className="w-full mt-1" />
                  ) : null
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleteDialog(null)}>إلغاء</Button>
            <Button
              onClick={submitComplete}
              disabled={
                submitting ||
                (path.require_audio &&
                  ((tab === "record" && !audioUrl) || (tab === "link" && !linkRecitationId)))
              }
              className="gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              تأكيد الإتمام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
