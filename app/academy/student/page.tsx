"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  BookOpen, Clock, Target, Trophy, Award, Calendar,
  PlayCircle, ChevronLeft, Flame, Star, TrendingUp,
  CheckCircle2, BookMarked, Users
} from 'lucide-react'

interface StudentStats {
  enrolled_courses: number
  completed_courses: number
  pending_tasks: number
  total_points: number
  current_level: number
  streak_days: number
  upcoming_sessions: number
  badges_earned: number
}

interface Course {
  id: string
  title: string
  thumbnail_url?: string
  progress_percent: number
  next_lesson?: string
  teacher_name?: string
}

interface UpcomingSession {
  id: string
  title: string
  course_title: string
  scheduled_at: string
  teacher_name: string
}

interface Task {
  id: string
  title: string
  course_title: string
  due_date: string
  type: string
  points_value: number
}

export default function AcademyStudentDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, coursesRes, sessionsRes, tasksRes] = await Promise.all([
          fetch('/api/academy/student/stats'),
          fetch('/api/academy/student/courses?limit=3'),
          fetch('/api/academy/student/sessions?limit=3&upcoming=true'),
          fetch('/api/academy/student/tasks?limit=3&pending=true')
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.data || [])
        }
        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(data.data || [])
        }
        if (tasksRes.ok) {
          const data = await tasksRes.json()
          setTasks(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return 'متأخر'
    if (days === 0) return 'اليوم'
    if (days === 1) return 'غداً'
    return `${days} أيام`
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
          {t.academy?.welcomeBack || 'مرحباً بعودتك!'} 
        </h1>
        <p className="text-blue-100 mb-4">
          {t.academy?.continueJourney || 'واصل رحلتك التعليمية واكسب المزيد من النقاط'}
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <span className="font-bold">{stats?.streak_days || 0}</span>
            <span className="text-blue-200 text-sm">{t.academy?.streakDays || 'يوم متتالي'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-300" />
            <span className="font-bold">{stats?.total_points || 0}</span>
            <span className="text-blue-200 text-sm">{t.academy?.points || 'نقطة'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" />
            <span className="font-bold">{t.academy?.level || 'المستوى'} {stats?.current_level || 1}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={BookOpen}
          label={t.academy?.enrolledCourses || 'الدورات المسجلة'}
          value={stats?.enrolled_courses || 0}
          color="blue"
        />
        <StatCard 
          icon={CheckCircle2}
          label={t.academy?.completedCourses || 'الدورات المكتملة'}
          value={stats?.completed_courses || 0}
          color="green"
        />
        <StatCard 
          icon={Clock}
          label={t.academy?.pendingTasks || 'المهام المعلقة'}
          value={stats?.pending_tasks || 0}
          color="orange"
        />
        <StatCard 
          icon={Award}
          label={t.academy?.badgesEarned || 'الشارات المكتسبة'}
          value={stats?.badges_earned || 0}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">{t.academy?.myCourses || 'دوراتي'}</h2>
            <Link 
              href="/academy/student/courses"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {t.academy?.viewAll || 'عرض الكل'}
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.academy?.noCourses || 'لم تسجل في أي دورة بعد'}</p>
              <Link 
                href="/academy/student/courses/browse"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.academy?.browseCourses || 'تصفح الدورات'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Link 
                  key={course.id}
                  href={`/academy/student/courses/${course.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    {course.teacher_name && (
                      <p className="text-sm text-muted-foreground">{course.teacher_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${course.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {course.progress_percent}%
                      </span>
                    </div>
                  </div>
                  <PlayCircle className="w-8 h-8 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
                <Calendar className="w-5 h-5 text-blue-600" />
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
                    href={`/academy/student/sessions/${session.id}`}
                    className="block p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{session.course_title}</p>
                    <p className="text-xs text-blue-600 mt-2">{formatDate(session.scheduled_at)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                {t.academy?.pendingTasks || 'المهام المعلقة'}
              </h2>
              <Link 
                href="/academy/student/tasks"
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {t.academy?.viewAll || 'الكل'}
              </Link>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.academy?.noTasks || 'لا توجد مهام معلقة'}
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/academy/student/tasks/${task.id}`}
                    className="block p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{task.title}</p>
                      <span className="text-xs bg-orange-200 dark:bg-orange-800 px-2 py-0.5 rounded">
                        {formatDueDate(task.due_date)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{task.course_title}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                      <Star className="w-3 h-3" />
                      <span>{task.points_value} {t.academy?.points || 'نقطة'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
  color 
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
