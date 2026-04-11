"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { Trophy, Medal, Star, Flame, Crown, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  avatar_url?: string
  total_points: number
  current_level: number
  streak_days: number
  is_current_user: boolean
}

export default function LeaderboardPage() {
  const { t } = useI18n()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly')

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/academy/leaderboard?period=${period}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data.data || [])
          setCurrentUserRank(data.current_user || null)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [period])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>
  }

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-l from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-300 dark:border-yellow-700'
    if (rank === 2) return 'bg-gradient-to-l from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-800/10 border-gray-300 dark:border-gray-700'
    if (rank === 3) return 'bg-gradient-to-l from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-300 dark:border-amber-700'
    return 'bg-card border-border'
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            {t.academy?.leaderboard || 'لوحة المتصدرين'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.academy?.leaderboardDesc || 'تنافس مع زملائك واكسب المراكز الأولى'}
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {p === 'weekly' && (t.academy?.weekly || 'أسبوعي')}
              {p === 'monthly' && (t.academy?.monthly || 'شهري')}
              {p === 'all_time' && (t.academy?.allTime || 'الكل')}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Position */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
            {t.academy?.yourPosition || 'ترتيبك الحالي'}
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {currentUserRank.rank}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{currentUserRank.user_name}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {currentUserRank.total_points} {t.academy?.points || 'نقطة'}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {currentUserRank.streak_days} {t.academy?.days || 'يوم'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-8">
          {/* Second Place */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden mb-2">
              {leaderboard[1].avatar_url ? (
                <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-500">{leaderboard[1].user_name[0]}</span>
              )}
            </div>
            <Medal className="w-8 h-8 mx-auto text-gray-400 mb-1" />
            <p className="font-semibold text-sm truncate max-w-[100px]">{leaderboard[1].user_name}</p>
            <p className="text-sm text-muted-foreground">{leaderboard[1].total_points}</p>
            <div className="h-16 w-20 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-2" />
          </div>

          {/* First Place */}
          <div className="text-center -mb-4">
            <Crown className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
            <div className="w-24 h-24 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 border-4 border-yellow-400 flex items-center justify-center overflow-hidden mb-2">
              {leaderboard[0].avatar_url ? (
                <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-yellow-600">{leaderboard[0].user_name[0]}</span>
              )}
            </div>
            <p className="font-bold truncate max-w-[120px]">{leaderboard[0].user_name}</p>
            <p className="text-sm text-yellow-600 font-semibold">{leaderboard[0].total_points}</p>
            <div className="h-24 w-24 bg-yellow-200 dark:bg-yellow-800/30 rounded-t-lg mt-2" />
          </div>

          {/* Third Place */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 border-4 border-amber-400 flex items-center justify-center overflow-hidden mb-2">
              {leaderboard[2].avatar_url ? (
                <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-amber-600">{leaderboard[2].user_name[0]}</span>
              )}
            </div>
            <Medal className="w-8 h-8 mx-auto text-amber-600 mb-1" />
            <p className="font-semibold text-sm truncate max-w-[100px]">{leaderboard[2].user_name}</p>
            <p className="text-sm text-muted-foreground">{leaderboard[2].total_points}</p>
            <div className="h-12 w-20 bg-amber-200 dark:bg-amber-800/30 rounded-t-lg mt-2" />
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold">{t.academy?.fullRankings || 'الترتيب الكامل'}</h2>
        </div>

        <div className="divide-y divide-border">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-4 p-4 transition-colors",
                entry.is_current_user && "bg-blue-50 dark:bg-blue-900/20",
                getRankBackground(entry.rank)
              )}
            >
              {/* Rank */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-blue-600">{entry.user_name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    entry.is_current_user && "text-blue-600"
                  )}>
                    {entry.user_name}
                    {entry.is_current_user && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mr-2">
                        {t.academy?.you || 'أنت'}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.academy?.level || 'المستوى'} {entry.current_level}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  {entry.streak_days}
                </span>
                <span className="flex items-center gap-1 font-bold text-yellow-600">
                  <Star className="w-4 h-4" />
                  {entry.total_points}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
