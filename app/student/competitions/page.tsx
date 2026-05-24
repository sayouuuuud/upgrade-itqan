'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trophy, Calendar, Users, Star, Clock,
  Loader2, CheckCircle2, BookOpen, Mic, ChevronLeft
} from 'lucide-react'
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
  participants_count?: number
  has_joined: boolean
  min_verses?: number | null
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; gradient: string }> = {
  monthly:     { label: 'شهرية',    icon: '📅', gradient: 'from-blue-500 to-indigo-600' },
  ramadan:     { label: 'رمضان',    icon: '🌙', gradient: 'from-violet-500 to-purple-600' },
  tajweed:     { label: 'تجويد',    icon: '⭐', gradient: 'from-amber-500 to-orange-600' },
  memorization:{ label: 'حفظ',      icon: '📖', gradient: 'from-emerald-500 to-teal-600' },
  weekly:      { label: 'أسبوعية', icon: '🗓️', gradient: 'from-sky-500 to-cyan-600' },
  special:     { label: 'خاصة',     icon: '🏆', gradient: 'from-rose-500 to-pink-600' },
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  upcoming: { label: 'قادمة',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',  dot: 'bg-blue-400' },
  active:   { label: 'نشطة',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-400 animate-pulse' },
  ended:    { label: 'انتهت', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
}

export default function StudentLibraryCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'all' | 'active' | 'upcoming' | 'ended'>('all')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    try {
      const res = await fetch('/api/student/competitions')
      if (res.ok) {
        const json = await res.json()
        setCompetitions(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleJoin = async (compId: string) => {
    setJoiningId(compId)
    try {
      const res = await fetch(`/api/student/competitions/${compId}/join`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('تم التسجيل في المسابقة بنجاح! 🎉')
        load()
      } else {
        showToast(data.error || 'حدث خطأ', 'err')
      }
    } finally {
      setJoiningId(null)
    }
  }

  const filtered = competitions.filter(c => filter === 'all' || c.status === filter)

  const activeCount = competitions.filter(c => c.status === 'active').length
  const joinedCount = competitions.filter(c => c.has_joined).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">جاري تحميل المسابقات...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all',
          toast.type === 'ok'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        )}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-bold">
              <Trophy className="w-4 h-4" />
              مسابقات المقرأة
            </div>
            <h1 className="text-3xl font-black">شارك واكسب التميّز!</h1>
            <p className="text-sm text-white/80 max-w-md">سجّل في المسابقات وقدّم تلاوتك وانتظر التحكيم. الفائز يحصل على شهادة ونقاط مضاعفة.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="text-xs text-white/80 mt-1">مسابقة نشطة</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{joinedCount}</p>
              <p className="text-xs text-white/80 mt-1">مشاركاتي</p>
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
              'px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              filter === f
                ? 'bg-primary text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {f === 'all' ? `الكل (${competitions.length})` :
             f === 'active' ? `نشطة (${competitions.filter(c => c.status === 'active').length})` :
             f === 'upcoming' ? `قادمة (${competitions.filter(c => c.status === 'upcoming').length})` :
             `منتهية (${competitions.filter(c => c.status === 'ended').length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-16 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-lg font-bold text-muted-foreground">لا توجد مسابقات {filter !== 'all' ? 'بهذا الفلتر' : ''}</p>
          <p className="text-sm text-muted-foreground mt-1">ترقّب المسابقات القادمة من الإدارة!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(comp => {
            const typeConf = TYPE_CONFIG[comp.type] || TYPE_CONFIG.special
            const statusConf = STATUS_CONFIG[comp.status] || STATUS_CONFIG.upcoming
            const startDate = new Date(comp.start_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
            const endDate = new Date(comp.end_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

            return (
              <div key={comp.id} className={cn(
                'bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col',
                comp.is_featured && 'ring-2 ring-primary/50',
                comp.has_joined && 'ring-2 ring-emerald-400'
              )}>
                {/* Top color bar */}
                <div className={`h-2 bg-gradient-to-l ${typeConf.gradient}`} />

                <div className="p-6 flex-1 flex flex-col gap-4">
                  {/* Featured badge */}
                  {comp.is_featured && (
                    <div className="flex items-center gap-1.5 text-primary text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-primary" />
                      مسابقة مميزة
                    </div>
                  )}

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold', statusConf.cls)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusConf.dot)} />
                          {statusConf.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                          {typeConf.icon} {typeConf.label}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-foreground">{comp.title}</h2>
                    </div>
                    {comp.has_joined && (
                      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        مشترك
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {comp.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-6">{comp.description}</p>
                  )}

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                      <Calendar className="w-3.5 h-3.5" />
                      {startDate}
                    </span>
                    <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      حتى {endDate}
                    </span>
                    {comp.max_participants && (
                      <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                        <Users className="w-3.5 h-3.5" />
                        الحد: {comp.max_participants}
                      </span>
                    )}
                    {comp.min_verses ? (
                      <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                        <BookOpen className="w-3.5 h-3.5" />
                        {comp.min_verses} آية على الأقل
                      </span>
                    ) : null}
                  </div>

                  {/* Prizes */}
                  {comp.prizes_description && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        🏅 الجائزة: {comp.prizes_description}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-2 flex gap-2">
                    {comp.has_joined ? (
                      <Link
                        href={`/student/competitions/${comp.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                      >
                        <Mic className="w-4 h-4" />
                        عرض وتقديم مشاركتي
                      </Link>
                    ) : comp.status === 'active' ? (
                      <button
                        onClick={() => handleJoin(comp.id)}
                        disabled={joiningId === comp.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
                      >
                        {joiningId === comp.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trophy className="w-4 h-4" />}
                        سجّل في المسابقة
                      </button>
                    ) : (
                      <Link
                        href={`/student/competitions/${comp.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/70 text-foreground rounded-xl font-bold text-sm transition-colors"
                      >
                        عرض التفاصيل
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
