'use client'

import { useEffect, useState, use } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Clock, CheckCircle, XCircle, BookOpen,
  User, FileText, Loader2, Mail, Video, Headphones,
  AlignLeft, ShieldAlert, Sparkles, Send
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  audio_url: string | null
  transcript_text: string | null
  duration_minutes: number | null
  order_index: number | null
  status: string
  review_notes: string | null
  reviewed_at: string | null
  created_at: string
  course_id: string
  course_title: string
  course_description: string | null
  teacher_id: string
  teacher_name: string
  teacher_email: string
  teacher_avatar: string | null
  reviewer_name: string | null
}

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    fetch(`/api/academy/supervisor/content/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.lesson) {
          setLesson(d.lesson)
          setNotes(d.lesson.review_notes || '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && !notes.trim()) {
      toast.error(isAr ? 'يجب كتابة سبب الرفض' : 'Rejection reason is required')
      return
    }
    setSubmitting(action)
    try {
      const res = await fetch(`/api/academy/supervisor/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(action === 'approve' 
          ? (isAr ? 'تم اعتماد الدرس ونشره' : 'Lesson approved and published') 
          : (isAr ? 'تم رفض الدرس' : 'Lesson rejected'))
        router.push('/academy/content-supervisor/lessons')
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error occurred')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 text-rose-500/50 mb-4" />
        <p className="text-xl font-bold text-foreground mb-2">{isAr ? 'الدرس غير موجود' : 'Lesson not found'}</p>
        <p className="text-muted-foreground text-sm mb-6">
          {isAr ? 'قد يكون تم حذفه أو ليس لديك صلاحية للوصول إليه.' : 'It may have been deleted or you do not have permission to access it.'}
        </p>
        <Link href="/academy/content-supervisor/lessons" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          <ArrowRight className="w-4 h-4" />
          {isAr ? 'العودة إلى القائمة' : 'Back to List'}
        </Link>
      </div>
    )
  }

  const isPending = lesson.status === 'pending_review'

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/academy/content-supervisor/lessons"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-card hover:bg-muted border border-border/50 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          {isAr ? 'العودة إلى الدروس' : 'Back to Lessons'}
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/10">
                {lesson.course_title}
              </span>
              <StatusBadge status={lesson.status} isAr={isAr} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
              {lesson.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {isAr ? 'رُفع في' : 'Uploaded on'} {new Date(lesson.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {lesson.duration_minutes && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1.5">
                    {isAr ? 'المدة:' : 'Duration:'} <strong className="text-foreground">{lesson.duration_minutes}</strong> {isAr ? 'دقيقة' : 'minutes'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Teacher Info Card-let */}
          <div className="shrink-0 flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm">
              {lesson.teacher_avatar ? (
                <img src={lesson.teacher_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'المعلم' : 'Teacher'}</p>
              <p className="font-bold text-foreground text-sm">{lesson.teacher_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {lesson.teacher_email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Description */}
        {lesson.description && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              {isAr ? 'وصف الدرس' : 'Lesson Description'}
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {lesson.description}
              </p>
            </div>
          </div>
        )}

        {/* Media Grid (Video / Audio) */}
        {(lesson.video_url || lesson.audio_url) && (
          <div className="grid grid-cols-1 gap-6">
            {lesson.video_url && (
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <Video className="w-5 h-5 text-blue-500" />
                  {isAr ? 'مقطع الفيديو' : 'Video Clip'}
                </h2>
                <div className="aspect-video bg-black/5 dark:bg-black/40 rounded-xl overflow-hidden border border-border/50 shadow-inner">
                  <video src={lesson.video_url} controls className="w-full h-full object-contain outline-none" />
                </div>
              </div>
            )}

            {lesson.audio_url && (
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <Headphones className="w-5 h-5 text-purple-500" />
                  {isAr ? 'المقطع الصوتي' : 'Audio Clip'}
                </h2>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <audio src={lesson.audio_url} controls className="w-full outline-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        {lesson.transcript_text && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
              <AlignLeft className="w-5 h-5 text-indigo-500" />
              {isAr ? 'النص التفصيلي (Transcript)' : 'Transcript'}
            </h2>
            <div className="bg-muted/20 p-6 rounded-xl border border-border/50">
              <p className="text-sm text-foreground/80 leading-loose whitespace-pre-wrap">
                {lesson.transcript_text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-sm border-2 ${isPending ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/50'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 text-xl">
            {isPending ? (
              <>
                <Sparkles className="w-6 h-6 text-primary" />
                {isAr ? 'قرار المراجعة' : 'Review Decision'}
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-muted-foreground" />
                {isAr ? 'سجل المراجعة' : 'Review Log'}
              </>
            )}
          </h2>
          
          {!isPending && lesson.reviewer_name && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg border border-border/50">
              <User className="w-3 h-3 text-muted-foreground" />
              {isAr ? 'المراجع:' : 'Reviewer:'} {lesson.reviewer_name}
              {lesson.reviewed_at && <span className="text-muted-foreground ml-1">({new Date(lesson.reviewed_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')})</span>}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{isAr ? 'ملاحظات المراجعة' : 'Review Notes'}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isPending}
              placeholder={isPending ? (isAr ? "أضف ملاحظاتك على الدرس... (مطلوبة عند الرفض وتظهر للمعلم)" : "Add your notes on the lesson... (Required for rejection and visible to teacher)") : (isAr ? "لا توجد ملاحظات." : "No notes.")}
              rows={4}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none disabled:opacity-70 disabled:bg-muted/50 transition-all shadow-sm"
            />
          </div>

          {isPending && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleReview('approve')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'approve' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isAr ? 'اعتماد ونشر' : 'Approve and Publish'}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
              
              <button
                type="button"
                onClick={() => handleReview('reject')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'reject' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isAr ? 'رفض الدرس' : 'Reject Lesson'}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const config: Record<string, { labelAr: string; labelEn: string; cls: string; icon: any }> = {
    pending_review: { labelAr: 'بانتظار المراجعة', labelEn: 'Pending Review', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400', icon: Clock },
    approved:       { labelAr: 'معتمد',          labelEn: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    published:      { labelAr: 'منشور',          labelEn: 'Published',      cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    rejected:       { labelAr: 'مرفوض',          labelEn: 'Rejected',       cls: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400', icon: XCircle },
    draft:          { labelAr: 'مسودة',          labelEn: 'Draft',          cls: 'bg-muted text-muted-foreground border-border/50', icon: BookOpen },
  }
  const c = config[status] || config.draft
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${c.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {isAr ? c.labelAr : c.labelEn}
    </span>
  )
}
