"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { BookOpen, Plus, GraduationCap, PlayCircle, Users, Edit, FileText, Bell, Archive, Loader2, Trash2, Clock, XCircle, AlertTriangle, Send } from 'lucide-react'

type CourseStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: CourseStatus
  is_active?: boolean
  category_name?: string
  total_lessons: number
  total_enrolled: number
  pending_requests: number
  rejection_reason?: string | null
  reviewed_at?: string | null
  submitted_for_review_at?: string | null
  created_at: string
}

export default function TeacherCoursesPage() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resubmittingId, setResubmittingId] = useState<string | null>(null)

  const fetchCourses = async () => {
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses()
  }, [])

  const handleDelete = async (course: Course) => {
    if (!confirm(`حذف الدورة "${course.title}" نهائياً؟ لا يمكن التراجع عن هذا الاجراء.`)) return
    setDeletingId(course.id)
    try {
      let res = await fetch(`/api/academy/teacher/courses/${course.id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}))
        const enrolledCount = json?.enrolled_count
        const forceMsg = enrolledCount
          ? `يوجد ${enrolledCount} طالب مسجل في الدورة. هل تود حذفها فعلاً؟ ستفقد السجلات التعليمية للطلاب.`
          : (json?.message || 'لا يمكن حذف الدورة. هل تود المحاولة على أي حال؟')
        if (!confirm(forceMsg)) {
          setDeletingId(null)
          return
        }
        res = await fetch(`/api/academy/teacher/courses/${course.id}?force=1`, { method: 'DELETE' })
      }
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== course.id))
      } else {
        const json = await res.json().catch(() => ({}))
        alert(json?.message || 'تعذر حذف الدورة.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleResubmit = async (course: Course) => {
    if (!confirm(`إعادة إرسال الدورة "${course.title}" للأدمن للمراجعة؟ تأكد أنك عدّلت المحتوى بناءً على سبب الرفض.`)) return
    setResubmittingId(course.id)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_review' }),
      })
      if (res.ok) {
        alert('تم إرسال الدورة للأدمن للمراجعة.')
        fetchCourses()
      } else {
        const json = await res.json().catch(() => ({}))
        alert(json?.error || 'تعذر إرسال الدورة للمراجعة.')
      }
    } finally {
      setResubmittingId(null)
    }
  }

  const handleToggleArchive = async (course: Course) => {
    const willDeactivate = course.is_active !== false
    const msg = willDeactivate
      ? 'تعطيل الدورة؟ هتختفي من الطلاب الجدد لكن الحاليين هيكملوا عادي.'
      : 'إعادة تفعيل الدورة؟ هتظهر للطلاب الجدد تاني.'
    if (!confirm(msg)) return
    setArchivingId(course.id)
    try {
      const res = await fetch(`/api/academy/teacher/courses/${course.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !willDeactivate }),
      })
      if (res.ok) fetchCourses()
      else alert('حدث خطأ')
    } finally {
      setArchivingId(null)
    }
  }

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
  const pendingCount = courses.filter(c => c.status === 'pending_review').length
  const rejectedCount = courses.filter(c => c.status === 'rejected').length
  const totalStudents = courses.reduce((sum, c) => sum + c.total_enrolled, 0)

  const statusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'published':
        return { label: 'منشورة', cls: 'bg-green-500/80 text-white border-green-400' }
      case 'pending_review':
        return { label: 'بانتظار المراجعة', cls: 'bg-amber-500/80 text-white border-amber-400' }
      case 'rejected':
        return { label: 'مرفوضة', cls: 'bg-red-500/80 text-white border-red-400' }
      case 'archived':
        return { label: 'مؤرشفة', cls: 'bg-gray-700/80 text-white border-gray-500' }
      case 'draft':
      default:
        return { label: 'مسودة', cls: 'bg-black/50 text-white border-white/20' }
    }
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <Clock className="w-6 h-6 text-amber-500" />
          <span className="text-2xl font-bold">{pendingCount}</span>
          <span className="text-sm text-muted-foreground">بانتظار المراجعة</span>
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
      {rejectedCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            لديك {rejectedCount} دورة مرفوضة — راجع سبب الرفض على بطاقة الدورة، عدّل المحتوى، ثم اضغط <strong>&quot;إعادة الإرسال للمراجعة&quot;</strong>.
          </span>
        </div>
      )}

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
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {(() => {
                    const b = statusBadge(course.status)
                    return (
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-sm backdrop-blur-md',
                        b.cls,
                      )}>{b.label}</span>
                    )
                  })()}
                  {course.is_active === false && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-sm backdrop-blur-md bg-gray-700/80 text-white border-gray-500">
                      مؤرشفة
                    </span>
                  )}
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

                {course.status === 'rejected' && course.rejection_reason && (
                  <div className="mb-3 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/60 rounded-lg p-2.5 text-xs text-red-700 dark:text-red-300">
                    <div className="font-bold mb-0.5 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> سبب رفض الأدمن:</div>
                    <p className="line-clamp-3 leading-relaxed">{course.rejection_reason}</p>
                  </div>
                )}

                {course.status === 'pending_review' && (
                  <div className="mb-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>الدورة بانتظار مراجعة الأدمن ولا تظهر للطلاب حتى تتم الموافقة.</span>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-auto mb-4">
                  <span className="flex items-center gap-1.5">
                     <PlayCircle className="w-4 h-4" /> {course.total_lessons} درس
                  </span>
                  <span className="flex items-center gap-1.5">
                     <Users className="w-4 h-4" /> {course.total_enrolled} مسجلين
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  {course.status === 'rejected' ? (
                    <button
                      onClick={() => handleResubmit(course)}
                      disabled={resubmittingId === course.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
                    >
                      {resubmittingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      إعادة الإرسال للمراجعة
                    </button>
                  ) : (
                    <Link 
                      href={`/academy/teacher/courses/${course.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-sm font-bold transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      إدارة الدورة
                    </Link>
                  )}
                  {course.status === 'rejected' && (
                    <Link 
                      href={`/academy/teacher/courses/${course.id}`}
                      className="shrink-0 flex items-center justify-center w-10 h-10 border border-border bg-card rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600 transition-colors"
                      title="تعديل الدورة"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => handleToggleArchive(course)}
                    disabled={archivingId === course.id}
                    className="shrink-0 flex items-center justify-center w-10 h-10 border border-border bg-card rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-muted-foreground hover:text-amber-600 transition-colors"
                    title={course.is_active === false ? 'إعادة تفعيل' : 'تعطيل وأرشفة'}
                  >
                    {archivingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    disabled={deletingId === course.id}
                    className="shrink-0 flex items-center justify-center w-10 h-10 border border-border bg-card rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                    title="حذف الدورة نهائياً"
                  >
                    {deletingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
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
