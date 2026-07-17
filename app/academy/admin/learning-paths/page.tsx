"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  ImageIcon,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  UploadCloud,
  Users,
  LayoutGrid,
  List,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

type Subject = "fiqh" | "aqeedah" | "seerah" | "tafsir"
type SubjectTab = "all" | Subject
type Level = "beginner" | "intermediate" | "advanced"
type PathKind = "tajweed" | "learning"
type StatusFilter = "all" | "published" | "draft"
type ViewMode = "grid" | "table"

type PathStats = {
  enrolled: string
  active: string
  completed: string
  avg_progress: string
}

type LearningPath = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: Level | string
  subject: Subject
  total_stages: number
  estimated_days: number | null
  require_audio: boolean
  is_published: boolean
  is_active: boolean
  kind?: PathKind
  created_by_name?: string | null
  manager_id?: string | null
  manager_name?: string | null
  manager_email?: string | null
  created_at?: string | null
  stats?: PathStats
}

type ManagerCandidate = {
  id: string
  name: string
  email: string
  role: string
}

type PathsPayload = {
  paths?: LearningPath[]
  warning?: string
  notice?: string
  error?: string
}

type UsersPayload = {
  users?: ManagerCandidate[]
}

type CreateForm = {
  title: string
  description: string
  level: Level
  subject: Subject
  manager_id: string
  require_audio: boolean
  estimated_days: string
  is_published: boolean
  seed_default_stages: boolean
  thumbnail_url: string
}

