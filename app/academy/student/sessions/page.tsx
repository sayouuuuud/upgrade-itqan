"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  Video, Calendar, Clock, Users, PlayCircle,
  CheckCircle2, ExternalLink, BookOpen
} from 'lucide-react'

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
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recording_url?: string
  attendees_count?: number
}

export default function StudentSessionsPage() {
  const { t } = useI18n()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'live' | 'completed'>('upcoming')

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

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)

    if (filter === 'live') {
      return session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now)
    }
    if (filter === 'upcoming') {
      return session.status === 'scheduled' && sessionDate > now
    }
    if (filter === 'completed') {
      return session.status === 'completed' || sessionEnd < now
    }
    return true
  })

  const statusConfig = {
    scheduled: {
      label: t.academy?.scheduled || 'مجدولة',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    in_progress: {
      label: t.academy?.live || 'مباشر الآن',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    },
    completed: {
      label: t.academy?.completed || 'منتهية',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    },
    cancelled: {
      label: t.academy?.cancelled || 'ملغاة',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} ${t.academy?.days || 'يوم'}`
    }
    if (hours > 0) {
      return `${hours} ${t.academy?.hours || 'ساعة'} و ${minutes} ${t.academy?.minutes || 'دقيقة'}`
    }
    return `${minutes} ${t.academy?.minutes || 'دقيقة'}`
  }

  const isLive = (session: Session) => {
    const sessionDate = new Date(session.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
    return session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const liveCount = sessions.filter(s => isLive(s)).length
  const upcomingCount = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t.academy?.liveSessions || 'الجلسات الحية'}</h1>
        <p className="text-muted-foreground mt-1">
          {t.academy?.sessionsDesc || 'احضر الجلسات المباشرة مع المدرسين'}
        </p>
      </div>

      {/* Live Alert */}
      {liveCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                {liveCount} {t.academy?.sessionsLiveNow || 'جلسات مباشرة الآن'}
              </p>
              <p className="text-sm text-red-600 dark:text-red-500">
                {t.academy?.joinNow || 'انضم الآن لا تفوت الفرصة'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button
          onClick={() => setFilter('upcoming')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            filter === 'upcoming'
              ? "bg-blue-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Calendar className="w-4 h-4" />
          {t.academy?.upcoming || 'القادمة'}
          {upcomingCount > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{upcomingCount}</span>
          )}
        </button>
        <button
          onClick={() => setFilter('live')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            filter === 'live'
              ? "bg-red-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Video className="w-4 h-4" />
          {t.academy?.live || 'مباشر'}
          {liveCount > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs animate-pulse">{liveCount}</span>
          )}
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            filter === 'completed'
              ? "bg-green-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          {t.academy?.completed || 'منتهية'}
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {t.academy?.noSessions || 'لا توجد جلسات'}
          </h3>
          <p className="text-muted-foreground">
            {filter === 'upcoming' && (t.academy?.noUpcomingSessions || 'لا توجد جلسات قادمة')}
            {filter === 'live' && (t.academy?.noLiveSessions || 'لا توجد جلسات مباشرة حالياً')}
            {filter === 'completed' && (t.academy?.noCompletedSessions || 'لا توجد جلسات منتهية')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const sessionIsLive = isLive(session)
            const timeUntil = getTimeUntil(session.scheduled_at)

            return (
              <div
                key={session.id}
                className={cn(
                  "bg-card rounded-xl border p-5 transition-all",
                  sessionIsLive
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-border hover:border-blue-500/50"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                    sessionIsLive
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 animate-pulse"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                  )}>
                    <Video className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-lg">{session.title}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        sessionIsLive
                          ? statusConfig.in_progress.color
                          : statusConfig[session.status].color
                      )}>
                        {sessionIsLive ? statusConfig.in_progress.label : statusConfig[session.status].label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{session.course_title}</span>
                      <span>•</span>
                      <span>{session.teacher_name}</span>
                    </div>

                    {session.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.duration_minutes} {t.academy?.minutes || 'دقيقة'}
                      </span>
                      {session.attendees_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.attendees_count} {t.academy?.attendees || 'حاضر'}
                        </span>
                      )}
                    </div>

                    {/* Time Until */}
                    {!sessionIsLive && timeUntil && (
                      <p className="text-sm text-blue-600 mt-2">
                        {t.academy?.startsIn || 'تبدأ خلال'} {timeUntil}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {sessionIsLive && session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse"
                      >
                        <PlayCircle className="w-5 h-5" />
                        {t.academy?.joinNow || 'انضم الآن'}
                      </a>
                    )}
                    {session.status === 'completed' && session.recording_url && (
                      <a
                        href={session.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <PlayCircle className="w-5 h-5" />
                        {t.academy?.watchRecording || 'شاهد التسجيل'}
                      </a>
                    )}
                    {session.status === 'scheduled' && !sessionIsLive && (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed"
                      >
                        <Clock className="w-5 h-5" />
                        {t.academy?.notStarted || 'لم تبدأ بعد'}
                      </button>
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
