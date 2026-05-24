'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  HelpCircle,
  User,
  Clock,
  Tag,
  CheckCircle2,
  Loader2,
  EyeOff,
  Send,
  AlertCircle,
  Pencil,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  title: string | null
  question: string
  answer: string | null
  status: string
  publish_consent: string
  is_published: boolean
  is_anonymous: boolean
  views_count: number
  asked_at: string
  answered_at: string | null
  published_at: string | null
  asker_name: string | null
  assigned_to_name: string | null
  answered_by_name: string | null
  category_name_ar: string | null
  category_slug: string | null
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'في الانتظار',
  assigned: 'مُسند إليك',
  in_progress: 'قيد العمل',
  awaiting_consent: 'بانتظار موافقة السائل',
  published: 'منشور في المكتبة',
  declined: 'لم يُنشر (رفض السائل)',
  closed: 'مغلق',
}

export default function FiqhSupervisorQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/fiqh/${id}`)
      if (res.ok) {
        const d = await res.json()
        if (d?.question) {
          setQuestion(d.question)
          if (d.question.answer) setAnswer(d.question.answer)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/academy/fiqh/${id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error || 'حدث خطأ أثناء حفظ الإجابة')
        return
      }
      await load()
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-bold text-foreground">السؤال غير موجود</h2>
        <Link
          href="/academy/fiqh-supervisor/questions"
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          العودة للقائمة
        </Link>
      </div>
    )
  }

  const isAnswered = question.answer !== null
  const showForm = !isAnswered || editing
  const askerLabel = question.is_anonymous
    ? 'سائل مجهول'
    : question.asker_name || 'سائل'

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <Link
        href="/academy/fiqh-supervisor/questions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة لصندوق الأسئلة
      </Link>

      {/* Question */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {question.category_name_ar && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {question.category_name_ar}
                </span>
              )}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted border border-border font-semibold">
                {STATUS_TEXT[question.status] || question.status}
              </span>
            </div>
            {question.title && (
              <h1 className="font-black text-xl text-foreground leading-relaxed">
                {question.title}
              </h1>
            )}
            <p className="font-medium text-foreground leading-relaxed whitespace-pre-wrap">
              {question.question}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {askerLabel}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(question.asked_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {question.is_published && (
                <span className="flex items-center gap-1 text-emerald-700">
                  <Eye className="w-3 h-3" />
                  {question.views_count || 0} مشاهدة
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Existing answer */}
      {isAnswered && !editing && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              الإجابة
            </h2>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل الإجابة
            </button>
          </div>
          <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-loose whitespace-pre-wrap">
            {question.answer}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-700 dark:text-emerald-400">
            {question.answered_by_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {question.answered_by_name}
              </span>
            )}
            {question.answered_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(question.answered_at).toLocaleDateString('ar-EG')}
              </span>
            )}
            <span className="flex items-center gap-1">
              {question.is_published ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> منشور في المكتبة العامة
                </>
              ) : question.status === 'awaiting_consent' ? (
                <>
                  <Clock className="w-3 h-3" /> بانتظار موافقة السائل
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> لم يُنشر
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Answer form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {isAnswered ? 'تعديل الإجابة' : 'كتابة الإجابة'}
          </h2>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder="اكتب الإجابة الفقهية هنا..."
            required
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
          />

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            بعد حفظ الإجابة سيُرسل طلب موافقة على النشر إلى السائل تلقائياً. لا تظهر الإجابة في
            المكتبة العامة قبل قبول السائل.
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              تم حفظ الإجابة وإرسال طلب الموافقة للسائل.
            </div>
          )}

          <div className="flex gap-3">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setAnswer(question.answer || '')
                }}
                className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-colors"
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !answer.trim()}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors',
                (saving || !answer.trim()) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : isAnswered ? 'حفظ التعديلات' : 'إرسال الإجابة'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
