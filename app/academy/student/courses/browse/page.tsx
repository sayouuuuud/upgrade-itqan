"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { BookOpen, Search, GraduationCap, PlayCircle, Users } from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category_name?: string
  teacher_name: string
  total_lessons: number
  total_enrolled: number
  created_at: string
}

export default function BrowseCoursesPage() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/academy/student/courses/all')
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
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesLevel && matchesSearch
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.academy?.browseCourses || 'تصفح الدورات'}</h1>
          <p className="text-muted-foreground mt-1">
            {t.academy?.browseDesc || 'استكشف الدورات المتاحة وانضم إلى رحلة التعلم'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t.academy?.searchCourses || 'ابحث عن دورة أو أستاذ...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                levelFilter === level
                  ? "bg-blue-600 text-white"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              )}
            >
              {level === 'all' ? (t.academy?.all || 'الكل') : levelLabels[level]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery 
              ? (t.academy?.noSearchResults || 'لا توجد نتائج بحث')
              : (t.academy?.noPublishedCourses || 'لا توجد دورات متاحة حالياً')
            }
          </h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all">
              <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden shrink-0">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className={cn(
                  "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold shadow-sm",
                  levelColors[course.level]
                )}>
                  {levelLabels[course.level]}
                </span>
                {course.category_name && (
                  <span className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                    {course.category_name}
                  </span>
                )}
                <div className="absolute bottom-4 right-4 left-4">
                  <h3 className="font-bold text-white text-xl line-clamp-2">{course.title}</h3>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {course.teacher_name}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    {course.total_lessons} {t.academy?.lessons || 'درس'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.total_enrolled} {t.academy?.students || 'طالب'}
                  </span>
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/academy/student/courses/${course.id}`}
                    className="flex w-full items-center justify-center py-2.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    {t.academy?.viewCourse || 'عرض الدورة'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
