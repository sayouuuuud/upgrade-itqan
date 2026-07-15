"use client"
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Calendar, Clock, Users, PlayCircle,
  CheckCircle2, ExternalLink, BookOpen, Search,
  ArrowUpRight, History, Library, Loader2, RefreshCcw
} from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Session {
  id: string
  title: string
  description?: string
  course_id: string
  course_title: string
  teacher_id: string
  teacher_name: string
  scheduled_at: string
  duration_minutes: number
  meeting_link?: string
  meeting_platform?: string
  is_public?: boolean
  public_join_token?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recording_url?: string
  attendees_count?: number
}

interface Recording {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  title: string | null
  started_at: string
  duration_seconds: number | null
  recording_url: string | null
  started_by_name: string | null
  participants_count: number
}

type Filter = 'upcoming' | 'live' | 'completed' | 'all' | 'recordings'

const KIND_LABEL: Record<string, string> = {
  halaqa: (t.addedTranslations_2026?.['حلقة إقراء'] || 'حلقة إقراء'),
  booking: (t.addedTranslations_2026?.['جلسة فردية'] || 'جلسة فردية'),
  course_session: (t.addedTranslations_2026?.['درس دورة'] || 'درس دورة'),
}

const KIND_LABEL_EN: Record<string, string> = {
  halaqa: 'Halaqa Recitation',
  booking: 'Individual Session',
  course_session: 'Course Lesson',
}

const KIND_COLORS: Record<string, string> = {
  halaqa: 'from-emerald-500/20 to-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  booking: 'from-blue-500/20 to-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  course_session: 'from-indigo-500/20 to-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
}

function fmtDuration(seconds: number | null, isAr: boolean) {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h > 0) return isAr ? `${h}س ${rem}د` : `${h}h ${rem}m`
  return isAr ? `${m}د` : `${m}m`
}

function SessionCardSkeleton() {
  return (
    <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-border/50 p-5 animate-pulse backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
      </div>
    </div>
  )
}