function getSubjects(a: any) {
  return [
    { value: "fiqh" as Subject, label: a.lpSubjects.fiqh, tone: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700" },
    { value: "aqeedah" as Subject, label: a.lpSubjects.aqeedah, tone: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700" },
    { value: "seerah" as Subject, label: a.lpSubjects.seerah, tone: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700" },
    { value: "tafsir" as Subject, label: a.lpSubjects.tafsir, tone: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700" },
  ]
}

function getSubjectLabels(a: any): Record<Subject, string> {
  return {
    fiqh: a.lpSubjects.fiqh,
    aqeedah: a.lpSubjects.aqeedah,
    seerah: a.lpSubjects.seerah,
    tafsir: a.lpSubjects.tafsir,
  }
}

function getLevelLabels(a: any): Record<Level, string> {
  return {
    beginner: a.courseLevel.beginner,
    intermediate: a.lpIntermediate,
    advanced: a.courseLevel.advanced,
  }
}

const LEVEL_BADGE_CLS: Record<Level, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
}

function emptyForm(): CreateForm {
  return {
    title: "",
    description: "",
    level: "beginner",
    subject: "fiqh",
    manager_id: "",
    require_audio: false,
    estimated_days: "",
    is_published: false,
    seed_default_stages: true,
    thumbnail_url: "",
  }
}

function isSubjectTab(value: string): value is SubjectTab {
  return value === "all" || ["fiqh", "aqeedah", "seerah", "tafsir"].includes(value)
}

function subjectTone(subject: Subject) {
  switch (subject) {
    case "fiqh": return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
    case "aqeedah": return "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700"
    case "seerah": return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
    case "tafsir": return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700"
    default: return "bg-slate-50 text-slate-800 border-slate-200"
  }
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T
  } catch {
    return {} as T
  }
}

function apiErrorMessage(payload: { error?: string }, fallback: string) {
  return payload.error || fallback
}

function parseCount(value: string | undefined) {
  const parsed = Number.parseInt(value || "0", 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseFloatSafe(value: string | undefined) {
  const parsed = Number.parseFloat(value || "0")
  return Number.isFinite(parsed) ? parsed : 0
}

export default function AcademyAdminLearningPathsPage() {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin
  const SUBJECTS = useMemo(() => getSubjects(a), [a])
  const SUBJECT_LABELS = useMemo(() => getSubjectLabels(a), [a])
  const LEVEL_LABELS = useMemo(() => getLevelLabels(a), [a])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [subjectTab, setSubjectTab] = useState<SubjectTab>("all")
  const [levelFilter, setLevelFilter] = useState<"all" | Level>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  
  const [managers, setManagers] = useState<ManagerCandidate[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const [form, setForm] = useState<CreateForm>(() => emptyForm())
  const [createTab, setCreateTab] = useState("basic")
  
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPaths = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/admin/tajweed-paths?include_stats=1&scope=academy", { cache: "no-store" })
      const payload = await readJson<PathsPayload>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, a.lpPathLoadError))

      setPaths(Array.isArray(payload.paths) ? payload.paths : [])
      setWarning(payload.warning || payload.notice ? a.lpPartialDataLoaded : null)
    } catch (loadError) {
      setPaths([])
      setWarning(null)
      toast.error(loadError instanceof Error ? loadError.message : a.lpPathLoadError)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadManagers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users?role=teacher&limit=100")
      const payload = await readJson<UsersPayload>(response)
      const unique = new Map<string, ManagerCandidate>()
      for (const manager of (payload.users || [])) {
        if (manager.id) unique.set(manager.id, manager)
      }
      setManagers([...unique.values()])
    } catch {
      setManagers([])
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPaths()
      void loadManagers()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadManagers, loadPaths])

  const visiblePaths = useMemo(() => {
    const q = search.trim().toLowerCase()
    return paths.filter(path => {
      if (subjectTab !== "all" && path.subject !== subjectTab) return false
      if (levelFilter !== "all" && path.level !== levelFilter) return false
      if (statusFilter === "published" && !path.is_published) return false
      if (statusFilter === "draft" && path.is_published) return false
      if (managerFilter !== "all" && path.manager_id !== managerFilter) return false
      if (q) {
        const haystack = `${path.title} ${path.description || ""} ${path.manager_name || ""} ${path.manager_email || ""} ${path.created_by_name || ""}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [paths, search, subjectTab, levelFilter, statusFilter, managerFilter])

  const summary = useMemo(() => {
    const total = paths.length
    const published = paths.filter(path => path.is_published).length
    const drafts = total - published
    const enrolled = paths.reduce((sum, path) => sum + parseCount(path.stats?.enrolled), 0)
    const completed = paths.reduce((sum, path) => sum + parseCount(path.stats?.completed), 0)
    const active = paths.reduce((sum, path) => sum + parseCount(path.stats?.active), 0)
    const pathsWithProgress = paths.filter(path => parseCount(path.stats?.enrolled) > 0)
    const avgProgress = pathsWithProgress.length === 0
      ? 0
      : Math.round(pathsWithProgress.reduce((sum, path) => sum + parseFloatSafe(path.stats?.avg_progress), 0) / pathsWithProgress.length)
    const empty = paths.filter(path => path.total_stages === 0).length
    return { total, published, drafts, enrolled, completed, active, avgProgress, empty }
  }, [paths])

  async function handleThumbnailUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(a.lpImageRequired)
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(a.lpImageMaxSize)
      return
    }
    setUploadingThumb(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await readJson<{ url?: string; error?: string; details?: string }>(res)
      if (!res.ok || !json.url) {
        const errMsg = json.details ? `${json.error || a.lpImageUploadFailed}: ${json.details}` : (json.error || a.lpImageUploadFailed)
        toast.error(errMsg)
        return
      }
      setForm(prev => ({ ...prev, thumbnail_url: json.url || "" }))
      toast.success(a.lpImageUploaded)
    } finally {
      setUploadingThumb(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.error(a.lpPathNameRequired)
      return
    }
    setCreating(true)
    try {
      const response = await fetch("/api/admin/tajweed-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          level: form.level,
          subject: form.subject,
          manager_id: form.manager_id || null,
          require_audio: form.require_audio,
          estimated_days: form.estimated_days ? Number.parseInt(form.estimated_days, 10) : null,
          is_published: form.is_published,
          seed_default_stages: form.seed_default_stages,
          thumbnail_url: form.thumbnail_url.trim() || null,
        }),
      })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, a.lpPathCreateError))

      toast.success(a.lpPathCreatedSuccessfully)
      setOpenCreate(false)
      setForm(emptyForm())
      setCreateTab("basic")
      await loadPaths()
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : a.lpPathCreateError)
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(path: LearningPath) {
    setActionId(`publish-${path.id}`)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !path.is_published }),
      })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, a.lpPathUpdateError))
      toast.success(!path.is_published ? a.lpPathPublished : a.lpPathUnpublished)
      await loadPaths()
    } catch (publishError) {
      toast.error(publishError instanceof Error ? publishError.message : a.lpPathUpdateError)
    } finally {
      setActionId(null)
    }
  }

  async function toggleArchive(path: LearningPath) {
    if (path.kind !== "tajweed" && path.kind !== undefined) {
      toast.error(a.lpArchiveNotAvailable)
      return
    }
    const willArchive = path.is_active !== false
    if (!confirm(willArchive
      ? a.lpArchivePathConfirm.replace('{title}', path.title)
      : a.lpUnarchivePathConfirm.replace('{title}', path.title))) return
    setActionId(`archive-${path.id}`)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !willArchive }),
      })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, a.lpPathUpdateError))
      toast.success(willArchive ? a.lpPathArchived : a.lpPathActivated)
      await loadPaths()
    } catch (archiveError) {
      toast.error(archiveError instanceof Error ? archiveError.message : a.lpPathUpdateError)
    } finally {
      setActionId(null)
    }
  }

  async function remove(path: LearningPath) {
    if (!confirm(a.lpDeletePathConfirm.replace('{title}', path.title))) return
    setActionId(`delete-${path.id}`)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, { method: "DELETE" })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, a.lpPathDeleteError))
      toast.success(a.lpPathDeleted)
      await loadPaths()
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : a.lpPathDeleteError)
    } finally {
      setActionId(null)
    }
  }

  const renderActionsMenu = (path: LearningPath) => {
    const isLegacy = path.kind === "learning"
    const isArchived = path.is_active === false

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {actionId?.endsWith(path.id) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/academy/admin/learning-paths/${path.id}`} className="cursor-pointer gap-2">
              <Settings className="h-4 w-4" />
              <span>{isLegacy ? a.lpEdit : a.lpManagePath}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => togglePublish(path)} className="cursor-pointer gap-2">
            {path.is_published ? (
              <><EyeOff className="h-4 w-4" /> {a.lpUnpublish}</>
            ) : (
              <><Eye className="h-4 w-4" /> {a.lpPublishToStudents}</>
            )}
          </DropdownMenuItem>
          {!isLegacy && (
            <DropdownMenuItem onClick={() => toggleArchive(path)} className="cursor-pointer gap-2">
              {isArchived ? (
                <><ArchiveRestore className="h-4 w-4" /> {a.lpReactivate}</>
              ) : (
                <><Archive className="h-4 w-4" /> {a.lpArchiveHide}</>
              )}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => remove(path)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2">
            <Trash2 className="h-4 w-4" /> {a.lpDeletePath}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:max-w-[1400px] mx-auto">
      {/* Header & Stats Premium Design */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700 py-1.5 px-3">
              <GraduationCap className="h-4 w-4" /> {a.lpBreadcrumbTitle}
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{a.lpPageTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {a.lpPageDescription}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-muted rounded-lg me-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 shadow-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 shadow-none"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={loadPaths} disabled={refreshing} className="gap-2 shadow-sm">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              {a.lpUpdate}
            </Button>
            <Button onClick={() => setOpenCreate(true)} className="gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" /> {a.lpCreateNewPath}
            </Button>
          </div>
        </div>

        {warning && (
          <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{warning}</p>
            </div>
          </Card>
        )}

        {/* Stats Dashboard - Premium Look */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <StatCard icon={<BookOpen className="h-5 w-5 text-white" />} iconBg="bg-emerald-500" value={summary.total} label={a.lpTotalPaths} />
          <StatCard icon={<Eye className="h-5 w-5 text-white" />} iconBg="bg-blue-500" value={summary.published} label={a.lpPublishedToStudents} />
          <StatCard icon={<EyeOff className="h-5 w-5 text-white" />} iconBg="bg-slate-400" value={summary.drafts} label={a.lpDraftsUnpublished} />
          <StatCard icon={<Users className="h-5 w-5 text-white" />} iconBg="bg-violet-500" value={summary.enrolled} label={a.lpTotalEnrolled} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-white" />} iconBg="bg-teal-500" value={summary.completed} label={a.lpCompletedSuccessfully} />
          <StatCard icon={<BarChart3 className="h-5 w-5 text-white" />} iconBg="bg-amber-500" value={`${summary.avgProgress}%`} label={a.lpAverageProgress} />
          <StatCard icon={<AlertCircle className="h-5 w-5 text-white" />} iconBg={summary.empty > 0 ? "bg-red-500" : "bg-emerald-400"} value={summary.empty} label={a.lpEmptyPathsWarning} tone={summary.empty > 0 ? "warn" : undefined} />
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-2 flex flex-col lg:flex-row lg:items-center gap-2 shadow-sm rounded-xl">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={a.lpSearchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-lg border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-colors"
          />
        </div>
        <div className="h-px w-full bg-border lg:h-6 lg:w-px lg:mx-2" />
        <div className="flex flex-wrap items-center gap-2 p-1">
          <FilterSelect
            icon={<Filter className="h-3.5 w-3.5" />}
            value={statusFilter}
            onChange={v => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: a.lpAllStatuses },
              { value: "published", label: a.lpPublishedFilter },
              { value: "draft", label: a.lpDraftsFilter },
            ]}
          />
          <FilterSelect
            value={levelFilter}
            onChange={v => setLevelFilter(v as "all" | Level)}
            options={[
              { value: "all", label: a.lpAllLevels },
              { value: "beginner", label: a.lpBeginner },
              { value: "intermediate", label: a.lpIntermediate },
              { value: "advanced", label: a.lpAdvancedFilter },
            ]}
          />
          {managers.length > 0 && (
            <FilterSelect
              value={managerFilter}
              onChange={setManagerFilter}
              options={[
                { value: "all", label: a.lpAllManagers },
                ...managers.map(m => ({ value: m.id, label: m.name || m.email })),
              ]}
            />
          )}
        </div>
      </Card>

      {/* Subject Tabs */}
      <Tabs value={subjectTab} onValueChange={value => setSubjectTab(isSubjectTab(value) ? value : "all")}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background shadow-sm border border-transparent data-[state=inactive]:border-border data-[state=inactive]:bg-background">{a.lpTabAll.replace('{count}', String(paths.length))}</TabsTrigger>
          {SUBJECTS.map(subject => (
            <TabsTrigger key={subject.value} value={subject.value} className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background shadow-sm border border-transparent data-[state=inactive]:border-border data-[state=inactive]:bg-background">
              {subject.label} ({paths.filter(path => path.subject === subject.value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Main Content Area */}
      {loading ? (
        <Card className="flex min-h-[300px] items-center justify-center p-10 text-muted-foreground rounded-2xl border-dashed">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p>{a.lpLoadingPaths}</p>
          </div>
        </Card>
      ) : visiblePaths.length === 0 ? (
        <Card className="p-16 text-center rounded-2xl border-dashed">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-10 w-10 text-emerald-500" />
          </div>
          {paths.length === 0 ? (
            <>
              <h2 className="text-xl font-bold">{a.lpNoPathsYet}</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                {a.lpNoPathsDesc}
              </p>
              <Button className="mt-6 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setOpenCreate(true)}>
              <Plus className="h-4 w-4" /> {a.lpCreateNewPath}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{a.lpNoMatchingResults}</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                {a.lpNoMatchingDesc}
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setSubjectTab("all"); setLevelFilter("all"); setStatusFilter("all"); setManagerFilter("all"); }}>
                {a.lpClearFilters}
              </Button>
            </>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiblePaths.map(path => {
            const subject = path.subject as Subject
            const level = (path.level as Level) || "beginner"
            const enrolled = parseCount(path.stats?.enrolled)
            const completed = parseCount(path.stats?.completed)
            const avgProgress = parseFloatSafe(path.stats?.avg_progress)
            const isLegacy = path.kind === "learning"
            const isArchived = path.is_active === false

            return (
              <Card key={path.id} className={cn(
                "group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border/50",
                isArchived && "opacity-75 grayscale-[0.2]"
              )}>
                {/* Thumbnail Header */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shrink-0 overflow-hidden">
                  {path.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/20">
                      <GraduationCap className="h-16 w-16 text-emerald-200 dark:text-emerald-900" />
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {path.is_published ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-none backdrop-blur-md">
                        {a.lpPublishedBadge}
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-800/80 hover:bg-slate-800 text-white shadow-sm border-none backdrop-blur-md">
                        {a.lpDraftBadge}
                      </Badge>
                    )}
                    {isArchived && (
                      <Badge className="bg-red-500/90 text-white border-none shadow-sm backdrop-blur-md">
                        {a.lpArchivedBadge}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="absolute bottom-3 right-3 left-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge variant="secondary" className="bg-white/90 text-black border-none shadow-sm">{path.total_stages || 0} {a.lpStage}</Badge>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border-transparent", subjectTone(subject))}>{SUBJECT_LABELS[subject] || subject}</Badge>
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border-transparent", LEVEL_BADGE_CLS[level])}>{LEVEL_LABELS[level] || level}</Badge>
                    {isLegacy && <Badge variant="outline" className="text-[10px] px-2 py-0 opacity-50">{a.lpLegacy}</Badge>}
                  </div>

                  <Link href={`/academy/admin/learning-paths/${path.id}`} className="font-bold text-lg hover:text-emerald-600 line-clamp-2 leading-tight mb-2 transition-colors">
                    {path.title}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {path.description || a.lpNoDescription}
                  </p>

                  {/* Meta Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 py-3 border-y border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground mb-1 font-semibold">{a.lpEnrolledLabel}</span>
                      <span className="text-sm font-medium flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-blue-500" /> {enrolled}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground mb-1 font-semibold">{a.lpAchievementLabel}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{avgProgress}%</span>
                        <Progress value={avgProgress} className="h-1.5 w-12" />
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-1 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {path.manager_name ? (
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md" title={path.manager_email || ""}>
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {path.manager_name.charAt(0)}
                          </div>
                          <span className="truncate max-w-[100px]">{path.manager_name}</span>
                        </div>
                      ) : (
                        <span className="opacity-50">{a.lpNoManager}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600">
                        <Link href={`/academy/admin/learning-paths/${path.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {renderActionsMenu(path)}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[300px]">{a.lpTablePath}</TableHead>
                  <TableHead>{a.lpTableCategory}</TableHead>
                  <TableHead>{a.lpTableStages}</TableHead>
                  <TableHead>{a.lpTableStudentsProgress}</TableHead>
                  <TableHead>{a.lpTableManager}</TableHead>
                  <TableHead>{a.lpTableStatus}</TableHead>
                  <TableHead className="text-right">{a.lpTableActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePaths.map(path => {
                  const subject = path.subject as Subject
                  const level = (path.level as Level) || "beginner"
                  const enrolled = parseCount(path.stats?.enrolled)
                  const avgProgress = parseFloatSafe(path.stats?.avg_progress)
                  const isArchived = path.is_active === false

                  return (
                    <TableRow key={path.id} className={cn("hover:bg-muted/20 transition-colors", isArchived && "opacity-60")}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-border">
                            {path.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={path.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                                <GraduationCap className="h-5 w-5 text-emerald-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link href={`/academy/admin/learning-paths/${path.id}`} className="font-semibold text-sm hover:text-emerald-600 truncate transition-colors">
                              {path.title}
                            </Link>
                            {path.estimated_days ? (
                              <span className="text-[10px] text-muted-foreground mt-0.5">{path.estimated_days} {a.lpDays}</span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" className={cn("text-[10px] py-0 border-transparent", subjectTone(subject))}>{SUBJECT_LABELS[subject] || subject}</Badge>
                          <Badge variant="outline" className={cn("text-[10px] py-0 border-transparent", LEVEL_BADGE_CLS[level])}>{LEVEL_LABELS[level] || level}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{path.total_stages || 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-24">
                          <span className="text-xs font-medium flex items-center gap-1.5"><Users className="h-3 w-3 text-blue-500" /> {enrolled} {a.lpStudents}</span>
                          <div className="flex items-center gap-1.5" title={`${avgProgress}% ${a.lpProgressLabel}`}>
                            <Progress value={avgProgress} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground">{avgProgress}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {path.manager_name ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground/80">{path.manager_name}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={path.manager_email || ""}>{path.manager_email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground opacity-50">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {path.is_published ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">{a.lpPublishedBadge}</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">{a.lpDraftBadge}</Badge>
                          )}
                          {isArchived && <Badge variant="destructive" className="text-[10px] py-0 px-1.5">{a.lpArchivedBadge}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderActionsMenu(path)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Premium Create Modal (Wizard-like Tabs) */}
      <Dialog open={openCreate} onOpenChange={open => !creating && setOpenCreate(open)}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border/60 shadow-2xl rounded-xl">
          <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                  <Plus className="h-4 w-4" />
                </div>
                {a.lpCreateNewLearningPath}
              </DialogTitle>
              <DialogDescription className="pt-1">
                {a.lpCreateNewLearningPathDesc}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Tabs value={createTab} onValueChange={setCreateTab} className="flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger value="basic" className="rounded-md">{a.lpBasicInfo}</TabsTrigger>
                <TabsTrigger value="media" className="rounded-md">{a.lpMedia}</TabsTrigger>
                <TabsTrigger value="settings" className="rounded-md">{a.lpSettingsLabel}</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
              <TabsContent value="basic" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="path-title" className="text-sm font-semibold mb-1.5 block">{a.lpPathTitle} <span className="text-red-500">*</span></Label>
                    <Input
                      id="path-title"
                      value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={a.lpPathTitlePlaceholder}
                      className="bg-muted/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="path-desc" className="text-sm font-semibold mb-1.5 block">{a.lpShortDescription}</Label>
                    <Textarea
                      id="path-desc"
                      rows={4}
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={a.lpShortDescriptionPlaceholder}
                      className="bg-muted/20 resize-none"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold mb-1.5 block">{a.lpSelectSubjectPlaceholder}</Label>
                      <Select value={form.subject} onValueChange={value => setForm(prev => ({ ...prev, subject: value as Subject }))}>
                        <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-1.5 block">{a.lpDifficultyLevel}</Label>
                      <Select value={form.level} onValueChange={value => setForm(prev => ({ ...prev, level: value as Level }))}>
                        <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">{a.lpBeginnerFundamental}</SelectItem>
                          <SelectItem value="intermediate">{a.lpIntermediate}</SelectItem>
                          <SelectItem value="advanced">{a.lpAdvancedSpecialized}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                  <div className="mx-auto w-full max-w-sm aspect-[16/9] bg-background shadow-sm rounded-lg overflow-hidden border border-border/50 mb-4 relative flex items-center justify-center">
                    {form.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.thumbnail_url} alt={a.lpImagePreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <span className="text-sm text-muted-foreground">{a.lpCoverImage}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative inline-block">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void handleThumbnailUpload(file)
                      }}
                      disabled={uploadingThumb || creating}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label={a.lpUploadCoverImage}
                    />
                    <Button type="button" variant="secondary" disabled={uploadingThumb || creating} className="gap-2 px-6">
                      {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      {form.thumbnail_url ? a.lpChangeCurrentImage : a.lpSelectAndUploadImage}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">{a.lpSupportedFormats}</p>
                  
                  {form.thumbnail_url && (
                    <div className="mt-3">
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, thumbnail_url: "" }))} className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2">
                        {a.lpRemoveImagePermanently}
                      </button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="m-0 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">{a.lpPathManager}</Label>
                    <Select value={form.manager_id || "none"} onValueChange={value => setForm(prev => ({ ...prev, manager_id: value === "none" ? "" : value }))}>
                      <SelectTrigger className="bg-muted/20"><SelectValue placeholder={a.lpSelectManager} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- {a.lpNoManagerAssignment} --</SelectItem>
                        {managers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} <span className="text-muted-foreground text-xs mx-1">({m.email})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{a.lpManagerPathHint}</p>
                  </div>
                  <div>
                    <Label htmlFor="path-days" className="text-sm font-semibold mb-1.5 block">{a.lpEstimatedDurationDays}</Label>
                    <Input
                      id="path-days"
                      type="number"
                      min={0}
                      value={form.estimated_days}
                      onChange={e => setForm(prev => ({ ...prev, estimated_days: e.target.value }))}
                      placeholder="30"
                      className="bg-muted/20"
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-muted-foreground" /> {a.lpAdvancedSettings}
                  </h4>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <input type="checkbox" className="h-4 w-4 accent-emerald-600 rounded border-gray-300" checked={form.seed_default_stages} onChange={e => setForm(prev => ({ ...prev, seed_default_stages: e.target.checked }))} />
                    </div>
                    <div>
                      <span className="text-sm font-medium group-hover:text-emerald-700 transition-colors">{a.lpBuildDefaultStages}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.lpBuildDefaultStagesDesc}</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <input type="checkbox" className="h-4 w-4 accent-emerald-600 rounded border-gray-300" checked={form.require_audio} onChange={e => setForm(prev => ({ ...prev, require_audio: e.target.checked }))} />
                    </div>
                    <div>
                      <span className="text-sm font-medium group-hover:text-emerald-700 transition-colors">{a.lpEnableAudioRecording}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.lpEnableAudioRecordingDesc}</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <input type="checkbox" className="h-4 w-4 accent-emerald-600 rounded border-gray-300" checked={form.is_published} onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked }))} />
                    </div>
                    <div>
                      <span className="text-sm font-medium group-hover:text-emerald-700 transition-colors">{a.lpPublishAfterCreation}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.lpPublishAfterCreationDesc}</p>
                    </div>
                  </label>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="bg-muted/30 px-6 py-4 border-t border-border/50">
            <DialogFooter className="flex justify-between sm:justify-between w-full">
              <Button variant="ghost" onClick={() => setOpenCreate(false)} disabled={creating}>{a.lpCancelCreation}</Button>
              <div className="flex gap-2">
                {createTab !== "settings" ? (
                    <Button type="button" variant="secondary" onClick={() => setCreateTab(createTab === "basic" ? "media" : "settings")}>
                    {a.lpNext}
                  </Button>
                ) : null}
                <Button onClick={submit} disabled={creating || uploadingThumb || !form.title.trim()} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {a.lpApproveAndCreate}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  tone,
  iconBg,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  tone?: "warn"
  iconBg?: string
}) {
  return (
    <Card className={cn(
      "p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:shadow-md border-border/50",
      tone === "warn" && "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800"
    )}>
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.03] bg-current" />
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", iconBg || "bg-emerald-500")}>
        {icon}
      </div>
      <div className="flex flex-col">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs font-medium text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  )
}

function FilterSelect({
  icon,
  value,
  onChange,
  options,
}: {
  icon?: React.ReactNode
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative group">
      {icon && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "appearance-none h-8 rounded-md bg-transparent border-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted focus:bg-muted focus:text-foreground focus:outline-none transition-colors cursor-pointer",
          icon ? "pr-8 pl-6" : "px-3"
        )}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="text-foreground bg-background">{o.label}</option>
        ))}
      </select>
    </div>
  )
}
