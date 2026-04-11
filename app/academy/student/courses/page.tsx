"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  BookOpen, Search, Filter, PlayCircle, Clock, Users,
  CheckCircle2, ChevronLeft, GraduationCap
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  teacher_id: string
  teacher_name?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  progress_percent: number
  completed_lessons: number
  total_lessons: number
  status: 'active' | 'completed' | 'dropped'
  enrolled_at: string
}

export default function StudentCoursesPage() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/academy/student/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const levelLabels = {
    beginner: t.academy?.beginner || 'مبتدئ',
    intermediate: t.academy?.intermediate || 'متوسط',
    advanced: t.academy?.advanced || 'متقدم'
  }

  const levelColors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.academy?.myCourses || 'دوراتي'}</h1>
          <p className="text-muted-foreground mt-1">
            {t.academy?.coursesDesc || 'تابع تقدمك في الدورات المسجلة'}
          </p>
        </div>
        <Link
          href="/academy/student/courses/browse"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          {t.academy?.browseCourses || 'تصفح الدورات'}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t.academy?.searchCourses || 'ابحث عن دورة...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f === 'all' && (t.academy?.all || 'الكل')}
              {f === 'active' && (t.academy?.inProgress || 'قيد التقدم')}
              {f === 'completed' && (t.academy?.completed || 'مكتملة')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
          <p className="text-sm text-muted-foreground">{t.academy?.totalCourses || 'إجمالي الدورات'}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {courses.filter(c => c.status === 'completed').length}
          </p>
          <p className="text-sm text-muted-foreground">{t.academy?.completedCourses || 'مكتملة'}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {courses.filter(c => c.status === 'active').length}
          </p>
          <p className="text-sm text-muted-foreground">{t.academy?.inProgress || 'قيد التقدم'}</p>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery 
              ? (t.academy?.noSearchResults || 'لا توجد نتائج')
              : (t.academy?.noCoursesYet || 'لم تسجل في أي دورة بعد')
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {t.academy?.exploreAndEnroll || 'استكشف الدورات المتاحة وسجل الآن'}
          </p>
          <Link
            href="/academy/student/courses/browse"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            {t.academy?.browseCourses || 'تصفح الدورات'}
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/academy/student/courses/${course.id}`}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className={cn(
                  "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium",
                  levelColors[course.level]
                )}>
                  {levelLabels[course.level]}
                </span>
                {course.status === 'completed' && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white p-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 left-3">
                  <h3 className="font-bold text-white text-lg line-clamp-2">{course.title}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {course.teacher_name && (
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {course.teacher_name}
                  </p>
                )}

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {t.academy?.progress || 'التقدم'}
                    </span>
                    <span className="font-medium">{course.progress_percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        course.status === 'completed' ? "bg-green-500" : "bg-blue-500"
                      )}
                      style={{ width: `${course.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    {course.completed_lessons}/{course.total_lessons} {t.academy?.lessons || 'درس'}
                  </span>
                  <ChevronLeft className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
