'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export interface PublicLessonFormValues {
  title: string
  description: string
  cover_image_url: string
  scheduled_at: string
  duration_minutes: number
  meeting_link: string
  meeting_provider: 'zoom' | 'google_meet' | 'other'
  meeting_password: string
}

const DEFAULTS: PublicLessonFormValues = {
  title: '',
  description: '',
  cover_image_url: '',
  scheduled_at: '',
  duration_minutes: 60,
  meeting_link: '',
  meeting_provider: 'zoom',
  meeting_password: '',
}

interface Props {
  initial?: Partial<PublicLessonFormValues>
  submitLabel?: string
  onSubmit: (values: PublicLessonFormValues) => Promise<void> | void
  onDelete?: () => void
}

export function PublicLessonForm({ initial, submitLabel = 'إنشاء الدرس', onSubmit, onDelete }: Props) {
  const [values, setValues] = useState<PublicLessonFormValues>({ ...DEFAULTS, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const set = <K extends keyof PublicLessonFormValues>(k: K, v: PublicLessonFormValues[K]) => {
    setValues(prev => ({ ...prev, [k]: v }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setSuccess(null)
    if (!values.title.trim() || !values.scheduled_at) {
      setError('العنوان والموعد مطلوبان')
      return
    }
    if (values.meeting_link && !/^https?:\/\//i.test(values.meeting_link)) {
      setError('رابط الانضمام لازم يبدأ بـ http(s)')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(values)
      setSuccess('تم الحفظ.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">عنوان الدرس <span className="text-red-500">*</span></Label>
        <Input id="title" value={values.title} onChange={e => set('title', e.target.value)}
          placeholder="مثال: تفسير سورة الكهف" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">وصف الدرس</Label>
        <Textarea id="description" rows={4} value={values.description}
          onChange={e => set('description', e.target.value)}
          placeholder="ايه اللي هتتكلم عنه في الدرس؟" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_image_url">رابط صورة الغلاف (Open Graph)</Label>
        <Input id="cover_image_url" type="url" dir="ltr" value={values.cover_image_url}
          onChange={e => set('cover_image_url', e.target.value)}
          placeholder="https://...png" />
        <p className="text-xs text-muted-foreground">
          الصورة دي بتظهر لما الرابط يتشير على فيس بوك/تويتر/واتساب.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">موعد الدرس <span className="text-red-500">*</span></Label>
          <Input id="scheduled_at" type="datetime-local" value={values.scheduled_at}
            onChange={e => set('scheduled_at', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">المدة (بالدقائق)</Label>
          <Input id="duration_minutes" type="number" min={5} max={480}
            value={values.duration_minutes}
            onChange={e => set('duration_minutes', Number(e.target.value) || 60)} />
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <h2 className="font-semibold">رابط الانضمام (Zoom/Meet)</h2>

        <div className="space-y-2">
          <Label>مقدم الخدمة</Label>
          <div className="flex gap-2 flex-wrap">
            {(['zoom', 'google_meet', 'other'] as const).map(p => (
              <button type="button" key={p} onClick={() => set('meeting_provider', p)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  values.meeting_provider === p
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}>
                {p === 'zoom' ? 'Zoom' : p === 'google_meet' ? 'Google Meet' : 'آخر'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting_link">الرابط</Label>
          <Input id="meeting_link" type="url" dir="ltr" value={values.meeting_link}
            onChange={e => set('meeting_link', e.target.value)}
            placeholder="https://zoom.us/j/123..." />
          <p className="text-xs text-muted-foreground">
            الرابط ده بيتعرض للزوار لما الدرس يبدأ في موعده تلقائياً (مش قبل كده).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting_password">كلمة المرور (اختياري)</Label>
          <Input id="meeting_password" type="text" dir="ltr"
            value={values.meeting_password}
            onChange={e => set('meeting_password', e.target.value)} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="flex justify-end gap-2 pt-2">
        {onDelete && (
          <Button type="button" variant="outline" onClick={onDelete}
            className="text-red-600 hover:text-red-700">
            حذف
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin me-2" /> جاري الحفظ</> : submitLabel}
        </Button>
      </div>
    </form>
  )
}
