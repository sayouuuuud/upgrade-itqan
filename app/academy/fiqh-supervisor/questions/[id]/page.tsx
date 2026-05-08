"use client"

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowRight, HelpCircle, User, Clock, Tag,
  CheckCircle, Loader2, Globe, EyeOff, Send, AlertCircle, Pencil
} from 'lucide-react'

interface FiqhQuestion {
  id: string
  question: string
  student_name: string
  category: string
  answer: string | null
  answered_by_name: string | null
  is_published: boolean
  is_anonymous: boolean
  asked_at: string
  answered_at: string | null
}

export default function FiqhQuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [question, setQuestion] = useState<FiqhQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [publish, setPublish] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch(`/api/academy/fiqh/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.question) {
          setQuestion(d.question)
          if (d.question.answer) {
            setAnswer(d.question.answer)
            setPublish(d.question.is_published)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/academy/fiqh', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, answer, is_published: publish }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'حدث خطأ')
        return
      }
      const d = await res.json()
      setQuestion(d.question)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('حدث خطأ في الاتصال')
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
        <Link href="/academy/fiqh-supervisor/questions" className="text-sm text-primary hover:underline mt-2 inline-block">
          العودة للقائمة
        </Link>
      </div>
    )
  }

  const isAnswered = question.answer !== null
  const showForm = !isAnswered || editing

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/academy/fiqh-supervisor/questions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للأسئلة
      </Link>

      {/* Question card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-foreground leading-relaxed">{question.question}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {question.is_anonymous ? 'مجهول الهوية' : question.student_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(question.asked_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full font-medium">
                <Tag className="w-3 h-3" />
                {question.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Existing answer */}
      {isAnswered && !editing && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              الإجابة
            </h2>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل
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
            {question.is_published
              ? <span className="flex items-center gap-1"><Globe className="w-3 h-3" />منشور للعامة</span>
              : <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" />غير منشور</span>
            }
          </div>
        </div>
      )}

      {/* Answer / edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {isAnswered ? 'تعديل الإجابة' : 'كتابة الإجابة'}
          </h2>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={8}
            placeholder="اكتب الإجابة الفقهية هنا..."
            required
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
          />

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setPublish(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${publish ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${publish ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">نشر الإجابة للعامة</p>
              <p className="text-xs text-muted-foreground">
                {publish ? 'ستظهر في صفحة الأسئلة الشائعة' : 'لن تظهر إلا للطالب فقط'}
              </p>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              تم حفظ الإجابة بنجاح
            </div>
          )}

          <div className="flex gap-3">
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(false); setAnswer(question.answer || '') }}
                className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-colors"
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !answer.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : 'حفظ الإجابة'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
