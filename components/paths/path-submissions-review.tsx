'use client'

import { useState, useEffect } from 'react'
import {
  Loader2, CheckCircle2, XCircle, Inbox, Mic, FileText, Clock, User, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface Submission {
  progress_id: string
  status: string
  audio_url: string | null
  file_url: string | null
  recitation_id: string | null
  notes: string | null
  submitted_at: string | null
  reviewer_feedback: string | null
  stage_id: string
  stage_title: string
  stage_position: number
  require_audio: boolean
  require_file: boolean
  task_instructions: string | null
  student_id: string
  student_name: string
  student_email: string
}

// Shared review surface for both maqraa (reader) and academy (teacher) paths.
// apiBase example: `/api/admin/tajweed-paths/${pathId}` or `/api/academy/teacher/paths/${pathId}`
export default function PathSubmissionsReview({ apiBase }: { apiBase: string }) {
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      const res = await fetch(`${apiBase}/submissions`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.submissions || [])
      } else {
        toast.error('تعذّر تحميل التسليمات')
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل التسليمات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [apiBase])

  const review = async (progressId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !(feedback[progressId] || '').trim()) {
      toast.error('اكتب ملاحظة توضّح سبب الرفض للطالب')
      return
    }
    setActing(progressId + action)
    try {
      const res = await fetch(`${apiBase}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_id: progressId, action, feedback: feedback[progressId] || null }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(action === 'approve' ? 'تم اعتماد التسليم' : 'تم رفض التسليم وإعادته للطالب')
        setItems(prev => prev.filter(i => i.progress_id !== progressId))
      } else {
        toast.error(json.error || 'تعذّر حفظ المراجعة')
      }
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-12 text-center">
        <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground font-medium">لا توجد تسليمات بانتظار المراجعة</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(s => (
        <div key={s.progress_id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="w-7 h-7 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center shrink-0">
                  {s.stage_position}
                </span>
                <span className="truncate">{s.stage_title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {s.student_name}</span>
                {s.submitted_at && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(s.submitted_at).toLocaleDateString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {s.task_instructions && (
            <div className="text-xs bg-muted/40 border border-border/50 rounded-lg p-3 text-muted-foreground">
              <span className="font-bold text-foreground">المطلوب: </span>{s.task_instructions}
            </div>
          )}

          {s.notes && (
            <div className="text-sm flex items-start gap-2">
              <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{s.notes}</p>
            </div>
          )}

          {/* Submitted assets */}
          <div className="space-y-3">
            {s.audio_url && (
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs font-bold text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-sky-600" /> التسجيل الصوتي
                </p>
                <audio src={s.audio_url} controls className="w-full" />
              </div>
            )}
            {s.file_url && (
              <a
                href={s.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline"
              >
                <FileText className="w-4 h-4" /> فتح الملف المرفوع
              </a>
            )}
            {!s.audio_url && !s.file_url && (
              <p className="text-xs text-amber-600">لم يرفق الطالب أي ملف أو تسجيل.</p>
            )}
          </div>

          {/* Feedback + actions */}
          <div className="space-y-2 pt-1">
            <textarea
              rows={2}
              value={feedback[s.progress_id] || ''}
              onChange={(e) => setFeedback(prev => ({ ...prev, [s.progress_id]: e.target.value }))}
              placeholder="ملاحظات للطالب (مطلوبة عند الرفض)..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => review(s.progress_id, 'approve')}
                disabled={acting === s.progress_id + 'approve'}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors disabled:opacity-60"
              >
                {acting === s.progress_id + 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                اعتماد واجتياز
              </button>
              <button
                onClick={() => review(s.progress_id, 'reject')}
                disabled={acting === s.progress_id + 'reject'}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 border border-rose-300 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg font-bold transition-colors disabled:opacity-60"
              >
                {acting === s.progress_id + 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                رفض وإعادة
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
