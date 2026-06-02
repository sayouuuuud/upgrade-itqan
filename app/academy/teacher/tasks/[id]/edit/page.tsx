"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  CalendarClock,
  Trophy,
  BookOpen,
  ListChecks,
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: "pending", label: "مفتوحة (بانتظار التسليم)" },
  { value: "active", label: "نشطة" },
  { value: "graded", label: "مصححة" },
  { value: "closed", label: "مغلقة" },
]

function toLocalInput(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function EditTaskPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [isQuiz, setIsQuiz] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    submission_instructions: "",
    due_date: "",
    max_score: "100",
    status: "pending",
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/academy/teacher/tasks/${taskId}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || "تعذر تحميل المهمة")
          return
        }
        const t = json.data
        setIsQuiz(t.type === "quiz")
        setForm({
          title: t.title || "",
          description: t.description || "",
          submission_instructions: t.submission_instructions || "",
          due_date: toLocalInput(t.due_date),
          max_score: String(t.max_score ?? 100),
          status: t.status || "pending",
        })
      } catch {
        setError("خطأ في الاتصال بالخادم")
      } finally {
        setLoading(false)
      }
    }
    if (taskId) load()
  }, [taskId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.title.trim()) return setError("عنوان المهمة مطلوب")
    if (!form.due_date) return setError("تاريخ التسليم مطلوب")

    setSaving(true)
    try {
      const res = await fetch(`/api/academy/teacher/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          submission_instructions: form.submission_instructions,
          due_date: new Date(form.due_date).toISOString(),
          max_score: isQuiz ? undefined : Number(form.max_score) || 100,
          status: form.status,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "تعذر حفظ التعديلات")
      router.push("/academy/teacher/tasks")
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع")
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟ سيتم حذف جميع التسليمات المرتبطة بها.")) return
    setDeleting(true)
    setError("")
    try {
      const res = await fetch(`/api/academy/teacher/tasks/${taskId}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "تعذر حذف المهمة")
      router.push("/academy/teacher/tasks")
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">جاري تحميل المهمة...</p>
      </div>
    )
  }

  if (error && loading === false && !form.title) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Link
            href="/academy/teacher/tasks"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            العودة للمهام
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/academy/teacher/tasks"
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            تعديل المهمة
            {isQuiz && <ListChecks className="w-5 h-5 text-emerald-600" />}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">عدّل بيانات المهمة أو غيّر حالتها</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              تفاصيل المهمة
            </h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="title">
              عنوان المهمة <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="description">
              وصف المهمة
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="instructions">
              تعليمات التسليم
            </label>
            <textarea
              id="instructions"
              rows={3}
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              value={form.submission_instructions}
              onChange={e => setForm({ ...form, submission_instructions: e.target.value })}
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              الجدولة والحالة
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground" htmlFor="due_date">
                <CalendarClock className="w-4 h-4 inline ml-1" />
                تاريخ التسليم <span className="text-red-500">*</span>
              </label>
              <input
                id="due_date"
                type="datetime-local"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground" htmlFor="max_score">
                <Trophy className="w-4 h-4 inline ml-1" />
                الدرجة القصوى
              </label>
              {isQuiz ? (
                <div className="w-full p-3 rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                  {form.max_score} درجة (تُحسب من أسئلة الاختبار)
                </div>
              ) : (
                <input
                  id="max_score"
                  type="number"
                  min="1"
                  max="1000"
                  className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.max_score}
                  onChange={e => setForm({ ...form, max_score: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="status">
              حالة المهمة
            </label>
            <select
              id="status"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-5 py-3 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold rounded-lg transition-colors hover:bg-red-100 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            حذف المهمة
          </button>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Link
              href="/academy/teacher/tasks"
              className="px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-lg transition-colors text-center"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
