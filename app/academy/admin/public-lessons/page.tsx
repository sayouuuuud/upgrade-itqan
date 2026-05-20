'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, Loader2, ExternalLink, Calendar, Video } from 'lucide-react'

interface PublicLesson {
  id: string
  teacher_id: string
  teacher_name: string
  title: string
  description: string | null
  public_slug: string
  scheduled_at: string
  duration_minutes: number
  status: string
  is_published: boolean
  review_status: 'pending_review' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_at: string | null
  category_id: string | null
  category_name: string | null
  created_at: string
}

type Tab = 'pending_review' | 'approved' | 'rejected'

export default function AdminPublicLessonsReviewPage() {
  const [lessons, setLessons] = useState<PublicLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending_review')
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/academy/admin/public-lessons?review_status=${tab}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'فشل التحميل')
      setLessons(json.data || [])
    } catch (e: any) {
      setError(e.message || 'تعذر التحميل')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load() }, [tab])

  const review = async (id: string, action: 'approve' | 'reject') => {
    let notes: string | null = null
    if (action === 'reject') {
      notes = prompt('سبب الرفض (اختياري)')
    }
    if (!confirm(action === 'approve' ? 'الموافقة على نشر الحلقة؟' : 'رفض الحلقة؟')) return
    setActingId(id)
    try {
      const res = await fetch(`/api/academy/admin/public-lessons/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json?.error || 'فشل التحديث')
        return
      }
      setLessons(prev => prev.filter(l => l.id !== id))
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مراجعة الحلقات العامة</h1>
        <p className="text-muted-foreground mt-1">راجع الحلقات التي يقدّمها المدرسون قبل ظهورها للجمهور.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-border">
        {[
          { id: 'pending_review' as const, label: 'بانتظار المراجعة', icon: Clock, color: 'text-amber-600' },
          { id: 'approved' as const, label: 'مقبولة', icon: CheckCircle2, color: 'text-green-600' },
          { id: 'rejected' as const, label: 'مرفوضة', icon: XCircle, color: 'text-red-600' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className={`w-4 h-4 ${tab === t.id ? '' : t.color}`} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      ) : lessons.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          {tab === 'pending_review' && 'لا توجد حلقات تنتظر المراجعة الآن.'}
          {tab === 'approved' && 'لم تتم الموافقة على أي حلقات بعد.'}
          {tab === 'rejected' && 'لا توجد حلقات مرفوضة.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {lessons.map(l => (
            <div key={l.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                  <span>المدرس: <strong className="text-foreground">{l.teacher_name}</strong></span>
                  {l.category_name && <span>• {l.category_name}</span>}
                </div>
                <h3 className="font-bold text-lg mb-1 truncate">{l.title}</h3>
                {l.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{l.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(l.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span className="inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {l.duration_minutes} د</span>
                </div>
                {l.review_notes && (
                  <div className="mt-3 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-2 rounded">
                    ملاحظات المراجعة السابقة: {l.review_notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/lessons/${l.public_slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                >
                  <ExternalLink className="w-4 h-4" />
                  معاينة
                </Link>
                {tab === 'pending_review' && (
                  <>
                    <button
                      onClick={() => review(l.id, 'reject')}
                      disabled={actingId === l.id}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {actingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      رفض
                    </button>
                    <button
                      onClick={() => review(l.id, 'approve')}
                      disabled={actingId === l.id}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {actingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      موافقة
                    </button>
                  </>
                )}
                {tab === 'rejected' && (
                  <button
                    onClick={() => review(l.id, 'approve')}
                    disabled={actingId === l.id}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {actingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    إعادة الموافقة
                  </button>
                )}
                {tab === 'approved' && (
                  <button
                    onClick={() => review(l.id, 'reject')}
                    disabled={actingId === l.id}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {actingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    سحب النشر
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
