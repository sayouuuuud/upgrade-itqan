import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  Globe2,
  Users,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
  Radio,
  Timer,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RecordingShareToggle } from './recording-share-toggle'
import { cn } from '@/lib/utils'

interface SessionDetails {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_at: string
  duration_minutes: number
  is_public: boolean
  meeting_url: string | null
  recording_url: string | null
  is_recording_shared: boolean
  course_name: string
  series_title: string | null
  [key: string]: unknown
}

interface AttendanceRecord {
  id: string
  joined_at: string
  left_at: string | null
  full_name: string
  email: string
}

async function getSessionDetails(id: string, teacherId: string): Promise<SessionDetails | null> {
  const sessions = await query<SessionDetails>(
    `
    SELECT 
      cs.*,
      c.title as course_name,
      ls.title as series_title
    FROM course_sessions cs
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN lesson_series ls ON cs.series_id = ls.id
    WHERE cs.id = $1 AND c.teacher_id = $2
  `,
    [id, teacherId],
  )

  return sessions[0] || null
}

async function getSessionAttendance(id: string): Promise<AttendanceRecord[]> {
  const attendance = await query<AttendanceRecord>(
    `
    SELECT 
      sa.id,
      sa.joined_at,
      sa.left_at,
      u.name as full_name,
      u.email
    FROM session_attendance sa
    JOIN users u ON sa.student_id = u.id
    WHERE sa.session_id = $1
    ORDER BY sa.joined_at ASC
  `,
    [id],
  )

  return attendance
}

function getInitials(name: string) {
  if (!name) return '؟'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0)
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const authSession = await getSession()
  if (!authSession || !['teacher', 'academy_admin'].includes(authSession.role)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">غير مصرح لك بالوصول لهذه الصفحة</p>
      </div>
    )
  }

  const { id } = await params
  const sessionDetails = await getSessionDetails(id, authSession.sub)

  if (!sessionDetails) {
    notFound()
  }

  const attendance = await getSessionAttendance(id)

  const isCompleted = sessionDetails.status === 'completed'
  const isActive = sessionDetails.status === 'in_progress'

  const dateLabel = new Date(sessionDetails.scheduled_at).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeLabel = new Date(sessionDetails.scheduled_at).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const infoItems = [
    {
      icon: Calendar,
      label: 'التاريخ',
      value: dateLabel,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: Clock,
      label: 'الوقت',
      value: timeLabel,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      icon: Timer,
      label: 'المدة',
      value: `${sessionDetails.duration_minutes} دقيقة`,
      color: 'text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      icon: Globe2,
      label: 'النوع',
      value: sessionDetails.is_public ? 'عامة' : 'خاصة',
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
  ]

  const statusConfig: Record<string, { gradient: string; shadow: string; label: string; icon: any; pulse?: boolean }> = {
    scheduled: {
      gradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      label: 'مجدولة',
      icon: Clock
    },
    in_progress: {
      gradient: 'from-red-600 to-orange-600',
      shadow: 'shadow-red-500/30',
      label: 'مباشر الآن',
      icon: Radio,
      pulse: true
    },
    completed: {
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      label: 'مكتملة',
      icon: CheckCircle2
    },
    cancelled: {
      gradient: 'from-slate-600 to-slate-800',
      shadow: 'shadow-slate-500/30',
      label: 'ملغاة',
      icon: Globe2
    },
  }

  const currentStatus = isActive ? 'in_progress' : sessionDetails.status as keyof typeof statusConfig
  const statusInfo = statusConfig[currentStatus] || statusConfig.scheduled
  const StatusIcon = statusInfo.icon

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12 relative" dir="rtl">
      {/* Background Ornaments */}
      <div className={cn("absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full -z-10 pointer-events-none opacity-20", isActive ? "bg-red-500" : "bg-blue-500")} />

      {/* Back link */}
      <Link
        href="/academy/teacher"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground transition-all hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 backdrop-blur-sm -ml-2"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى لوحة التحكم
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero header */}
          <div className={cn(
            "relative overflow-hidden rounded-3xl border-2 transition-all duration-500 shadow-xl",
            isActive ? "border-red-500/50 shadow-red-500/10" : "border-border/50 shadow-blue-900/5"
          )}>
            <div className={cn("relative p-8 md:p-10 bg-gradient-to-l text-white overflow-hidden", statusInfo.gradient)}>
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
              
              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge
                      className={cn("gap-1.5 border border-white/20 bg-white/20 text-white hover:bg-white/30 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm", statusInfo.shadow)}
                    >
                      <StatusIcon className={cn("h-4 w-4", statusInfo.pulse && "animate-pulse")} />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-balance sm:text-4xl drop-shadow-sm">
                    {sessionDetails.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-white/90">
                    <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      <Layers className="h-4.5 w-4.5 opacity-80" />
                      {sessionDetails.course_name}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      <Calendar className="h-4.5 w-4.5 opacity-80" />
                      {dateLabel}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-lg px-6 py-5 min-w-[120px]">
                  <Users className="h-7 w-7 text-white opacity-90" />
                  <div className="text-center mt-1">
                    <p className="text-3xl font-black leading-none drop-shadow-sm">{attendance.length}</p>
                    <p className="mt-1.5 text-xs font-bold text-white/80 tracking-wide">إجمالي الحضور</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 space-y-8">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {infoItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col rounded-2xl border border-border/50 bg-card p-4 transition-all hover:shadow-md hover:-translate-y-1"
                  >
                    <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-xl shrink-0", item.bg, item.color)}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-black leading-snug truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {sessionDetails.series_title && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-border/50">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      <Layers className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">السلسلة التابع لها</p>
                      <p className="text-lg font-black">{sessionDetails.series_title}</p>
                    </div>
                  </div>
                </>
              )}

              {sessionDetails.description && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-black">
                      <FileText className="h-5 w-5 text-blue-500" />
                      وصف الجلسة
                    </div>
                    <p className="rounded-2xl border border-border/50 bg-slate-50 dark:bg-slate-800/30 p-6 text-base leading-relaxed text-muted-foreground font-medium shadow-sm">
                      {sessionDetails.description}
                    </p>
                  </div>
                </>
              )}

              {sessionDetails.recording_url && (
                <>
                  <Separator className="bg-border/50" />
                  <RecordingShareToggle 
                    sessionId={sessionDetails.id}
                    initialShared={sessionDetails.is_recording_shared || false}
                    hasRecording={!!sessionDetails.recording_url}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Attendance Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-2 border-border/50 shadow-xl shadow-blue-900/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden sticky top-6">
            <CardHeader className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-800/30 pb-5">
              <CardTitle className="flex items-center justify-between text-xl font-black">
                <span className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Users className="h-5 w-5" />
                  </div>
                  سجل الحضور
                </span>
                {attendance.length > 0 && (
                  <Badge variant="secondary" className="font-bold px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {attendance.length} طالب
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {attendance.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto divide-y divide-border/50 scrollbar-thin scrollbar-thumb-muted">
                  {attendance.map((record, idx) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-sm font-bold text-blue-700 dark:text-blue-300">
                          {getInitials(record.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold">{record.full_name}</p>
                        <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">{record.email}</p>
                      </div>
                      <div className="shrink-0 text-left bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">انضمام</p>
                        <p className="font-mono text-xs font-bold text-foreground">
                          {new Date(record.joined_at).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-black">لا يوجد حضور بعد</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground max-w-[200px] leading-relaxed">
                    لم يقم أي طالب بتسجيل الدخول أو الانضمام لهذه الجلسة حتى الآن.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
