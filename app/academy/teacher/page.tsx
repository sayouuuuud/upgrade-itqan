"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  BookOpen, Users, ClipboardList, Calendar, Video,
  ChevronLeft, Star, Clock, TrendingUp, CheckCircle2,
  AlertCircle, PlayCircle, GraduationCap
} from 'lucide-react'

interface TeacherStats {
  total_courses: number
  active_courses: number
  total_students: number
  pending_submissions: number
  upcoming_sessions: number
  total_halaqat: number
  average_rating?: number
}

interface Course {
  id: string
  title: string
  thumbnail_url?: string
  enrolled_count: number
  lessons_count: number
  status: 'draft' | 'published' | 'archived'
}

interface PendingSubmission {
  id: string
  task_title: string
  student_name: string
  course_title: string
  submitted_at: string
  type: string
}

interface UpcomingSession {
  id: string
  title: string
  course_title: string
  scheduled_at: string
  attendees_count: number
}

export default function TeacherDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([])
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, coursesRes, submissionsRes, sessionsRes] = await Promise.all([
          fetch('/api/academy/teacher/stats'),
          fetch('/api/academy/teacher/courses?limit=4'),
          fetch('/api/academy/teacher/submissions?limit=5&pending=true'),
          fetch('/api/academy/teacher/sessions?limit=3&upcoming=true')
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.data || [])
        }
        if (submissionsRes.ok) {
          const data = await submissionsRes.json()
          setSubmissions(data.data || [])
        }
        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'منذ قليل'
    if (hours < 24) return `منذ ${hours} ساعة`
    const days = Math.floor(hours / 24)
    return `منذ ${days} يوم`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {t.academy?.teacherWelcome || 'مرحباً بك أيها المدرس'}
        </h1>
        <p className="text-blue-100">
          {t.academy?.teacherWelcomeDesc || 'تابع طلابك وأدر دوراتك من هنا'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={BookOpen}
          label={t.academy?.activeCourses || 'الدورات النشطة'}
          value={stats?.active_courses || 0}
          color="blue"
        />
        <StatCard 
          icon={Users}
          label={t.academy?.totalStudents || 'إجمالي الطلاب'}
          value={stats?.total_students || 0}
          color="green"
        />
        <StatCard 
          icon={ClipboardList}
          label={t.academy?.pendingReview || 'بانتظار التقييم'}
          value={stats?.pending_submissions || 0}
          color="orange"
          alert={stats?.pending_submissions ? stats.pending_submissions > 0 : false}
        />
        <StatCard 
          icon={Calendar}
          label={t.academy?.upcomingSessions || 'الجلسات القادمة'}
          value={stats?.upcoming_sessions || 0}
          color="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">{t.academy?.myCourses || 'دوراتي'}</h2>
            <Link 
              href="/academy/teacher/courses"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {t.academy?.viewAll || 'عرض الكل'}
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.academy?.noCoursesYet || 'لم تنشئ أي دورة بعد'}</p>
              <Link 
                href="/academy/teacher/courses/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.academy?.createCourse || 'إنشاء دورة'}
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/academy/teacher/courses/${course.id}`}
                  className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrolled_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-4 h-4" />
                        {course.lessons_count}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        course.status === 'published' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        course.status === 'draft' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                        course.status === 'archived' && "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      )}>
                        {course.status === 'published' && (t.academy?.published || 'منشورة')}
                        {course.status === 'draft' && (t.academy?.draft || 'مسودة')}
                        {course.status === 'archived' && (t.academy?.archived || 'مؤرشفة')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                {t.academy?.upcomingSessions || 'الجلسات القادمة'}
              </h2>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.academy?.noSessions || 'لا توجد جلسات قادمة'}
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/academy/teacher/sessions/${session.id}`}
                    className="block p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{session.course_title}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-blue-600">{formatDateTime(session.scheduled_at)}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {session.attendees_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/academy/teacher/live"
              className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              <PlayCircle className="w-4 h-4" />
              {t.academy?.startSession || 'بدء جلسة جديدة'}
            </Link>
          </div>

          {/* Pending Submissions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-orange-600" />
                {t.academy?.pendingSubmissions || 'بانتظار التقييم'}
              </h2>
              {submissions.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {submissions.length}
                </span>
              )}
            </div>

            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.academy?.noSubmissions || 'لا توجد تسليمات معلقة'}
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/academy/teacher/tasks/${submission.id}/review`}
                    className="block p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <p className="font-medium text-sm">{submission.task_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {submission.student_name} • {submission.course_title}
                    </p>
                    <p className="text-xs text-orange-600 mt-2">
                      {formatTimeAgo(submission.submitted_at)}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/academy/teacher/tasks"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
            >
              {t.academy?.viewAllTasks || 'عرض كل المهام'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  alert = false
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: 'blue' | 'green' | 'orange' | 'purple'
  alert?: boolean
}) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
  }

  return (
    <div className={cn(
      "bg-card rounded-xl border p-4 relative",
      alert ? "border-orange-500 ring-2 ring-orange-500/20" : "border-border"
    )}>
      {alert && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
      )}
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
