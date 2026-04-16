"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { BookOpen, Plus, GraduationCap, PlayCircle, Users, Edit, FileText, Bell } from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published'
  category_name?: string
  total_lessons: number
  total_enrolled: number
  pending_requests: number
  created_at: string
}

export default function TeacherCoursesPage() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/academy/teacher/courses')
        if (res.ok) {
          const json = await res.json()
          setCourses(json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const levelLabels: Record<string, string> = {
    beginner: t.academy?.beginner || 'مبتدئ',
    intermediate: t.academy?.intermediate || 'متوسط',
    advanced: t.academy?.advanced || 'متقدم'
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const publishedCount = courses.filter(c => c.status === 'published').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalStudents = courses.reduce((sum, c) => sum + c.total_enrolled, 0)

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
            إدارة دوراتك ومتابعة طلابك
          </p>
        </div>
        <Link 
          href="/academy/teacher/courses/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          إنشاء دورة جديدة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <span className="text-2xl font-bold">{courses.length}</span>
          <span className="text-sm text-muted-foreground">إجمالي الدورات</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
          <GraduationCap className="w-6 h-6 text-green-500" />
          <span className="text-2xl font-bold">{publishedCount}</span>
          <span className="text-sm text-muted-foreground">منشورة</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
          <FileText className="w-6 h-6 text-yellow-500" />
          <span className="text-2xl font-bold">{draftCount}</span>
          <span className="text-sm text-muted-foreground">في المسودة</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
          <Users className="w-6 h-6 text-purple-500" />
          <span className="text-2xl font-bold">{totalStudents}</span>
          <span className="text-sm text-muted-foreground">إجمالي الطلاب</span>
        </div>
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">لا توجد لديك دورات حتى الآن</h3>
          <p className="text-muted-foreground mb-6">ابدأ بنشر علمك بإنشاء دورتك الأولى</p>
          <Link 
            href="/academy/teacher/courses/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            إنشاء دورتي الأولى
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-card border border-border rounded-xl flex flex-col md:flex-row overflow-hidden hover:border-blue-500/50 hover:shadow-md transition-all">
              {/* Thumbnail */}
              <div className="md:w-1/3 aspect-video md:aspect-auto bg-gradient-to-br from-blue-700 to-blue-900 relative shrink-0">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-blue-300/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-sm backdrop-blur-md",
                    course.status === 'published' 
                      ? "bg-green-500/80 text-white border-green-400" 
                      : "bg-black/50 text-white border-white/20"
                  )}>
                    {course.status === 'published' ? 'منشورة' : 'مسودة'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col min-w-0">
                <div className="flex gap-2 mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", levelColors[course.level])}>
                    {levelLabels[course.level]}
                  </span>
                  {course.category_name && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                      {course.category_name}
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-foreground mb-3 truncate">{course.title}</h3>
                
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-auto mb-4">
                  <span className="flex items-center gap-1.5">
                     <PlayCircle className="w-4 h-4" /> {course.total_lessons} درس
                  </span>
                  <span className="flex items-center gap-1.5">
                     <Users className="w-4 h-4" /> {course.total_enrolled} مسجلين
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Link 
                    href={`/academy/teacher/courses/${course.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-sm font-bold transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    إدارة الدورة
                  </Link>
                  <Link 
                    href={`/academy/teacher/enrollment-requests?course_id=${course.id}`}
                    className="shrink-0 flex items-center justify-center w-10 h-10 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground relative transition-colors"
                    title="طلبات الانضمام"
                  >
                    <Bell className="w-4 h-4" />
                    {course.pending_requests > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold shadow-sm">
                        {course.pending_requests > 99 ? '+99' : course.pending_requests}
                      </span>
                    )}
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
