'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Trophy, Calendar, Clock, CheckCircle2, Mic,
  Loader2, Send, Play, Users, BookOpen, Star, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AudioRecorder from '@/components/academy/audio-recorder'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  start_date: string
  end_date: string
  prizes_description: string | null
  rules: string | null
  min_verses: number | null
  max_participants: number | null
  is_featured: boolean
}

interface Entry {
  id: string
  status: string
  submission_url: string | null
  notes: string | null
  verses_count: number
  score: number | null
  feedback: string | null
  submitted_at: string
  evaluated_at: string | null
  tajweed_scores: Record<string, number> | null
}

const STATUS_LABELS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: 'في انتظار التحكيم', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  evaluated: { label: 'تم التحكيم',        cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', icon: CheckCircle2 },
  winner:    { label: 'فائز 🏆',           cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', icon: Trophy },
}

const TAJWEED_RULES_LABELS: Record<string, string> = {
  idgham: 'الإدغام', ikhfa: 'الإخفاء', iqlab: 'الإقلاب',
  izhar: 'الإظهار', madd: 'المدود', qalqala: 'القلقلة',
  ghunna: 'الغنة', tafkhim_tarqiq: 'التفخيم والترقيق',
  waqf: 'الوقف والابتداء', makharij: 'مخارج الحروف',
}

export default function StudentCompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [form, setForm] = useState({ submission_url: '', notes: '', verses_count: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    try {
      const res = await fetch(`/api/student/competitions/${id}`)
      if (res.ok) {
        const json = await res.json()
        setCompetition(json.competition)
        setEntry(json.entry || null)
        if (json.entry?.submission_url) {
          setForm(prev => ({ ...prev, submission_url: json.entry.submission_url || '' }))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/student/competitions/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('تم تقديم مشاركتك بنجاح! 🎉')
        setShowSubmitForm(false)
        load()
      } else {
        showToast(data.error || 'حدث خطأ', 'err')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="font-bold text-muted-foreground">المسابقة غير موجودة</p>
        <Link href="/student/competitions" className="mt-4 inline-block text-sm text-primary hover:underline">
          العودة للمسابقات
        </Link>
      </div>
    )
  }

  const startDate = new Date(competition.start_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
  const endDate = new Date(competition.end_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
  const entryStatus = entry ? STATUS_LABELS[entry.status] || STATUS_LABELS.pending : null
  const tajweedScores = entry?.tajweed_scores || {}
  const hasScores = Object.keys(tajweedScores).length > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl text-sm font-bold',
          toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <Link href="/student/competitions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للمسابقات
      </Link>

      {/* Competition Card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="h-3 bg-gradient-to-l from-primary via-primary/60 to-primary/30" />
        <div className="p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              {competition.is_featured && (
                <div className="flex items-center gap-1 text-primary text-xs font-black mb-2">
                  <Star className="w-3.5 h-3.5 fill-primary" />
                  مسابقة مميزة
                </div>
              )}
              <h1 className="text-2xl font-black text-foreground">{competition.title}</h1>
            </div>
            <span className={cn(
              'shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border',
              competition.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                : competition.status === 'upcoming'
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                : 'bg-muted text-muted-foreground border-border'
            )}>
              {competition.status === 'active' ? 'نشطة' : competition.status === 'upcoming' ? 'قادمة' : 'منتهية'}
            </span>
          </div>

          {competition.description && (
            <p className="text-muted-foreground leading-7">{competition.description}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ البداية</p>
                <p className="text-sm font-bold">{startDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
                <p className="text-sm font-bold">{endDate}</p>
              </div>
            </div>
            {competition.min_verses ? (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الحد الأدنى للآيات</p>
                  <p className="text-sm font-bold">{competition.min_verses} آية</p>
                </div>
              </div>
            ) : null}
            {competition.max_participants ? (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الحد الأقصى للمشاركين</p>
                  <p className="text-sm font-bold">{competition.max_participants} مشارك</p>
                </div>
              </div>
            ) : null}
          </div>

          {competition.prizes_description && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                الجائزة: {competition.prizes_description}
              </p>
            </div>
          )}

          {competition.rules && (
            <div className="bg-muted/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground mb-2">قواعد المسابقة</p>
              <p className="text-sm leading-7 whitespace-pre-line">{competition.rules}</p>
            </div>
          )}
        </div>
      </div>

      {/* Entry Status & Submission */}
      {entry ? (
        <div className="space-y-4">
          {/* Status */}
          {entryStatus && (
            <div className={cn('border rounded-2xl p-5 flex items-center gap-4', entryStatus.cls)}>
              <entryStatus.icon className="w-7 h-7 shrink-0" />
              <div>
                <p className="font-black text-lg">{entryStatus.label}</p>
                {entry.submitted_at && (
                  <p className="text-xs opacity-70 mt-0.5">
                    تاريخ التقديم: {new Date(entry.submitted_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Score */}
          {entry.score !== null && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-black text-lg">نتيجة التحكيم</h3>

              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeDasharray={`${entry.score} 100`}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">{Math.round(entry.score)}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              {hasScores && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(tajweedScores).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                      <span className="text-xs text-muted-foreground">{TAJWEED_RULES_LABELS[key] || key}</span>
                      <span className="font-bold text-sm">{val}/10</span>
                    </div>
                  ))}
                </div>
              )}

              {entry.feedback && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-bold text-muted-foreground mb-1">ملاحظات المحكّم</p>
                  <p className="text-sm leading-6">{entry.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Submission */}
          {entry.submission_url && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-bold text-muted-foreground mb-3">مشاركتك المقدّمة</p>
              <a
                href={entry.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
              >
                <Play className="w-4 h-4 fill-primary" />
                استمع للتلاوة
              </a>
              {entry.verses_count > 0 && (
                <p className="text-xs text-muted-foreground mt-2">عدد الآيات: {entry.verses_count}</p>
              )}
              {entry.notes && (
                <p className="text-sm text-muted-foreground mt-2">ملاحظاتك: {entry.notes}</p>
              )}
            </div>
          )}

          {/* Resubmit if still pending/active */}
          {competition.status === 'active' && entry.status !== 'winner' && (
            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary rounded-2xl text-sm font-bold transition-all"
            >
              <Mic className="w-4 h-4" />
              {entry.submission_url ? 'تحديث تلاوتي' : 'رفع التلاوة'}
            </button>
          )}
        </div>
      ) : competition.status === 'active' ? (
        <div className="bg-card border-2 border-dashed border-primary/30 rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-black text-lg">أنت مسجل في المسابقة</p>
            <p className="text-sm text-muted-foreground mt-1">قدّم تلاوتك الآن للمشاركة في التحكيم</p>
          </div>
          <button
            onClick={() => setShowSubmitForm(true)}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <Mic className="w-4 h-4 inline-block ml-2" />
            تقديم التلاوة
          </button>
        </div>
      ) : null}

      {/* Submit Form */}
      {showSubmitForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <h3 className="font-black text-lg">تقديم التلاوة</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-bold">
              سجل تلاوتك <span className="text-red-500">*</span>
            </label>
            <AudioRecorder
              value={form.submission_url}
              onChange={url => setForm(prev => ({ ...prev, submission_url: url || '' }))}
            />
            <p className="text-xs text-muted-foreground mt-2">قم بتسجيل تلاوتك مباشرة هنا</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">عدد الآيات المقروءة</label>
              <input
                type="number"
                min={0}
                value={form.verses_count || ''}
                onChange={e => setForm(prev => ({ ...prev, verses_count: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">ملاحظات (اختياري)</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي معلومة إضافية..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال المشاركة
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitForm(false)}
              className="px-4 py-3 bg-muted text-foreground rounded-xl font-bold text-sm hover:bg-muted/70 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
