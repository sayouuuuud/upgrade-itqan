'use client'


import { useRouter } from 'next/navigation'
import { PublicLessonForm } from '@/components/academy/public-lesson-form'
import { useI18n } from '@/lib/i18n/context'

export default function NewPublicLessonPage() {
  const { t } = useI18n();
  const academyTeacher = (t as any).academyTeacher as Record<string, string> | undefined

  const router = useRouter()
  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">{(t.addedTranslations_2026?.['درس عام جديد'] || (t.addedTranslations_2026?.['درس عام جديد'] || 'درس عام جديد'))}</h1>
      <PublicLessonForm
        onSubmit={async (data) => {
          const res = await fetch('/api/academy/teacher/public-lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const d = await res.json()
          if (!res.ok) throw new Error(d.error || (t.addedTranslations_2026?.['تعذر الحفظ'] || 'تعذر الحفظ'))
          router.push(`/academy/teacher/public-lessons/${d.data.id}`)
        }}
      />
    </div>
  )
}
