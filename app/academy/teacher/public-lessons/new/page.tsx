'use client'

import { useRouter } from 'next/navigation'
import { PublicLessonForm } from '@/components/academy/public-lesson-form'

export default function NewPublicLessonPage() {
  const router = useRouter()
  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">درس عام جديد</h1>
      <PublicLessonForm
        onSubmit={async (data) => {
          const res = await fetch('/api/academy/teacher/public-lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const d = await res.json()
          if (!res.ok) throw new Error(d.error || 'تعذر الحفظ')
          router.push(`/academy/teacher/public-lessons/${d.data.id}`)
        }}
      />
    </div>
  )
}
