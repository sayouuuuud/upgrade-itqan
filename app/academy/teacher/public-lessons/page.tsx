'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Globe, Eye, UserPlus, Calendar, Clock, Edit2, Trash2, ExternalLink } from 'lucide-react'

interface PublicLesson {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  public_slug: string
  scheduled_at: string
  duration_minutes: number
  status: string
  is_published: boolean
  view_count: number
  signup_count: number
}

export default function TeacherPublicLessonsPage() {
  const [lessons, setLessons] = useState<PublicLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch('/api/academy/teacher/public-lessons')
      .then(r => r.json())
      .then(d => setLessons(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('متأكد من حذف الدرس؟ سيتعطل الرابط المنشور.')) return
    const res = await fetch(`/api/academy/teacher/public-lessons/${id}`, { method: 'DELETE' })
    if (res.ok) setLessons(lessons.filter(l => l.id !== id))
  }

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>

  const upcoming = lessons.filter(l => new Date(l.scheduled_at) > new Date())
  const past = lessons.filter(l => new Date(l.scheduled_at) <= new Date())

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="w-7 h-7 text-emerald-600" />
            الدروس العامة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            افتح درساً عاماً برابط قابل للمشاركة على السوشيال ميديا — أي حد بيدخل الرابط يقدر يحضر بدون تسجيل.
          </p>
        </div>
        <Button asChild>
          <Link href="/academy/teacher/public-lessons/new">
            <Plus className="w-4 h-4 me-1" />
            درس عام جديد
          </Link>
        </Button>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">لم تنشئ أي دروس عامة بعد</p>
            <Button asChild>
              <Link href="/academy/teacher/public-lessons/new">
                <Plus className="w-4 h-4 me-1" />
                أنشئ أول درس
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title="الدروس القادمة">
              {upcoming.map(l => <LessonRow key={l.id} lesson={l} origin={origin} onDelete={handleDelete} />)}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="الدروس السابقة">
              {past.map(l => <LessonRow key={l.id} lesson={l} origin={origin} onDelete={handleDelete} />)}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function LessonRow({ lesson, origin, onDelete }: {
  lesson: PublicLesson
  origin: string
  onDelete: (id: string) => void
}) {
  const url = `${origin}/lessons/${lesson.public_slug}`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url)
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{lesson.title}</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                {lesson.is_published ? 'منشور' : 'مسودة'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(lesson.scheduled_at).toLocaleDateString('ar-EG')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(lesson.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {lesson.view_count} مشاهدة
              </span>
              <span className="flex items-center gap-1">
                <UserPlus className="w-4 h-4" />
                {lesson.signup_count} تسجيل
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground break-all" dir="ltr">{url}</code>
              <button onClick={copyUrl} className="px-2 py-1 rounded border border-border hover:bg-muted">
                نسخ
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
            <Button asChild size="sm" variant="outline">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 me-1" /> عرض
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/academy/teacher/public-lessons/${lesson.id}`}>
                <Edit2 className="w-4 h-4 me-1" /> تعديل
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(lesson.id)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 me-1" /> حذف
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
