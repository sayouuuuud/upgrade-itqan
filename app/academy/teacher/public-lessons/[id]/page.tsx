'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PublicLessonForm, PublicLessonFormValues } from '@/components/academy/public-lesson-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, UserPlus, ExternalLink, Copy, ArrowRight } from 'lucide-react'

interface LessonData {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  public_slug: string
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  meeting_provider: 'zoom' | 'google_meet' | 'other' | null
  meeting_password: string | null
  status: string
  is_published: boolean
}

export default function EditPublicLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<LessonData | null>(null)
  const [stats, setStats] = useState<{ views: number; uniques: number; signups: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch(`/api/academy/teacher/public-lessons/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d.data)
        setStats(d.stats)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>
  if (!data) return <div className="text-center py-12">الدرس غير موجود</div>

  const url = `${origin}/lessons/${data.public_slug}`
  const initialValues: PublicLessonFormValues = {
    title: data.title,
    description: data.description || '',
    cover_image_url: data.cover_image_url || '',
    scheduled_at: toDatetimeLocal(data.scheduled_at),
    duration_minutes: data.duration_minutes,
    meeting_link: data.meeting_link || '',
    meeting_provider: data.meeting_provider || 'zoom',
    meeting_password: data.meeting_password || '',
  }

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      <Button variant="ghost" asChild>
        <Link href="/academy/teacher/public-lessons">
          <ArrowRight className="w-4 h-4 me-1 rotate-180" />
          العودة لقائمة الدروس
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">تعديل الدرس العام</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">رابط الدرس العام</div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="bg-muted px-3 py-2 rounded flex-1 break-all text-sm" dir="ltr">{url}</code>
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="w-4 h-4 me-1" />
                {copied ? 'تم النسخ' : 'نسخ'}
              </Button>
              <Button size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 me-1" /> فتح
                </a>
              </Button>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Stat icon={<Eye className="w-4 h-4" />} label="مشاهدات" value={stats.views} />
              <Stat icon={<Eye className="w-4 h-4" />} label="زوار فريدون" value={stats.uniques} />
              <Stat icon={<UserPlus className="w-4 h-4" />} label="تسجيلات" value={stats.signups} />
            </div>
          )}
        </CardContent>
      </Card>

      <PublicLessonForm
        initial={initialValues}
        submitLabel="حفظ التعديلات"
        onSubmit={async (form) => {
          const res = await fetch(`/api/academy/teacher/public-lessons/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
          const d = await res.json()
          if (!res.ok) throw new Error(d.error || 'تعذر الحفظ')
          setData(d.data)
        }}
        onDelete={async () => {
          if (!confirm('متأكد من حذف الدرس نهائياً؟')) return
          const res = await fetch(`/api/academy/teacher/public-lessons/${id}`, { method: 'DELETE' })
          if (res.ok) router.push('/academy/teacher/public-lessons')
        }}
      />
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}
