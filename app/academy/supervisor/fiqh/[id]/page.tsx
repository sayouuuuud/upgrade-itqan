"use client"


import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowRight, HelpCircle, User, Clock, Tag,
  CheckCircle, Loader2, Globe, EyeOff, Send, AlertCircle, Pencil, Info, ShieldCheck
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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
  const { t } = useI18n();
  const academy = (t as any).academy as Record<string, string> | undefined

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
        setError(d.error || (t.addedTranslations_2026?.['حدث خطأ'] || 'حدث خطأ'))
        return
      }
      const d = await res.json()
      setQuestion(d.question)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError((t.addedTranslations_2026?.['حدث خطأ في الاتصال'] || 'حدث خطأ في الاتصال'))
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
        <p className="text-xl font-black text-muted-foreground animate-pulse">{(t.addedTranslations_2026?.['جاري تحميل بيانات السؤال...'] || 'جاري تحميل بيانات السؤال...')}</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="bg-card/40 backdrop-blur-md border-2 border-dashed border-border rounded-[40px] p-24 text-center shadow-none flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
          <AlertCircle className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-2xl font-black text-foreground mb-2">{(t.addedTranslations_2026?.['السؤال غير موجود'] || 'السؤال غير موجود')}</h3>
        <p className="text-muted-foreground font-bold mb-8">{(t.addedTranslations_2026?.['عذراً، لم نتمكن من العثور على السؤال المطلوب.'] || 'عذراً، لم نتمكن من العثور على السؤال المطلوب.')}</p>
        <Link href="/academy/supervisor/fiqh" className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          <ArrowRight className="w-5 h-5" /> {(t.addedTranslations_2026?.['العودة لصندوق الأسئلة'] || 'العودة لصندوق الأسئلة')}
                        </Link>
      </div>
    )
  }

  const isAnswered = question.answer !== null
  const showForm = !isAnswered || editing

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative min-h-screen pb-20" dir="rtl">
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* Header Bar */}
      <div className="flex items-center gap-4">
        <Link 
          href="/academy/supervisor/fiqh"
          className="w-12 h-12 rounded-2xl bg-card border border-white/10 flex items-center justify-center hover:bg-muted transition-all shadow-sm group hover:-translate-x-1 shrink-0"
        >
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
        <div className="flex-1 bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground">{(t.addedTranslations_2026?.['تفاصيل السؤال ومحرر الإجابة'] || 'تفاصيل السؤال ومحرر الإجابة')}</h1>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">{(t.addedTranslations_2026?.['لوحة الإشراف الفقهي العليا'] || 'لوحة الإشراف الفقهي العليا')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Question Card */}
        <div className="bg-card/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-6 sm:p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 opacity-50 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-4">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-sm uppercase tracking-wider shadow-sm">
                <Tag className="w-4 h-4" /> {question.category}
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                {new Date(question.asked_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <p className="text-2xl font-black text-foreground leading-relaxed bg-background/50 p-6 rounded-3xl border border-white/5 shadow-inner">
              {question.question}
            </p>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">{(t.addedTranslations_2026?.['السائل'] || 'السائل')}</p>
                <p className="text-xs text-muted-foreground font-medium">{question.is_anonymous ? (t.addedTranslations_2026?.['مجهول الهوية'] || 'مجهول الهوية') : question.student_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Answer Display */}
        {isAnswered && !editing && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 backdrop-blur-3xl border border-emerald-500/20 rounded-[40px] p-6 sm:p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 opacity-50 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
                <h2 className="font-black text-2xl text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {(t.addedTranslations_2026?.['الإجابة الفقهية المعتمدة'] || 'الإجابة الفقهية المعتمدة')}
                                                  </h2>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition-all shadow-sm"
                >
                  <Pencil className="w-4 h-4" /> {(t.addedTranslations_2026?.['تعديل أو إضافة'] || 'تعديل أو إضافة')}
                                                  </button>
              </div>
              
              <div className="bg-white/60 dark:bg-black/20 rounded-3xl p-6 border border-emerald-500/10 shadow-inner">
                <p className="text-lg text-emerald-950 dark:text-emerald-100 leading-loose whitespace-pre-wrap font-medium">
                  {question.answer}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-emerald-800/70 dark:text-emerald-300/70">
                {question.answered_by_name && (
                  <span className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <User className="w-4 h-4" /> {(t.addedTranslations_2026?.['المجيب:'] || 'المجيب:')} {question.answered_by_name}
                  </span>
                )}
                {question.answered_at && (
                  <span className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <Clock className="w-4 h-4" /> {new Date(question.answered_at).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${question.is_published ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                  {question.is_published ? <><Globe className="w-4 h-4" /> {(t.addedTranslations_2026?.['منشور للعامة'] || 'منشور للعامة')}</> : <><EyeOff className="w-4 h-4" /> {(t.addedTranslations_2026?.['غير منشور (للطالب فقط)'] || 'غير منشور (للطالب فقط)')}</>}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Answer / Edit Form Card */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card/80 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-6 sm:p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 opacity-50 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 dark:border-white/5 pb-6">
                <h2 className="font-black text-2xl text-foreground flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    {isAnswered ? <Pencil className="w-6 h-6 text-primary" /> : <Send className="w-6 h-6 text-primary" />}
                  </div>
                  {isAnswered ? (t.addedTranslations_2026?.['تعديل وتحديث الإجابة'] || 'تعديل وتحديث الإجابة') : 'كتابة إجابة جديدة'}
                </h2>
                
                {/* Publish toggle */}
                <label className="flex items-center gap-4 cursor-pointer select-none bg-muted/40 p-2 rounded-2xl border border-border">
                  <div className="flex-1 text-left sm:text-right px-2">
                    <p className="text-sm font-black text-foreground">{(t.addedTranslations_2026?.['النشر للعامة'] || 'النشر للعامة')}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{(t.addedTranslations_2026?.['تظهر للطلاب في الأسئلة الشائعة'] || 'تظهر للطلاب في الأسئلة الشائعة')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublish(p => !p)}
                    className={`relative w-14 h-8 rounded-full transition-colors shrink-0 shadow-inner ${publish ? 'bg-emerald-500' : 'bg-muted border border-border'}`}
                  >
                    <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${publish ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                  {(t.addedTranslations_2026?.['يُرجى تحري الدقة والوضوح في الإجابة، مع ذكر الأدلة إن أمكن. تذكر أن هذه الإجابات تمثل الأكاديمية منهجياً وعلمياً.'] || 'يُرجى تحري الدقة والوضوح في الإجابة، مع ذكر الأدلة إن أمكن. تذكر أن هذه الإجابات تمثل الأكاديمية منهجياً وعلمياً.')}
                                                  </p>
              </div>

              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-3xl opacity-0 group-focus-within/input:opacity-20 transition duration-500 blur" />
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={8}
                  placeholder={(t.addedTranslations_2026?.['اكتب الإجابة الفقهية المفصلة هنا...'] || 'اكتب الإجابة الفقهية المفصلة هنا...')}
                  required
                  className="relative w-full bg-background border-2 border-border focus:border-transparent rounded-3xl px-6 py-5 text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-primary/20 resize-none leading-loose shadow-inner transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-bold text-sm shadow-inner">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 font-bold shadow-inner">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {(t.addedTranslations_2026?.['تمت مراجعة الإجابة وحفظها بنجاح!'] || 'تمت مراجعة الإجابة وحفظها بنجاح!')}
                                                  </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving || !answer.trim()}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {saving ? (t.addedTranslations_2026?.['جاري الاعتماد...'] || 'جاري الاعتماد...') : (isAnswered ? (t.addedTranslations_2026?.['تحديث واعتماد الإجابة'] || 'تحديث واعتماد الإجابة') : 'اعتماد الإجابة')}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setAnswer(question.answer || '') }}
                    className="w-full sm:w-auto px-8 py-4 bg-muted text-foreground rounded-2xl font-black text-base hover:bg-muted/80 transition-colors"
                  >
                    {(t.addedTranslations_2026?.['إلغاء التعديل'] || 'إلغاء التعديل')}
                                                        </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
