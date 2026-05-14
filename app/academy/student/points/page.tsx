'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Star, Flame, Trophy, TrendingUp, Zap, Award,
  BookOpen, CheckCircle, Mic, Target
} from 'lucide-react'
import Link from 'next/link'

interface PointsData {
  total_points: number
  level: string
  level_label: string
  streak_days: number
  longest_streak: number
  streak_multiplier_active: boolean
  next_level: { key: string; label: string; min: number } | null
  points_to_next_level: number
  total_verses_memorized: number
  total_verses_revised: number
  points_config: Record<string, number>
  levels: Array<{ key: string; min: number; label: string }>
  log: Array<{
    id: string
    points: number
    reason: string
    description: string | null
    created_at: string
  }>
  badges: Array<{
    badge_key: string
    badge_name: string
    badge_description: string
    badge_icon: string
    badge_image_url: string | null
    badge_color: string
    points_awarded: number
    awarded_at: string
  }>
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
  intermediate: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-600' },
  advanced: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-600' },
  hafiz: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-600' },
}

const REASON_ICONS: Record<string, React.ElementType> = {
  recitation: Mic,
  mastered: Trophy,
  task: CheckCircle,
  session_attend: BookOpen,
  streak: Flame,
  juz_complete: Target,
  badge_earned: Award,
}

const REASON_LABELS: Record<string, string> = {
  recitation: 'تسجيل تلاوة',
  mastered: 'إتقان تلاوة',
  task: 'إنهاء مهمة',
  lesson: 'درس',
  streak: 'يوم Streak',
  juz_complete: 'إنهاء جزء كامل',
  course_complete: 'إنهاء دورة',
  session_attend: 'حضور درس',
  daily_login: 'تسجيل دخول يومي',
  competition_win: 'فوز بمسابقة',
  badge_earned: 'شارة جديدة',
  admin_adjust: 'تعديل من الإدارة',
}

export default function StudentPointsPage() {
  const [data, setData] = useState<PointsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPoints() {
      try {
        const res = await fetch('/api/academy/student/points')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch points:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPoints()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>لا توجد بيانات نقاط بعد</p>
        <p className="text-sm mt-2">ابدأ بتسجيل تلاوة أو حفظ آيات لكسب النقاط!</p>
      </div>
    )
  }

  const levelColors = LEVEL_COLORS[data.level] || LEVEL_COLORS.beginner

  // Calculate progress to next level
  const currentLevelIdx = data.levels.findIndex(l => l.key === data.level)
  const currentLevelMin = data.levels[currentLevelIdx]?.min ?? 0
  const nextLevelMin = data.next_level?.min ?? data.total_points
  const progressRange = nextLevelMin - currentLevelMin
  const progressValue = data.total_points - currentLevelMin
  const progressPct = progressRange > 0 ? Math.min(Math.round((progressValue / progressRange) * 100), 100) : 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-7 h-7 text-amber-500" />
          نقاطي
        </h1>
        <Link
          href="/academy/student/leaderboard"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <Trophy className="w-4 h-4" />
          لوحة المتصدرين
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Points */}
        <Card className={`${levelColors.bg} ${levelColors.border} border-2`}>
          <CardContent className="pt-6 text-center">
            <Star className="w-10 h-10 mx-auto mb-2 text-amber-500" />
            <p className="text-4xl font-bold text-amber-600">{data.total_points.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">نقطة</p>
          </CardContent>
        </Card>

        {/* Level */}
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-blue-500" />
            <p className={`text-2xl font-bold ${levelColors.text}`}>{data.level_label}</p>
            <p className="text-sm text-muted-foreground mt-1">المستوى الحالي</p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className={data.streak_multiplier_active ? 'ring-2 ring-orange-400' : ''}>
          <CardContent className="pt-6 text-center">
            <Flame className={`w-10 h-10 mx-auto mb-2 ${data.streak_multiplier_active ? 'text-orange-500' : 'text-gray-400'}`} />
            <p className="text-4xl font-bold text-orange-600">{data.streak_days}</p>
            <p className="text-sm text-muted-foreground mt-1">
              يوم متواصل
              {data.streak_multiplier_active && (
                <span className="block text-orange-600 font-medium mt-1">
                  نقاط مضاعفة ×1.5
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      {data.next_level && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{data.level_label}</span>
              <span className="text-sm font-medium">{data.next_level.label}</span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {data.points_to_next_level.toLocaleString()} نقطة للمستوى التالي
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-amber-500" />
              كيف تكسب النقاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.points_config).map(([key, val]) => {
                const Icon = REASON_ICONS[key] || Star
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{REASON_LABELS[key] || key}</span>
                    </div>
                    <span className="font-bold text-amber-600">+{val}</span>
                  </div>
                )
              })}
            </div>
            {data.streak_multiplier_active && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                  <Flame className="w-4 h-4 inline ml-1" />
                  نقاطك مضاعفة ×1.5 لأن عندك Streak أكثر من 7 أيام!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-purple-500" />
              الشارات ({data.badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.badges.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">لم تحصل على شارات بعد — اجمع نقاط أكثر!</p>
                <Link href="/academy/student/badges" className="text-sm text-blue-600 hover:underline">
                  تصفح كل الشارات المتاحة
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {data.badges.map(b => (
                  <div key={b.badge_key} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: b.badge_color + '15' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: b.badge_color + '30' }}>
                      {b.badge_image_url ? (
                        <img src={b.badge_image_url} alt={b.badge_name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span>{b.badge_icon || '🏆'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{b.badge_name}</p>
                      <p className="text-xs text-muted-foreground">{b.badge_description}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600">+{b.points_awarded}</span>
                  </div>
                ))}
                <Link href="/academy/student/badges" className="block text-center text-sm text-blue-600 hover:underline mt-3">
                  عرض كل الشارات
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            سجل النقاط الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.log.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد نشاطات بعد</p>
          ) : (
            <div className="space-y-2">
              {data.log.map((entry) => {
                const Icon = REASON_ICONS[entry.reason] || Star
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {REASON_LABELS[entry.reason] || entry.reason}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-green-600">+{entry.points}</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{data.total_verses_memorized}</p>
            <p className="text-xs text-muted-foreground">آيات محفوظة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{data.total_verses_revised}</p>
            <p className="text-xs text-muted-foreground">آيات مراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{data.longest_streak}</p>
            <p className="text-xs text-muted-foreground">أطول Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{data.badges.length}</p>
            <p className="text-xs text-muted-foreground">شارات</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
