'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Video, Calendar, Clock, Users, PlayCircle, ArrowRight,
  CheckCircle2, ExternalLink, BookOpen, FileText,
  Loader2, ArrowLeft, Info, AlertTriangle
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

interface SessionDetails {
  id: string
  title: string
  description: string | null
  course_id: string
  course_title: string
  course_description: string | null
  teacher_id: string
  teacher_name: string
  teacher_avatar: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  meeting_platform: string | null
  public_join_token: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recording_url: string | null
  notes: string | null
  attachments: string | null
  attendees_count: number
  user_attended: boolean
  user_attendance: { id: string; joined_at: string; left_at: string | null } | null
  materials: Array<{
    id: string
    title: string
    type: string
    content_url: string | null
  }>
}

export default function SessionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [session, setSession] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const sessionId = params.id as string

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setError(isAr ? 'معرف الجلسة مفقود' : 'Session ID is missing')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/academy/student/sessions/${sessionId}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
        setError(null)
      } else if (res.status === 404) {
        setError(isAr ? 'الجلسة غير موجودة أو غير متاحة' : 'Session not found or not available')
      } else if (res.status === 401) {
        router.push('/login')
        return
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || (isAr ? 'فشل تحميل الجلسة' : 'Failed to load session'))
      }
    } catch (err) {
      console.error('[SessionDetails] Fetch error:', err)
      setError(isAr ? 'تعذّر الاتصال بالخادم' : 'Could not connect to server')
    } finally {
      setLoading(false)
    }
  }, [router, sessionId, isAr])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSession() }, [fetchSession])

  const handleJoinSession = async () => {
    if (!session?.meeting_link) return

    setJoining(true)
    try {
      const res = await fetch(`/api/academy/student/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
        credentials: 'include',
      })

      if (res.ok) {
        window.open(session.meeting_link, '_blank')
        fetchSession()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || (isAr ? 'فشل الانضمام للجلسة' : 'Failed to join session'))
      }
    } catch (err) {
      console.error('[SessionDetails] Join error:', err)
      setError(isAr ? 'حدث خطأ أثناء الانضمام' : 'Error occurred while joining')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          {isAr ? 'جارٍ تحميل تفاصيل الجلسة...' : 'Loading session details...'}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/academy/student/sessions">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
          </Link>
        </Button>

        <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {isAr ? 'حدث خطأ' : 'An error occurred'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setLoading(true); setError(null); fetchSession() }}>
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/academy/student/sessions">
                {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/academy/student/sessions">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
          </Link>
        </Button>

        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isAr ? 'الجلسة غير موجودة' : 'Session not found'}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {isAr ? 'قد تكون الجلسة محذوفة أو غير متاحة لك.' : 'The session may have been deleted or is not available to you.'}
          </p>
          <Button asChild>
            <Link href="/academy/student/sessions">
              {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const now = new Date()
  const sessionDate = new Date(session.scheduled_at)
  const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
  const isLive = session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now && session.status !== 'completed')
  const isUpcoming = session.status === 'scheduled' && sessionDate > now
  const isCompleted = session.status === 'completed' || sessionEnd < now

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }

  const statusConfig = {
    scheduled: {
      label: isAr ? 'مجدولة' : 'Scheduled',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      gradient: 'from-blue-500 to-blue-600',
    },
    in_progress: {
      label: isAr ? 'مباشر الآن' : 'Live Now',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      gradient: 'from-red-500 to-red-600',
    },
    completed: {
      label: isAr ? 'منتهية' : 'Completed',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      gradient: 'from-green-500 to-green-600',
    },
    cancelled: {
      label: isAr ? 'ملغاة' : 'Cancelled',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      gradient: 'from-gray-500 to-gray-600',
    },
  }

  const currentStatus = isLive ? 'in_progress' : session.status
  const statusInfo = statusConfig[currentStatus]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/academy/student/sessions">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
        </Link>
      </Button>

      {/* Main Card */}
      <Card className={cn(
        "overflow-hidden border-2 transition-shadow duration-300",
        isLive ? "border-red-500 shadow-lg shadow-red-500/10" : "border-border"
      )}>
        {/* Header */}
        <div className={cn(
          "p-6 bg-gradient-to-r text-white",
          statusInfo.gradient
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                  {statusInfo.label}
                </Badge>
                {isLive && (
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    {isAr ? 'بث مباشر' : 'Live'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{session.title}</h1>
              <p className="text-white/90 flex items-center gap-2 text-sm md:text-base">
                <BookOpen className="w-4 h-4 shrink-0" />
                {session.course_title}
              </p>
            </div>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Video className="w-7 h-7 md:w-8 md:h-8" />
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Session Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoCard
              icon={<Calendar className="w-5 h-5 text-muted-foreground" />}
              label={isAr ? 'التاريخ والوقت' : 'Date & Time'}
              value={formatDateTime(session.scheduled_at)}
              isAr={isAr}
            />
            <InfoCard
              icon={<Clock className="w-5 h-5 text-muted-foreground" />}
              label={isAr ? 'المدة' : 'Duration'}
              value={`${session.duration_minutes} ${isAr ? 'دقيقة' : 'min'}`}
              isAr={isAr}
            />
            <InfoCard
              icon={<Users className="w-5 h-5 text-muted-foreground" />}
              label={isAr ? 'الحضور' : 'Attendees'}
              value={String(session.attendees_count)}
              isAr={isAr}
            />
            <InfoCard
              icon={<CheckCircle2 className="w-5 h-5 text-muted-foreground" />}
              label={isAr ? 'حضورك' : 'Your Attendance'}
              value={session.user_attended ? (isAr ? 'حضرت' : 'Attended') : (isAr ? 'لم تحضر' : 'Not attended')}
              isAr={isAr}
              highlight={session.user_attended}
            />
          </div>

          {/* Description */}
          {session.description && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                {isAr ? 'وصف الجلسة' : 'Session Description'}
              </h3>
              <p className="text-foreground leading-relaxed">{session.description}</p>
            </div>
          )}

          {/* Teacher */}
          <div className="flex items-center gap-4 p-4 rounded-xl border bg-card/50">
            <Avatar className="h-14 w-14 ring-2 ring-primary/10">
              <AvatarImage src={session.teacher_avatar || undefined} alt={session.teacher_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {session.teacher_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{isAr ? 'المدرس' : 'Teacher'}</p>
              <p className="font-semibold text-lg">{session.teacher_name}</p>
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                    {isAr ? 'ملاحظات المدرس' : 'Teacher Notes'}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">{session.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Link Info */}
          {session.meeting_link && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-emerald-900 dark:text-emerald-100 text-sm">
                    {isAr ? 'رابط الاجتماع متاح' : 'Meeting link is ready'}
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {session.meeting_platform === 'google_meet' ? 'Google Meet' :
                     session.meeting_platform === 'zoom' ? 'Zoom' :
                     session.meeting_platform === 'microsoft_teams' ? 'Microsoft Teams' :
                     session.meeting_platform || (isAr ? 'رابط خارجي' : 'External meeting')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isLive && (
              <Button
                size="lg"
                asChild
                className="gap-2 flex-1 font-semibold bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200"
              >
                <Link href={`/academy/student/sessions/${session.id}/live`}>
                  <PlayCircle className="w-5 h-5" />
                  {isAr ? 'انضم للبث ا��مباشر الآن' : 'Join Live Stream Now'}
                </Link>
              </Button>
            )}
            {(isLive || isUpcoming) && session.meeting_link && (
              <Button
                size="lg"
                variant={isLive ? 'outline' : 'default'}
                className={cn(
                  "gap-2 flex-1 font-semibold transition-all duration-200",
                  !isLive && "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25"
                )}
                onClick={handleJoinSession}
                disabled={joining}
              >
                {joining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                {isLive
                  ? (isAr ? 'فتح الرابط الخارجي' : 'Open External Link')
                  : (isAr ? 'فتح رابط الجلسة' : 'Open Meeting Link')}
              </Button>
            )}

            {isCompleted && session.recording_url && (
              <VideoPlayerModal url={session.recording_url} title={session.title}>
                <Button
                  size="lg"
                  className="gap-2 flex-1 bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                >
                  <PlayCircle className="w-5 h-5" />
                  {isAr ? 'شاهد التسجيل' : 'Watch Recording'}
                </Button>
              </VideoPlayerModal>
            )}

            {isUpcoming && !session.meeting_link && (
              <Button size="lg" disabled className="gap-2 flex-1">
                <Clock className="w-5 h-5" />
                {isAr ? 'الجلسة لم تبدأ بعد' : 'Session not started yet'}
              </Button>
            )}

            {session.public_join_token && (
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link href={`/academy/public/session/${session.public_join_token}`}>
                  <ExternalLink className="w-5 h-5" />
                  {isAr ? 'رابط الدرس العام' : 'Public Lesson Link'}
                </Link>
              </Button>
            )}

            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href={`/academy/student/courses/${session.course_id}`}>
                <BookOpen className="w-5 h-5" />
                {isAr ? 'عرض الدورة' : 'View Course'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related Materials */}
      {session.materials && session.materials.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              {isAr ? 'مواد الدورة' : 'Course Materials'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {session.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{material.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {material.type}
                      </p>
                    </div>
                  </div>
                  {material.content_url && (
                    <Button size="sm" variant="ghost" asChild className="shrink-0">
                      <a href={material.content_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  isAr,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isAr: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn("font-medium text-sm truncate", highlight && "text-green-600 dark:text-green-400")}>
          {value}
        </p>
      </div>
    </div>
  )
}
