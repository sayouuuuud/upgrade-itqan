"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { Award, Lock, Star, CheckCircle2, Trophy, Flame, BookOpen, Target } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon?: string | null
  icon_url?: string
  points_required?: number
  criteria_type: string
  criteria_value?: number
  earned_at?: string
  is_earned: boolean
}

interface BadgeCategory {
  name: string
  badges: Badge[]
}

export default function BadgesPage() {
  const { t } = useI18n()
  const [categories, setCategories] = useState<BadgeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch('/api/academy/student/badges')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [])

  const getBadgeIcon = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points': return Star
      case 'streak': return Flame
      case 'courses': return BookOpen
      case 'tasks': return Target
      case 'memorization': return BookOpen
      default: return Award
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const totalBadges = categories.reduce((sum, cat) => sum + cat.badges.length, 0)
  const earnedBadges = categories.reduce((sum, cat) => sum + cat.badges.filter(b => b.is_earned).length, 0)

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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-7 h-7 text-yellow-500" />
          {t.academy?.badges || 'الشارات'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.academy?.badgesDesc || 'اجمع الشارات وأظهر إنجازاتك'}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-l from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-yellow-100 text-sm">{t.academy?.badgesEarned || 'الشارات المكتسبة'}</p>
            <p className="text-4xl font-bold">{earnedBadges} / {totalBadges}</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${totalBadges ? (earnedBadges / totalBadges) * 100 : 0}%` }}
          />
        </div>
        <p className="text-sm text-yellow-100 mt-2">
          {Math.round((earnedBadges / totalBadges) * 100) || 0}% {t.academy?.completed || 'مكتمل'}
        </p>
      </div>

      {/* Badge Categories */}
      {categories.map((category) => (
        <div key={category.name} className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {category.name}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {category.badges.map((badge) => {
              const BadgeIcon = getBadgeIcon(badge.criteria_type)
              
              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    badge.is_earned
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:shadow-lg"
                      : "border-border bg-muted/30 opacity-60 hover:opacity-80"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                    badge.is_earned
                      ? "bg-yellow-200 dark:bg-yellow-800"
                      : "bg-muted"
                  )}>
                    {badge.is_earned ? (
                      badge.icon_url || badge.icon?.startsWith('http') ? (
                        <img src={badge.icon_url || badge.icon || ''} alt={badge.name} className="w-10 h-10" />
                      ) : badge.icon ? (
                        <span className="text-3xl">{badge.icon}</span>
                      ) : (
                        <BadgeIcon className="w-8 h-8 text-yellow-600" />
                      )
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{badge.name}</p>
                  {badge.is_earned && (
                    <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.academy?.earned || 'مكتسبة'}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSelectedBadge(null)} 
          />
          <div className="relative bg-card rounded-xl border border-border p-6 w-full max-w-sm text-center">
            <div className={cn(
              "w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center",
              selectedBadge.is_earned
                ? "bg-yellow-200 dark:bg-yellow-800"
                : "bg-muted"
            )}>
              {selectedBadge.is_earned ? (
                selectedBadge.icon_url || selectedBadge.icon?.startsWith('http') ? (
                  <img src={selectedBadge.icon_url || selectedBadge.icon || ''} alt={selectedBadge.name} className="w-14 h-14" />
                ) : selectedBadge.icon ? (
                  <span className="text-4xl">{selectedBadge.icon}</span>
                ) : (
                  <Award className="w-12 h-12 text-yellow-600" />
                )
              ) : (
                <Lock className="w-10 h-10 text-muted-foreground" />
              )}
            </div>

            <h2 className="text-xl font-bold mb-2">{selectedBadge.name}</h2>
            <p className="text-muted-foreground mb-4">{selectedBadge.description}</p>

            {selectedBadge.is_earned ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                <p className="text-green-600 text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.academy?.earnedOn || 'تم الحصول عليها في'} {formatDate(selectedBadge.earned_at!)}
                </p>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedBadge.points_required && (
                    <>
                      {t.academy?.requires || 'يتطلب'} {selectedBadge.points_required} {t.academy?.points || 'نقطة'}
                    </>
                  )}
                  {selectedBadge.criteria_value && !selectedBadge.points_required && (
                    <>
                      {t.academy?.requires || 'يتطلب'} {selectedBadge.criteria_value} {selectedBadge.criteria_type}
                    </>
                  )}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              {t.close || 'إغلاق'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
