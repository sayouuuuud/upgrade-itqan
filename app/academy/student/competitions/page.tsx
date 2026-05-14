'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Calendar, Users, Star, Clock, ChevronLeft, Loader2, Filter, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  status: string
  max_participants: number | null
  prizes_description: string | null
  is_featured: boolean
  participants_count: number
  has_joined: boolean
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  monthly: { label: 'مسابقة شهرية', icon: '📅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ramadan: { label: 'مسابقة رمضان', icon: '🌙', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  tajweed: { label: 'مسابقة التجويد', icon: '⭐', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  memorization: { label: 'مسابقة الحفظ', icon: '📖', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  weekly: { label: 'مسابقة أسبوعية', icon: '🗓️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  special: { label: 'مسابقة خاصة', icon: '🏆', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'قادمة', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { label: 'نشطة', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ended: { label: 'انتهت', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  cancelled: { label: 'ملغاة', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function StudentCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const fetchCompetitions = async () => {
    try {
      const res = await fetch('/api/academy/student/competitions')
      if (res.ok) {
        const json = await res.json()
        setCompetitions(json.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompetitions() }, [])

  const handleJoin = async (compId: string) => {
    setJoiningId(compId)
    try {
      const res = await fetch(`/api/academy/student/competitions/${compId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        fetchCompetitions()
      } else {
        const data = await res.json()
        alert(data.error || 'حدث خطأ')
      }
    } finally {
      setJoiningId(null)
    }
  }

  const filtered = competitions.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    return true
  })

  const activeCount = competitions.filter(c => c.status === 'active').length
  const myJoinedCount = competitions.filter(c => c.has_joined).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-600" />
            المسابقات
          </h1>
          <p className="text-muted-foreground mt-1">شارك في المسابقات واكسب الشارات والنقاط</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card p-3 rounded-xl shadow-sm border border-border flex items-center gap-3 min-w-[100px]">
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 p-2 rounded-xl">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">نشطة</span>
              <span className="font-bold text-foreground">{activeCount}</span>
            </div>
          </div>
          <div className="bg-card p-3 rounded-xl shadow-sm border border-border flex items-center gap-3 min-w-[100px]">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 p-2 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">مشاركاتي</span>
              <span className="font-bold text-foreground">{myJoinedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'upcoming', 'ended'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f === 'all' ? 'الكل' : f === 'active' ? 'نشطة' : f === 'upcoming' ? 'قادمة' : 'منتهية'}
          </button>
        ))}
        <div className="mr-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-muted border border-border"
          >
            <option value="all">كل الأنواع</option>
            <option value="monthly">شهرية</option>
            <option value="ramadan">رمضان</option>
            <option value="tajweed">تجويد</option>
            <option value="memorization">حفظ</option>
            <option value="weekly">أسبوعية</option>
            <option value="special">خاصة</option>
          </select>
        </div>
      </div>

      {/* Competition Cards */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Trophy className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-2">لا توجد مسابقات حالياً</p>
          <p className="text-sm text-muted-foreground">ترقب المسابقات القادمة!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(comp => {
            const typeConf = TYPE_CONFIG[comp.type] || TYPE_CONFIG.special
            const statusConf = STATUS_CONFIG[comp.status] || STATUS_CONFIG.upcoming
            const startDate = new Date(comp.start_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
            const endDate = new Date(comp.end_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

            return (
              <div key={comp.id} className={cn(
                "bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all",
                comp.is_featured && "ring-2 ring-amber-400 dark:ring-amber-600"
              )}>
                {comp.is_featured && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    مسابقة مميزة
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeConf.color)}>
                        {typeConf.icon} {typeConf.label}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusConf.cls)}>
                        {statusConf.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{comp.title}</h3>
                  </div>
                </div>

                {comp.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{comp.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {startDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    حتى {endDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {comp.participants_count} مشارك
                    {comp.max_participants && ` / ${comp.max_participants}`}
                  </span>
                </div>

                {comp.prizes_description && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      🏅 الجوائز: {comp.prizes_description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {comp.has_joined ? (
                    <Link
                      href={`/academy/student/competitions/${comp.id}`}
                      className="flex-1 text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors text-sm"
                    >
                      <Mic className="w-4 h-4 inline-block ml-1" />
                      عرض وتقديم المشاركة
                    </Link>
                  ) : comp.status === 'active' ? (
                    <button
                      onClick={() => handleJoin(comp.id)}
                      disabled={joiningId === comp.id}
                      className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
                    >
                      {joiningId === comp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin inline-block ml-1" />
                      ) : (
                        <Trophy className="w-4 h-4 inline-block ml-1" />
                      )}
                      سجّل الآن
                    </button>
                  ) : (
                    <Link
                      href={`/academy/student/competitions/${comp.id}`}
                      className="flex-1 text-center px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition-colors text-sm"
                    >
                      عرض التفاصيل
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
