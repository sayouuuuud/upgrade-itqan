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
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  UploadCloud,
  Users,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Subject = "fiqh" | "aqeedah" | "seerah" | "tafsir"
type SubjectTab = "all" | Subject
type Level = "beginner" | "intermediate" | "advanced"
type PathKind = "tajweed" | "learning"
type StatusFilter = "all" | "published" | "draft"

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

const SUBJECTS: { value: Subject; label: string; tone: string }[] = [
  { value: "fiqh", label: "الفقه", tone: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700" },
  { value: "aqeedah", label: "العقيدة", tone: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700" },
  { value: "seerah", label: "السيرة", tone: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700" },
  { value: "tafsir", label: "التفسير", tone: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700" },
]

const SUBJECT_LABELS: Record<Subject, string> = {
  fiqh: "الفقه",
  aqeedah: "العقيدة",
  seerah: "السيرة",
  tafsir: "التفسير",
}

const LEVEL_LABELS: Record<Level, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
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
  return value === "all" || SUBJECTS.some(subject => subject.value === value)
}

function subjectTone(subject: Subject) {
  return SUBJECTS.find(item => item.value === subject)?.tone || "bg-slate-50 text-slate-800 border-slate-200"
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
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [subjectTab, setSubjectTab] = useState<SubjectTab>("all")
  const [levelFilter, setLevelFilter] = useState<"all" | Level>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [managers, setManagers] = useState<ManagerCandidate[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const [form, setForm] = useState<CreateForm>(() => emptyForm())
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPaths = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/admin/tajweed-paths?include_stats=1&scope=academy", { cache: "no-store" })
      const payload = await readJson<PathsPayload>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر تحميل مسارات التعلم"))

      setPaths(Array.isArray(payload.paths) ? payload.paths : [])
      setWarning(payload.warning || payload.notice ? "تم تحميل البيانات المتاحة فقط. بعض التفاصيل قد تكون ناقصة." : null)
    } catch (loadError) {
      setPaths([])
      setWarning(null)
      toast.error(loadError instanceof Error ? loadError.message : "تعذر تحميل مسارات التعلم")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadManagers = useCallback(async () => {
    try {
      const [readersResponse, teachersResponse] = await Promise.all([
        fetch("/api/admin/users?role=reader&limit=100"),
        fetch("/api/admin/users?role=teacher&limit=100"),
      ])
      const readers = await readJson<UsersPayload>(readersResponse)
      const teachers = await readJson<UsersPayload>(teachersResponse)
      const unique = new Map<string, ManagerCandidate>()
      for (const manager of [...(readers.users || []), ...(teachers.users || [])]) {
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
      toast.error("يجب اختيار ملف صورة")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("الحجم الأقصى للصورة 4MB")
      return
    }
    setUploadingThumb(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await readJson<{ url?: string; error?: string }>(res)
      if (!res.ok || !json.url) {
        toast.error(json.error || "فشل رفع الصورة")
        return
      }
      setForm(prev => ({ ...prev, thumbnail_url: json.url || "" }))
      toast.success("تم رفع الصورة")
    } finally {
      setUploadingThumb(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.error("اسم المسار مطلوب")
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
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر إنشاء المسار"))

      toast.success("تم إنشاء المسار")
      setOpenCreate(false)
      setForm(emptyForm())
      await loadPaths()
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "تعذر إنشاء المسار")
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
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر تحديث حالة النشر"))
      toast.success(!path.is_published ? "تم نشر المسار" : "تم إلغاء نشر المسار")
      await loadPaths()
    } catch (publishError) {
      toast.error(publishError instanceof Error ? publishError.message : "تعذر تحديث حالة النشر")
    } finally {
      setActionId(null)
    }
  }

  async function toggleArchive(path: LearningPath) {
    if (path.kind !== "tajweed" && path.kind !== undefined) {
      toast.error("الأرشفة غير متاحة للمسارات القديمة")
      return
    }
    const willArchive = path.is_active !== false
    if (!confirm(willArchive
      ? `أرشفة مسار «${path.title}»؟ لن يظهر للطلاب الجدد.`
      : `إعادة تفعيل مسار «${path.title}»؟`)) return
    setActionId(`archive-${path.id}`)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !willArchive }),
      })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر تحديث حالة الأرشفة"))
      toast.success(willArchive ? "تم أرشفة المسار" : "تم تفعيل المسار")
      await loadPaths()
    } catch (archiveError) {
      toast.error(archiveError instanceof Error ? archiveError.message : "تعذر تحديث حالة الأرشفة")
    } finally {
      setActionId(null)
    }
  }

  async function remove(path: LearningPath) {
    if (!confirm(`هل تريد حذف مسار «${path.title}» نهائياً؟`)) return
    setActionId(`delete-${path.id}`)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, { method: "DELETE" })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر حذف المسار"))
      toast.success("تم حذف المسار")
      await loadPaths()
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "تعذر حذف المسار")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
            <GraduationCap className="h-4 w-4" /> إدارة الأكاديمية
          </Badge>
          <div>
            <h1 className="text-2xl font-bold">المسارات التعليمية</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أنشئ مسارات تعلم متدرجة في الفقه والعقيدة والسيرة والتفسير، وأسند إدارتها للمدرسين، وتابع إنجاز الطلاب.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadPaths} disabled={refreshing} className="gap-2">
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            تحديث
          </Button>
          <Button onClick={() => setOpenCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> مسار جديد
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

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <StatCard icon={<BookOpen className="h-5 w-5 text-emerald-600" />} value={summary.total} label="إجمالي المسارات" />
        <StatCard icon={<Eye className="h-5 w-5 text-green-600" />} value={summary.published} label="منشورة" />
        <StatCard icon={<EyeOff className="h-5 w-5 text-slate-500" />} value={summary.drafts} label="مسودات" />
        <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} value={summary.enrolled} label="ملتحقون" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-purple-600" />} value={summary.completed} label="مكتمل" />
        <StatCard icon={<BarChart3 className="h-5 w-5 text-cyan-600" />} value={`${summary.avgProgress}%`} label="متوسط الإنجاز" />
        <StatCard icon={<AlertCircle className="h-5 w-5 text-amber-600" />} value={summary.empty} label="بلا مراحل" tone={summary.empty > 0 ? "warn" : undefined} />
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث بعنوان المسار، الوصف، أو اسم المدير..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            icon={<Filter className="h-4 w-4" />}
            value={statusFilter}
            onChange={v => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: "كل الحالات" },
              { value: "published", label: "منشورة" },
              { value: "draft", label: "مسودات" },
            ]}
          />
          <FilterSelect
            value={levelFilter}
            onChange={v => setLevelFilter(v as "all" | Level)}
            options={[
              { value: "all", label: "كل المستويات" },
              { value: "beginner", label: "مبتدئ" },
              { value: "intermediate", label: "متوسط" },
              { value: "advanced", label: "متقدم" },
            ]}
          />
          {managers.length > 0 && (
            <FilterSelect
              value={managerFilter}
              onChange={setManagerFilter}
              options={[
                { value: "all", label: "كل المدراء" },
                ...managers.map(m => ({ value: m.id, label: m.name || m.email })),
              ]}
            />
          )}
        </div>
      </Card>

      {/* Subject Tabs */}
      <Tabs value={subjectTab} onValueChange={value => setSubjectTab(isSubjectTab(value) ? value : "all")}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="all">الكل ({paths.length})</TabsTrigger>
          {SUBJECTS.map(subject => (
            <TabsTrigger key={subject.value} value={subject.value}>
              {subject.label} ({paths.filter(path => path.subject === subject.value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Cards */}
      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center p-10 text-muted-foreground">
          <Loader2 className="me-2 h-5 w-5 animate-spin" /> جاري تحميل المسارات...
        </Card>
      ) : visiblePaths.length === 0 ? (
        <Card className="p-10 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
          {paths.length === 0 ? (
            <>
              <h2 className="mt-3 text-lg font-semibold">لا توجد مسارات تعليمية بعد</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                ابدأ بإضافة مسار جديد، وسيتم إنشاء مراحل افتراضية قابلة للتعديل حسب التخصص.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setOpenCreate(true)}>
                <Plus className="h-4 w-4" /> إنشاء مسار
              </Button>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-lg font-semibold">لا توجد نتائج تطابق الفلاتر</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                جرب تخفيف الفلاتر أو تغيير البحث.
              </p>
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePaths.map(path => (
            <PathCard
              key={path.id}
              path={path}
              actionId={actionId}
              onTogglePublish={() => togglePublish(path)}
              onToggleArchive={() => toggleArchive(path)}
              onRemove={() => remove(path)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={openCreate} onOpenChange={open => !creating && setOpenCreate(open)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              مسار تعليمي جديد
            </DialogTitle>
            <DialogDescription>
              عبّأ المعلومات الأساسية الآن، ويمكن تعديل المراحل وإضافة المحتوى بعد إنشاء المسار.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Thumbnail */}
            <div>
              <Label className="mb-2 block">صورة الغلاف</Label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-full sm:w-44 aspect-video bg-muted rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center shrink-0">
                  {form.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.thumbnail_url} alt="معاينة" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void handleThumbnailUpload(file)
                      }}
                      disabled={uploadingThumb || creating}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="رفع صورة الغلاف"
                    />
                    <Button type="button" variant="outline" disabled={uploadingThumb || creating} className="gap-2">
                      {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      {form.thumbnail_url ? "تغيير الصورة" : "رفع صورة"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG / PNG / WebP — حتى 4MB. الأمثل 1280×720.</p>
                  {form.thumbnail_url && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, thumbnail_url: "" }))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="path-title">العنوان <span className="text-red-500">*</span></Label>
              <Input
                id="path-title"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: مسار الفقه الأساسي للمبتدئين"
              />
            </div>

            <div>
              <Label htmlFor="path-desc">الوصف</Label>
              <Textarea
                id="path-desc"
                rows={3}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للمسار وأهدافه التعليمية..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>التخصص</Label>
                <Select value={form.subject} onValueChange={value => setForm(prev => ({ ...prev, subject: value as Subject }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المستوى</Label>
                <Select value={form.level} onValueChange={value => setForm(prev => ({ ...prev, level: value as Level }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>المدير المسؤول</Label>
                <Select value={form.manager_id || "none"} onValueChange={value => setForm(prev => ({ ...prev, manager_id: value === "none" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مدير</SelectItem>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="path-days">المدة التقديرية (أيام)</Label>
                <Input
                  id="path-days"
                  type="number"
                  min={0}
                  value={form.estimated_days}
                  onChange={e => setForm(prev => ({ ...prev, estimated_days: e.target.value }))}
                  placeholder="مثال: 30"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.require_audio}
                  onChange={e => setForm(prev => ({ ...prev, require_audio: e.target.checked }))}
                />
                يتطلب تلاوة صوتية
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.seed_default_stages}
                  onChange={e => setForm(prev => ({ ...prev, seed_default_stages: e.target.checked }))}
                />
                إنشاء مراحل افتراضية
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.is_published}
                  onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                />
                نشر فور الإنشاء
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>إلغاء</Button>
            <Button onClick={submit} disabled={creating || uploadingThumb} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إنشاء المسار
            </Button>
          </DialogFooter>
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
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  tone?: "warn"
}) {
  return (
    <Card className={cn(
      "p-4",
      tone === "warn" && "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800"
    )}>
      <div className="flex items-center justify-between">
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
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
    <div className="relative">
      {icon && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "appearance-none px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500",
          icon ? "pr-8" : ""
        )}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function PathCard({
  path,
  actionId,
  onTogglePublish,
  onToggleArchive,
  onRemove,
}: {
  path: LearningPath
  actionId: string | null
  onTogglePublish: () => void
  onToggleArchive: () => void
  onRemove: () => void
}) {
  const subject = path.subject as Subject
  const level = (path.level as Level) || "beginner"
  const enrolled = parseCount(path.stats?.enrolled)
  const completed = parseCount(path.stats?.completed)
  const avgProgress = parseFloatSafe(path.stats?.avg_progress)
  const isLegacy = path.kind === "learning"
  const isArchived = path.is_active === false

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden transition-shadow hover:shadow-md",
      isArchived && "opacity-70"
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-emerald-700 to-emerald-900 shrink-0">
        {path.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="h-14 w-14 text-emerald-300/30" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {path.is_published ? (
            <Badge className="gap-1 bg-green-500/90 text-white border-green-400 backdrop-blur-md">
              <Eye className="h-3 w-3" /> منشور
            </Badge>
          ) : (
            <Badge className="gap-1 bg-slate-700/80 text-white border-slate-500 backdrop-blur-md">
              <EyeOff className="h-3 w-3" /> مسودة
            </Badge>
          )}
          {isArchived && (
            <Badge className="gap-1 bg-gray-700/80 text-white border-gray-500 backdrop-blur-md">
              <Archive className="h-3 w-3" /> مؤرشف
            </Badge>
          )}
          {isLegacy && (
            <Badge variant="outline" className="bg-white/80 text-slate-700 backdrop-blur-md text-[10px]">
              قديم
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="outline" className={subjectTone(subject)}>{SUBJECT_LABELS[subject] || subject}</Badge>
          <Badge variant="outline" className={LEVEL_BADGE_CLS[level]}>{LEVEL_LABELS[level] || level}</Badge>
          <Badge variant="secondary">{path.total_stages || 0} {isLegacy ? "دورة" : "مرحلة"}</Badge>
          {path.require_audio && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
              يتطلب تلاوة
            </Badge>
          )}
        </div>

        <Link
          href={`/academy/admin/learning-paths/${path.id}`}
          className="font-bold text-base hover:text-emerald-700 line-clamp-1 mb-1"
        >
          {path.title}
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
          {path.description || "— لا يوجد وصف —"}
        </p>

        {/* Progress */}
        {enrolled > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>متوسط الإنجاز</span>
              <span className="font-bold text-foreground">{avgProgress}%</span>
            </div>
            <Progress value={avgProgress} className="h-1.5" />
          </div>
        )}

        {/* Meta */}
        <div className="text-xs text-muted-foreground space-y-1 mb-3">
          {path.manager_name && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground/80 truncate">{path.manager_name}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {enrolled}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {completed}
            </span>
            {path.estimated_days && (
              <span className="flex items-center gap-1">
                {path.estimated_days} {isLegacy ? "س" : "ي"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-border flex items-center gap-1.5">
          <Link
            href={`/academy/admin/learning-paths/${path.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-bold transition-colors"
            title="إدارة المراحل والمحتوى"
          >
            <Settings className="h-3.5 w-3.5" />
            {isLegacy ? "تعديل" : "إدارة المسار"}
          </Link>
          <button
            onClick={onTogglePublish}
            disabled={actionId === `publish-${path.id}`}
            className="shrink-0 flex items-center justify-center w-9 h-9 border border-border bg-card rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-60"
            title={path.is_published ? "إلغاء النشر" : "نشر"}
          >
            {actionId === `publish-${path.id}` ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : path.is_published ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          {!isLegacy && (
            <button
              onClick={onToggleArchive}
              disabled={actionId === `archive-${path.id}`}
              className="shrink-0 flex items-center justify-center w-9 h-9 border border-border bg-card rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-60"
              title={isArchived ? "إعادة تفعيل" : "أرشفة"}
            >
              {actionId === `archive-${path.id}` ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isArchived ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <button
            onClick={onRemove}
            disabled={actionId === `delete-${path.id}`}
            className="shrink-0 flex items-center justify-center w-9 h-9 border border-border bg-card rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-60"
            title="حذف المسار"
          >
            {actionId === `delete-${path.id}` ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </Card>
  )
}