export default function StudentSessionsPage() {
  const { t } = useI18n()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [sessions, setSessions] = useState<Session[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [recordingsLoading, setRecordingsLoading] = useState(true)
  const [recordingsError, setRecordingsError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [search, setSearch] = useState('')

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/student/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const loadRecordings = useCallback(async () => {
    setRecordingsLoading(true)
    setRecordingsError(null)
    try {
      const res = await fetch('/api/video/recordings?scope=mine&platform=academy&limit=200')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || (isAr ? (t.addedTranslations_2026?.['فشل تحميل التسجيلات'] || 'فشل تحميل التسجيلات') : 'Failed to load recordings'))
      }
      const json = await res.json()
      setRecordings(json.data || [])
    } catch (e) {
      setRecordingsError(e instanceof Error ? e.message : (isAr ? (t.addedTranslations_2026?.['حدث خطأ غير متوقع أثناء الاتصال بالخادم'] || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم') : 'An unexpected error occurred while connecting to the server'))
    } finally {
      setRecordingsLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadRecordings()
  }, [loadRecordings])

  const now = new Date()

  const isLive = (session: Session) => {
    const sessionDate = new Date(session.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
    return session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now && session.status !== 'completed')
  }

  const matchesSearch = useCallback((s: Session | Recording) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    if ('course_title' in s) {
      // Session
      return (
        s.title?.toLowerCase().includes(q) ||
        s.course_title?.toLowerCase().includes(q) ||
        s.teacher_name?.toLowerCase().includes(q)
      )
    } else {
      // Recording
      return (
        s.title?.toLowerCase().includes(q) ||
        s.started_by_name?.toLowerCase().includes(q)
      )
    }
  }, [search])

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (!matchesSearch(s)) return false
      const sessionDate = new Date(s.scheduled_at)
      const sessionEnd = new Date(sessionDate.getTime() + s.duration_minutes * 60000)
      if (filter === 'live') return isLive(s)
      if (filter === 'upcoming') return s.status === 'scheduled' && sessionDate > now && !isLive(s)
      if (filter === 'completed') return s.status === 'completed' || sessionEnd < now
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, filter, search, matchesSearch])

  const filteredRecordings = useMemo(() => {
    return recordings.filter(r => matchesSearch(r))
  }, [recordings, matchesSearch])

  const liveCount = sessions.filter(isLive).length
  const upcomingCount = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now && !isLive(s)).length
  const completedCount = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + s.duration_minutes * 60000)
    return s.status === 'completed' || sessionEnd < now
  }).length

  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled:   { label: t.studentPages?.sessions?.scheduled || (isAr ? (t.addedTranslations_2026?.['مجدولة'] || 'مجدولة') : 'Scheduled'),  color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
    in_progress: { label: t.studentPages?.sessions?.liveNow || (isAr ? (t.addedTranslations_2026?.['مباشر الآن'] || 'مباشر الآن') : 'Live now'),    color: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20' },
    completed:   { label: t.studentPages?.sessions?.completed || (isAr ? (t.addedTranslations_2026?.['منتهية'] || 'منتهية') : 'Completed'),  color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
    cancelled:   { label: t.studentPages?.sessions?.cancelled || (isAr ? (t.addedTranslations_2026?.['ملغاة'] || 'ملغاة') : 'Cancelled'),  color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20' },
  }

  const fmtDate = (d: Date) => new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: !isAr }).format(d)
  
  const fmtDateShort = (s: string) => {
    try {
      return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(s))
    } catch {
      return s
    }
  }

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = date.getTime() - now.getTime()
    if (diff < 0) return null
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return (t.studentPages?.sessions?.afterMin || (isAr ? `بعد ${minutes} دقيقة` : `in ${minutes} min`)).replace('{minutes}', String(minutes))
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return (t.studentPages?.sessions?.afterHr || (isAr ? `بعد ${hours} ساعة` : `in ${hours} hr`)).replace('{hours}', String(hours))
    const days = Math.floor(hours / 24)
    return (t.studentPages?.sessions?.afterDay || (isAr ? `بعد ${days} يوم` : `in ${days} days`)).replace('{days}', String(days))
  }

  const groupedSessions = useMemo(() => {
    if (filter === 'live' || filter === 'recordings') return null
    const groups = new Map<string, Session[]>()
    const sorted = [...filteredSessions].sort((a, b) => {
      const av = new Date(a.scheduled_at).getTime()
      const bv = new Date(b.scheduled_at).getTime()
      return filter === 'completed' ? bv - av : av - bv
    })
    for (const s of sorted) {
      const d = new Date(s.scheduled_at)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    }
    return Array.from(groups.entries())
  }, [filteredSessions, filter])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative" dir={isAr ? "rtl" : "ltr"}>
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase backdrop-blur-sm w-fit">
            <Video className="w-4 h-4" />
            {t.studentPages?.sessions?.title || (isAr ? (t.addedTranslations_2026?.['الجلسات الحية والتسجيلات'] || 'الجلسات الحية والتسجيلات') : 'Live Sessions & Recordings')}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 py-1">
            {t.studentPages?.sessions?.title || (isAr ? (t.addedTranslations_2026?.['الجلسات والتسجيلات'] || 'الجلسات والتسجيلات') : 'Sessions & Recordings')}
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            {t.studentPages?.sessions?.desc || (isAr ? (t.addedTranslations_2026?.['احضر جلسات دوراتك المباشرة وراجع التسجيلات السابقة بكل سهولة.'] || 'احضر جلسات دوراتك المباشرة وراجع التسجيلات السابقة بكل سهولة.') : 'Attend your live class sessions and review recordings.')}
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.studentPages?.sessions?.searchPlaceholder || (isAr ? (t.addedTranslations_2026?.['ابحث بعنوان الجلسة، الدورة، أو المدرس...'] || 'ابحث بعنوان الجلسة، الدورة، أو المدرس...') : 'Search by session, course, or teacher...')}
            className="w-full ps-11 pe-4 py-3 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-slate-900/80"
          />
        </div>
      </motion.div>

      {/* Live Alert */}
      <AnimatePresence>
        {liveCount > 0 && filter !== 'live' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-500/5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40 shrink-0">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-red-700 dark:text-red-300 text-lg">
                    {liveCount} {t.studentPages?.sessions?.sessionsLiveNow || (isAr ? (t.addedTranslations_2026?.['جلسة مباشرة الآن'] || 'جلسة مباشرة الآن') : 'live sessions right now')}
                  </p>
                  <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80">
                    {t.studentPages?.sessions?.joinNowDesc || (isAr ? (t.addedTranslations_2026?.['انضم الآن قبل انتهاء البث المباشر'] || 'انضم الآن قبل انتهاء البث المباشر') : 'Join now before it ends')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilter('live')}
                className="self-start sm:self-center px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/20"
              >
                {t.studentPages?.sessions?.viewLiveSessions || (isAr ? (t.addedTranslations_2026?.['عرض الجلسات المباشرة'] || 'عرض الجلسات المباشرة') : 'View live sessions')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm w-fit max-w-full"
      >
        {([
          { id: 'upcoming'  as Filter, label: t.studentPages?.sessions?.upcoming || (isAr ? (t.addedTranslations_2026?.['القادمة'] || 'القادمة') : 'Upcoming'),  count: upcomingCount,  icon: Calendar },
          { id: 'live'      as Filter, label: t.studentPages?.sessions?.live || (isAr ? (t.addedTranslations_2026?.['مباشر'] || 'مباشر') : 'Live'),        count: liveCount,      icon: Video },
          { id: 'completed' as Filter, label: t.studentPages?.sessions?.completed || (isAr ? (t.addedTranslations_2026?.['منتهية'] || 'منتهية') : 'Completed'), count: completedCount, icon: CheckCircle2 },
          { id: 'all'       as Filter, label: t.studentPages?.sessions?.all || (isAr ? (t.addedTranslations_2026?.['الكل'] || 'الكل') : 'All'),                                      count: sessions.length, icon: History },
          { id: 'recordings' as Filter, label: t.studentPages?.sessions?.recordings || (isAr ? (t.addedTranslations_2026?.['مكتبة التسجيلات'] || 'مكتبة التسجيلات') : 'Recordings'),                  count: recordings.length, icon: Library },
        ]).map(tab => {
          const isSelected = filter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "relative shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden",
                isSelected ? "text-white shadow-md shadow-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {isSelected && (
                <motion.div 
                  layoutId="sessionFilterTab"
                  className={cn(
                    "absolute inset-0",
                    tab.id === 'live' ? "bg-gradient-to-r from-red-600 to-orange-600" :
                    tab.id === 'completed' ? "bg-gradient-to-r from-emerald-600 to-teal-600" :
                    tab.id === 'recordings' ? "bg-gradient-to-r from-teal-600 to-emerald-700" :
                    tab.id === 'all' ? "bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800" :
                    "bg-gradient-to-r from-blue-600 to-indigo-600"
                  )}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className={cn("w-4 h-4", isSelected && tab.id === 'live' && "animate-pulse")} />
                {tab.label}
                <span className={cn(
                  "flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] px-1.5 transition-colors",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {tab.count}
                </span>
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {filter === 'recordings' ? (
          <motion.div key="recordings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {recordingsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">{t.studentPages?.sessions?.loadingRecordings || (isAr ? (t.addedTranslations_2026?.['جاري جلب التسجيلات...'] || 'جاري جلب التسجيلات...') : 'Fetching recordings...')}</p>
              </div>
            ) : recordingsError ? (
              <div className="flex justify-center">
                <Card className="w-full max-w-md border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 shadow-lg shadow-red-500/5 backdrop-blur-xl">
                  <CardContent className="py-12 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <RefreshCcw className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">{t.studentPages?.sessions?.errorTitle || (isAr ? (t.addedTranslations_2026?.['عذراً، حدث خطأ'] || 'عذراً، حدث خطأ') : 'Sorry, an error occurred')}</h3>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 px-4">{recordingsError}</p>
                    </div>
                    <Button onClick={loadRecordings} variant="destructive" className="rounded-xl px-8 shadow-sm hover:shadow-md transition-all">
                      {t.studentPages?.sessions?.retry || (isAr ? (t.addedTranslations_2026?.['إعادة المحاولة'] || 'إعادة المحاولة') : 'Retry')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="flex justify-center">
                <Card className="w-full max-w-2xl border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/30">
                  <CardContent className="py-20 text-center space-y-5">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-ping opacity-20" />
                      <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
                        <Library className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{search ? (t.studentPages?.sessions?.noResults || (isAr ? (t.addedTranslations_2026?.['لا توجد نتائج'] || 'لا توجد نتائج') : 'No results')) : (t.studentPages?.sessions?.noRecordingsYet || (isAr ? (t.addedTranslations_2026?.['لا توجد تسجيلات حتى الآن'] || 'لا توجد تسجيلات حتى الآن') : 'No recordings yet'))}</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {search ? (t.studentPages?.sessions?.noRecordingsMatched || (isAr ? `لم نعثر على تسجيلات تطابق "${search}".` : `No recordings matched "${search}".`)).replace('{search}', search) : (t.studentPages?.sessions?.noRecordingsDesc || (isAr ? (t.addedTranslations_2026?.['لم يتم العثور على أي تسجيلات للجلسات التي حضرتها. بمجرد أن يقوم المعلم بمشاركة تسجيل جلسة سابقة، سيظهر هنا مباشرة.'] || 'لم يتم العثور على أي تسجيلات للجلسات التي حضرتها. بمجرد أن يقوم المعلم بمشاركة تسجيل جلسة سابقة، سيظهر هنا مباشرة.') : 'No recordings found for the sessions you attended. Once the teacher shares a recording, it will appear here.'))}
                      </p>
                    </div>
                    {!search && (
                      <Button onClick={loadRecordings} variant="outline" className="mt-4 rounded-xl border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        {t.studentPages?.sessions?.refreshPage || (isAr ? (t.addedTranslations_2026?.['تحديث الصفحة'] || 'تحديث الصفحة') : 'Refresh Page')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecordings.map((r) => (
                  <Card key={r.id} className="group h-full flex flex-col overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-border/50 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                    <CardContent className="p-6 flex flex-col h-full space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2 flex-1">
                          <Badge variant="secondary" className={cn("w-fit font-bold border bg-gradient-to-r", KIND_COLORS[r.kind] || KIND_COLORS.halaqa)}>
                            {t.studentPages?.sessions?.[r.kind] || (isAr ? KIND_LABEL[r.kind] : KIND_LABEL_EN[r.kind] || r.kind) || (isAr ? (t.addedTranslations_2026?.['جلسة'] || 'جلسة') : 'Session')}
                          </Badge>
                          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {r.title || t.studentPages?.sessions?.[r.kind] || (isAr ? KIND_LABEL[r.kind] : KIND_LABEL_EN[r.kind] || r.kind)}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate font-medium">{fmtDateShort(r.started_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-medium">{fmtDuration(r.duration_seconds, isAr)}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <Users className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium">{r.participants_count} {t.studentPages?.sessions?.participants || (isAr ? (t.addedTranslations_2026?.['مشارك حضر الجلسة'] || 'مشارك حضر الجلسة') : 'participants')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        {r.recording_url ? (
                          <div className="flex-1">
                            <VideoPlayerModal url={r.recording_url} title={r.title || t.studentPages?.sessions?.[r.kind] || (isAr ? KIND_LABEL[r.kind] : KIND_LABEL_EN[r.kind] || r.kind) || (isAr ? (t.addedTranslations_2026?.['جلسة'] || 'جلسة') : 'Session')}>
                              <button className="inline-flex items-center justify-center gap-2 px-5 py-2 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:scale-105 font-bold shadow-md shadow-emerald-500/20 transition-all text-sm">
                                <PlayCircle className="w-4 h-4" />
                                {t.studentPages?.sessions?.watchRecording || (isAr ? (t.addedTranslations_2026?.['شاهد التسجيل'] || 'شاهد التسجيل') : 'Watch')}
                              </button>
                            </VideoPlayerModal>
                          </div>
                        ) : (
                          <Button disabled className="flex-1 rounded-xl bg-muted text-muted-foreground" variant="secondary">
                            {t.studentPages?.sessions?.processing || (isAr ? (t.addedTranslations_2026?.['قيد المعالجة'] || 'قيد المعالجة') : 'Processing')}
                          </Button>
                        )}
                        
                        {r.kind === 'course_session' && (
                          <Button asChild variant="outline" className="shrink-0 rounded-xl px-4 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
                            <Link href={`/academy/student/sessions/${r.ref_id}`}>
                              {t.studentPages?.sessions?.details || (isAr ? (t.addedTranslations_2026?.['التفاصيل'] || 'التفاصيل') : 'Details')}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        ) : loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {[0,1,2].map(i => <SessionCardSkeleton key={i} />)}
          </motion.div>
        ) : filteredSessions.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white/60 dark:bg-slate-900/60 border border-border/50 rounded-3xl backdrop-blur-xl shadow-xl shadow-blue-900/5 min-h-[350px]"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Video className="w-10 h-10 text-slate-400 dark:text-slate-500/50" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">
              {search ? (t.studentPages?.sessions?.noResults || (isAr ? (t.addedTranslations_2026?.['لا توجد نتائج'] || 'لا توجد نتائج') : 'No results')) : (t.studentPages?.sessions?.noSessions || (isAr ? (t.addedTranslations_2026?.['لا توجد جلسات'] || 'لا توجد جلسات') : 'No sessions'))}
            </h3>
            <p className="text-muted-foreground font-medium max-w-sm mb-8 leading-relaxed">
              {search
                ? (t.studentPages?.sessions?.noSessionsMatched || (isAr ? `لم نعثر على جلسات تطابق "${search}".` : `No sessions matched "${search}".`)).replace('{search}', search)
                : (
                  filter === 'upcoming'  ? (t.studentPages?.sessions?.noUpcomingSessions || (isAr ? (t.addedTranslations_2026?.['لا توجد جلسات قادمة في الوقت الحالي. سيتم تنبيهك عند تحديد موعد.'] || 'لا توجد جلسات قادمة في الوقت الحالي. سيتم تنبيهك عند تحديد موعد.') : 'No upcoming sessions right now.')) :
                  filter === 'live'      ? (t.studentPages?.sessions?.noLiveSessions     || (isAr ? (t.addedTranslations_2026?.['لا توجد جلسات مباشرة الآن. راقب تبويب القادمة لمعرفة المواعيد.'] || 'لا توجد جلسات مباشرة الآن. راقب تبويب القادمة لمعرفة المواعيد.') : 'No live sessions at the moment.')) :
                  filter === 'completed' ? (t.studentPages?.sessions?.noCompletedSessions || (isAr ? (t.addedTranslations_2026?.['لم تنتهِ أي جلسات بعد للاطلاع على تسجيلاتها.'] || 'لم تنتهِ أي جلسات بعد للاطلاع على تسجيلاتها.') : 'No completed sessions yet.')) :
                                            (t.studentPages?.sessions?.noRecordedSessions || (isAr ? (t.addedTranslations_2026?.['لا توجد جلسات مسجّلة.'] || 'لا توجد جلسات مسجّلة.') : 'No sessions recorded.'))
                )
              }
            </p>
          </motion.div>
        ) : groupedSessions && filter !== 'live' ? (
          <motion.div key="grouped" className="space-y-8" initial="hidden" animate="show" variants={{
            show: { transition: { staggerChildren: 0.1 } }
          }}>
            {groupedSessions.map(([key, items]) => (
              <motion.div key={key} className="space-y-4" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <div className="flex items-center gap-3 text-sm font-black text-slate-500 dark:text-slate-400 px-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {fmtDate(new Date(items[0].scheduled_at))}
                  <div className="flex-1 h-px bg-border/50 ml-4" />
                </div>
                <div className="space-y-4">
                  {items.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isLive={isLive(session)}
                      isAr={isAr}
                      t={t}
                      statusConfig={statusConfig}
                      fmtTime={fmtTime}
                      timeUntil={getTimeUntil(session.scheduled_at)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-4" initial="hidden" animate="show" variants={{
            show: { transition: { staggerChildren: 0.05 } }
          }}>
            {filteredSessions.map(session => (
              <motion.div key={session.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <SessionCard
                  session={session}
                  isLive={isLive(session)}
                  isAr={isAr}
                  t={t}
                  statusConfig={statusConfig}
                  fmtTime={fmtTime}
                  timeUntil={getTimeUntil(session.scheduled_at)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SessionCardProps {
  session: Session
  isLive: boolean
  isAr: boolean
  t: any
  statusConfig: Record<string, { label: string; color: string }>
  fmtTime: (d: Date) => string
  timeUntil: string | null
}

function SessionCard({ session, isLive, isAr, t, statusConfig, fmtTime, timeUntil }: SessionCardProps) {
  const platformLabel =
    session.meeting_platform === 'google_meet' ? 'Google Meet' :
    session.meeting_platform === 'zoom' ? 'Zoom' :
    (t.studentPages?.sessions?.externalLink || (isAr ? (t.addedTranslations_2026?.['رابط خارجي'] || 'رابط خارجي') : 'External link'))

  return (
    <div
      className={cn(
        'group bg-white/80 dark:bg-slate-900/80 rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-xl',
        isLive ? 'border-red-500/50 shadow-lg shadow-red-500/10 hover:border-red-500' : 'border-border/50 hover:border-blue-500/40 hover:shadow-blue-500/5'
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        {/* Icon */}
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 self-start shadow-inner',
          isLive ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white animate-pulse shadow-red-500/30'
                 : session.status === 'completed' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400'
                 : 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400'
        )}>
          {session.status === 'completed' ? <CheckCircle2 className="w-8 h-8" /> : <Video className="w-8 h-8" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div>
              <Link
                href={`/academy/student/sessions/${session.id}`}
                className="font-black text-xl hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
              >
                {session.title}
              </Link>
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground mt-2 flex-wrap">
                <Link href={`/academy/student/courses/${session.course_id}`} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg hover:text-foreground transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  {session.course_title}
                </Link>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {session.teacher_name}
                </span>
              </div>
            </div>
            
            <div className={cn(
              'px-3 py-1.5 rounded-xl text-sm font-bold shrink-0 border',
              isLive ? statusConfig.in_progress.color : statusConfig[session.status].color
            )}>
              {isLive ? statusConfig.in_progress.label : statusConfig[session.status].label}
            </div>
          </div>

          {session.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{session.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground flex-wrap pt-2 border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 opacity-70" />
              {fmtTime(new Date(session.scheduled_at))}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 opacity-70" />
              {session.duration_minutes} {t.studentPages?.sessions?.minutes || (isAr ? (t.addedTranslations_2026?.['دقيقة'] || 'دقيقة') : 'min')}
            </span>
            {session.attendees_count !== undefined && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 opacity-70" />
                {session.attendees_count} {t.studentPages?.sessions?.attendees || (isAr ? (t.addedTranslations_2026?.['حاضر'] || 'حاضر') : 'attending')}
              </span>
            )}
            {session.meeting_link && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <ExternalLink className="w-3.5 h-3.5" />
                {platformLabel}
              </span>
            )}
          </div>

          {!isLive && timeUntil && session.status === 'scheduled' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold mt-1">
              <Calendar className="w-4 h-4" />
              {timeUntil}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0 flex flex-row md:flex-col gap-2 md:items-end flex-wrap">
          {isLive ? (
            <Link
              href={`/academy/student/sessions/${session.id}/live`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:scale-105 font-bold shadow-md shadow-red-500/30 transition-all flex-1 md:flex-none"
            >
              <PlayCircle className="w-5 h-5" />
              {t.studentPages?.sessions?.joinNow || (isAr ? (t.addedTranslations_2026?.['انضم للبث المباشر'] || 'انضم للبث المباشر') : 'Join live now')}
            </Link>
          ) : session.meeting_link && session.status === 'scheduled' ? (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all flex-1 md:flex-none"
            >
              <Video className="w-5 h-5" />
              {t.studentPages?.sessions?.externalLink || (isAr ? (t.addedTranslations_2026?.['رابط خارجي'] || 'رابط خارجي') : 'External link')}
            </a>
          ) : session.status === 'completed' && session.recording_url ? (
            <VideoPlayerModal url={session.recording_url} title={session.title}>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:scale-105 font-bold shadow-md shadow-emerald-500/20 transition-all flex-1 md:flex-none"
              >
                <PlayCircle className="w-5 h-5" />
                {t.studentPages?.sessions?.watchRecording || (isAr ? (t.addedTranslations_2026?.['شاهد التسجيل'] || 'شاهد التسجيل') : 'Watch recording')}
              </button>
            </VideoPlayerModal>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold cursor-not-allowed flex-1 md:flex-none"
            >
              <Clock className="w-5 h-5" />
              {t.studentPages?.sessions?.notStartedYet || (isAr ? (t.addedTranslations_2026?.['لم تبدأ بعد'] || 'لم تبدأ بعد') : 'Not started')}
            </button>
          )}
          <Link
            href={`/academy/student/sessions/${session.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-foreground border border-border/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 md:flex-none"
          >
            {t.studentPages?.sessions?.sessionDetails || (isAr ? (t.addedTranslations_2026?.['تفاصيل الجلسة'] || 'تفاصيل الجلسة') : 'Details')}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          {session.is_public && session.public_join_token && (
            <Link
              href={`/academy/public/session/${session.public_join_token}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex-1 md:flex-none mt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.studentPages?.sessions?.shareLink || (isAr ? (t.addedTranslations_2026?.['رابط المشاركة'] || 'رابط المشاركة') : 'Share link')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
