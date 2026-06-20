"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  BookOpen, Users, ClipboardList, Calendar, Video,
  ChevronLeft, Star, Clock, TrendingUp, CheckCircle2,
  AlertCircle, PlayCircle, GraduationCap, LayoutDashboard, Plus, ArrowUpRight
} from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'

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
          fetch('/api/academy/teacher/sessions?limit=3&upcoming=true') // Fetch up to 3 upcoming sessions
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
    return <PageLoadingSkeleton />
  }

  const FADE_UP_ANIMATION_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="space-y-8 max-w-7xl mx-auto pb-12 relative" dir="rtl"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Hero Welcome Section */}
      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-l from-blue-700 to-indigo-800 p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-blue-100" />
              <span className="text-sm font-bold tracking-wide">لوحة تحكم المعلم</span>
            </div>
            <h1 className="text-3xl font-black sm:text-4xl drop-shadow-sm">
              {t.academy?.teacherWelcome || 'مرحباً بك أيها المعلم'}
            </h1>
            <p className="text-blue-100 max-w-xl leading-relaxed text-base">
              {t.academy?.teacherWelcomeDesc || 'تابع طلابك، أدر دوراتك، وراقب أداءك من مكان واحد بكل سهولة.'}
            </p>
          </div>
          
          {/* Quick Actions inside Hero */}
          <div className="flex shrink-0 gap-3">
            <Link href="/academy/teacher/live" className="flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
              <Video className="w-5 h-5" />
              بدء جلسة مباشرة
            </Link>
            <Link href="/academy/teacher/courses/new" className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 px-5 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors shadow-lg">
              <Plus className="w-5 h-5" />
              دورة جديدة
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          icon={BookOpen}
          label={t.academy?.activeCourses || 'دوراتك النشطة'}
          value={stats?.active_courses || 0}
          color="blue"
        />
        <StatCard 
          icon={Users}
          label={t.academy?.totalStudents || 'إجمالي طلابك'}
          value={stats?.total_students || 0}
          color="green"
        />
        <StatCard 
          icon={Star}
          label={'متوسط التقييم'}
          value={stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '—'}
          color="yellow"
        />
        <StatCard 
          icon={Calendar}
          label={t.academy?.upcomingSessions || 'الجلسات القادمة'}
          value={stats?.upcoming_sessions || 0}
          color="purple"
        />
        <StatCard 
          icon={ClipboardList}
          label={t.academy?.pendingReview || 'مهام تنتظر التقييم'}
          value={stats?.pending_submissions || 0}
          color="orange"
          alert={stats?.pending_submissions ? stats.pending_submissions > 0 : false}
          className="col-span-2 md:col-span-1"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (Courses & More) */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="lg:col-span-2 space-y-8">
          
          {/* My Courses */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">{t.academy?.myCourses || 'أحدث الدورات'}</h2>
              </div>
              <Link 
                href="/academy/teacher/courses"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t.academy?.viewAll || 'عرض الكل'}
                <ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-semibold text-lg">{t.academy?.noCoursesYet || 'لم تنشئ أي دورة بعد'}</p>
                <p className="text-sm mt-2 max-w-sm mx-auto">ابدأ رحلتك في التعليم بإنشاء أول دورة لك ونشرها للطلاب.</p>
                <Link 
                  href="/academy/teacher/courses/new"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  {t.academy?.createCourse || 'إنشاء دورة'}
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/academy/teacher/courses/${course.id}`}
                    className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:shadow-md hover:-translate-y-1 group"
                  >
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-blue-500/50" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <h3 className="font-bold text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          {course.enrolled_count}
                        </span>
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                          {course.lessons_count}
                        </span>
                      </div>
                      <span className={cn(
                        "mt-3 w-fit px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        course.status === 'published' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50",
                        course.status === 'draft' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50",
                        course.status === 'archived' && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50"
                      )}>
                        {course.status === 'published' && (t.academy?.published || 'منشورة')}
                        {course.status === 'draft' && (t.academy?.draft || 'مسودة')}
                        {course.status === 'archived' && (t.academy?.archived || 'مؤرشفة')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </motion.div>

        {/* Right Sidebar */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="space-y-8">
          
          {/* Upcoming Sessions (Scrollable) */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-sm p-6 overflow-hidden flex flex-col max-h-[480px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                  <Video className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">{t.academy?.upcomingSessions || 'الجلسات القادمة'}</h2>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Video className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">{t.academy?.noSessions || 'لا توجد جلسات قادمة قريباً'}</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30 pr-1 -mr-1">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/academy/teacher/sessions/${session.id}`}
                    className="block p-4 rounded-2xl bg-card border border-border/40 hover:border-purple-200 dark:hover:border-purple-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all hover:-translate-y-0.5"
                  >
                    <p className="font-bold text-sm leading-tight line-clamp-1">{session.title}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1.5 truncate">{session.course_title}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Users className="w-3.5 h-3.5" />
                        {session.attendees_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Submissions */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                  <ClipboardList className="w-5 h-5" />
                  {submissions.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <h2 className="text-lg font-bold">{t.academy?.pendingSubmissions || 'مهام التقييم'}</h2>
              </div>
              <Link href="/academy/teacher/tasks" className="text-xs font-bold text-orange-600 hover:text-orange-700">كل المهام</Link>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500/50" />
                <p className="text-sm font-semibold">ممتاز! قمت بتقييم جميع المهام.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/academy/teacher/tasks/${submission.id}/review`}
                    className="block p-4 rounded-2xl bg-card border border-border/40 hover:border-orange-200 dark:hover:border-orange-900/50 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all hover:-translate-y-0.5"
                  >
                    <p className="font-bold text-sm leading-tight line-clamp-1">{submission.task_title}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[11px] font-semibold text-muted-foreground truncate max-w-[120px]">
                        {submission.student_name}
                      </p>
                      <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-md">
                        {formatTimeAgo(submission.submitted_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  alert = false,
  className
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  color: 'blue' | 'green' | 'orange' | 'purple' | 'yellow'
  alert?: boolean
  className?: string
}) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200/50',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200/50',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-orange-200/50',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border-purple-200/50',
    yellow: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200/50',
  }

  const bgHover = {
    blue: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-300/50',
    green: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:border-emerald-300/50',
    orange: 'hover:bg-orange-50/50 dark:hover:bg-orange-900/10 hover:border-orange-300/50',
    purple: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:border-purple-300/50',
    yellow: 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10 hover:border-amber-300/50',
  }

  return (
    <div className={cn(
      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border p-5 relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      alert ? "border-orange-500/50 shadow-orange-500/10" : "border-border/50",
      bgHover[color],
      className
    )}>
      {alert && (
        <div className="absolute top-0 right-0 w-full h-full rounded-3xl border-2 border-orange-500/30 animate-pulse pointer-events-none" />
      )}
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  )
}
