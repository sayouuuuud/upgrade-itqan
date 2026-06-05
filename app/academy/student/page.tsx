"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  BookOpen, Clock, Target, Trophy, Award, Calendar,
  PlayCircle, ChevronLeft, Flame, Star, TrendingUp,
  CheckCircle2, GraduationCap, Activity as ActivityIcon,
  Video, Sparkles, ArrowUpRight, Medal,
} from 'lucide-react'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
  hafiz: 'حافظ',
  master: 'متقن',
}

interface LevelProgress {
  level: string
  next: string | null
  current_floor: number
  next_floor: number | null
  percent: number
}

interface StudentStats {
  enrolled_courses: number
  completed_courses: number
  pending_tasks: number
  total_points: number
  current_level: string
  streak_days: number
  longest_streak: number
  upcoming_sessions: number
  badges_earned: number
  level_progress?: LevelProgress
  avg_grade?: number | null
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

interface ActivityEntry {
  id: string
  points: number
  reason: string
  description: string | null
  created_at: string
}

const REASON_LABELS: Record<string, string> = {
  recitation: 'سجّلت تلاوة',
  mastered: 'أتقنت حفظاً',
  task: 'أنجزت مهمة',
  lesson: 'أكملت درساً',
  streak: 'مكافأة المثابرة',
  juz_complete: 'أتممت جزءاً',
  course_complete: 'أكملت دورة',
  session_attend: 'حضرت جلسة',
  daily_login: 'دخول يومي',
  competition_win: 'فزت في مسابقة',
  badge_earned: 'حصلت على شارة',
}

export default function AcademyStudentDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllSessions, setShowAllSessions] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, coursesRes, sessionsRes, tasksRes, pointsRes] = await Promise.all([
          fetch('/api/academy/student/stats'),
          fetch('/api/academy/student/courses?limit=3'),
          fetch('/api/academy/student/sessions?limit=20&upcoming=true'),
          fetch('/api/academy/student/tasks?limit=4&pending=true'),
          fetch('/api/academy/student/points'),
        ])

        if (statsRes.ok) setStats(await statsRes.json())
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
        if (pointsRes.ok) {
          const data = await pointsRes.json()
          setActivity(data.data?.log || [])
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
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  const formatRelative = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} د`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `منذ ${hrs} س`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `منذ ${days} يوم`
    return new Intl.DateTimeFormat('ar-EG', { month: 'short', day: 'numeric' }).format(date)
  }

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return 'متأخر'
    if (days === 0) return 'اليوم'
    if (days === 1) return 'غداً'
    return `${days} أيام`
  }

  // Next upcoming session highlighted separately
  const nextSession = sessions[0]
  const sessionStartsSoon = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    return diff <= 15 * 60000 && diff > -60 * 60000
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const lp = stats?.level_progress
  const levelLabel = LEVEL_LABELS[lp?.level || stats?.current_level || 'beginner'] || 'مبتدئ'
  const nextLevelLabel = lp?.next ? LEVEL_LABELS[lp.next] : null
  const pointsToNext = lp?.next_floor != null ? Math.max(0, lp.next_floor - (stats?.total_points || 0)) : 0

  return (
    <div className="space-y-6">
      {/* Welcome + Level Hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
          <h1 className="text-2xl font-bold mb-1 text-balance">
            {t.academy?.welcomeBack || 'مرحباً بعودتك!'}
          </h1>
          <p className="text-white/80 mb-5 text-sm leading-relaxed">
            {t.academy?.continueJourney || 'واصل رحلتك التعليمية واكسب المزيد من النقاط'}
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-bold text-lg">{stats?.streak_days || 0}</span>
              <span className="text-white/70 text-sm">يوم متتالي</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-lg">{stats?.total_points || 0}</span>
              <span className="text-white/70 text-sm">نقطة</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-200" />
              <span className="font-bold text-lg">{stats?.badges_earned || 0}</span>
              <span className="text-white/70 text-sm">شارة</span>
            </div>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مستواك الحالي</p>
                <p className="font-bold text-lg">{levelLabel}</p>
              </div>
            </div>
            <Link href="/academy/student/points" className="text-muted-foreground hover:text-foreground">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${lp?.percent ?? 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {nextLevelLabel
                ? `باقي ${pointsToNext} نقطة للوصول إلى «${nextLevelLabel}»`
                : 'وصلت إلى أعلى مستوى!'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={BookOpen} label="دوراتي" value={stats?.enrolled_courses || 0} tone="sky" />
        <StatCard icon={CheckCircle2} label="دورات مكتملة" value={stats?.completed_courses || 0} tone="emerald" />
        <StatCard icon={Clock} label="مهام معلّقة" value={stats?.pending_tasks || 0} highlight={Boolean(stats?.pending_tasks)} />
        <StatCard icon={Calendar} label="جلسات قادمة" value={stats?.upcoming_sessions || 0} tone="violet" />
        <StatCard icon={Award} label="الشارات" value={stats?.badges_earned || 0} tone="rose" />
        <StatCard
          icon={GraduationCap}
          label="متوسط الدرجات"
          value={stats?.avg_grade != null ? `${stats.avg_grade}%` : '—'}
          tone="teal"
        />
      </div>

      {/* Next Session Highlight */}
      {nextSession && (
        <Link
          href={`/academy/student/sessions/${nextSession.id}`}
          className="block bg-gradient-to-l from-violet-500/10 to-transparent rounded-2xl border border-violet-500/20 p-5 hover:border-violet-500/50 transition-colors group"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">جلستك القادمة</p>
                {sessionStartsSoon(nextSession.scheduled_at) && (
                  <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    تبدأ قريباً
                  </span>
                )}
              </div>
              <p className="font-bold truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{nextSession.title}</p>
              <p className="text-sm text-muted-foreground truncate">{nextSession.course_title}</p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-sm font-medium">{formatDate(nextSession.scheduled_at)}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-violet-600 dark:text-violet-400 font-bold">
                <PlayCircle className="w-4 h-4" /> انضمام
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" /> دوراتي
              </h2>
              <Link href="/academy/student/courses" className="text-sm text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                عرض الكل <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لم تسجل في أي دورة بعد</p>
                <Link
                  href="/academy/student/courses/browse"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  تصفح الدورات
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/academy/student/courses/${course.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors group"
                  >
                    <div className="w-20 h-14 rounded-lg bg-sky-500/10 flex items-center justify-center overflow-hidden shrink-0">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{course.title}</h3>
                      {course.teacher_name && (
                        <p className="text-sm text-muted-foreground">{course.teacher_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all" style={{ width: `${course.progress_percent}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{course.progress_percent}%</span>
                      </div>
                    </div>
                    <PlayCircle className="w-7 h-7 text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
              <ActivityIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" /> آخر النشاطات
            </h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد نشاطات بعد</p>
            ) : (
              <div className="space-y-1">
                {activity.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.description || REASON_LABELS[entry.reason] || entry.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatRelative(entry.created_at)}</p>
                    </div>
                    <span className={cn(
                      'text-sm font-bold shrink-0',
                      entry.points >= 0 ? 'text-emerald-600' : 'text-destructive'
                    )}>
                      {entry.points >= 0 ? '+' : ''}{entry.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" /> الجلسات القادمة
              </h2>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد جلسات قادمة</p>
            ) : (
              <div className="space-y-2">
                {(showAllSessions ? sessions : sessions.slice(0, 4)).map((session) => (
                  <Link
                    key={session.id}
                    href={`/academy/student/sessions/${session.id}`}
                    className="block p-3 rounded-xl bg-muted/40 hover:bg-violet-500/10 transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{session.course_title}</p>
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">{formatDate(session.scheduled_at)}</p>
                  </Link>
                ))}
                {sessions.length > 4 && (
                  <button
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="w-full text-center text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 py-2 mt-2 border border-violet-500/20 rounded-lg hover:bg-violet-500/10 transition-colors"
                  >
                    {showAllSessions ? (t.academy?.showLess || 'عرض أقل') : (t.academy?.showMore || 'المزيد')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" /> المهام المعلّقة
              </h2>
              <Link href="/academy/student/tasks" className="text-xs text-rose-600 dark:text-rose-400 hover:underline">الكل</Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد مهام معلّقة</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const due = formatDueDate(task.due_date)
                  const late = due === 'متأخر'
                  return (
                    <Link
                      key={task.id}
                      href={`/academy/student/tasks/${task.id}`}
                      className="block p-3 rounded-xl bg-muted/40 hover:bg-rose-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded shrink-0',
                          late ? 'bg-destructive/15 text-destructive' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        )}>
                          {due}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{task.course_title}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3" /> <span>{task.points_value} نقطة</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Streak Card */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" /> سلسلة المثابرة
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">{stats?.streak_days || 0}</p>
                <p className="text-xs text-muted-foreground">يوم متتالي</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold flex items-center gap-1 justify-end">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {stats?.longest_streak || 0}
                </p>
                <p className="text-xs text-muted-foreground">أطول سلسلة</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => {
                const active = i < Math.min(7, stats?.streak_days || 0)
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 aspect-square rounded-lg flex items-center justify-center',
                      active ? 'bg-orange-500/15 text-orange-500' : 'bg-muted text-muted-foreground/40'
                    )}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STAT_TONES = {
  sky: { icon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', border: 'hover:border-sky-500/40' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', border: 'hover:border-emerald-500/40' },
  amber: { icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', border: 'hover:border-amber-500/40' },
  violet: { icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', border: 'hover:border-violet-500/40' },
  rose: { icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400', border: 'hover:border-rose-500/40' },
  teal: { icon: 'bg-teal-500/15 text-teal-600 dark:text-teal-400', border: 'hover:border-teal-500/40' },
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
  tone = 'sky',
}: {
  icon: React.ElementType
  label: string
  value: number | string
  highlight?: boolean
  tone?: keyof typeof STAT_TONES
}) {
  const t = STAT_TONES[tone]
  return (
    <div className={cn(
      'bg-card rounded-xl border p-4 transition-colors',
      highlight ? 'border-amber-500/50' : cn('border-border', t.border)
    )}>
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
        highlight ? 'bg-amber-500 text-white' : t.icon
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
