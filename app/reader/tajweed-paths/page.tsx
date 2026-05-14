"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  GraduationCap, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

type Subject = "tajweed" | "fiqh" | "aqeedah" | "seerah" | "tafsir"
const SUBJECTS: Subject[] = ["tajweed"] // Maqra'ah reader: tajweed only

type Path = {
  id: string
  title: string
  description: string | null
  level: string
  subject: Subject
  total_stages: number
  estimated_days: number | null
  require_audio: boolean
  is_published: boolean
  is_active: boolean
  created_at: string
  created_by?: string
  manager_id?: string | null
  manager_name?: string | null
  manager_email?: string | null
  stats?: { enrolled: string; active: string; completed: string; avg_progress: string }
}

export default function ReaderTajweedPathsPage() {
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths

  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [migrationMissing, setMigrationMissing] = useState(false)

  const [subjectTab, setSubjectTab] = useState<"all" | Subject>("all")
  const [form, setForm] = useState({
    title: "", description: "", level: "beginner",
    subject: "tajweed" as Subject,
    require_audio: false, estimated_days: "",
    is_published: false, seed_default_stages: true,
  })

  const visiblePaths = subjectTab === "all" ? paths : paths.filter(p => p.subject === subjectTab)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/reader/tajweed-paths?include_stats=1&scope=tajweed")
      const data = await res.json()
      if (data.notice === "migration_not_applied") setMigrationMissing(true)
      setPaths(data.paths || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function submit() {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/reader/tajweed-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          level: form.level,
          subject: form.subject,
          require_audio: form.require_audio,
          estimated_days: form.estimated_days ? parseInt(form.estimated_days, 10) : null,
          is_published: form.is_published,
          seed_default_stages: form.seed_default_stages,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || tp.form.createFailed)
        return
      }
      setOpenCreate(false)
      setForm({ ...form, title: "", description: "" })
      await load()
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(p: Path) {
    await fetch(`/api/reader/tajweed-paths/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !p.is_published }),
    })
    await load()
  }

  async function remove(p: Path) {
    if (!confirm(tp.confirm.deletePath.replace("{title}", p.title))) return
    await fetch(`/api/reader/tajweed-paths/${p.id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-600" /> {tp.tajweedTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tp.readerSubtitle}
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {tp.actions.createPath}
        </Button>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-900">
          {tp.migrationMissingPrefix}
          <code className="bg-amber-100 px-2 py-0.5 mx-1 rounded">scripts/023-tajweed-paths.sql</code>
        </Card>
      )}



      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : visiblePaths.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {tp.emptyReader}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePaths.map(p => (
            <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <Link href={`/reader/tajweed-paths/${p.id}`} className="font-semibold text-lg hover:text-emerald-700 line-clamp-2">
                  {p.title}
                </Link>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline">{tp.levels[p.level] || p.level}</Badge>
                  <Badge variant="secondary">{p.total_stages} {tp.metadata.stagesUnit}</Badge>
                  {p.is_published ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      <Eye className="h-3 w-3 me-1" /> {tp.statuses.published}
                    </Badge>
                  ) : (
                    <Badge variant="outline"><EyeOff className="h-3 w-3 me-1" /> {tp.statuses.draft}</Badge>
                  )}
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3" /> {tp.metadata.enrolled}</div>
                  <div className="text-lg font-semibold">{p.stats?.enrolled || "0"}</div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" /> {tp.metadata.completed}</div>
                  <div className="text-lg font-semibold">{p.stats?.completed || "0"}</div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">{tp.metadata.avgPercent}</div>
                  <div className="text-lg font-semibold">{p.stats?.avg_progress || "0"}%</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/reader/tajweed-paths/${p.id}`}>
                    {tp.actions.manage} <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button variant={p.is_published ? "secondary" : "default"} size="sm" onClick={() => togglePublish(p)}>
                  {p.is_published ? tp.actions.unpublish : tp.actions.publish}
                </Button>
                <Button variant="destructive" size="icon" onClick={() => remove(p)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{tp.actions.createTitle}</DialogTitle>
            <DialogDescription>
              {tp.form.createDescReader}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label>{tp.form.title}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={tp.form.titlePlaceholder} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>{tp.form.description}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>{tp.form.level}</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{tp.levels.beginner}</SelectItem>
                  <SelectItem value="intermediate">{tp.levels.intermediate}</SelectItem>
                  <SelectItem value="advanced">{tp.levels.advanced}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{tp.form.estimatedDaysLabel}</Label>
              <Input type="number" min="1" value={form.estimated_days} onChange={e => setForm({ ...form, estimated_days: e.target.value })} placeholder={tp.form.estimatedDaysPlaceholder} />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="rt_seed" type="checkbox" className="h-4 w-4" checked={form.seed_default_stages} onChange={e => setForm({ ...form, seed_default_stages: e.target.checked })} />
              <Label htmlFor="rt_seed" className="cursor-pointer">{tp.form.seedDefaultStages}</Label>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="rt_aud" type="checkbox" className="h-4 w-4" checked={form.require_audio} onChange={e => setForm({ ...form, require_audio: e.target.checked })} />
              <Label htmlFor="rt_aud" className="cursor-pointer">{tp.form.requireAudioOption}</Label>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="rt_pub" type="checkbox" className="h-4 w-4" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              <Label htmlFor="rt_pub" className="cursor-pointer">{tp.form.publishImmediately}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>{tp.actions.cancel}</Button>
            <Button onClick={submit} disabled={creating || !form.title.trim()} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {tp.actions.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
