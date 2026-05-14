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
  CheckCircle2, ExternalLink, BookOpen, FileText, Download,
  Loader2, ArrowLeft, User, Info
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  const [joining, setJoining] = useState(false)

  const sessionId = params.id as string

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/academy/student/sessions/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
      } else if (res.status === 404) {
        router.push('/academy/student/sessions')
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }, [router, sessionId])

  useEffect(() => {
    void Promise.resolve().then(fetchSession)
  }, [fetchSession])

  const handleJoinSession = async () => {
    if (!session?.meeting_link) return
    
    setJoining(true)
    try {
      await fetch(`/api/academy/student/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      })
      
      // Open meeting link
      window.open(session.meeting_link, '_blank')
      
      // Refresh session data
      fetchSession()
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{isAr ? 'الجلسة غير موجودة' : 'Session not found'}</p>
        <Button asChild className="mt-4">
          <Link href="/academy/student/sessions">
            {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
          </Link>
        </Button>
      </div>
    )
  }

  const now = new Date()
  const sessionDate = new Date(session.scheduled_at)
  const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
  const isLive = session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now)
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
    scheduled: { label: isAr ? 'مجدولة' : 'Scheduled', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: isAr ? 'مباشر الآن' : 'Live Now', color: 'bg-red-100 text-red-700' },
    completed: { label: isAr ? 'منتهية' : 'Completed', color: 'bg-green-100 text-green-700' },
    cancelled: { label: isAr ? 'ملغاة' : 'Cancelled', color: 'bg-gray-100 text-gray-700' },
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/academy/student/sessions">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
        </Link>
      </Button>

      {/* Main Card */}
      <Card className={cn(
        "overflow-hidden",
        isLive && "border-red-500 ring-2 ring-red-500/20"
      )}>
        {/* Header */}
        <div className={cn(
          "p-6",
          isLive ? "bg-gradient-to-r from-red-500 to-red-600 text-white" :
          isCompleted ? "bg-gradient-to-r from-green-500 to-green-600 text-white" :
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        )}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {isLive ? statusConfig.in_progress.label : statusConfig[session.status].label}
                </Badge>
                {isLive && (
                  <span className="flex items-center gap-1 text-sm">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    {isAr ? 'بث مباشر' : 'Live'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">{session.title}</h1>
              <p className="text-white/80 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {session.course_title}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Video className="w-8 h-8" />
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Session Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</p>
                <p className="font-medium text-sm">{formatDateTime(session.scheduled_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'المدة' : 'Duration'}</p>
                <p className="font-medium text-sm">{session.duration_minutes} {isAr ? 'دقيقة' : 'min'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'الحضور' : 'Attendees'}</p>
                <p className="font-medium text-sm">{session.attendees_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'حضورك' : 'Your Attendance'}</p>
                <p className="font-medium text-sm">
                  {session.user_attended 
                    ? (isAr ? 'حضرت' : 'Attended')
                    : (isAr ? 'لم تحضر' : 'Not attended')
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {session.description && (
            <div>
              <h3 className="font-semibold mb-2">{isAr ? 'وصف الجلسة' : 'Session Description'}</h3>
              <p className="text-muted-foreground">{session.description}</p>
            </div>
          )}

          {/* Teacher */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <Avatar className="h-14 w-14">
              <AvatarImage src={session.teacher_avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {session.teacher_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? 'المدرس' : 'Teacher'}</p>
              <p className="font-semibold">{session.teacher_name}</p>
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{session.notes}</p>
                </div>
              </div>
            </div>
          )}

          {session.meeting_link && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-green-700 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    {isAr ? 'رابط الاجتماع متاح' : 'Meeting link is ready'}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {session.meeting_platform === 'google_meet' ? 'Google Meet' : session.meeting_platform === 'zoom' ? 'Zoom' : isAr ? 'رابط خارجي' : 'External meeting'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {(isLive || isUpcoming) && session.meeting_link && (
              <Button
                size="lg"
                className={cn("gap-2 flex-1", isLive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}
                onClick={handleJoinSession}
                disabled={joining}
              >
                {joining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
                {isLive ? (isAr ? 'انضم للجلسة الآن' : 'Join Session Now') : (isAr ? 'فتح رابط الجلسة' : 'Open Meeting Link')}
              </Button>
            )}
            
            {isCompleted && session.recording_url && (
              <Button size="lg" asChild className="gap-2 flex-1">
                <a href={session.recording_url} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="w-5 h-5" />
                  {isAr ? 'شاهد التسجيل' : 'Watch Recording'}
                </a>
              </Button>
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
      {session.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isAr ? 'مواد الدورة' : 'Course Materials'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{material.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{material.type}</p>
                    </div>
                  </div>
                  {material.content_url && (
                    <Button size="sm" variant="ghost" asChild>
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
