'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Clock, CheckCircle, XCircle, BookOpen,
  User, FileText, Loader2, Mail, Video,
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
      toast.error('يجب كتابة سبب الرفض')
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
        toast.success(action === 'approve' ? 'تم اعتماد الدرس ونشره' : 'تم رفض الدرس')
        router.push('/academy/content-supervisor/lessons')
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="bg-card border border-border rounded-2xl p-16 text-center">
        <p className="font-bold text-foreground">الدرس غير موجود</p>
        <Link href="/academy/content-supervisor/lessons" className="text-primary text-sm font-bold mt-3 inline-block">
          العودة إلى القائمة
        </Link>
      </div>
    )
  }

  const isPending = lesson.status === 'pending_review'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/academy/content-supervisor/lessons"
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة إلى القائمة
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary mb-1">{lesson.course_title}</p>
            <h1 className="text-2xl font-black text-foreground">{lesson.title}</h1>
          </div>
          <StatusBadge status={lesson.status} />
        </div>

        {/* Teacher + meta */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {lesson.teacher_avatar ? (
                <img src={lesson.teacher_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{lesson.teacher_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {lesson.teacher_email}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            رُفع في {new Date(lesson.created_at).toLocaleDateString('ar-EG')}
          </span>
          {lesson.duration_minutes && (
            <span className="text-xs text-muted-foreground">
              المدة: {lesson.duration_minutes} دقيقة
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {lesson.description && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            وصف الدرس
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {lesson.description}
          </p>
        </div>
      )}

      {/* Video */}
      {lesson.video_url && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            مقطع الفيديو
          </h2>
          <div className="aspect-video bg-muted rounded-xl overflow-hidden">
            <video src={lesson.video_url} controls className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Audio */}
      {lesson.audio_url && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-3">المقطع الصوتي</h2>
          <audio src={lesson.audio_url} controls className="w-full" />
        </div>
      )}

      {/* Transcript */}
      {lesson.transcript_text && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-2">النص</h2>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {lesson.transcript_text}
          </p>
        </div>
      )}

      {/* Review section */}
      <div className="bg-card border-2 border-primary/20 rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          {isPending ? 'مراجعة الدرس' : 'ملاحظات المراجعة'}
        </h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!isPending}
          placeholder="أضف ملاحظاتك على الدرس (مطلوبة عند الرفض)..."
          rows={5}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
        />

        {!isPending && lesson.reviewer_name && (
          <p className="text-xs text-muted-foreground mt-3">
            تمت المراجعة بواسطة {lesson.reviewer_name}
            {lesson.reviewed_at && ` في ${new Date(lesson.reviewed_at).toLocaleDateString('ar-EG')}`}
          </p>
        )}

        {isPending && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={() => handleReview('approve')}
              disabled={submitting !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting === 'approve' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              اعتماد ونشر
            </button>
            <button
              type="button"
              onClick={() => handleReview('reject')}
              disabled={submitting !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting === 'reject' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              رفض الدرس
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending_review: { label: 'بانتظار المراجعة', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'      },
    approved:       { label: 'معتمد',          cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    rejected:       { label: 'مرفوض',          cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400'          },
    draft:          { label: 'مسودة',          cls: 'bg-muted text-muted-foreground'                            },
  }
  const c = config[status] || config.draft
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${c.cls}`}>
      {c.label}
    </span>
  )
}
