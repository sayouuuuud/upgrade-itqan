"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  Target, TrendingUp, BookOpen, CheckCircle2, Star,
  Flame, Award, Trophy, Calendar, Clock, BarChart3
} from 'lucide-react'

interface ProgressStats {
  total_points: number
  current_level: number
  points_to_next_level: number
  streak_days: number
  longest_streak: number
  courses_enrolled: number
  courses_completed: number
  tasks_completed: number
  total_tasks: number
  lessons_completed: number
  total_lessons: number
  memorized_ayahs: number
  attendance_rate: number
  badges_earned: number
  total_badges: number
}

interface WeeklyActivity {
  day: string
  points: number
  tasks: number
  lessons: number
}

interface Achievement {
  id: string
  title: string
  description: string
  earned_at?: string
  icon: string
}

export default function StudentProgressPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([])
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes, achievementsRes] = await Promise.all([
          fetch('/api/academy/student/progress'),
          fetch('/api/academy/student/progress/weekly'),
          fetch('/api/academy/student/progress/achievements?limit=5')
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
        if (activityRes.ok) {
          const data = await activityRes.json()
          setWeeklyActivity(data.data || [])
        }
        if (achievementsRes.ok) {
          const data = await achievementsRes.json()
          setRecentAchievements(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch progress data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getLevelProgress = () => {
    if (!stats) return 0
    const currentLevelPoints = (stats.current_level - 1) * 1000
    const nextLevelPoints = stats.current_level * 1000
    const progress = ((stats.total_points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    return Math.min(100, Math.max(0, progress))
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
      <div>
        <h1 className="text-2xl font-bold">{t.academy?.myProgress || 'تقدمي'}</h1>
        <p className="text-muted-foreground mt-1">
          {t.academy?.progressDesc || 'تتبع إنجازاتك وتطورك في الأكاديمية'}
        </p>
      </div>

      {/* Level Progress Card */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">{t.academy?.currentLevel || 'المستوى الحالي'}</p>
            <p className="text-4xl font-bold">{t.academy?.level || 'المستوى'} {stats?.current_level || 1}</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-300" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{stats?.total_points || 0} {t.academy?.points || 'نقطة'}</span>
            <span>{stats?.points_to_next_level || 1000} {t.academy?.toNextLevel || 'للمستوى التالي'}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${getLevelProgress()}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <span className="font-bold">{stats?.streak_days || 0}</span>
            <span className="text-blue-200 text-sm">{t.academy?.currentStreak || 'سلسلة حالية'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-300" />
            <span className="font-bold">{stats?.longest_streak || 0}</span>
            <span className="text-blue-200 text-sm">{t.academy?.longestStreak || 'أطول سلسلة'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={BookOpen}
          label={t.academy?.coursesProgress || 'الدورات'}
          value={`${stats?.courses_completed || 0}/${stats?.courses_enrolled || 0}`}
          color="blue"
        />
        <StatCard 
          icon={CheckCircle2}
          label={t.academy?.tasksProgress || 'المهام'}
          value={`${stats?.tasks_completed || 0}/${stats?.total_tasks || 0}`}
          color="green"
        />
        <StatCard 
          icon={Target}
          label={t.academy?.lessonsProgress || 'الدروس'}
          value={`${stats?.lessons_completed || 0}/${stats?.total_lessons || 0}`}
          color="purple"
        />
        <StatCard 
          icon={Award}
          label={t.academy?.badgesProgress || 'الشارات'}
          value={`${stats?.badges_earned || 0}/${stats?.total_badges || 0}`}
          color="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            {t.academy?.weeklyActivity || 'النشاط الأسبوعي'}
          </h2>
          
          {weeklyActivity.length > 0 ? (
            <div className="space-y-4">
              {/* Simple Bar Chart */}
              <div className="flex items-end gap-2 h-40">
                {weeklyActivity.map((day, index) => {
                  const maxPoints = Math.max(...weeklyActivity.map(d => d.points), 1)
                  const height = (day.points / maxPoints) * 100
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${day.points} ${t.academy?.points || 'نقطة'}`}
                      />
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  {t.academy?.points || 'النقاط'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.academy?.noActivityYet || 'لا يوجد نشاط هذا الأسبوع'}</p>
            </div>
          )}
        </div>

        {/* Recent Achievements */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            {t.academy?.recentAchievements || 'الإنجازات الأخيرة'}
          </h2>

          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t.academy?.noAchievementsYet || 'لم تحصل على إنجازات بعد'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.academy?.memorizedAyahs || 'الآيات المحفوظة'}</p>
              <p className="text-2xl font-bold">{stats?.memorized_ayahs || 0}</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, ((stats?.memorized_ayahs || 0) / 6236) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {((stats?.memorized_ayahs || 0) / 6236 * 100).toFixed(1)}% {t.academy?.ofQuran || 'من القرآن'}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.academy?.attendanceRate || 'نسبة الحضور'}</p>
              <p className="text-2xl font-bold">{stats?.attendance_rate || 0}%</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${stats?.attendance_rate || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.academy?.completionRate || 'معدل الإنجاز'}</p>
              <p className="text-2xl font-bold">
                {stats?.total_tasks ? Math.round((stats.tasks_completed / stats.total_tasks) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${stats?.total_tasks ? (stats.tasks_completed / stats.total_tasks) * 100 : 0}%` }}
            />
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
  value: string
  color: 'blue' | 'green' | 'purple' | 'yellow'
}) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
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
