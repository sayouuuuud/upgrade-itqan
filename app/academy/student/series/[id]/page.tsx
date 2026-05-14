'use client'

import { useState, useEffect, use } from 'react'
import { Layers, BookOpen, Route, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SeriesDetail {
  id: string
  title: string
  description: string
  subject: string
  teacher_name: string
  items: SeriesItem[]
}

interface SeriesItem {
  id: string
  item_type: 'course' | 'path'
  course_id: string | null
  path_id: string | null
  order_index: number
  title: string
  description: string
  thumbnail_url: string | null
}

export default function StudentSeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [series, setSeries] = useState<SeriesDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await fetch(`/api/academy/student/series/${id}`)
        if (res.ok) {
          const data = await res.json()
          setSeries(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch series:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSeries()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">السلسلة غير موجودة</p>
        <Link href="/academy/student/series" className="text-emerald-600 hover:underline mt-2 inline-block">
          العودة للسلاسل
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/academy/student/series" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
          <ArrowRight className="w-4 h-4" />
          العودة للسلاسل
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-7 h-7 text-emerald-600" />
          {series.title}
        </h1>
        {series.description && (
          <p className="text-muted-foreground mt-1">{series.description}</p>
        )}
        {series.teacher_name && (
          <p className="text-sm text-muted-foreground mt-1">الشيخ: {series.teacher_name}</p>
        )}
      </div>

      {series.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Layers className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">لا توجد محتويات في هذه السلسلة بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {series.items.map((item, index) => {
            const href = item.item_type === 'course'
              ? `/academy/student/courses/${item.course_id}`
              : `/academy/student/path`

            return (
              <Link
                key={item.id}
                href={href}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group block"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold shrink-0">
                  {index + 1}
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                  item.item_type === 'course'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                }`}>
                  {item.item_type === 'course' ? <BookOpen className="w-5 h-5" /> : <Route className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold group-hover:text-emerald-600 transition-colors truncate">
                    {item.title || 'بدون عنوان'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {item.item_type === 'course' ? 'دورة' : 'مسار تعليمي'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
