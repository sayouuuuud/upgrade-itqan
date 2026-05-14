"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  Archive, Search, BookOpen, GraduationCap, CheckCircle2, ChevronLeft, Loader2,
} from 'lucide-react'

interface ArchivedCourse {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | string
  category_name: string
  teacher_name: string
  progress_percent: number
  completed_at: string | null
  enrolled_at: string
  total_lessons: number
  is_active: boolean
}

export default function StudentCoursesArchivePage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<ArchivedCourse[]>([])
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchDebounced) params.set('search', searchDebounced)
    fetch(`/api/academy/student/courses/archive?${params}`)
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => setCourses(d.data || []))
      .finally(() => setLoading(false))
  }, [searchDebounced])

  const titleText = t.academy?.archiveTitle || (isAr ? 'الأرشيف' : 'Archive')
  const descText = t.academy?.archiveStudentDesc || (isAr ? 'الدورات اللي خلّصتها — افتح أي دورة لمراجعتها' : 'Courses you have completed — open any to review')
  const searchPlaceholder = t.academy?.archiveSearchPlaceholder || (isAr ? 'ابحث بالعنوان أو الوصف...' : 'Search by title or description...')
  const emptyTitle = t.academy?.archiveEmptyTitle || (isAr ? 'الأرشيف فاضي' : 'No archived courses')
  const emptyDesc = t.academy?.archiveStudentEmptyDesc || (isAr ? 'بمجرد ما تكمّل دورة، هتلاقيها هنا للمراجعة' : 'Once you complete a course it will appear here for review')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="w-7 h-7 text-blue-600" />
          {titleText}
        </h1>
        <p className="text-muted-foreground mt-1">{descText}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
          <p className="text-muted-foreground">{emptyDesc}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/academy/student/courses/${course.id}`}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all"
            >
              <div className="h-36 bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="absolute bottom-3 right-3 left-3">
                  <h3 className="font-bold text-white text-lg line-clamp-2">{course.title}</h3>
                </div>
              </div>

              <div className="p-4">
                {course.category_name && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground mb-2">
                    {course.category_name}
                  </span>
                )}
                {course.teacher_name && (
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {course.teacher_name}
                  </p>
                )}
                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-medium">
                    {t.academy?.completed || (isAr ? 'مكتملة' : 'Completed')}
                    {course.completed_at && ` · ${new Date(course.completed_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}`}
                  </span>
                  <ChevronLeft className={cn(
                    "w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600",
                    !isAr && "rotate-180"
                  )} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
