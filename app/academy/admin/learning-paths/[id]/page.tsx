"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight, GraduationCap, Eye, EyeOff, Loader2, Plus, Save, Trash2,
  Users, CheckCircle2, Clock, ChevronUp, ChevronDown, BarChart3,
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
import { useI18n } from "@/lib/i18n/context"

type Subject = "tajweed" | "fiqh" | "aqeedah" | "seerah" | "tafsir"
const SUBJECTS: Subject[] = ["fiqh", "aqeedah", "seerah", "tafsir"] // Academy: 4 islamic sciences

type ManagerCandidate = { id: string; name: string; email: string; role: string }

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
}

const initialStageForm = {
  title: "", description: "", content: "",
  video_url: "", pdf_url: "", passage_text: "",
  estimated_minutes: 30,
}

export default function AcademyAdminLearningPathDetailPage() {
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
    subject: "tajweed" as Subject,
    manager_id: "" as string,
    estimated_days: "", require_audio: false, is_published: false,
  })
  const [managers, setManagers] = useState<ManagerCandidate[]>([])

  const [stageDialog, setStageDialog] = useState<{ open: boolean; stage?: Stage }>({ open: false })
  const [stageForm, setStageForm] = useState(initialStageForm)
  const [savingStage, setSavingStage] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/tajweed-paths/${pathId}`),
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
          subject: (d1.path.subject as Subject) || "tajweed",
          manager_id: d1.path.manager_id || "",
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

  useEffect(() => {
    (async () => {
      try {
        const [readers, teachers] = await Promise.all([
          fetch("/api/admin/users?role=reader&limit=100").then(r => r.json()).catch(() => ({})),
          fetch("/api/admin/users?role=teacher&limit=100").then(r => r.json()).catch(() => ({})),
        ])
        setManagers([
          ...((readers?.users as any[]) || []),
          ...((teachers?.users as any[]) || []),
        ])
      } catch {
        setManagers([])
      }
    })()
  }, [])

  async function savePath() {
    setSaving(true)
    try {
      await fetch(`/api/admin/tajweed-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edit.title,
          description: edit.description || null,
          level: edit.level,
          subject: edit.subject,
          manager_id: edit.manager_id || null,
          estimated_days: edit.estimated_days ? parseInt(edit.estimated_days, 10) : null,
          require_audio: edit.require_audio,
          is_published: edit.is_published,
        }),
      })
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
    })
    setStageDialog({ open: true, stage })
  }

  async function saveStage() {
    if (!stageForm.title.trim()) return
    setSavingStage(true)
    try {
      const body = {
        title: stageForm.title,
        description: stageForm.description || null,
        content: stageForm.content || null,
        video_url: stageForm.video_url || null,
        pdf_url: stageForm.pdf_url || null,
        passage_text: stageForm.passage_text || null,
        estimated_minutes: stageForm.estimated_minutes,
      }
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
      await load()
    } finally {
      setSavingStage(false)
    }
  }

  async function deleteStage(stage: Stage) {
    if (!confirm(tp.confirm.deleteStage.replace("{title}", stage.title))) return
    await fetch(`/api/admin/tajweed-paths/${pathId}/stages/${stage.id}`, { method: "DELETE" })
    await load()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!path) return <div className="p-6 text-center text-muted-foreground">{tp.notFound}</div>

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/academy/admin/learning-paths">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {tp.actions.backToList}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-600" /> {path.title}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          {path.subject && (
            <Badge className="bg-blue-50 text-blue-800 hover:bg-blue-50 border-blue-200">
              {tp.subjects[path.subject as Subject] || path.subject}
            </Badge>
          )}
          <Badge variant="secondary">{stages.length} {tp.metadata.stagesUnit}</Badge>
          <Badge variant="outline">{tp.levels[path.level] || path.level}</Badge>
          {path.is_published ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <Eye className="h-3 w-3 me-1" /> {tp.statuses.published}
            </Badge>
          ) : (
            <Badge variant="outline"><EyeOff className="h-3 w-3 me-1" /> {tp.statuses.draft}</Badge>
          )}
        </div>
        {path.manager_name && (
          <p className="text-xs text-muted-foreground mt-2">
            {tp.manager.assignedTo}: <span className="font-medium text-foreground">{path.manager_name}</span>
            {path.manager_email && <span className="opacity-70"> ({path.manager_email})</span>}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {tp.metadata.enrolledPlural}</div>
          <div className="text-2xl font-bold mt-1">{stats?.enrolled || "0"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {tp.metadata.completed}</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{stats?.completed || "0"}</div>
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
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              {tp.stageForm.accessibilityNote}
            </p>
            <Button onClick={openAddStage} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> {tp.actions.addStage}
            </Button>
          </div>

          <div className="space-y-3">
            {stages.map(s => (
              <Card key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 text-emerald-800 rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    {s.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{s.title}</h3>
                      <Badge variant="outline" className="text-xs">{s.estimated_minutes} {tp.metadata.minutesShort}</Badge>
                      {s.video_url && <Badge variant="secondary" className="text-xs">{tp.metadata.videoBadge}</Badge>}
                      {s.pdf_url && <Badge variant="secondary" className="text-xs">{tp.metadata.pdfBadge}</Badge>}
                    </div>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => reorderStage(s, "up")}
                      disabled={s.position <= 1}
                      title={tp.actions.moveUp}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => reorderStage(s, "down")}
                      disabled={s.position >= stages.length}
                      title={tp.actions.moveDown}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditStage(s)}>
                      {tp.actions.edit}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteStage(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {stages.length === 0 && (
              <Card className="p-10 text-center text-muted-foreground">
                {tp.emptyStages}
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
                  <div className="text-2xl font-bold mt-1 text-emerald-700">
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
                          <span className="text-muted-foreground">
                            {tp.metadata.funnelStarted} {started}/{total} ({pctStarted}%) · {tp.metadata.funnelPassed} {completed} ({pctCompleted}%)
                          </span>
                        </div>
                        <Progress value={pctCompleted} className="h-2" />
                      </div>
                    )
                  })}
                  {(!funnel.per_stage || funnel.per_stage.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      {tp.emptyFunnel}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" /> {tp.metadata.topStudentsTitle}
                </h3>
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
            <div className="space-y-1">
              <Label>{tp.form.title}</Label>
              <Input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{tp.form.description}</Label>
              <Textarea rows={3} value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{tp.form.subject}</Label>
                <Select value={edit.subject} onValueChange={v => setEdit({ ...edit, subject: v as Subject })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{tp.subjects[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="space-y-1">
              <Label>{tp.form.manager}</Label>
              <Select
                value={edit.manager_id || "none"}
                onValueChange={v => setEdit({ ...edit, manager_id: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder={tp.form.managerPlaceholder} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tp.form.managerNone}</SelectItem>
                  {managers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} — {m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{tp.form.managerHint}</p>
            </div>
            <div className="space-y-1">
              <Label>{tp.form.estimatedDaysLabel}</Label>
              <Input type="number" value={edit.estimated_days} onChange={e => setEdit({ ...edit, estimated_days: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input id="t_req_aud_e" type="checkbox" className="h-4 w-4" checked={edit.require_audio} onChange={e => setEdit({ ...edit, require_audio: e.target.checked })} />
              <Label htmlFor="t_req_aud_e" className="cursor-pointer">{tp.form.requireAudioShort}</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="t_pub_e" type="checkbox" className="h-4 w-4" checked={edit.is_published} onChange={e => setEdit({ ...edit, is_published: e.target.checked })} />
              <Label htmlFor="t_pub_e" className="cursor-pointer">{tp.form.publishedToggle}</Label>
            </div>
            <Button onClick={savePath} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {tp.actions.save}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={stageDialog.open} onOpenChange={o => setStageDialog({ open: o })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{stageDialog.stage ? tp.actions.editStage : tp.actions.addNewStage}</DialogTitle>
            <DialogDescription>{tp.stageForm.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
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
            <div className="space-y-1">
              <Label>{tp.stageForm.videoUrl}</Label>
              <Input value={stageForm.video_url} onChange={e => setStageForm({ ...stageForm, video_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>{tp.stageForm.pdfUrl}</Label>
              <Input value={stageForm.pdf_url} onChange={e => setStageForm({ ...stageForm, pdf_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>{tp.stageForm.passageText}</Label>
              <Textarea rows={3} value={stageForm.passage_text} onChange={e => setStageForm({ ...stageForm, passage_text: e.target.value })} placeholder={tp.stageForm.passagePlaceholder} />
            </div>
            <div className="space-y-1">
              <Label>{tp.stageForm.estimatedMinutes}</Label>
              <Input type="number" min="1" value={stageForm.estimated_minutes} onChange={e => setStageForm({ ...stageForm, estimated_minutes: parseInt(e.target.value, 10) || 30 })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setStageDialog({ open: false })}>{tp.actions.cancel}</Button>
            <Button onClick={saveStage} disabled={savingStage || !stageForm.title.trim()} className="gap-2">
              {savingStage && <Loader2 className="h-4 w-4 animate-spin" />}
              {stageDialog.stage ? tp.actions.saveChanges : tp.actions.addStageVerb}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
