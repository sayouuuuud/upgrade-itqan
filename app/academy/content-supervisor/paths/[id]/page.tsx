'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Clock, CheckCircle, XCircle, Route as RouteIcon,
  User, FileText, Loader2, Mail, ListOrdered,
} from 'lucide-react'

interface Stage {
  id: string
  title: string
  position: number
}

interface PathDetail {
  id: string
  title: string
  description: string | null
  level: string | null
  status: string
  path_type: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_for_review_at: string | null
  created_at: string
  creator_id: string | null
  creator_name: string | null
  creator_email: string | null
  creator_avatar: string | null
  reviewer_name: string | null
  stages: Stage[]
}

const TYPE_LABEL: Record<string, string> = {
  tajweed: 'تجويد',
  memorization: 'حفظ',
}

export default function PathReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tajweed'

  const [path, setPath] = useState<PathDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    fetch(`/api/academy/supervisor/paths/${id}?type=${type}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.path) {
          setPath(d.path)
          setNotes(d.path.rejection_reason || '')
        }
      })
      .finally(() => setLoading(false))
  }, [id, type])

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && !notes.trim()) {
      toast.error('يجب كتابة سبب الرفض')
      return
    }
    setSubmitting(action)
    try {
      const res = await fetch(`/api/academy/supervisor/paths/${id}?type=${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(action === 'approve' ? 'تم اعتماد المسار ونشره' : 'تم رفض المسار')
        router.push('/academy/content-supervisor/paths')
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

  if (!path) {
    return (
      <div className="bg-card border border-border rounded-2xl p-16 text-center">
        <p className="font-bold text-foreground">المسار غير موجود</p>
        <Link href="/academy/content-supervisor/paths" className="text-primary text-sm font-bold mt-3 inline-block">
          العودة إلى القائمة
        </Link>
      </div>
    )
  }

  const isPending = path.status === 'pending_review'

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/academy/content-supervisor/paths"
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة إلى القائمة
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {TYPE_LABEL[type] || type}
            </span>
            <h1 className="text-2xl font-black text-foreground mt-2">{path.title}</h1>
          </div>
          <StatusBadge status={path.status} />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border text-sm">
          {path.creator_name && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {path.creator_avatar ? (
                  <img src={path.creator_avatar || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{path.creator_name}</p>
                {path.creator_email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {path.creator_email}
                  </p>
                )}
              </div>
            </div>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(path.submitted_for_review_at || path.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>

      {path.description && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            وصف المسار
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {path.description}
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-primary" />
          {type === 'memorization' ? 'وحدات المسار' : 'مراحل المسار'} ({path.stages.length})
        </h2>
        {path.stages.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد عناصر في هذا المسار بعد.</p>
        ) : (
          <div className="space-y-2">
            {path.stages.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center gap-3 bg-background border border-border rounded-xl p-3"
              >
                <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="font-semibold text-sm text-foreground truncate min-w-0 flex-1">
                  {s.title || `عنصر ${idx + 1}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border-2 border-primary/20 rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <RouteIcon className="w-4 h-4 text-primary" />
          {isPending ? 'مراجعة المسار' : 'نتيجة المراجعة'}
        </h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!isPending}
          placeholder="أضف سبب الرفض (مطلوب عند الرفض)..."
          rows={4}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
        />

        {!isPending && path.reviewer_name && (
          <p className="text-xs text-muted-foreground mt-3">
            تمت المراجعة بواسطة {path.reviewer_name}
            {path.reviewed_at && ` في ${new Date(path.reviewed_at).toLocaleDateString('ar-EG')}`}
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
              رفض المسار
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
    published: { label: 'منشور', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    rejected: { label: 'مرفوض', cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
    draft: { label: 'مسودة', cls: 'bg-muted text-muted-foreground' },
  }
  const c = config[status] || config.draft
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${c.cls}`}>
      {c.label}
    </span>
  )
}
