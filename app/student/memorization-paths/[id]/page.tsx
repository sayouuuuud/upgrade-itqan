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
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/student/memorization-paths">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع للمسارات
        </Link>
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              {path.title}
            </h1>
            {path.description && (
              <p className="text-sm text-muted-foreground mt-2">{path.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">{path.total_units} وحدة</Badge>
              {path.level && <Badge variant="outline">{path.level}</Badge>}
              {path.estimated_days && (
                <Badge variant="outline">{path.estimated_days} يوماً متوقع</Badge>
              )}
              {path.require_audio && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  <Mic className="h-3 w-3 me-1" /> يتطلب تسجيل صوتي
                </Badge>
              )}
            </div>
          </div>
        </div>

        {!enrollment ? (
          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              اشترك في المسار لتبدأ الحفظ، وستفتح الوحدة الأولى مباشرة.
            </p>
            <Button onClick={enroll} disabled={enrolling} className="gap-2">
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              ابدأ المسار
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">تقدمك</span>
              <span className="font-semibold">{completed}/{total} ({pct}%)</span>
            </div>
            <Progress value={pct} className="h-3" />
            {enrollment.status === "completed" && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">أتممت المسار — تبارك الله</span>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-2">
        {units.map(unit => {
          const status = unit.progress?.status || "locked"
          const isLocked = !enrollment || status === "locked"
          const isCompleted = status === "completed"
          const isExpanded = expandedUnit === unit.id

          return (
            <Card
              key={unit.id}
              className={
                "transition-shadow " +
                (isCompleted ? "border-emerald-300 bg-emerald-50/40 " : "") +
                (isLocked ? "opacity-70 " : "")
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return
                  setExpandedUnit(isExpanded ? null : unit.id)
                  if (!isExpanded) startUnit(unit)
                }}
                disabled={isLocked}
                className="w-full text-start p-4 flex items-center gap-3 disabled:cursor-not-allowed"
              >
                <div
                  className={
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 " +
                    (isCompleted
                      ? "bg-emerald-600 text-white"
                      : isLocked
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-100 text-emerald-700")
                  }
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" />
                    : isLocked ? <Lock className="h-4 w-4" />
                    : <Unlock className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      الوحدة {unit.position}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[unit.unit_type] || unit.unit_type}
                    </Badge>
                    {isCompleted && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">مكتمل</Badge>
                    )}
                    {status === "in_progress" && (
                      <Badge variant="secondary" className="text-xs">قيد العمل</Badge>
                    )}
                  </div>
                  <div className="font-semibold mt-1 truncate">{unit.title}</div>
                  {unit.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {unit.description}
                    </div>
                  )}
                </div>

                {!isLocked && (
                  isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && !isLocked && (
                <div className="border-t border-border p-4 space-y-3">
                  {unit.description && (
                    <div className="text-sm text-muted-foreground">{unit.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                    <span>المدة المتوقعة: {unit.estimated_minutes} دقيقة</span>
                    {unit.progress?.attempts ? (
                      <span>عدد المحاولات: {unit.progress.attempts}</span>
                    ) : null}
                  </div>

                  {unit.progress?.audio_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">تسجيلك السابق:</p>
                      <audio src={unit.progress.audio_url} controls className="w-full" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {!isCompleted && (
                      <Button onClick={() => openComplete(unit)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        إتمام الوحدة
                      </Button>
                    )}
                    {isCompleted && (
                      <Button onClick={() => openComplete(unit)} variant="outline" className="gap-2">
                        <Mic className="h-4 w-4" />
                        تحديث التسجيل
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
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
