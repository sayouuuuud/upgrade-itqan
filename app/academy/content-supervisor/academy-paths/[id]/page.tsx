'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, GraduationCap, Clock, CheckCircle, XCircle,
  Loader2, AlertCircle, User, BookMarked, Timer,
} from 'lucide-react'

interface PathDetail {
  id: string
  title: string
  description: string | null
  subject: string | null
  level: string | null
  estimated_hours: number | null
  status: string
  is_published: boolean
  rejection_reason: string | null
  submitted_for_review_at: string | null
  reviewed_at: string | null
  created_at: string
  creator_name: string | null
  creator_avatar: string | null
  creator_email: string | null
  reviewer_name: string | null
}

export default function AcademyPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [path, setPath] = useState<PathDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/academy/supervisor/academy-paths/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setPath(d.data))
      .catch(() => setError('تعذّر تحميل بيانات المسار'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAction(action: 'approve' | 'reject') {
    if (action === 'reject' && !notes.trim()) {
      setError('يرجى كتابة سبب الرفض')
      return
    }
    setSubmitting(action)
    setError(null)
    try {
      const res = await fetch(`/api/academy/supervisor/academy-paths/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'فشل الإجراء')
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!path) {
    return (
      <div className="bg-card border border-border rounded-2xl p-16 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-bold text-foreground">المسار غير موجود</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
        <p className="text-xl font-black text-foreground">تم تنفيذ الإجراء بنجاح</p>
        <button
          onClick={() => router.push('/academy/content-supervisor/academy-paths')}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
        >
          العودة للقائمة
        </button>
      </div>
    )
  }

  const isPending = path.status === 'pending_review'

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-black text-foreground">{path.title}</h1>
            <StatusBadge status={path.status} />
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            {path.creator_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {path.creator_name}
              </span>
            )}
            {path.estimated_hours ? (
              <span className="flex items-center gap-1.5">
                <Timer className="w-4 h-4" />
                {path.estimated_hours} ساعة
              </span>
            ) : null}
            {path.subject && (
              <span className="flex items-center gap-1.5">
                <BookMarked className="w-4 h-4" />
                {path.subject}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {new Date(path.submitted_for_review_at || path.created_at).toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {path.description && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-2">الوصف</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{path.description}</p>
        </div>
      )}

      {/* Previous rejection */}
      {path.status === 'rejected' && path.rejection_reason && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-foreground">سبب الرفض السابق</p>
            <p className="text-sm text-muted-foreground mt-1">{path.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Review panel — only if pending */}
      {isPending && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-foreground">قرار المراجعة</h2>

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <textarea
            rows={3}
            placeholder="سبب الرفض (مطلوب عند الرفض، اختياري عند الاعتماد)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleAction('approve')}
              disabled={!!submitting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              اعتماد ونشر
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={!!submitting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {submitting === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              رفض المسار
            </button>
          </div>
        </div>
      )}

      {/* Already reviewed */}
      {!isPending && path.reviewer_name && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">
            تمت المراجعة بواسطة <span className="font-bold text-foreground">{path.reviewer_name}</span>
            {path.reviewed_at && (
              <> في {new Date(path.reviewed_at).toLocaleDateString('ar-EG')}</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending_review: { label: 'بانتظار المراجعة', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    published:      { label: 'منشور',            cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    rejected:       { label: 'مرفوض',            cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
    draft:          { label: 'مسودة',             cls: 'bg-muted text-muted-foreground' },
  }
  const c = config[status] || config.draft
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  )
}
