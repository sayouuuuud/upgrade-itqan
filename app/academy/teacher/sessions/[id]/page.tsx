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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

async function getSessionDetails(id: string, teacherId: string) {
  const sessions = await query(
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

async function getSessionAttendance(id: string) {
  const attendance = await query(
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
    },
    {
      icon: Clock,
      label: 'الوقت',
      value: timeLabel,
    },
    {
      icon: Timer,
      label: 'المدة',
      value: `${sessionDetails.duration_minutes} دقيقة`,
    },
    {
      icon: Globe2,
      label: 'نوع الجلسة',
      value: sessionDetails.is_public ? 'عامة' : 'خاصة بالطلاب',
    },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Back link */}
      <Link
        href="/academy/teacher/schedule"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الجدول
      </Link>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge
              variant="secondary"
              className="gap-1.5 border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Radio className="h-3.5 w-3.5" />
              )}
              {isCompleted ? 'مكتملة' : isActive ? 'نشطة حالياً' : 'مجدولة'}
            </Badge>
            <h1 className="text-2xl font-bold leading-tight text-balance sm:text-3xl">
              {sessionDetails.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                {sessionDetails.course_name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {dateLabel}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3">
            <Users className="h-5 w-5 text-primary-foreground/70" />
            <div>
              <p className="text-2xl font-bold leading-none">{attendance.length}</p>
              <p className="mt-1 text-xs text-primary-foreground/70">إجمالي الحضور</p>
            </div>
          </div>
        </div>
        {/* decorative accent bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل الجلسة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {infoItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug">{item.value}</p>
                </div>
              ))}
            </div>

            {sessionDetails.series_title && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">السلسلة</p>
                    <p className="text-sm font-semibold">{sessionDetails.series_title}</p>
                  </div>
                </div>
              </>
            )}

            {sessionDetails.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    وصف الجلسة
                  </div>
                  <p className="rounded-xl bg-muted/30 p-4 text-sm leading-relaxed text-foreground/90">
                    {sessionDetails.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                سجل الحضور
              </span>
              {attendance.length > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {attendance.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="max-h-[460px] space-y-2 overflow-y-auto pl-1">
                {attendance.map((record: any) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(record.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{record.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{record.email}</p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-[11px] text-muted-foreground">انضم</p>
                      <p className="font-mono text-xs font-medium">
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
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">لا يوجد حضور بعد</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  لم يتم تسجيل أي حضور لهذه الجلسة حتى الآن.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
