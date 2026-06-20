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
  Plus,
  Trash2,
  CircleDot,
  PencilLine,
  GripVertical,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

type TaskTypeKey = "written" | "audio" | "video" | "quiz" | "project"

type QuizQuestionType = "mcq" | "essay"

interface QuizQuestion {
  id: string
  type: QuizQuestionType
  question: string
  options: string[]
  correct: number
  points: number
}

let _qid = 0
const newQuestionId = () => `q_${Date.now()}_${_qid++}`

export default function NewTaskPage() {
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const TASK_TYPES: {
    key: TaskTypeKey
    title: string
    desc: string
    Icon: React.ComponentType<{ className?: string }>
    expects: string
  }[] = [
    {
      key: "written",
      title: isAr ? "مهمة كتابية" : "Written Task",
      desc: isAr ? "إجابة نصية يكتبها الطالب" : "Text response written by the student",
      Icon: FileText,
      expects: isAr ? "نص + مرفق اختياري" : "Text + optional attachment",
    },
    {
      key: "audio",
      title: isAr ? "تسجيل صوتي" : "Audio Recording",
      desc: isAr ? "تلاوة أو حفظ أو تسجيل شفهي" : "Recitation, memorization or oral recording",
      Icon: Mic,
      expects: isAr ? "ملف صوتي مطلوب" : "Audio file required",
    },
    {
      key: "video",
      title: isAr ? "مقطع فيديو" : "Video Clip",
      desc: isAr ? "تسليم على هيئة مقطع فيديو" : "Submission as a video clip",
      Icon: Video,
      expects: isAr ? "ملف فيديو مطلوب" : "Video file required",
    },
    {
      key: "project",
      title: isAr ? "مشروع / ملف" : "Project / File",
      desc: isAr ? "تقرير، عرض، أو ملف عملي" : "Report, presentation or practical file",
      Icon: Layers,
      expects: isAr ? "ملف مرفق مطلوب" : "Attached file required",
    },
    {
      key: "quiz",
      title: isAr ? "اختبار" : "Quiz",
      desc: isAr ? "إجابة قصيرة على أسئلة" : "Short answers to questions",
      Icon: ListChecks,
      expects: isAr ? "إجابة نصية" : "Text response",
    },
  ]

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

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])

  const isQuiz = formData.task_type === "quiz"
  const quizTotal = quizQuestions.reduce((s, q) => s + (Number(q.points) || 0), 0)

  const addQuestion = (type: QuizQuestionType) => {
    setQuizQuestions(prev => [
      ...prev,
      {
        id: newQuestionId(),
        type,
        question: "",
        options: type === "mcq" ? ["", ""] : [],
        correct: 0,
        points: type === "mcq" ? 1 : 5,
      },
    ])
  }

  const updateQuestion = (id: string, patch: Partial<QuizQuestion>) => {
    setQuizQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== id))
  }

  const addOption = (id: string) => {
    setQuizQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, options: [...q.options, ""] } : q)),
    )
  }

  const updateOption = (id: string, idx: number, value: string) => {
    setQuizQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) }
          : q,
      ),
    )
  }

  const removeOption = (id: string, idx: number) => {
    setQuizQuestions(prev =>
      prev.map(q => {
        if (q.id !== id) return q
        const options = q.options.filter((_, i) => i !== idx)
        const correct = q.correct >= options.length ? Math.max(0, options.length - 1) : q.correct
        return { ...q, options, correct }
      }),
    )
  }

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

    if (!formData.course_id) return setError(isAr ? "يجب اختيار دورة" : "Course must be selected")
    if (!formData.title.trim()) return setError(isAr ? "عنوان المهمة مطلوب" : "Task title is required")
    if (!formData.due_date) return setError(isAr ? "تاريخ التسليم مطلوب" : "Due date is required")

    if (isQuiz) {
      if (quizQuestions.length === 0) return setError(isAr ? "أضف سؤالاً واحداً على الأقل للاختبار" : "Add at least one question to the quiz")
      for (const q of quizQuestions) {
        if (!q.question.trim()) return setError(isAr ? "يوجد سؤال بدون نص. أكمل جميع الأسئلة" : "There is a question without text. Complete all questions")
        if (q.type === "mcq") {
          const filled = q.options.filter(o => o.trim()).length
          if (filled < 2) return setError(isAr ? "أسئلة الاختيار يجب أن تحتوي على خيارين على الأقل" : "Multiple choice questions must have at least 2 options")
          if (!q.options[q.correct]?.trim())
            return setError(isAr ? "حدّد الإجابة الصحيحة لكل سؤال اختيار من متعدد" : "Select correct answer for each multiple choice question")
        }
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/academy/teacher/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          max_score: formData.max_score ? Number(formData.max_score) : 100,
          due_date: new Date(formData.due_date).toISOString(),
          quiz_questions: isQuiz
            ? quizQuestions.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question.trim(),
                points: Number(q.points) || 1,
                ...(q.type === "mcq"
                  ? {
                      options: q.options.map(o => o.trim()).filter(Boolean),
                      correct: q.correct,
                    }
                  : {}),
              }))
            : undefined,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || (isAr ? "حدث خطأ أثناء الإنشاء" : "An error occurred during creation"))
      }
      router.push("/academy/teacher/tasks")
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      setError(msg)
      setLoading(false)
    }
  }

  const selectedType = TASK_TYPES.find(t => t.key === formData.task_type)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/academy/teacher/tasks"
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          aria-label={isAr ? "رجوع" : "Back"}
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isAr ? "إنشاء مهمة جديدة" : "Create New Task"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr 
              ? "أضف مهمة لإحدى دوراتك وحدّد طريقة التسليم المطلوبة من الطلاب"
              : "Add a task to one of your courses and specify the submission format required from students"}
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
              {isAr ? "المعلومات الأساسية" : "Basic Information"}
            </h2>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="course_id">
              {isAr ? "الدورة" : "Course"} <span className="text-red-500">*</span>
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
                {coursesLoading 
                  ? (isAr ? "جاري تحميل الدورات..." : "Loading courses...") 
                  : (isAr ? "اختر الدورة..." : "Select course...")}
              </option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {!coursesLoading && courses.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {isAr ? "لا توجد دورات لديك بعد." : "You do not have any courses yet."}{" "}
                <Link
                  href="/academy/teacher/courses/new"
                  className="underline font-medium"
                >
                  {isAr ? "أنشئ دورة أولاً" : "Create a course first"}
                </Link>
                .
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="title">
              {isAr ? "عنوان المهمة" : "Task Title"} <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder={isAr ? "مثال: واجب تلاوة سورة البقرة" : "e.g. Surah Al-Baqarah Recitation Homework"}
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
              {isAr ? "وصف المهمة" : "Task Description"}
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder={isAr ? "اشرح المطلوب من الطالب وما الهدف من هذه المهمة..." : "Explain what is required from the student and the goal of this task..."}
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
              {isAr ? "نوع المهمة وطريقة التسليم" : "Task Type & Submission Method"}
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

          {/* Quiz builder — shown only when the quiz type is selected */}
          {isQuiz && (
            <div className="space-y-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground">{isAr ? "أسئلة الاختبار" : "Quiz Questions"}</h3>
                </div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-1 rounded-full">
                  {quizQuestions.length} {isAr ? "سؤال" : "questions"} · {quizTotal} {isAr ? "درجة" : "points"}
                </span>
              </div>

              {quizQuestions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {isAr ? "لم تُضِف أي أسئلة بعد. اختر نوع السؤال لإضافته." : "No questions added yet. Select a question type to add."}
                </p>
              )}

              <div className="space-y-4">
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-border bg-background p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground pt-2.5">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-xs font-bold">{qIdx + 1}</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              q.type === "mcq"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {q.type === "mcq" ? (
                              <>
                                <CircleDot className="w-3 h-3" /> {isAr ? "اختيار من متعدد" : "Multiple Choice"}
                              </>
                            ) : (
                              <>
                                <PencilLine className="w-3 h-3" /> {isAr ? "سؤال مقالي" : "Essay Question"}
                              </>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5 mr-auto">
                            <label className="text-[11px] text-muted-foreground">{isAr ? "الدرجة" : "Points"}</label>
                            <input
                              type="number"
                              min={1}
                              value={q.points}
                              onChange={e =>
                                updateQuestion(q.id, { points: Number(e.target.value) })
                              }
                              className="w-16 p-1.5 text-sm rounded-md border border-border bg-background text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label={isAr ? "حذف السؤال" : "Delete Question"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          placeholder={isAr ? "اكتب نص السؤال هنا..." : "Write question text here..."}
                          value={q.question}
                          onChange={e => updateQuestion(q.id, { question: e.target.value })}
                          className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        />

                        {q.type === "mcq" && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-muted-foreground">
                              {isAr ? "اختر الدائرة بجانب الإجابة الصحيحة:" : "Select the circle next to the correct answer:"}
                            </p>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { correct: oIdx })}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    q.correct === oIdx
                                      ? "border-emerald-500 bg-emerald-500"
                                      : "border-border"
                                  }`}
                                  aria-label={isAr ? "تحديد كإجابة صحيحة" : "Set as correct answer"}
                                >
                                  {q.correct === oIdx && (
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  )}
                                </button>
                                <input
                                  type="text"
                                  placeholder={isAr ? `الخيار ${oIdx + 1}` : `Option ${oIdx + 1}`}
                                  value={opt}
                                  onChange={e => updateOption(q.id, oIdx, e.target.value)}
                                  className="flex-1 p-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(q.id, oIdx)}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    aria-label={isAr ? "حذف الخيار" : "Delete Option"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(q.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> {isAr ? "إضافة خيار" : "Add Option"}
                            </button>
                          </div>
                        )}

                        {q.type === "essay" && (
                          <p className="text-[11px] text-muted-foreground italic">
                            {isAr 
                              ? "سيكتب الطالب إجابته نصياً، وتقوم أنت بتصحيحها ورصد درجتها يدوياً."
                              : "The student will write their answer as text, and you will manually grade it."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => addQuestion("mcq")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> {isAr ? "سؤال اختيار من متعدد" : "Multiple Choice Question"}
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("essay")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-sm font-bold hover:bg-amber-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> {isAr ? "سؤال مقالي" : "Essay Question"}
                </button>
              </div>
            </div>
          )}

          {/* Submission instructions */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-foreground"
              htmlFor="submission_instructions"
            >
              {isAr ? "تعليمات التسليم (اختياري)" : "Submission Instructions (Optional)"}
            </label>
            <textarea
              id="submission_instructions"
              rows={3}
              placeholder={
                selectedType?.key === "audio"
                  ? (isAr ? "مثال: سجل التلاوة بصوت واضح، وتأكد من جودة الميكروفون..." : "e.g., Record the recitation in a clear voice, check microphone quality...")
                  : selectedType?.key === "video"
                  ? (isAr ? "مثال: المدة لا تتجاوز 5 دقائق، وضع الإضاءة مناسبة..." : "e.g., Duration not exceeding 5 minutes, ensure proper lighting...")
                  : (isAr ? "أي تعليمات إضافية تريد إخبار الطالب بها قبل التسليم" : "Any additional instructions for the student before submission")
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
              {isAr ? "الجدولة والتقييم" : "Scheduling & Grading"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground" htmlFor="due_date">
                <CalendarClock className="w-4 h-4 inline ml-1" />
                {isAr ? "تاريخ التسليم" : "Due Date"} <span className="text-red-500">*</span>
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
                {isAr ? "الدرجة القصوى" : "Max Score"}
              </label>
              {isQuiz ? (
                <div className="w-full p-3 rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                  {isAr ? "تُحسب تلقائياً من مجموع درجات الأسئلة:" : "Calculated automatically from total question points:"}{" "}
                  <span className="font-bold text-foreground">{quizTotal} {isAr ? "درجة" : "points"}</span>
                </div>
              ) : (
                <input
                  id="max_score"
                  type="number"
                  min="1"
                  max="1000"
                  className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.max_score}
                  onChange={e => setFormData({ ...formData, max_score: e.target.value })}
                />
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end pt-2">
          <Link
            href="/academy/teacher/tasks"
            className="px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-lg transition-colors text-center"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={loading || coursesLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isAr ? "جاري الحفظ..." : "Saving..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? "حفظ المهمة" : "Save Task"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
