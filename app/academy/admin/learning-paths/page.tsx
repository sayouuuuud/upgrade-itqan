"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  Users,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type Subject = "fiqh" | "aqeedah" | "seerah" | "tafsir"
type SubjectTab = "all" | Subject
type Level = "beginner" | "intermediate" | "advanced"

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
  level: Level | string
  subject: Subject
  total_stages: number
  estimated_days: number | null
  require_audio: boolean
  is_published: boolean
  is_active: boolean
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
}

const SUBJECTS: { value: Subject; label: string; tone: string }[] = [
  { value: "fiqh", label: "الفقه", tone: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "aqeedah", label: "العقيدة", tone: "bg-violet-50 text-violet-800 border-violet-200" },
  { value: "seerah", label: "السيرة", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "tafsir", label: "التفسير", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
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

export default function AcademyAdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [subjectTab, setSubjectTab] = useState<SubjectTab>("all")
  const [managers, setManagers] = useState<ManagerCandidate[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateForm>(() => emptyForm())

  const loadPaths = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/tajweed-paths?include_stats=1&scope=academy", { cache: "no-store" })
      const payload = await readJson<PathsPayload>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر تحميل مسارات التعلم"))

      setPaths(Array.isArray(payload.paths) ? payload.paths : [])
      setWarning(payload.warning || payload.notice ? "تم تحميل البيانات المتاحة فقط. إذا كانت بعض التفاصيل ناقصة، أعد تحميل الصفحة بعد اكتمال تحديث قاعدة البيانات." : null)
    } catch (loadError) {
      setPaths([])
      setWarning(null)
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل مسارات التعلم")
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

  const visiblePaths = useMemo(
    () => subjectTab === "all" ? paths : paths.filter(path => path.subject === subjectTab),
    [paths, subjectTab],
  )

  const summary = useMemo(() => ({
    total: paths.length,
    published: paths.filter(path => path.is_published).length,
    drafts: paths.filter(path => !path.is_published).length,
    enrolled: paths.reduce((sum, path) => sum + parseCount(path.stats?.enrolled), 0),
  }), [paths])

  async function submit() {
    if (!form.title.trim()) return
    setCreating(true)
    setError(null)
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
        }),
      })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر إنشاء المسار"))

      setOpenCreate(false)
      setForm(emptyForm())
      await loadPaths()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إنشاء المسار")
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(path: LearningPath) {
    setActionId(`publish-${path.id}`)
    setError(null)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !path.is_published }),
      })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر تحديث حالة النشر"))
      await loadPaths()
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "تعذر تحديث حالة النشر")
    } finally {
      setActionId(null)
    }
  }

  async function remove(path: LearningPath) {
    if (!confirm(`هل تريد حذف مسار «${path.title}»؟`)) return
    setActionId(`delete-${path.id}`)
    setError(null)
    try {
      const response = await fetch(`/api/admin/tajweed-paths/${path.id}`, { method: "DELETE" })
      const payload = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(apiErrorMessage(payload, "تعذر حذف المسار"))
      await loadPaths()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "تعذر حذف المسار")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200">
            <GraduationCap className="h-4 w-4" /> إدارة الأكاديمية
          </Badge>
          <div>
            <h1 className="text-2xl font-bold">مسارات التعلم</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أنشئ مسارات الفقه والعقيدة والسيرة والتفسير، وأسند إدارتها للمعلمين.
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

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">تعذر إكمال العملية</p>
                <p>{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadPaths}>إعادة المحاولة</Button>
          </div>
        </Card>
      )}

      {warning && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <p>{warning}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">إجمالي المسارات</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-5 w-5 text-emerald-600" /> {summary.total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">منشورة</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Eye className="h-5 w-5 text-emerald-600" /> {summary.published}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">مسودات</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <EyeOff className="h-5 w-5 text-slate-500" /> {summary.drafts}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">الملتحقون</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Users className="h-5 w-5 text-blue-600" /> {summary.enrolled}
          </div>
        </Card>
      </div>

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

      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center p-10 text-muted-foreground">
          <Loader2 className="me-2 h-5 w-5 animate-spin" /> جاري تحميل المسارات...
        </Card>
      ) : visiblePaths.length === 0 ? (
        <Card className="p-10 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">لا توجد مسارات في هذا القسم</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            ابدأ بإضافة مسار جديد، وسيتم إنشاء مراحل افتراضية قابلة للتعديل حسب التخصص.
          </p>
          <Button className="mt-4 gap-2" onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4" /> إنشاء مسار
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePaths.map(path => (
            <Card key={path.id} className="flex flex-col p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/academy/admin/learning-paths/${path.id}`}
                    className="line-clamp-2 text-lg font-semibold hover:text-emerald-700"
                  >
                    {path.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className={subjectTone(path.subject)}>{SUBJECT_LABELS[path.subject]}</Badge>
                    <Badge variant="outline">{LEVEL_LABELS[path.level as Level] || path.level}</Badge>
                    <Badge variant="secondary">{path.total_stages || 0} مرحلة</Badge>
                    {path.is_published ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        <Eye className="me-1 h-3 w-3" /> منشور
                      </Badge>
                    ) : (
                      <Badge variant="outline"><EyeOff className="me-1 h-3 w-3" /> مسودة</Badge>
                    )}
                  </div>
                </div>
              </div>

              {path.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{path.description}</p>
              )}

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                {path.manager_name ? (
                  <p>المسؤول: <span className="font-medium text-foreground">{path.manager_name}</span></p>
                ) : (
                  <p>لم يتم تعيين مسؤول للمسار بعد</p>
                )}
                {path.estimated_days ? <p>المدة المتوقعة: {path.estimated_days} يوم</p> : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> ملتحق
                  </div>
                  <div className="text-lg font-semibold">{path.stats?.enrolled || "0"}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" /> مكتمل
                  </div>
                  <div className="text-lg font-semibold">{path.stats?.completed || "0"}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <BarChart3 className="h-3 w-3" /> تقدم
                  </div>
                  <div className="text-lg font-semibold">{path.stats?.avg_progress || "0"}%</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/academy/admin/learning-paths/${path.id}`}>
                    إدارة <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button
                  variant={path.is_published ? "secondary" : "default"}
                  size="sm"
                  disabled={actionId === `publish-${path.id}`}
                  onClick={() => void togglePublish(path)}
                >
                  {actionId === `publish-${path.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : path.is_published ? "إلغاء" : "نشر"}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  disabled={actionId === `delete-${path.id}`}
                  onClick={() => void remove(path)}
                >
                  {actionId === `delete-${path.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>إنشاء مسار تعلم</DialogTitle>
            <DialogDescription>
              اختر التخصص والمسؤول، ويمكنك نشر المسار مباشرة أو تركه كمسودة.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>عنوان المسار</Label>
              <Input
                value={form.title}
                onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                placeholder="مثال: مدخل إلى فقه العبادات"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="وصف مختصر لما سيتعلمه الطالب في هذا المسار"
              />
            </div>

            <div className="space-y-1">
              <Label>التخصص</Label>
              <Select value={form.subject} onValueChange={value => setForm(current => ({ ...current, subject: value as Subject }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(subject => (
                    <SelectItem key={subject.value} value={subject.value}>{subject.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>المستوى</Label>
              <Select value={form.level} onValueChange={value => setForm(current => ({ ...current, level: value as Level }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>مسؤول المسار</Label>
              <Select
                value={form.manager_id || "none"}
                onValueChange={value => setForm(current => ({ ...current, manager_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger><SelectValue placeholder="اختر مسؤولًا" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مسؤول محدد</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={`${manager.role}-${manager.id}`} value={manager.id}>
                      {manager.name} — {manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">يمكن تعيين معلم أو مقرئ لمتابعة محتوى المسار.</p>
            </div>

            <div className="space-y-1">
              <Label>المدة المتوقعة بالأيام</Label>
              <Input
                type="number"
                min="1"
                value={form.estimated_days}
                onChange={event => setForm(current => ({ ...current, estimated_days: event.target.value }))}
                placeholder="مثال: 30"
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="seed_default_stages"
                type="checkbox"
                className="h-4 w-4"
                checked={form.seed_default_stages}
                onChange={event => setForm(current => ({ ...current, seed_default_stages: event.target.checked }))}
              />
              <Label htmlFor="seed_default_stages" className="cursor-pointer">إنشاء مراحل افتراضية للتخصص</Label>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="require_audio"
                type="checkbox"
                className="h-4 w-4"
                checked={form.require_audio}
                onChange={event => setForm(current => ({ ...current, require_audio: event.target.checked }))}
              />
              <Label htmlFor="require_audio" className="cursor-pointer">يتطلب رفع تسجيل صوتي</Label>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="is_published"
                type="checkbox"
                className="h-4 w-4"
                checked={form.is_published}
                onChange={event => setForm(current => ({ ...current, is_published: event.target.checked }))}
              />
              <Label htmlFor="is_published" className="cursor-pointer">نشر المسار فور الإنشاء</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={creating || !form.title.trim()} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء المسار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
