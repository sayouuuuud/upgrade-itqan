"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, GraduationCap, Eye, EyeOff, Loader2, Plus, Save, Trash2,
  Users, CheckCircle2, Clock, ChevronUp, ChevronDown, BarChart3, Video, FileText, Mic, BookOpen,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import FileUploader from "@/components/academy/file-uploader"
import { SURAHS } from "@/lib/data/surahs"
import { juzName } from "@/lib/quran-data"
import { useI18n } from "@/lib/i18n/context"

function toYouTubeEmbed(url: string): string | null {
  if (url.includes("youtube.com/watch?v=")) return `https://www.youtube.com/embed/${url.split("v=")[1]?.split("&")[0]}`
  if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]?.split("?")[0]}`
  if (url.includes("youtube.com/embed/")) return url
  return null
}

// Build a human-readable Arabic title for a recitation stage based on its target.
function recitationLabel(f: {
  recitation_mode: string
  surah_number: number
  ayah_from: number
  ayah_to: number
  juz_number: number
  page_from: number
  page_to: number
}): string {
  const surah = SURAHS.find(s => s.number === f.surah_number)
  switch (f.recitation_mode) {
    case "surah":
      return `تلاوة ${surah?.name ? "سورة " + surah.name : ""}`.trim()
    case "ayah":
      return `تلاوة ${surah?.name ? "سورة " + surah.name : ""} (${f.ayah_from}-${f.ayah_to})`.trim()
    case "juz":
      return `تلاوة ${juzName(f.juz_number)}`
    case "page":
      return f.page_from === f.page_to ? `تلاوة صفحة ${f.page_from}` : `تلاوة الصفحات ${f.page_from}-${f.page_to}`
    default:
      return "تلاوة"
  }
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
  stage_type?: string | null
  recitation_mode?: string | null
  surah_number?: number | null
  ayah_from?: number | null
  ayah_to?: number | null
  juz_number?: number | null
  page_from?: number | null
  page_to?: number | null
}

const initialStageForm = {
  title: "", description: "", content: "",
  video_url: "", pdf_url: "", passage_text: "",
  estimated_minutes: 30,
  stage_type: "custom",
  recitation_mode: "surah",
  surah_number: 1,
  ayah_from: 1,
  ayah_to: 7,
  juz_number: 30,
  page_from: 1,
  page_to: 1,
}

export default function ReaderTajweedPathDetailPage() {
  const params = useParams<{ id: string }>()
  const pathId = params.id
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths

  const [path, setPath] = useState<any>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [stats, setStats] = useState<any>(null)
  const [funnel, setFunnel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [edit, setEdit] = useState({
    title: "", description: "", level: "beginner",
    estimated_days: "", require_audio: false, is_published: false,
  })

  const [stageDialog, setStageDialog] = useState<{ open: boolean; stage?: Stage }>({ open: false })
  const [stageForm, setStageForm] = useState(initialStageForm)
  const [savingStage, setSavingStage] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/reader/tajweed-paths/${pathId}`),
        fetch(`/api/admin/tajweed-paths/${pathId}/stats`),
      ])
      const d1 = await r1.json()
      if (r1.ok && d1.path) {
        setPath(d1.path)
        setStages(d1.stages || [])
        setStats(d1.stats || null)
        setEdit({
          title: d1.path.title || "",
          description: d1.path.description || "",
          level: d1.path.level || "beginner",
          estimated_days: d1.path.estimated_days?.toString() || "",
          require_audio: !!d1.path.require_audio,
          is_published: !!d1.path.is_published,
        })
      }
      if (r2.ok) {
        const d2 = await r2.json()
        setFunnel(d2)
      }
    } finally {
      setLoading(false)
    }
  }

  async function reorderStage(stage: Stage, direction: "up" | "down") {
    await fetch(
      `/api/admin/tajweed-paths/${pathId}/stages/${stage.id}/reorder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      },
    )
    await load()
  }
  useEffect(() => { if (pathId) load() }, [pathId])

  async function savePath() {
    setSaving(true)
    try {
      await fetch(`/api/reader/tajweed-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edit.title,
          description: edit.description || null,
          level: edit.level,
          estimated_days: edit.estimated_days ? parseInt(edit.estimated_days, 10) : null,
          require_audio: edit.require_audio,
          is_published: edit.is_published,
        }),
      })
      toast.success("تم حفظ إعدادات المسار")
      await load()
    } finally {
      setSaving(false)
    }
  }

  function openAddStage() {
    setStageForm(initialStageForm)
    setStageDialog({ open: true })
  }
  function openEditStage(stage: Stage) {
    setStageForm({
      title: stage.title || "",
      description: stage.description || "",
      content: stage.content || "",
      video_url: stage.video_url || "",
      pdf_url: stage.pdf_url || "",
      passage_text: stage.passage_text || "",
      estimated_minutes: stage.estimated_minutes || 30,
      stage_type: stage.stage_type || "custom",
      recitation_mode: stage.recitation_mode || "surah",
      surah_number: stage.surah_number || 1,
      ayah_from: stage.ayah_from || 1,
      ayah_to: stage.ayah_to || 7,
      juz_number: stage.juz_number || 30,
      page_from: stage.page_from || 1,
      page_to: stage.page_to || 1,
    })
    setStageDialog({ open: true, stage })
  }

  async function saveStage() {
    const isRecitation = stageForm.stage_type === "recitation"
    const autoTitle = isRecitation ? recitationLabel(stageForm) : stageForm.title
    if (!autoTitle.trim()) return
    setSavingStage(true)
    try {
      const body: any = {
        title: autoTitle,
        description: stageForm.description || null,
        content: stageForm.content || null,
        video_url: stageForm.video_url || null,
        pdf_url: stageForm.pdf_url || null,
        passage_text: stageForm.passage_text || null,
        estimated_minutes: stageForm.estimated_minutes,
        stage_type: stageForm.stage_type || "custom",
      }
      if (isRecitation) {
        body.recitation_mode = stageForm.recitation_mode
        body.surah_number = stageForm.recitation_mode === "surah" || stageForm.recitation_mode === "ayah" ? stageForm.surah_number : null
        body.ayah_from = stageForm.recitation_mode === "ayah" ? stageForm.ayah_from : null
        body.ayah_to = stageForm.recitation_mode === "ayah" ? stageForm.ayah_to : null
        body.juz_number = stageForm.recitation_mode === "juz" ? stageForm.juz_number : null
        body.page_from = stageForm.recitation_mode === "page" ? stageForm.page_from : null
        body.page_to = stageForm.recitation_mode === "page" ? stageForm.page_to : null
      } else {
        body.recitation_mode = null
      }
      // Reader uses /api/admin/tajweed-paths/[id]/stages — that route accepts
      // 'reader' role and enforces ownership server-side.
      if (stageDialog.stage) {
        await fetch(`/api/admin/tajweed-paths/${pathId}/stages/${stageDialog.stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        await fetch(`/api/admin/tajweed-paths/${pathId}/stages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      setStageDialog({ open: false })
      toast.success(stageDialog.stage ? "تم حفظ تعديلات المرحلة" : "تمت إضافة المرحلة")
      await load()
    } finally {
      setSavingStage(false)
    }
  }

  async function deleteStage(stage: Stage) {
    if (!confirm(tp.confirm.deleteStage.replace("{title}", stage.title))) return
    await fetch(`/api/admin/tajweed-paths/${pathId}/stages/${stage.id}`, { method: "DELETE" })
    toast.success("تم حذف المرحلة")
    await load()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!path) return <div className="p-6 text-center text-muted-foreground">{tp.notFound}</div>

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/reader/learning-paths">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع للقائمة
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary shrink-0">
            <GraduationCap className="h-5 w-5" />
          </span>
          {path.title}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">{stages.length} مرحلة</Badge>
          <Badge variant="outline" className="border-primary/30 text-primary">{tp.levels[path.level] || path.level}</Badge>
          {path.is_published ? (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
              <Eye className="h-3 w-3 me-1" /> {tp.statuses.published}
            </Badge>
          ) : (
            <Badge variant="outline"><EyeOff className="h-3 w-3 me-1" /> {tp.statuses.draft}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {tp.metadata.enrolledPlural}</div>
          <div className="text-2xl font-bold mt-1">{stats?.enrolled || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {tp.metadata.completed}</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats?.completed || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {tp.metadata.active}</div>
          <div className="text-2xl font-bold mt-1">{stats?.active || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">{tp.metadata.avgStages}</div>
          <div className="text-2xl font-bold mt-1">{stats?.avg_completed_stages || "0"}</div>
        </Card>
      </div>

      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">{tp.tabs.stages} ({stages.length})</TabsTrigger>
          <TabsTrigger value="funnel">{tp.tabs.funnel}</TabsTrigger>
          <TabsTrigger value="settings">{tp.tabs.settings}</TabsTrigger>
        </TabsList>

        <TabsContent value="stages">
          <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              كل مرحلة هي درس مستقل (شرح/فيديو/ملف/نص) — تُفتح للطالب بعد اجتياز المرحلة السابقة.
            </p>
            <Button onClick={openAddStage} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> إضافة مرحلة
            </Button>
          </div>

          <div className="space-y-3">
            {stages.map(s => (
              <Card key={s.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary rounded-2xl w-9 h-9 flex items-center justify-center font-bold shrink-0">
                    {s.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{s.title}</h3>
                      <Badge variant="outline" className="text-xs">{s.estimated_minutes} {tp.metadata.minutesShort}</Badge>
                      {s.video_url && <Badge variant="secondary" className="text-xs">{tp.metadata.videoBadge}</Badge>}
                      {s.pdf_url && <Badge variant="secondary" className="text-xs">{tp.metadata.pdfBadge}</Badge>}
                      {s.passage_text && <Badge variant="secondary" className="text-xs">نص للقراءة</Badge>}
                    </div>
                    {s.description && (<p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>)}
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    <Button variant="ghost" size="icon" disabled={s.position <= 1} onClick={() => reorderStage(s, "up")} title={tp.actions.moveUp}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={s.position >= stages.length} onClick={() => reorderStage(s, "down")} title={tp.actions.moveDown}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditStage(s)}>{tp.actions.edit}</Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteStage(s)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {stages.length === 0 && (
              <Card className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3">
                  <Plus className="h-7 w-7" />
                </div>
                <h3 className="font-bold">لا توجد مراحل بعد</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">أضف أول مرحلة (درس) لهذا المسار.</p>
                <Button onClick={openAddStage} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> إضافة مرحلة
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          {!funnel ? (
            <Card className="p-10 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin inline-block" />
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">{tp.metadata.avgStages}</div>
                  <div className="text-2xl font-bold mt-1">{funnel.overall?.avg_stages_completed || "0"}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">{tp.metadata.avgProgress}</div>
                  <div className="text-2xl font-bold mt-1">{funnel.overall?.avg_progress_percent || "0"}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">{tp.metadata.completionRate}</div>
                  <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    {(() => {
                      const e = parseInt(funnel.overall?.enrolled || "0", 10)
                      const c = parseInt(funnel.overall?.completed || "0", 10)
                      return e ? Math.round((c / e) * 100) : 0
                    })()}%
                  </div>
                </Card>
              </div>
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> {tp.metadata.funnelTitle}
                </h3>
                <div className="space-y-3">
                  {(funnel.per_stage || []).map((row: any) => {
                    const total = parseInt(funnel.overall?.enrolled || "0", 10) || 1
                    const completed = parseInt(row.completed || "0", 10)
                    const started = parseInt(row.started || "0", 10)
                    const pctCompleted = Math.round((completed / total) * 100)
                    const pctStarted = Math.round((started / total) * 100)
                    return (
                      <div key={row.stage_id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{row.position}. {row.title}</span>
                          <span className="text-muted-foreground">{tp.metadata.funnelStarted} {started}/{total} ({pctStarted}%) · {tp.metadata.funnelPassed} {completed} ({pctCompleted}%)</span>
                        </div>
                        <Progress value={pctCompleted} className="h-2" />
                      </div>
                    )
                  })}
                  {(!funnel.per_stage || funnel.per_stage.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-6">{tp.emptyFunnel}</div>
                  )}
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> {tp.metadata.topStudentsTitle}</h3>
                <div className="space-y-2">
                  {(funnel.top_students || []).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 text-sm border-b last:border-b-0 pb-2 last:pb-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.name || s.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                      </div>
                      <Badge variant="outline">{s.stages_completed} {tp.metadata.stagesUnit}</Badge>
                    </div>
                  ))}
                  {(!funnel.top_students || funnel.top_students.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-4">{tp.emptyEnrollments}</div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6 max-w-xl space-y-4">
            <div className="space-y-1"><Label>{tp.form.title}</Label><Input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>{tp.form.description}</Label><Textarea rows={3} value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{tp.form.level}</Label>
                <Select value={edit.level} onValueChange={v => setEdit({ ...edit, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{tp.levels.beginner}</SelectItem>
                    <SelectItem value="intermediate">{tp.levels.intermediate}</SelectItem>
                    <SelectItem value="advanced">{tp.levels.advanced}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>{tp.form.estimatedDaysLabel}</Label><Input type="number" value={edit.estimated_days} onChange={e => setEdit({ ...edit, estimated_days: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input id="rt_req_aud_e" type="checkbox" className="h-4 w-4" checked={edit.require_audio} onChange={e => setEdit({ ...edit, require_audio: e.target.checked })} />
              <Label htmlFor="rt_req_aud_e" className="cursor-pointer">{tp.form.requireAudioShort}</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="rt_pub_e" type="checkbox" className="h-4 w-4" checked={edit.is_published} onChange={e => setEdit({ ...edit, is_published: e.target.checked })} />
              <Label htmlFor="rt_pub_e" className="cursor-pointer">{tp.form.publishedToggle}</Label>
            </div>
            <Button onClick={savePath} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {tp.actions.save}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={stageDialog.open} onOpenChange={o => setStageDialog({ open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{stageDialog.stage ? "تعديل المرحلة" : "إضافة مرحلة جديدة"}</DialogTitle>
            <DialogDescription>المرحلة عبارة عن درس مستقل — أضف الشرح والمحتوى والمرفقات.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {/* Stage type: a normal lesson OR a Quran recitation task */}
            <div className="md:col-span-2 space-y-2">
              <Label>نوع المرحلة</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStageForm({ ...stageForm, stage_type: "custom" })}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-bold transition-colors ${stageForm.stage_type !== "recitation" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted/50"}`}
                >
                  <BookOpen className="h-4 w-4" /> درس (شرح/فيديو/ملف)
                </button>
                <button
                  type="button"
                  onClick={() => setStageForm({ ...stageForm, stage_type: "recitation" })}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-bold transition-colors ${stageForm.stage_type === "recitation" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted/50"}`}
                >
                  <Mic className="h-4 w-4" /> تلاوة / تسجيل
                </button>
              </div>
            </div>

            {stageForm.stage_type === "recitation" ? (
              <>
                {/* Recitation target selector */}
                <div className="md:col-span-2 space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <Label className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" /> المطلوب تلاوته
                  </Label>
                  <Select
                    value={stageForm.recitation_mode}
                    onValueChange={v => setStageForm({ ...stageForm, recitation_mode: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surah">سورة كاملة</SelectItem>
                      <SelectItem value="ayah">آيات محددة (من - إلى)</SelectItem>
                      <SelectItem value="juz">جزء كامل</SelectItem>
                      <SelectItem value="page">نطاق صفحات</SelectItem>
                    </SelectContent>
                  </Select>

                  {(stageForm.recitation_mode === "surah" || stageForm.recitation_mode === "ayah") && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">السورة</Label>
                      <Select
                        value={String(stageForm.surah_number)}
                        onValueChange={v => {
                          const n = parseInt(v, 10)
                          const s = SURAHS.find(x => x.number === n)
                          setStageForm({ ...stageForm, surah_number: n, ayah_from: 1, ayah_to: s?.verses || 1 })
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {SURAHS.map(s => (
                            <SelectItem key={s.number} value={String(s.number)}>
                              {s.number}. {s.name} ({s.verses} آية)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {stageForm.recitation_mode === "ayah" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">من الآية</Label>
                        <Input
                          type="number" min="1"
                          max={SURAHS.find(s => s.number === stageForm.surah_number)?.verses || 1}
                          value={stageForm.ayah_from}
                          onChange={e => setStageForm({ ...stageForm, ayah_from: parseInt(e.target.value, 10) || 1 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">إلى الآية</Label>
                        <Input
                          type="number" min="1"
                          max={SURAHS.find(s => s.number === stageForm.surah_number)?.verses || 1}
                          value={stageForm.ayah_to}
                          onChange={e => setStageForm({ ...stageForm, ayah_to: parseInt(e.target.value, 10) || 1 })}
                        />
                      </div>
                    </div>
                  )}

                  {stageForm.recitation_mode === "juz" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">الجزء</Label>
                      <Select
                        value={String(stageForm.juz_number)}
                        onValueChange={v => setStageForm({ ...stageForm, juz_number: parseInt(v, 10) })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                            <SelectItem key={j} value={String(j)}>{juzName(j)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {stageForm.recitation_mode === "page" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">من صفحة</Label>
                        <Input type="number" min="1" max="604" value={stageForm.page_from}
                          onChange={e => setStageForm({ ...stageForm, page_from: parseInt(e.target.value, 10) || 1 })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">إلى صفحة</Label>
                        <Input type="number" min="1" max="604" value={stageForm.page_to}
                          onChange={e => setStageForm({ ...stageForm, page_to: parseInt(e.target.value, 10) || 1 })} />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    عنوان المرحلة سيُولّد تلقائياً: <span className="font-bold text-foreground">{recitationLabel(stageForm)}</span>
                  </p>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label>{tp.stageForm.description} (تعليمات للطالب)</Label>
                  <Textarea rows={3} value={stageForm.description} onChange={e => setStageForm({ ...stageForm, description: e.target.value })} placeholder="مثال: راعِ أحكام التجويد وأرسل تلاوتك" />
                </div>
              </>
            ) : (
              <>
            <div className="md:col-span-2 space-y-1">
              <Label>{tp.stageForm.title}</Label>
              <Input value={stageForm.title} onChange={e => setStageForm({ ...stageForm, title: e.target.value })} placeholder={tp.stageForm.titlePlaceholder} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>{tp.stageForm.description}</Label>
              <Textarea rows={2} value={stageForm.description} onChange={e => setStageForm({ ...stageForm, description: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>{tp.stageForm.content}</Label>
              <Textarea rows={5} value={stageForm.content} onChange={e => setStageForm({ ...stageForm, content: e.target.value })} placeholder={tp.stageForm.contentPlaceholder} />
            </div>

            {/* Video: upload a file OR paste a URL (YouTube/Vimeo/direct) — same as a course lesson */}
            <div className="md:col-span-2 space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" /> {tp.stageForm.videoUrl}
              </Label>
              <Input
                dir="ltr"
                value={stageForm.video_url}
                onChange={e => setStageForm({ ...stageForm, video_url: e.target.value })}
                placeholder="https://youtube.com/... أو ارفع ملف بالأسفل"
              />
              <FileUploader
                accept="video/*"
                value={null}
                onChange={(url) => url && setStageForm({ ...stageForm, video_url: url })}
              />
              {stageForm.video_url && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border">
                  {toYouTubeEmbed(stageForm.video_url) ? (
                    <iframe src={toYouTubeEmbed(stageForm.video_url)!} className="w-full h-full" allowFullScreen title="preview" />
                  ) : (
                    <video src={stageForm.video_url} controls className="w-full h-full" />
                  )}
                </div>
              )}
            </div>

            {/* PDF / file attachment: upload OR paste a URL */}
            <div className="md:col-span-2 space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {tp.stageForm.pdfUrl}
              </Label>
              <Input
                dir="ltr"
                value={stageForm.pdf_url}
                onChange={e => setStageForm({ ...stageForm, pdf_url: e.target.value })}
                placeholder="https://... أو ارفع ملف بالأسفل"
              />
              <FileUploader
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                value={stageForm.pdf_url || null}
                onChange={(url) => setStageForm({ ...stageForm, pdf_url: url || "" })}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>{tp.stageForm.passageText}</Label>
              <Textarea rows={3} value={stageForm.passage_text} onChange={e => setStageForm({ ...stageForm, passage_text: e.target.value })} placeholder={tp.stageForm.passagePlaceholder} />
            </div>
              </>
            )}
            <div className="space-y-1">
              <Label>{tp.stageForm.estimatedMinutes}</Label>
              <Input type="number" min="1" value={stageForm.estimated_minutes} onChange={e => setStageForm({ ...stageForm, estimated_minutes: parseInt(e.target.value, 10) || 30 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStageDialog({ open: false })}>{tp.actions.cancel}</Button>
            <Button onClick={saveStage} disabled={savingStage || (stageForm.stage_type !== "recitation" && !stageForm.title.trim())} className="gap-2">
              {savingStage && <Loader2 className="h-4 w-4 animate-spin" />}
              {stageDialog.stage ? tp.actions.saveChanges : tp.actions.addStageVerb}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
