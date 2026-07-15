"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, GraduationCap, Eye, EyeOff, Loader2, Plus, Save, Trash2,
  Users, CheckCircle2, Clock, ChevronUp, ChevronDown, BarChart3, Video, FileText, Mic, BookOpen,
} from "lucide-react"
import { PathDetailSkeleton } from "@/components/ui/skeletons"
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
import PathSubmissionsReview from "@/components/paths/path-submissions-review"
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
      return `تلاوة ${surah?.name ? '' + surah.name : ""}`.trim()
    case "ayah":
      return `تلاوة ${surah?.name ? '' + surah.name : ""} (${f.ayah_from}-${f.ayah_to})`.trim()
    case "juz":
      return `تلاوة ${juzName(f.juz_number)}`
    case "page":
      return f.page_from === f.page_to ? `تلاوة صفحة ${f.page_from}` : `تلاوة الصفحات ${f.page_from}-${f.page_to}`
    default:
      return ''
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
  halaqa_id?: string | null
  halaqa_title?: string | null
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
  halaqa_id: "",
  require_audio: false,
  require_file: false,
  task_instructions: "",
  recitation_mode: "surah",
  surah_number: 1,
  ayah_from: 1,
  ayah_to: 7,
  juz_number: 30,
  page_from: 1,
  page_to: 1,
}

export default function ReaderTajweedPathDetailPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const pathId = params.id
  
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
  const [halaqat, setHalaqat] = useState<{ id: string; name: string }[]>([])

  // Load the reader's own maqraa halaqat so a stage can be linked to one.
  useEffect(() => {
    fetch(`/api/halaqat?platform=maqraa&scope=mine`)
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(j => setHalaqat((j.data || []).map((h: any) => ({ id: h.id, name: h.name }))))
      .catch(() => {})
  }, [])

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
      toast.success('')
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
      halaqa_id: stage.halaqa_id || "",
      require_audio: (stage as any).require_audio ?? false,
      require_file: (stage as any).require_file ?? false,
      task_instructions: (stage as any).task_instructions || "",
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
    const isHalaqa = stageForm.stage_type === "halaqa"
    const halaqaName = isHalaqa ? halaqat.find(h => h.id === stageForm.halaqa_id)?.name || "" : ""
    const autoTitle = isRecitation
      ? recitationLabel(stageForm)
      : isHalaqa
        ? stageForm.title.trim() || halaqaName
        : stageForm.title
    if (isHalaqa && !stageForm.halaqa_id) {
      toast.error('')
      return
    }
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
        require_audio: !!stageForm.require_audio,
        require_file: !!stageForm.require_file,
        task_instructions: stageForm.task_instructions || null,
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
      // Link to a halaqa when this is a halaqa stage; clear it otherwise.
      body.halaqa_id = isHalaqa ? stageForm.halaqa_id : null
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
      toast.success(stageDialog.stage ? '' : "تمت إضافة المرحلة")
      await load()
    } finally {
      setSavingStage(false)
    }
  }

  async function deleteStage(stage: Stage) {
    if (!confirm(tp.confirm.deleteStage.replace("{title}", stage.title))) return
    await fetch(`/api/admin/tajweed-paths/${pathId}/stages/${stage.id}`, { method: "DELETE" })
    toast.success('')
    await load()
  }

  if (loading) return <PathDetailSkeleton />
  if (!path) return <div className="p-6 text-center text-muted-foreground">{tp.notFound}</div>

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 p-4 sm:p-6">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between pb-6 border-b border-border/50">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 -ms-2 text-muted-foreground hover:text-foreground">
            <Link href="/reader/learning-paths">
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {''}
                                      </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </span>
            {path.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 font-semibold">
              {stages.length} {''}
                                      </Badge>
            <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 font-semibold">
              {tp.levels[path.level] || path.level}
            </Badge>
            {path.is_published ? (
              <div className="shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> {tp.statuses.published}
              </div>
            ) : (
              <div className="shrink-0 bg-muted text-muted-foreground border border-border/50 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5" /> {tp.statuses.draft}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Path Overall Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: tp.metadata.enrolledPlural, value: stats?.enrolled || "0", icon: Users, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
          { label: tp.metadata.completed, value: stats?.completed || "0", icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: tp.metadata.active, value: stats?.active || "0", icon: Clock, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: tp.metadata.avgStages, value: stats?.avg_completed_stages || "0", icon: BarChart3, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${s.tone}`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground leading-none mb-1">{s.value}</div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="stages" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="stages" className="rounded-lg">{tp.tabs.stages} ({stages.length})</TabsTrigger>
              <TabsTrigger value="submissions" className="rounded-lg">{''}</TabsTrigger>
              <TabsTrigger value="funnel" className="rounded-lg">{tp.tabs.funnel}</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg">{tp.tabs.settings}</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-6 mt-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-muted/20 border border-border/50 p-4 rounded-xl">
            <div className="text-sm text-muted-foreground">
              {''}
                                      </div>
            <Button onClick={openAddStage} className="gap-2 shadow-sm rounded-lg whitespace-nowrap">
              <Plus className="h-4 w-4" /> {''}
                                      </Button>
          </div>

          <div className="space-y-4">
            {stages.map(s => (
              <div key={s.id} className="bg-card border border-border/60 rounded-xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-all hover:shadow-md hover:border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xl shrink-0">
                  {s.position}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="font-bold text-lg text-foreground leading-tight">{s.title}</h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground bg-muted/50 border-border/50">
                      {s.estimated_minutes} {tp.metadata.minutesShort}
                    </Badge>
                    {s.stage_type === "halaqa" && <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1"><Users className="h-3 w-3" /> {''}</Badge>}
                    {s.video_url && <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">{tp.metadata.videoBadge}</Badge>}
                    {s.pdf_url && <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">{tp.metadata.pdfBadge}</Badge>}
                    {s.passage_text && <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">{''}</Badge>}
                  </div>
                  {s.description && (<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{s.description}</p>)}
                </div>
                <div className="flex sm:flex-col gap-1 shrink-0 bg-muted/30 p-1.5 rounded-lg border border-border/50 items-center justify-center">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled={s.position <= 1} onClick={() => reorderStage(s, "up")} title={tp.actions.moveUp} className="h-8 w-8 rounded-md">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={s.position >= stages.length} onClick={() => reorderStage(s, "down")} title={tp.actions.moveDown} className="h-8 w-8 rounded-md">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="w-px h-6 sm:w-full sm:h-px bg-border/50 my-1 hidden sm:block"></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditStage(s)} className="h-8 px-2 text-xs font-semibold rounded-md hover:bg-primary/10 hover:text-primary">
                      {tp.actions.edit}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteStage(s)} className="h-8 w-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {stages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-card/50 border border-dashed border-border rounded-xl">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">{''}</h3>
                <p className="text-muted-foreground text-center mb-6">{''}</p>
                <Button onClick={openAddStage} className="gap-2 rounded-lg">
                  <Plus className="h-4 w-4" /> {''}
                                                  </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-0">
          <PathSubmissionsReview apiBase={`/api/admin/tajweed-paths/${pathId}`} />
        </TabsContent>

        <TabsContent value="funnel" className="mt-0 space-y-6">
          {!funnel ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
              <div className="lg:col-span-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-8 bg-muted rounded w-1/3" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-6">
                <div className="h-6 bg-muted rounded w-1/4 mb-4" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                {/* Funnel Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tp.metadata.avgStages}</div>
                    <div className="text-3xl font-black mt-2 text-foreground">{funnel.overall?.avg_stages_completed || "0"}</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tp.metadata.avgProgress}</div>
                    <div className="text-3xl font-black mt-2 text-foreground">{funnel.overall?.avg_progress_percent || "0"}%</div>
                  </div>
                  <div className="bg-card border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{tp.metadata.completionRate}</div>
                    <div className="text-4xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                      {(() => {
                        const e = parseInt(funnel.overall?.enrolled || "0", 10)
                        const c = parseInt(funnel.overall?.completed || "0", 10)
                        return e ? Math.round((c / e) * 100) : 0
                      })()}%
                    </div>
                  </div>
                </div>

                {/* Top Students */}
                <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </span>
                    {tp.metadata.topStudentsTitle}
                  </h3>
                  <div className="space-y-3">
                    {(funnel.top_students || []).map((s: any, idx: number) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-6 text-center text-xs font-bold text-muted-foreground shrink-0">{idx + 1}</div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate text-foreground">{s.name || s.email}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{s.email}</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px] bg-primary/10 text-primary border-primary/20">
                          {s.stages_completed} {tp.metadata.stagesUnit}
                        </Badge>
                      </div>
                    ))}
                    {(!funnel.top_students || funnel.top_students.length === 0) && (
                      <div className="text-sm text-muted-foreground text-center py-6 italic">{tp.emptyEnrollments}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage Funnel Chart */}
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border/50 pb-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  {tp.metadata.funnelTitle}
                </h3>
                <div className="space-y-6">
                  {(funnel.per_stage || []).map((row: any) => {
                    const total = parseInt(funnel.overall?.enrolled || "0", 10) || 1
                    const completed = parseInt(row.completed || "0", 10)
                    const started = parseInt(row.started || "0", 10)
                    const pctCompleted = Math.round((completed / total) * 100)
                    const pctStarted = Math.round((started / total) * 100)
                    return (
                      <div key={row.stage_id} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                          <div className="font-bold text-sm text-foreground">
                            <span className="text-muted-foreground me-1">{row.position}.</span> {row.title}
                          </div>
                          <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded flex gap-2">
                            <span>{''} {started} ({pctStarted}%)</span>
                            <span className="text-border/50">|</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{''} {completed} ({pctCompleted}%)</span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex relative border border-border/50">
                          <div className="absolute top-0 bottom-0 start-0 bg-blue-500/30 transition-all duration-500" style={{ width: `${pctStarted}%` }}></div>
                          <div className="absolute top-0 bottom-0 start-0 bg-emerald-500 transition-all duration-500" style={{ width: `${pctCompleted}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                  {(!funnel.per_stage || funnel.per_stage.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-12 italic border border-dashed border-border rounded-xl">
                      {tp.emptyFunnel}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm max-w-2xl space-y-6">
            <h3 className="font-bold text-lg border-b border-border/50 pb-3 flex items-center gap-2">
              {''}
                                      </h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="font-semibold">{tp.form.title}</Label>
                <Input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} className="h-11 rounded-lg focus-visible:ring-primary/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">{tp.form.description}</Label>
                <Textarea rows={3} value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} className="resize-none rounded-lg focus-visible:ring-primary/20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="font-semibold">{tp.form.level}</Label>
                  <Select value={edit.level} onValueChange={v => setEdit({ ...edit, level: v })}>
                    <SelectTrigger className="h-11 rounded-lg focus:ring-primary/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{tp.levels.beginner}</SelectItem>
                      <SelectItem value="intermediate">{tp.levels.intermediate}</SelectItem>
                      <SelectItem value="advanced">{tp.levels.advanced}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold">{tp.form.estimatedDaysLabel}</Label>
                  <Input type="number" value={edit.estimated_days} onChange={e => setEdit({ ...edit, estimated_days: e.target.value })} className="h-11 rounded-lg focus-visible:ring-primary/20" />
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-4">
                  <input id="rt_req_aud_e" type="checkbox" className="mt-1 h-4 w-4 accent-primary rounded" checked={edit.require_audio} onChange={e => setEdit({ ...edit, require_audio: e.target.checked })} />
                  <div>
                    <Label htmlFor="rt_req_aud_e" className="cursor-pointer font-semibold text-base block">{tp.form.requireAudioShort}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{''}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-emerald-500/5 p-4">
                  <input id="rt_pub_e" type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600 rounded" checked={edit.is_published} onChange={e => setEdit({ ...edit, is_published: e.target.checked })} />
                  <div>
                    <Label htmlFor="rt_pub_e" className="cursor-pointer font-semibold text-base text-emerald-800 dark:text-emerald-400 block">{tp.form.publishedToggle}</Label>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">{''}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button onClick={savePath} disabled={saving} className="gap-2 rounded-lg font-bold w-full sm:w-auto min-w-[140px] h-11">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {tp.actions.save}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Stage Form Dialog */}
      <Dialog open={stageDialog.open} onOpenChange={o => setStageDialog({ open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="border-b border-border/50 pb-4 mb-2">
            <DialogTitle className="text-xl">{stageDialog.stage ? '' : "إضافة مرحلة جديدة"}</DialogTitle>
            <DialogDescription>{''}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
            {/* Stage type */}
            <div className="md:col-span-2 space-y-2">
              <Label className="font-semibold text-base">{''}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStageForm({ ...stageForm, stage_type: "custom" })}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-bold transition-all ${stageForm.stage_type === "custom" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border/50 bg-muted/10 text-muted-foreground hover:bg-muted/30"}`}
                >
                  <BookOpen className="h-5 w-5" /> {''}
                                                  </button>
                <button
                  type="button"
                  onClick={() => setStageForm({ ...stageForm, stage_type: "recitation" })}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-bold transition-all ${stageForm.stage_type === "recitation" ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 shadow-sm" : "border-border/50 bg-muted/10 text-muted-foreground hover:bg-muted/30"}`}
                >
                  <Mic className="h-5 w-5" /> {''}
                                                  </button>
                <button
                  type="button"
                  onClick={() => setStageForm({ ...stageForm, stage_type: "halaqa" })}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-bold transition-all ${stageForm.stage_type === "halaqa" ? "border-blue-500 bg-blue-500/5 text-blue-700 dark:text-blue-400 shadow-sm" : "border-border/50 bg-muted/10 text-muted-foreground hover:bg-muted/30"}`}
                >
                  <Users className="h-5 w-5" /> {''}
                                                  </button>
              </div>
            </div>

            {stageForm.stage_type === "halaqa" ? (
              <>
                <div className="md:col-span-2 space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <Label className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-400">
                    <Users className="h-5 w-5" /> {''}
                                                        </Label>
                  <Select value={stageForm.halaqa_id} onValueChange={v => setStageForm({ ...stageForm, halaqa_id: v })}>
                    <SelectTrigger className="h-11 rounded-lg bg-background border-blue-500/20 focus:ring-blue-500/20">
                      <SelectValue placeholder={''} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {halaqat.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{''}</div>
                      ) : (
                        halaqat.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                  <div className="text-left">
                    <Link href="/reader/halaqat" target="_blank" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                      {''}
                                                              </Link>
                  </div>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400/80">
                    {''}
                                                        </p>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{''}</Label>
                  <Input value={stageForm.title} onChange={e => setStageForm({ ...stageForm, title: e.target.value })} placeholder={''} className="h-11 rounded-lg focus-visible:ring-primary/20" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{''}</Label>
                  <Textarea rows={3} value={stageForm.description} onChange={e => setStageForm({ ...stageForm, description: e.target.value })} placeholder={''} className="resize-none rounded-lg focus-visible:ring-primary/20" />
                </div>
              </>
            ) : stageForm.stage_type === "recitation" ? (
              <>
                <div className="md:col-span-2 space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <Label className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
                    <Mic className="h-5 w-5" /> {''}
                                                            </Label>
                  <Select value={stageForm.recitation_mode} onValueChange={v => setStageForm({ ...stageForm, recitation_mode: v })}>
                    <SelectTrigger className="h-11 rounded-lg bg-background border-emerald-500/20 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surah">{''}</SelectItem>
                      <SelectItem value="ayah">{''}</SelectItem>
                      <SelectItem value="juz">{''}</SelectItem>
                      <SelectItem value="page">{''}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Settings based on recitation_mode */}
                  <div className="space-y-4 pt-2 border-t border-emerald-500/10">
                    {(stageForm.recitation_mode === "surah" || stageForm.recitation_mode === "ayah") && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">{''}</Label>
                        <Select
                          value={String(stageForm.surah_number)}
                          onValueChange={v => {
                            const n = parseInt(v, 10)
                            const s = SURAHS.find(x => x.number === n)
                            setStageForm({ ...stageForm, surah_number: n, ayah_from: 1, ayah_to: s?.verses || 1 })
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-lg bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {SURAHS.map(s => (
                              <SelectItem key={s.number} value={String(s.number)}>
                                {s.number}. {s.name} ({s.verses} {''}
                                                                  </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {stageForm.recitation_mode === "ayah" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">{''}</Label>
                          <Input type="number" min="1" max={SURAHS.find(s => s.number === stageForm.surah_number)?.verses || 1} value={stageForm.ayah_from} onChange={e => setStageForm({ ...stageForm, ayah_from: parseInt(e.target.value, 10) || 1 })} className="h-11 rounded-lg bg-background" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">{''}</Label>
                          <Input type="number" min="1" max={SURAHS.find(s => s.number === stageForm.surah_number)?.verses || 1} value={stageForm.ayah_to} onChange={e => setStageForm({ ...stageForm, ayah_to: parseInt(e.target.value, 10) || 1 })} className="h-11 rounded-lg bg-background" />
                        </div>
                      </div>
                    )}

                    {stageForm.recitation_mode === "juz" && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">{''}</Label>
                        <Select value={String(stageForm.juz_number)} onValueChange={v => setStageForm({ ...stageForm, juz_number: parseInt(v, 10) })}>
                          <SelectTrigger className="h-11 rounded-lg bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                              <SelectItem key={j} value={String(j)}>{juzName(j)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {stageForm.recitation_mode === "page" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">{''}</Label>
                          <Input type="number" min="1" max="604" value={stageForm.page_from} onChange={e => setStageForm({ ...stageForm, page_from: parseInt(e.target.value, 10) || 1 })} className="h-11 rounded-lg bg-background" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">{''}</Label>
                          <Input type="number" min="1" max="604" value={stageForm.page_to} onChange={e => setStageForm({ ...stageForm, page_to: parseInt(e.target.value, 10) || 1 })} className="h-11 rounded-lg bg-background" />
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-sm">
                      {''} <strong className="text-emerald-800 dark:text-emerald-400 ms-1">{recitationLabel(stageForm)}</strong>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{tp.stageForm.description} {''}</Label>
                  <Textarea rows={3} value={stageForm.description} onChange={e => setStageForm({ ...stageForm, description: e.target.value })} placeholder={''} className="resize-none rounded-lg focus-visible:ring-primary/20" />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{tp.stageForm.title}</Label>
                  <Input value={stageForm.title} onChange={e => setStageForm({ ...stageForm, title: e.target.value })} placeholder={tp.stageForm.titlePlaceholder} className="h-11 rounded-lg focus-visible:ring-primary/20" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{tp.stageForm.description}</Label>
                  <Textarea rows={2} value={stageForm.description} onChange={e => setStageForm({ ...stageForm, description: e.target.value })} className="resize-none rounded-lg focus-visible:ring-primary/20" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{tp.stageForm.content}</Label>
                  <Textarea rows={5} value={stageForm.content} onChange={e => setStageForm({ ...stageForm, content: e.target.value })} placeholder={tp.stageForm.contentPlaceholder} className="rounded-lg focus-visible:ring-primary/20" />
                </div>

                <div className="md:col-span-2 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-5">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Video className="h-5 w-5 text-blue-500" /> {tp.stageForm.videoUrl}
                  </Label>
                  <Input dir="ltr" value={stageForm.video_url} onChange={e => setStageForm({ ...stageForm, video_url: e.target.value })} placeholder={''} className="h-11 rounded-lg bg-background" />
                  <div className="bg-background rounded-lg p-1 border border-border/50">
                    <FileUploader accept="video/*" value={null} onChange={(url) => url && setStageForm({ ...stageForm, video_url: url })} />
                  </div>
                  {stageForm.video_url && (
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border shadow-sm mt-3">
                      {toYouTubeEmbed(stageForm.video_url) ? (
                        <iframe src={toYouTubeEmbed(stageForm.video_url)!} className="w-full h-full" allowFullScreen title="preview" />
                      ) : (
                        <video src={stageForm.video_url} controls className="w-full h-full" />
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-5">
                  <Label className="flex items-center gap-2 font-semibold">
                    <FileText className="h-5 w-5 text-amber-500" /> {tp.stageForm.pdfUrl}
                  </Label>
                  <Input dir="ltr" value={stageForm.pdf_url} onChange={e => setStageForm({ ...stageForm, pdf_url: e.target.value })} placeholder={''} className="h-11 rounded-lg bg-background" />
                  <div className="bg-background rounded-lg p-1 border border-border/50">
                    <FileUploader accept=".pdf,.doc,.docx,.ppt,.pptx" value={stageForm.pdf_url || null} onChange={(url) => setStageForm({ ...stageForm, pdf_url: url || "" })} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-semibold">{tp.stageForm.passageText}</Label>
                  <Textarea rows={3} value={stageForm.passage_text} onChange={e => setStageForm({ ...stageForm, passage_text: e.target.value })} placeholder={tp.stageForm.passagePlaceholder} className="resize-none rounded-lg focus-visible:ring-primary/20" />
                </div>
              </>
            )}
            <div className="md:col-span-2 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-5">
              <Label className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> {''}
                                            </Label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary rounded" checked={stageForm.require_audio} onChange={e => setStageForm({ ...stageForm, require_audio: e.target.checked })} />
                <span className="text-sm">
                  <span className="font-bold block">{''}</span>
                  <span className="text-xs text-muted-foreground">{''}</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary rounded" checked={stageForm.require_file} onChange={e => setStageForm({ ...stageForm, require_file: e.target.checked })} />
                <span className="text-sm">
                  <span className="font-bold block">{''}</span>
                  <span className="text-xs text-muted-foreground">{''}</span>
                </span>
              </label>
              {(stageForm.require_audio || stageForm.require_file) && (
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">{''}</Label>
                  <Textarea rows={2} value={stageForm.task_instructions} onChange={e => setStageForm({ ...stageForm, task_instructions: e.target.value })} placeholder={''} className="resize-none rounded-lg bg-background" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">{tp.stageForm.estimatedMinutes}</Label>
              <Input type="number" min="1" value={stageForm.estimated_minutes} onChange={e => setStageForm({ ...stageForm, estimated_minutes: parseInt(e.target.value, 10) || 30 })} className="h-11 rounded-lg focus-visible:ring-primary/20" />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50 mt-4 gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setStageDialog({ open: false })} className="rounded-lg font-semibold">{tp.actions.cancel}</Button>
            <Button onClick={saveStage} disabled={savingStage || (stageForm.stage_type === "custom" && !stageForm.title.trim()) || (stageForm.stage_type === "halaqa" && !stageForm.halaqa_id)} className="gap-2 rounded-lg font-bold min-w-[120px]">
              {savingStage && <Loader2 className="h-4 w-4 animate-spin" />}
              {stageDialog.stage ? tp.actions.saveChanges : tp.actions.addStageVerb}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
