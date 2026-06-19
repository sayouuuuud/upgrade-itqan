"use client"

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import {
  Archive, Search, BookOpen, Users, User, Loader2, Sparkles, ArrowLeft, ArrowRight
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/academy/content-supervisor"
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للوحة الإشراف' : 'Back to Dashboard'}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
              <Archive className="w-6 h-6" />
            </div>
            {isAr ? 'أرشيف الدورات' : 'Courses Archive'}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {isAr
              ? 'الدورات المعطّلة في تخصصك — للمراجعة فقط'
              : 'Deactivated courses in your specialization — read-only review'}
          </p>
        </div>
      </div>

      {/* Toolbar: Search */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
          <input
            type="text"
            placeholder={isAr ? 'ابحث بالعنوان أو الوصف...' : 'Search by title or description...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-background border border-border/50 rounded-xl px-4 py-3 ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm`}
          />
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-16 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <Archive className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {isAr ? 'لا توجد دورات في الأرشيف حالياً' : 'No archived courses currently'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {searchDebounced 
              ? (isAr ? 'لم نعثر على نتائج مطابقة لبحثك.' : 'No results matching your search.')
              : (isAr ? 'يظهر الأرشيف الدورات المعطلة المتعلقة بتخصصك فقط.' : 'The archive only shows deactivated courses in your specialization.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card border border-border/50 rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xl">
                      {course.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    {course.teacher_name || '—'}
                  </span>
                  
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {course.total_enrolled} {isAr ? 'مسجل' : 'enrolled'}
                  </span>

                  {(course.specialization || course.category_name) && (
                    <div className="flex gap-2">
                      {course.specialization && (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-foreground/80 font-medium">
                          {course.specialization}
                        </span>
                      )}
                      {course.category_name && (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-foreground/80 font-medium">
                          {course.category_name}
                        </span>
                      )}
                    </div>
                  )}

                  {course.archived_at && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Archive className="w-3.5 h-3.5" />
                      {isAr ? 'مؤرشف في:' : 'Archived:'} {new Date(course.archived_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 mt-4 sm:mt-0 pl-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 shadow-sm bg-muted text-muted-foreground border border-border/50`}>
                  <Archive className="w-3.5 h-3.5" />
                  {isAr ? 'مؤرشفة' : 'Archived'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
