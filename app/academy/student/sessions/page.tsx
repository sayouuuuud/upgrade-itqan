"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  Video, Calendar, Clock, Users, PlayCircle,
  CheckCircle2, ExternalLink, BookOpen, Search,
  ArrowUpRight, History
} from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

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

type Filter = 'upcoming' | 'live' | 'completed' | 'all'

function SessionCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-muted shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-muted shrink-0" />
      </div>
    </div>
  )
}

export default function StudentSessionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchSessions() {
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
    }
    fetchSessions()
  }, [])

  const now = new Date()

  const isLive = (session: Session) => {
    const sessionDate = new Date(session.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
    return session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now && session.status !== 'completed')
  }

  const matchesSearch = (s: Session) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      s.title?.toLowerCase().includes(q) ||
      s.course_title?.toLowerCase().includes(q) ||
      s.teacher_name?.toLowerCase().includes(q)
    )
  }

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
  }, [sessions, filter, search])

  const liveCount = sessions.filter(isLive).length
  const upcomingCount = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now && !isLive(s)).length
  const completedCount = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + s.duration_minutes * 60000)
    return s.status === 'completed' || sessionEnd < now
  }).length

  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled:   { label: t.academy?.scheduled  || (isAr ? 'مجدولة'      : 'Scheduled'),  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    in_progress: { label: t.academy?.live       || (isAr ? 'مباشر الآن' : 'Live now'),    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    completed:   { label: t.academy?.completed  || (isAr ? 'منتهية'      : 'Completed'),  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    cancelled:   { label: t.academy?.cancelled  || (isAr ? 'ملغاة'        : 'Cancelled'),  color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  }

  const fmtDate = (d: Date) => new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: !isAr }).format(d)

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = date.getTime() - now.getTime()
    if (diff < 0) return null
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return isAr ? `بعد ${minutes} دقيقة` : `in ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return isAr ? `بعد ${hours} ساعة` : `in ${hours} hr`
    const days = Math.floor(hours / 24)
    return isAr ? `بعد ${days} يوم` : `in ${days} days`
  }

  // Group filtered sessions by date for upcoming/completed views.
  const groupedSessions = useMemo(() => {
    if (filter === 'live') return null
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.academy?.liveSessions || (isAr ? 'الجلسات الحية' : 'Live Sessions')}</h1>
          <p className="text-muted-foreground mt-1">
            {t.academy?.sessionsDesc || (isAr ? 'احضر جلسات دوراتك المباشرة وراجع التسجيلات.' : 'Attend your live class sessions and review recordings.')}
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث بعنوان الجلسة، الدورة، أو المدرس...' : 'Search by session, course, or teacher...'}
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Live Alert */}
      {liveCount > 0 && filter !== 'live' && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-red-700 dark:text-red-300">
                {liveCount} {t.academy?.sessionsLiveNow || (isAr ? 'جلسة مباشرة الآن' : 'live sessions right now')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {t.academy?.joinNow || (isAr ? 'انضم الآن قبل فوات الفرصة' : 'Join now before it ends')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilter('live')}
            className="self-start sm:self-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700"
          >
            {isAr ? 'عرض الجلسات المباشرة' : 'View live sessions'}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border">
        {([
          { id: 'upcoming'  as Filter, label: t.academy?.upcoming  || (isAr ? 'القادمة' : 'Upcoming'),  count: upcomingCount,  icon: Calendar,    activeCls: 'bg-blue-600 text-white' },
          { id: 'live'      as Filter, label: t.academy?.live      || (isAr ? 'مباشر' : 'Live'),        count: liveCount,      icon: Video,       activeCls: 'bg-red-600 text-white' },
          { id: 'completed' as Filter, label: t.academy?.completed || (isAr ? 'منتهية' : 'Completed'), count: completedCount, icon: CheckCircle2, activeCls: 'bg-green-600 text-white' },
          { id: 'all'       as Filter, label: isAr ? 'الكل' : 'All',                                      count: sessions.length, icon: History,    activeCls: 'bg-foreground text-background' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              filter === tab.id ? tab.activeCls : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={cn('px-1.5 py-0.5 rounded text-[11px] tabular-nums', filter === tab.id ? 'bg-white/20' : 'bg-muted text-foreground')}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-4">
          {[0,1,2].map(i => <SessionCardSkeleton key={i} />)}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {search ? (isAr ? 'لا توجد نتائج' : 'No results') : (t.academy?.noSessions || (isAr ? 'لا توجد جلسات' : 'No sessions'))}
          </h3>
          <p className="text-muted-foreground text-sm">
            {search
              ? (isAr ? `لم نعثر على جلسات تطابق "${search}".` : `No sessions matched "${search}".`)
              : (
                filter === 'upcoming'  ? (t.academy?.noUpcomingSessions  || (isAr ? 'لا توجد جلسات قادمة في الوقت الحالي.' : 'No upcoming sessions right now.')) :
                filter === 'live'      ? (t.academy?.noLiveSessions      || (isAr ? 'لا توجد جلسات مباشرة الآن.' : 'No live sessions at the moment.')) :
                filter === 'completed' ? (t.academy?.noCompletedSessions || (isAr ? 'لم تحضر أي جلسات بعد.' : 'No completed sessions yet.')) :
                                          (isAr ? 'لا توجد جلسات مسجّلة.' : 'No sessions recorded.')
              )
            }
          </p>
        </div>
      ) : groupedSessions && filter !== 'live' ? (
        <div className="space-y-6">
          {groupedSessions.map(([key, items]) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {fmtDate(new Date(items[0].scheduled_at))}
                <span className="text-xs font-normal">— {items.length} {isAr ? 'جلسة' : 'session(s)'}</span>
              </div>
              <div className="space-y-3">
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
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => (
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
      )}
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
    (isAr ? 'رابط خارجي' : 'External link')

  return (
    <div
      className={cn(
        'group bg-card rounded-2xl border p-5 transition-all hover:shadow-lg',
        isLive ? 'border-red-500/70 ring-1 ring-red-500/30 shadow-md shadow-red-500/10' : 'border-border hover:border-blue-500/40'
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Icon */}
        <div className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center shrink-0 self-start',
          isLive ? 'bg-red-100 text-red-600 dark:bg-red-900/30 animate-pulse'
                 : session.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                 : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
        )}>
          {session.status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> : <Video className="w-7 h-7" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/academy/student/sessions/${session.id}`}
              className="font-semibold text-lg hover:text-blue-600 truncate"
            >
              {session.title}
            </Link>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              isLive ? statusConfig.in_progress.color : statusConfig[session.status].color
            )}>
              {isLive ? statusConfig.in_progress.label : statusConfig[session.status].label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
            <BookOpen className="w-4 h-4" />
            <Link href={`/academy/student/courses/${session.course_id}`} className="hover:text-foreground hover:underline">
              {session.course_title}
            </Link>
            <span>•</span>
            <span>{session.teacher_name}</span>
          </div>

          {session.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {fmtTime(new Date(session.scheduled_at))}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {session.duration_minutes} {t.academy?.minutes || (isAr ? 'دقيقة' : 'min')}
            </span>
            {session.attendees_count !== undefined && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {session.attendees_count} {t.academy?.attendees || (isAr ? 'حاضر' : 'attending')}
              </span>
            )}
            {session.meeting_link && (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <ExternalLink className="w-4 h-4" />
                {platformLabel}
              </span>
            )}
          </div>

          {!isLive && timeUntil && session.status === 'scheduled' && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
              {timeUntil}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0 flex flex-col gap-2 md:items-end">
          {isLive ? (
            <Link
              href={`/academy/student/sessions/${session.id}/live`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md shadow-red-500/30"
            >
              <PlayCircle className="w-5 h-5" />
              {t.academy?.joinNow || (isAr ? 'انضم للبث المباشر' : 'Join live now')}
            </Link>
          ) : session.meeting_link && session.status === 'scheduled' ? (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Video className="w-5 h-5" />
              {isAr ? 'رابط الجلسة الخارجي' : 'External meeting link'}
            </a>
          ) : session.status === 'completed' && session.recording_url ? (
            <VideoPlayerModal url={session.recording_url} title={session.title}>
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <PlayCircle className="w-5 h-5" />
                {t.academy?.watchRecording || (isAr ? 'شاهد التسجيل' : 'Watch recording')}
              </button>
            </VideoPlayerModal>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg cursor-not-allowed"
            >
              <Clock className="w-5 h-5" />
              {isAr ? 'لم تبدأ بعد' : 'Not started'}
            </button>
          )}
          <Link
            href={`/academy/student/sessions/${session.id}`}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted"
          >
            {isAr ? 'تفاصيل الجلسة' : 'Session details'}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          {session.is_public && session.public_join_token && (
            <Link
              href={`/academy/public/session/${session.public_join_token}`}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isAr ? 'رابط عام للمشاركة' : 'Public share link'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
