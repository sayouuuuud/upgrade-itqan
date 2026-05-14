"use client"

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import {
  Archive, Search, BookOpen, Users, User, Loader2,
} from 'lucide-react'

interface ArchivedCourse {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  specialization: string | null
  archived_at: string | null
  category_name: string
  teacher_name: string
  archived_by_name: string
  total_lessons: number
  total_enrolled: number
}

export default function ContentSupervisorArchivePage() {
  const { locale } = useI18n()
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
    fetch(`/api/academy/supervisor/courses/archive?${params}`)
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => setCourses(d.data || []))
      .finally(() => setLoading(false))
  }, [searchDebounced])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="w-7 h-7 text-blue-600" />
          {isAr ? 'أرشيف الدورات' : 'Courses Archive'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? 'الدورات المعطّلة في تخصصك — للمراجعة فقط'
            : 'Deactivated courses in your specialization — read-only review'}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={isAr ? 'ابحث بالعنوان أو الوصف...' : 'Search by title or description...'}
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
          <h3 className="text-lg font-semibold mb-2">
            {isAr ? 'لا توجد دورات في الأرشيف' : 'No archived courses'}
          </h3>
          <p className="text-muted-foreground">
            {isAr ? 'الأرشيف بيظهر فقط الدورات اللي في تخصصك' : 'Only courses in your specialization show up here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4"
            >
              <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground truncate">{course.title}</h3>
                {course.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{course.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {course.teacher_name || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.total_enrolled} {isAr ? 'مسجل' : 'enrolled'}
                  </span>
                  {course.specialization && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {course.specialization}
                    </span>
                  )}
                  {course.category_name && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {course.category_name}
                    </span>
                  )}
                  {course.archived_at && (
                    <span>
                      {isAr ? 'مؤرشف:' : 'Archived:'} {new Date(course.archived_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
