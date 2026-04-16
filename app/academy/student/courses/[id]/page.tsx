"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { GraduationCap, PlayCircle, Clock, Users, BookOpen, Lock, BookMarked, ArrowRight } from 'lucide-react'

interface CourseDetail {
  course: {
    id: string; title: string; description?: string; thumbnail_url?: string
    level: string; teacher_name: string; category_name?: string
    total_enrolled: number
  }
  lessons: { id: string; title: string; order_index: number; duration_minutes?: number }[]
  enrollment_status: 'none' | 'pending' | 'active' | 'rejected'
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const [data, setData] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [errorText, setErrorText] = useState('')

  const courseId = params.id as string

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/academy/student/courses/${courseId}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setErrorText('الدورة غير موجودة')
        }
      } catch (error) {
        console.error('Failed to fetch course details:', error)
        setErrorText('حدث خطأ أثناء تحميل الدورة')
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const res = await fetch(`/api/academy/student/courses/${courseId}/enroll`, { method: 'POST' })
      if (res.ok) {
        setData(prev => prev ? {...prev, enrollment_status: 'pending'} : prev)
      } else {
        const json = await res.json()
        alert(json.error || 'حدث خطأ')
      }
    } catch (e) {
      alert('حدث خطأ في الاتصال')
    } finally {
      setEnrolling(false)
    }
  }

  const levelLabels: Record<string, string> = {
    beginner: t.academy?.beginner || 'مبتدئ',
    intermediate: t.academy?.intermediate || 'متوسط',
    advanced: t.academy?.advanced || 'متقدم'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorText || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{errorText || 'حدث خطأ'}</h2>
        <Link href="/academy/student/courses/browse" className="text-blue-600 hover:underline">
          العودة للتصفح
        </Link>
      </div>
    )
  }

  const { course, lessons, enrollment_status } = data
  const hasAccess = enrollment_status === 'active'

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-blue-900 border border-blue-800">
        <div className="absolute inset-0">
          {course.thumbnail_url ? (
             <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-30" />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-950 opacity-90" />
          )}
        </div>
        
        <div className="relative z-10 p-8 md:p-12 lg:px-16 lg:py-16">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
              {levelLabels[course.level] || course.level}
            </span>
            {course.category_name && (
              <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                {course.category_name}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-4xl leading-tight">
            {course.title}
          </h1>
          
          <div className="flex items-center gap-6 text-blue-100 text-sm mb-6 max-w-3xl">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 opacity-70" />
              <span className="font-medium">{course.teacher_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 opacity-70" />
              <span className="font-medium">{lessons.length} درس</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 opacity-70" />
              <span className="font-medium">{course.total_enrolled} طالب</span>
            </div>
          </div>
          
          {course.description && (
            <p className="text-blue-50 max-w-3xl text-lg mb-8 opacity-90 leading-relaxed font-medium">
              {course.description}
            </p>
          )}
          
          <div className="mt-8 flex gap-4">
            {enrollment_status === 'none' && (
              <button 
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
              >
                {enrolling ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <BookMarked className="w-5 h-5" />
                    {t.academy?.enrollNow || 'طلب الانضمام'}
                  </>
                )}
              </button>
            )}
            
            {enrollment_status === 'pending' && (
              <button disabled className="px-8 py-3.5 bg-white/10 text-white text-base font-bold rounded-xl border border-white/20 flex items-center gap-2 cursor-not-allowed">
                 <Clock className="w-5 h-5" />
                {t.academy?.enrollmentPending || 'في انتظار موافقة الأستاذ'}
              </button>
            )}

            {enrollment_status === 'rejected' && (
              <button disabled className="px-8 py-3.5 bg-red-500/20 text-red-100 text-base font-bold rounded-xl border border-red-500/50 flex items-center gap-2 cursor-not-allowed">
                تم رفض طلبك لهذه الدورة
              </button>
            )}

            {enrollment_status === 'active' && lessons.length > 0 && (
              <Link 
                href={`/academy/student/courses/${courseId}/lesson/${lessons[0].id}`}
                className="px-8 py-3.5 bg-green-500 hover:bg-green-400 text-white text-base font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                {t.academy?.continueLearning || 'متابعة الدورة'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            {t.academy?.courseContent || 'محتوى الدورة'}
            <span className="text-sm font-normal text-muted-foreground ml-2">({lessons.length} درس)</span>
          </h2>
        </div>
        
        <div className="divide-y divide-border">
          {lessons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد دروس مضافة حتى الآن.
            </div>
          ) : (
            lessons.map((lesson, idx) => (
              <div key={lesson.id} className={cn("p-4 flex items-center gap-4 transition-colors", hasAccess ? 'hover:bg-muted/50' : 'opacity-75')}>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-bold truncate", hasAccess ? 'text-foreground' : 'text-muted-foreground')}>
                    {lesson.title}
                  </h3>
                  {lesson.duration_minutes && (
                     <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {lesson.duration_minutes} دقيقة
                     </p>
                  )}
                </div>
                <div>
                  {!hasAccess ? (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <Link 
                      href={`/academy/student/courses/${courseId}/lesson/${lesson.id}`}
                      className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    >
                      <PlayCircle className="w-5 h-5 rtl:rotate-180" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
