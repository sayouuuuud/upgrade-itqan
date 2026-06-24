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
  MessageCircle,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

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
  const { t } = useI18n()

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
        setError(d?.error || (t.addedTranslations_2026?.['حدث خطأ أثناء حفظ الإجابة'] || 'حدث خطأ أثناء حفظ الإجابة'))
        return
      }
      await load()
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError((t.addedTranslations_2026?.['تعذّر الاتصال بالخادم'] || 'تعذّر الاتصال بالخادم'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Loader2 className="absolute inset-0 m-auto w-10 h-10 animate-spin text-primary opacity-50" />
        </div>
        <p className="text-xl font-black text-muted-foreground animate-pulse">{(t.addedTranslations_2026?.['جاري تحميل السؤال...'] || 'جاري تحميل السؤال...')}</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-40 bg-card/40 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-destructive/20">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4">{(t.addedTranslations_2026?.['السؤال غير موجود'] || 'السؤال غير موجود')}</h2>
        <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">{(t.addedTranslations_2026?.['يبدو أن هذا السؤال قد تم حذفه أو لا تملك صلاحية الوصول إليه.'] || 'يبدو أن هذا السؤال قد تم حذفه أو لا تملك صلاحية الوصول إليه.')}</p>
        <Link
          href="/academy/fiqh-supervisor/questions"
          className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1"
        >
          {(t.addedTranslations_2026?.['العودة لصندوق الوارد'] || 'العودة لصندوق الوارد')}
                        </Link>
      </div>
    )
  }

  const isAnswered = question.answer !== null
  const showForm = !isAnswered || editing
  const askerLabel = question.is_anonymous
    ? (t.addedTranslations_2026?.['سائل مجهول'] || 'سائل مجهول')
    : question.asker_name || (t.addedTranslations_2026?.['سائل'] || 'سائل')

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative min-h-screen pb-20" dir="rtl">
      
      {/* Decorative Background */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* Top Nav */}
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <Link
          href="/academy/fiqh-supervisor/questions"
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all hover:scale-105 shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-black text-lg text-foreground">{(t.addedTranslations_2026?.['العودة للصندوق'] || 'العودة للصندوق')}</h2>
          <p className="text-xs font-bold text-muted-foreground">{(t.addedTranslations_2026?.['تفاصيل السؤال رقم #'] || 'تفاصيل السؤال رقم #')}{question.id.substring(0, 6)}</p>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* The Question Card */}
        <div className="bg-card/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-black/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent opacity-50 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                {question.category_name_ar && (
                  <span className="text-xs px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 inline-flex items-center gap-2 uppercase tracking-widest">
                    <Tag className="w-4 h-4" />
                    {question.category_name_ar}
                  </span>
                )}
                <span className="text-xs px-4 py-2 rounded-xl bg-muted/80 border border-border font-black text-foreground shadow-inner">
                  {STATUS_TEXT[question.status] || question.status}
                </span>
              </div>
              
              <div className="space-y-4">
                {question.title && (
                  <h1 className="font-black text-3xl md:text-4xl text-foreground leading-tight tracking-tight">
                    {question.title}
                  </h1>
                )}
                <div className="bg-white/50 dark:bg-black/20 rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-inner">
                  <p className="font-semibold text-lg text-foreground leading-loose whitespace-pre-wrap">
                    {question.question}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{askerLabel}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">
                    {new Date(question.asked_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {question.is_published && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-black text-emerald-700">{question.views_count || 0} {(t.addedTranslations_2026?.['مشاهدة'] || 'مشاهدة')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Answer Card */}
        {isAnswered && !editing && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-emerald-950/20 backdrop-blur-3xl border border-emerald-500/30 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 opacity-50 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-[24px] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="font-black text-2xl text-emerald-900 dark:text-emerald-300 flex items-center gap-3">
                    {(t.addedTranslations_2026?.['الإجابة الفقهية'] || 'الإجابة الفقهية')}
                                                        </h2>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-black text-emerald-700 dark:text-emerald-400 transition-all hover:scale-105"
                  >
                    <Pencil className="w-4 h-4" />
                    {(t.addedTranslations_2026?.['تعديل الإجابة'] || 'تعديل الإجابة')}
                                                        </button>
                </div>
                
                <div className="bg-white/60 dark:bg-black/20 rounded-3xl p-6 md:p-8 border border-white/40 dark:border-white/5 shadow-inner">
                  <p className="text-lg font-medium text-emerald-950 dark:text-emerald-100 leading-loose whitespace-pre-wrap">
                    {question.answer}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-emerald-500/20">
                  {question.answered_by_name && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                      <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{question.answered_by_name}</span>
                    </div>
                  )}
                  {question.answered_at && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                      <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        {new Date(question.answered_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    {question.is_published ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> 
                        <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">{(t.addedTranslations_2026?.['منشور في المكتبة العامة'] || 'منشور في المكتبة العامة')}</span>
                      </>
                    ) : question.status === 'awaiting_consent' ? (
                      <>
                        <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> 
                        <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">{(t.addedTranslations_2026?.['بانتظار موافقة السائل'] || 'بانتظار موافقة السائل')}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> 
                        <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">{(t.addedTranslations_2026?.['لم يُنشر'] || 'لم يُنشر')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answer Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-card/80 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-black/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-primary via-blue-500 to-emerald-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-black text-2xl text-foreground">
                  {isAnswered ? (t.addedTranslations_2026?.['تعديل الإجابة'] || 'تعديل الإجابة') : 'كتابة الإجابة'}
                </h2>
                <p className="text-sm font-bold text-muted-foreground mt-1">{(t.addedTranslations_2026?.['اكتب إجابتك الفقهية بوضوح وتفصيل.'] || 'اكتب إجابتك الفقهية بوضوح وتفصيل.')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-3xl opacity-0 group-focus-within:opacity-30 transition duration-500 blur" />
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={10}
                  placeholder={(t.addedTranslations_2026?.['ابدأ بكتابة الإجابة هنا...'] || 'ابدأ بكتابة الإجابة هنا...')}
                  required
                  className="relative w-full bg-background border-2 border-border focus:border-transparent rounded-3xl px-6 py-6 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 resize-none leading-loose shadow-inner transition-all"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="pt-1 text-sm leading-loose font-bold text-amber-900 dark:text-amber-200">
                  {(t.addedTranslations_2026?.['بعد حفظ الإجابة سيُرسل طلب موافقة على النشر إلى السائل تلقائياً. لن تظهر الإجابة في المكتبة العامة قبل قبول السائل. تأكد من مراجعة الإجابة لغوياً وفقهياً قبل الإرسال.'] || 'بعد حفظ الإجابة سيُرسل طلب موافقة على النشر إلى السائل تلقائياً. لن تظهر الإجابة في المكتبة العامة قبل قبول السائل. تأكد من مراجعة الإجابة لغوياً وفقهياً قبل الإرسال.')}
                                                  </div>
              </div>

              {error && (
                <div className="flex items-center gap-4 p-5 bg-destructive/10 border border-destructive/20 rounded-3xl text-destructive font-bold">
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  {error}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-700 dark:text-emerald-400 font-bold">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {(t.addedTranslations_2026?.['تم حفظ الإجابة وإرسال طلب الموافقة للسائل بنجاح.'] || 'تم حفظ الإجابة وإرسال طلب الموافقة للسائل بنجاح.')}
                                                  </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-border/50">
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setAnswer(question.answer || '')
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black text-base transition-all hover:scale-105"
                  >
                    {(t.addedTranslations_2026?.['إلغاء التعديل'] || 'إلغاء التعديل')}
                                                        </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !answer.trim()}
                  className={cn(
                    'w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-base transition-all shadow-lg shadow-primary/30',
                    (saving || !answer.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 hover:shadow-xl hover:-translate-y-1'
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 -translate-x-1" />
                  )}
                  {saving ? (t.addedTranslations_2026?.['جاري الحفظ...'] || 'جاري الحفظ...') : isAnswered ? (t.addedTranslations_2026?.['حفظ التعديلات'] || 'حفظ التعديلات') : 'إرسال الإجابة لاعتمادها'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
