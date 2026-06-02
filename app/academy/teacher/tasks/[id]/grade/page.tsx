"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  ListChecks,
  PencilLine,
  Loader2,
} from "lucide-react"

interface QuizQuestion {
  id: string
  type: "mcq" | "essay"
  question: string
  options?: string[]
  correct?: number
  points: number
}

export default function GradeTaskPage() {
  const params = useParams()
  const taskId = params.id as string

  const [submissions, setSubmissions] = useState<any[]>([])
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/academy/teacher/tasks/${taskId}/submissions`)
      if (res.ok) {
        const json = await res.json()
        setSubmissions(json.data || [])
        setTask(json.task || null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [taskId])

  const isQuiz = task?.type === "quiz"
  const quizQuestions: QuizQuestion[] = (() => {
    if (!task?.quiz_questions) return []
    try {
      return typeof task.quiz_questions === "string"
        ? JSON.parse(task.quiz_questions)
        : task.quiz_questions
    } catch {
      return []
    }
  })()

  const handleGrade = async (submissionId: string, score: number, feedback: string) => {
    const res = await fetch(
      `/api/academy/teacher/tasks/${taskId}/submissions/${submissionId}/grade`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, feedback }),
      },
    )
    if (res.ok) {
      await fetchSubmissions()
      return true
    }
    return false
  }

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Link
          href="/academy/teacher/tasks"
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">تقييم تسليمات الطلاب</h1>
          <p className="text-muted-foreground mt-1">
            {task?.title ? `«${task.title}» — ` : ""}
            {isQuiz ? "تصحيح الاختبار ورصد الدرجات" : "مراجعة المهام ورصد الدرجات"}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            لا توجد تسليمات لهذه المهمة حتى الآن.
          </div>
        ) : (
          submissions.map(sub => (
            <GradeCard
              key={sub.id}
              submission={sub}
              isQuiz={isQuiz}
              quizQuestions={quizQuestions}
              onGrade={handleGrade}
            />
          ))
        )}
      </div>
    </div>
  )
}

function GradeCard({
  submission,
  isQuiz,
  quizQuestions,
  onGrade,
}: {
  submission: any
  isQuiz: boolean
  quizQuestions: QuizQuestion[]
  onGrade: (id: string, score: number, feedback: string) => Promise<boolean>
}) {
  const [score, setScore] = useState(submission.score ?? submission.auto_score ?? 0)
  const [feedback, setFeedback] = useState(submission.feedback || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Parse the student's quiz answers (if any)
  const answers: any[] = (() => {
    if (!submission.quiz_answers) return []
    try {
      return typeof submission.quiz_answers === "string"
        ? JSON.parse(submission.quiz_answers)
        : submission.quiz_answers
    } catch {
      return []
    }
  })()
  const answerMap = new Map(answers.map(a => [a.questionId, a]))

  const submit = async () => {
    setSaving(true)
    const ok = await onGrade(submission.id, Number(score), feedback)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex justify-center items-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">{submission.student_name}</h3>
              <p className="text-xs text-muted-foreground">
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleString("ar-EG")
                  : ""}
              </p>
            </div>
            <div className="mr-auto">
              {submission.status === "graded" ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> تم التقييم
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-bold rounded-full">
                  بانتظار التقييم
                </span>
              )}
            </div>
          </div>

          {isQuiz ? (
            <div className="space-y-3">
              {submission.auto_score != null && (
                <p className="text-xs font-bold text-muted-foreground bg-muted/60 inline-flex px-3 py-1.5 rounded-lg">
                  درجة الاختيارات التلقائية: {submission.auto_score}
                </p>
              )}
              {quizQuestions.map((q, idx) => {
                const a = answerMap.get(q.id)
                return (
                  <div
                    key={q.id}
                    className="border border-border rounded-xl p-4 bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-sm flex gap-2">
                        <span className="text-primary">{idx + 1}.</span>
                        <span className="whitespace-pre-wrap">{q.question}</span>
                      </h4>
                      <span className="text-[11px] font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-md shrink-0 inline-flex items-center gap-1">
                        {q.type === "mcq" ? (
                          <ListChecks className="w-3 h-3" />
                        ) : (
                          <PencilLine className="w-3 h-3" />
                        )}
                        {q.points} د
                      </span>
                    </div>

                    {q.type === "mcq" ? (
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, oIdx) => {
                          const isSelected = a?.selected === oIdx
                          const isCorrect = q.correct === oIdx
                          return (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                                isCorrect
                                  ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                                  : isSelected
                                    ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                                    : "border-transparent"
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              ) : isSelected ? (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              ) : (
                                <span className="w-4 h-4 shrink-0" />
                              )}
                              <span
                                className={
                                  isCorrect
                                    ? "font-bold text-green-700 dark:text-green-300"
                                    : isSelected
                                      ? "text-red-700 dark:text-red-300"
                                      : "text-foreground"
                                }
                              >
                                {opt}
                              </span>
                              {isSelected && (
                                <span className="text-[11px] text-muted-foreground mr-auto">
                                  (إجابة الطالب)
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-background border border-border rounded-lg p-3 text-sm whitespace-pre-wrap">
                        {a?.text || (
                          <span className="text-muted-foreground italic">
                            لم يجب الطالب على هذا السؤال
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <div className="bg-muted/50 p-4 rounded-xl text-sm whitespace-pre-wrap font-medium">
                {submission.content || (
                  <span className="text-muted-foreground italic">
                    لم يكتب الطالب نصاً
                  </span>
                )}
              </div>

              {submission.audio_url && (
                <audio controls src={submission.audio_url} className="mt-3 w-full" />
              )}
              {submission.video_url && (
                <video controls src={submission.video_url} className="mt-3 w-full rounded-lg" />
              )}
              {submission.file_url && (
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline font-bold bg-primary/10 px-3 py-2 rounded-lg"
                >
                  <FileText className="w-4 h-4" />
                  فتح المرفق
                </a>
              )}
            </>
          )}
        </div>

        <div className="md:w-1/3 bg-background border border-border p-4 rounded-xl flex flex-col h-fit">
          <h4 className="font-bold text-sm mb-3">رصد الدرجة</h4>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                الدرجة (من {submission.max_score || 100})
              </label>
              <input
                type="number"
                min="0"
                max={submission.max_score || 100}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-full p-2 border border-border rounded-lg bg-card"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                ملاحظات الأستاذ (اختياري)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-card text-sm"
                placeholder="أحسنت صنعاً..."
              />
            </div>
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-bold rounded-lg text-sm mt-4 transition-colors inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> تم الحفظ</>
            ) : (
              "حفظ التقييم"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
