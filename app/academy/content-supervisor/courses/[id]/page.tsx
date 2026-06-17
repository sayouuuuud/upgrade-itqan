'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Clock, CheckCircle, XCircle, GraduationCap,
  User, FileText, Loader2, Mail, Layers, PlayCircle,
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  status: string
  order_index: number | null
}

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string | null
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_for_review_at: string | null
  created_at: string
  teacher_id: string
  teacher_name: string
  teacher_email: string
  teacher_avatar: string | null
  reviewer_name: string | null
}

export default function CourseReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    fetch(`/api/academy/supervisor/courses/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.course) {
          setCourse(d.course)
          setLessons(d.lessons || [])
          setReason(d.course.rejection_reason || '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && reason.trim().length < 3) {
      toast.error('يجب كتابة سبب الرفض')
      return
    }
    setSubmitting(action)
    try {
      const res = await fetch(`/api/academy/admin/courses/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(action === 'approve' ? 'تم اعتماد الدورة ونشرها' : 'تم رفض الدورة')
        router.push('/academy/content-supervisor/courses')
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

  if (!course) {
    return (
      <div className="bg-card border border-border rounded-2xl p-16 text-center">
        <p className="font-bold text-foreground">الدورة غير موجودة</p>
        <Link href="/academy/content-supervisor/courses" className="text-primary text-sm font-bold mt-3 inline-block">
          العودة إلى القائمة
        </Link>
      </div>
    )
  }

  const isPending = course.status === 'pending_review'

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/academy/content-supervisor/courses"
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة إلى القائمة
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-foreground">{course.title}</h1>
          </div>
          <StatusBadge status={course.status} />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {course.teacher_avatar ? (
                <img src={course.teacher_avatar || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{course.teacher_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {course.teacher_email}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Layers className="w-3 h-3" />
            {lessons.length} درس
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(course.submitted_for_review_at || course.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>

      {course.description && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            وصف الدورة
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {course.description}
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-primary" />
          دروس الدورة ({lessons.length})
        </h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد دروس في هذه الدورة بعد.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((l, idx) => (
              <div
                key={l.id}
                className="flex items-center gap-3 bg-background border border-border rounded-xl p-3"
              >
                <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">{l.title}</p>
                  {l.duration_minutes ? (
                    <p className="text-xs text-muted-foreground">{l.duration_minutes} دقيقة</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border-2 border-primary/20 rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          {isPending ? 'مراجعة الدورة' : 'نتيجة المراجعة'}
        </h2>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={!isPending}
          placeholder="أضف سبب الرفض (مطلوب عند الرفض ليتمكن المعلم من التعديل)..."
          rows={4}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
        />

        {!isPending && course.reviewer_name && (
          <p className="text-xs text-muted-foreground mt-3">
            تمت المراجعة بواسطة {course.reviewer_name}
            {course.reviewed_at && ` في ${new Date(course.reviewed_at).toLocaleDateString('ar-EG')}`}
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
              {submitting === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              اعتماد ونشر
            </button>
            <button
              type="button"
              onClick={() => handleReview('reject')}
              disabled={submitting !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              رفض الدورة
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending_review: { label: 'بانتظار المراجعة', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    published: { label: 'منشورة', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    rejected: { label: 'مرفوضة', cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
    draft: { label: 'مسودة', cls: 'bg-muted text-muted-foreground' },
    archived: { label: 'مؤرشفة', cls: 'bg-muted text-muted-foreground' },
  }
  const c = config[status] || config.draft
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${c.cls}`}>
      {c.label}
    </span>
  )
}
