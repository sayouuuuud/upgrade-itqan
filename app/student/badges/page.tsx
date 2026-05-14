'use client'

import { useState, useEffect } from 'react'
import { Award, Lock, CheckCircle2, Trophy, Star, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Badge {
  id: string
  name: string
  description: string | null
  icon: string
  icon_url: string | null
  color: string
  points_awarded: number
  criteria_type: string
  criteria_value: number
  badge_key: string
  is_earned: boolean
  earned_at: string | null
}

interface BadgeCategory {
  name: string
  badges: Badge[]
}

const CRITERIA_LABELS: Record<string, string> = {
  recitation_count: 'عدد التلاوات',
  recitation_total: 'إجمالي التلاوات',
  streak_days: 'أيام Streak',
  juz_memorized: 'حفظ جزء',
  tajweed_path: 'مسار التجويد',
  ramadan: 'أيام رمضان',
  quran_complete: 'ختم القرآن',
  top_student: 'الأعلى نقاطاً',
  points_threshold: 'حد نقاط',
  manual: 'يُمنح يدوياً',
}

export default function BadgesPage() {
  const [categories, setCategories] = useState<BadgeCategory[]>([])
  const [total, setTotal] = useState(0)
  const [earnedCount, setEarnedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch('/api/student/badges')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
          setTotal(data.total || 0)
          setEarnedCount(data.earned_count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const progressPct = total > 0 ? Math.round((earnedCount / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-7 h-7 text-yellow-500" />
          الشارات والإنجازات
        </h1>
        <p className="text-muted-foreground mt-1">اجمع الشارات وأظهر إنجازاتك</p>
      </div>

      {/* Progress Banner */}
      <div className="bg-gradient-to-l from-yellow-500 to-amber-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-yellow-100 text-sm">الشارات المكتسبة</p>
            <p className="text-4xl font-bold">{earnedCount} / {total}</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-200" />
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-sm text-yellow-100 mt-2">{progressPct}% مكتمل</p>
      </div>

      {/* Badge Categories */}
      {categories.map((category) => (
        <Card key={category.name}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-yellow-500" />
              {category.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {category.badges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-4 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                    badge.is_earned
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-border bg-muted/30 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl ${
                      badge.is_earned
                        ? 'bg-yellow-200 dark:bg-yellow-800'
                        : 'bg-muted'
                    }`}
                    style={badge.is_earned && badge.color ? { backgroundColor: badge.color + '30' } : undefined}
                  >
                    {badge.is_earned ? (
                      badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span>{badge.icon || '🏆'}</span>
                      )
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{badge.name}</p>
                  <p className="text-xs text-amber-600 font-bold mt-1">+{badge.points_awarded} نقطة</p>
                  {badge.is_earned && (
                    <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      مكتسبة
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {categories.length === 0 && (
        <Card className="text-center py-12">
          <Award className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <p className="text-muted-foreground">لا توجد شارات متاحة حالياً</p>
        </Card>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBadge(null)} />
          <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm text-center shadow-xl">
            {/* Badge Icon */}
            <div
              className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl ${
                selectedBadge.is_earned
                  ? 'bg-yellow-200 dark:bg-yellow-800'
                  : 'bg-muted'
              }`}
              style={selectedBadge.is_earned && selectedBadge.color ? { backgroundColor: selectedBadge.color + '30' } : undefined}
            >
              {selectedBadge.is_earned ? (
                selectedBadge.icon_url ? (
                  <img src={selectedBadge.icon_url} alt={selectedBadge.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <span>{selectedBadge.icon || '🏆'}</span>
                )
              ) : (
                <Lock className="w-10 h-10 text-muted-foreground" />
              )}
            </div>

            {/* Badge Info */}
            <h2 className="text-xl font-bold mb-2">{selectedBadge.name}</h2>
            <p className="text-muted-foreground mb-3">{selectedBadge.description}</p>

            {/* Points */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-600">+{selectedBadge.points_awarded} نقطة</span>
            </div>

            {/* Status */}
            {selectedBadge.is_earned ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                <p className="text-green-600 text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  تم الحصول عليها في {new Date(selectedBadge.earned_at!).toLocaleDateString('ar-SA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  <Lock className="w-3 h-3 inline ml-1" />
                  {CRITERIA_LABELS[selectedBadge.criteria_type] || selectedBadge.criteria_type}
                  {selectedBadge.criteria_value > 0 && `: ${selectedBadge.criteria_value}`}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
