"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mic,
  Video,
  ListChecks,
  Layers,
  BookOpen,
  CalendarClock,
  Trophy,
  Loader2,
} from "lucide-react"

type TaskTypeKey = "written" | "audio" | "video" | "quiz" | "project"

const TASK_TYPES: {
  key: TaskTypeKey
  title: string
  desc: string
  Icon: React.ComponentType<{ className?: string }>
  expects: string
}[] = [
  {
    key: "written",
    title: "مهمة كتابية",
    desc: "إجابة نصية يكتبها الطالب",
    Icon: FileText,
    expects: "نص + مرفق اختياري",
  },
  {
    key: "audio",
    title: "تسجيل صوتي",
    desc: "تلاوة أو حفظ أو تسجيل شفهي",
    Icon: Mic,
    expects: "ملف صوتي مطلوب",
  },
  {
    key: "video",
    title: "مقطع فيديو",
    desc: "تسليم على هيئة مقطع فيديو",
    Icon: Video,
    expects: "ملف فيديو مطلوب",
  },
  {
    key: "project",
    title: "مشروع / ملف",
    desc: "تقرير، عرض، أو ملف عملي",
    Icon: Layers,
    expects: "ملف مرفق مطلوب",
  },
  {
    key: "quiz",
    title: "اختبار",
    desc: "إجابة قصيرة على أسئلة",
    Icon: ListChecks,
    expects: "إجابة نصية",
  },
]

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    task_type: "written" as TaskTypeKey,
    submission_instructions: "",
    due_date: "",
    max_score: "100",
  })

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/academy/teacher/courses")
        if (res.ok) {
          const json = await res.json()
          setCourses(json.data || [])
        }
      } catch (e) {
        console.error("Failed to load courses", e)
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [])

  // Default due date to 7 days from now (helpful default)
  useEffect(() => {
    if (!formData.due_date) {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      d.setHours(23, 59, 0, 0)
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setFormData(f => ({ ...f, due_date: iso }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.course_id) return setError("يجب اختيار دورة")
    if (!formData.title.trim()) return setError("عنوان المهمة مطلوب")
    if (!formData.due_date) return setError("تاريخ التسليم مطلوب")

    setLoading(true)
    try {
      const res = await fetch("/api/academy/teacher/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          max_score: formData.max_score ? Number(formData.max_score) : 100,
          due_date: new Date(formData.due_date).toISOString(),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "حدث خطأ أثناء الإنشاء")
      }
      router.push("/academy/teacher/tasks")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع"
      setError(msg)
      setLoading(false)
    }
  }

  const selectedType = TASK_TYPES.find(t => t.key === formData.task_type)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/academy/teacher/tasks"
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إنشاء مهمة جديدة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            أضف مهمة لإحدى دوراتك وحدّد طريقة التسليم المطلوبة من الطلاب
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: Basic info */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              المعلومات الأساسية
            </h2>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="course_id">
              الدورة <span className="text-red-500">*</span>
            </label>
            <select
              id="course_id"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={formData.course_id}
              onChange={e => setFormData({ ...formData, course_id: e.target.value })}
              disabled={coursesLoading}
              required
            >
              <option value="">
                {coursesLoading ? "جاري تحميل الدورات..." : "اختر الدورة..."}
              </option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {!coursesLoading && courses.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                لا توجد دورات لديك بعد.{" "}
                <Link
                  href="/academy/teacher/courses/new"
                  className="underline font-medium"
                >
                  أنشئ دورة أولاً
                </Link>
                .
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="title">
              عنوان المهمة <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="مثال: واجب تلاوة سورة البقرة"
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="description">
              وصف المهمة
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="اشرح المطلوب من الطالب وما الهدف من هذه المهمة..."
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </section>

        {/* SECTION 2: Task Type */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              نوع المهمة وطريقة التسليم
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TASK_TYPES.map(t => {
              const Icon = t.Icon
              const active = formData.task_type === t.key
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setFormData({ ...formData, task_type: t.key })}
                  className={`relative text-right p-4 border rounded-xl transition-all flex flex-col gap-2 ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/30"
                      : "border-border bg-background hover:border-foreground/20 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mr-auto" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 mt-auto">
                    {t.expects}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Submission instructions */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-foreground"
              htmlFor="submission_instructions"
            >
              تعليمات التسليم (اختياري)
            </label>
            <textarea
              id="submission_instructions"
              rows={3}
              placeholder={
                selectedType?.key === "audio"
                  ? "مثال: سجل التلاوة بصوت واضح، وتأكد من جودة الميكروفون..."
                  : selectedType?.key === "video"
                  ? "مثال: المدة لا تتجاوز 5 دقائق، وضع الإضاءة مناسبة..."
                  : "أي تعليمات إضافية تريد إخبار الطالب بها قبل التسليم"
              }
              className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              value={formData.submission_instructions}
              onChange={e =>
                setFormData({ ...formData, submission_instructions: e.target.value })
              }
            />
          </div>
        </section>

        {/* SECTION 3: Schedule + Score */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              الجدولة والتقييم
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground" htmlFor="due_date">
                <CalendarClock className="w-4 h-4 inline ml-1" />
                تاريخ التسليم <span className="text-red-500">*</span>
              </label>
              <input
                id="due_date"
                type="datetime-local"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            {/* Max Score */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground" htmlFor="max_score">
                <Trophy className="w-4 h-4 inline ml-1" />
                الدرجة القصوى
              </label>
              <input
                id="max_score"
                type="number"
                min="1"
                max="1000"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.max_score}
                onChange={e => setFormData({ ...formData, max_score: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end pt-2">
          <Link
            href="/academy/teacher/tasks"
            className="px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-lg transition-colors text-center"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={loading || coursesLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                حفظ المهمة
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
