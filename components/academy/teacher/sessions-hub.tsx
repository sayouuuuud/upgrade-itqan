'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  Users,
  Video,
  Radio,
  Plus,
  Edit2,
  Trash2,
  Globe2,
  CheckCircle2,
  PlayCircle,
  Star,
  History,
  Megaphone,
  Loader2,
  Zap,
  CalendarClock,
  BarChart3,
  MessageSquare,
  Mic,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SessionRow {
  id: string
  course_id: string
  title: string
  description?: string | null
  course_name?: string
  scheduled_at: string
  duration_minutes?: number | null
  max_students?: number | null
  status: string
  is_public?: boolean
  public_join_token?: string | null
  series_title?: string | null
  attendance_count?: number
}

interface Course {
  id: string
  title: string
}

interface HistoryRow {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  peak_participants: number
  recording_url: string | null
  recording_status: string
  is_host: boolean
  title: string | null
  participants_count: number
  ratings_count: number
  avg_rating: number | null
}

interface RecordingRow {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  title: string | null
  started_at: string
  duration_seconds: number | null
  recording_url: string | null
  participants_count: number
}

const KIND_LABEL: Record<string, string> = {
  halaqa: 'حلقة',
  booking: 'جلسة فردية',
  course_session: 'درس دورة',
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h > 0) return `${h}س ${rem}د`
  return `${m}د`
}

function fmtDateTime(s: string) {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(s))
  } catch {
    return s
  }
}

function Stars({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">لا يوجد تقييم</span>
  }
  return (
    <div className="flex items-center gap-0.5" aria-label={`متوسط التقييم ${value}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-xs font-semibold text-foreground/80 mr-1">{Number(value).toFixed(1)}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const TABS = ['live', 'history', 'recordings'] as const
type TabId = (typeof TABS)[number]

export function TeacherSessionsHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId) || 'live'

  const [tab, setTab] = useState<TabId>(TABS.includes(initialTab) ? initialTab : 'live')

  // sessions (course_sessions)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  // history + recordings (video_sessions)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [recordings, setRecordings] = useState<RecordingRow[]>([])
  const [loadingRecordings, setLoadingRecordings] = useState(true)

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  /* ---- fetchers ---- */
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/teacher/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.data || data || [])
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e)
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/teacher/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.data || data || [])
      }
    } catch (e) {
      console.error('Failed to fetch courses', e)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/video/my-sessions?role=host&limit=100&platform=academy')
      if (res.ok) {
        const json = await res.json()
        setHistory(json.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch history', e)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const fetchRecordings = useCallback(async () => {
    setLoadingRecordings(true)
    try {
      const res = await fetch('/api/video/recordings?scope=mine&platform=academy&limit=200')
      if (res.ok) {
        const json = await res.json()
        setRecordings(json.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch recordings', e)
    } finally {
      setLoadingRecordings(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      setLoadingSessions(true)
      await Promise.all([fetchSessions(), fetchCourses()])
      setLoadingSessions(false)
    })()
    void fetchHistory()
    void fetchRecordings()
  }, [fetchSessions, fetchCourses, fetchHistory, fetchRecordings])

  // keep ?tab= in the URL in sync without a full navigation
  const onTabChange = (value: string) => {
    const v = value as TabId
    setTab(v)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('tab', v)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  /* ---- derived ---- */
  const now = Date.now()
  const liveNow = useMemo(
    () => sessions.filter((s) => s.status === 'in_progress'),
    [sessions]
  )
  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => s.status !== 'in_progress' && s.status !== 'completed' && new Date(s.scheduled_at).getTime() > now - 6 * 3600_000)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [sessions, now]
  )
  const past = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'completed' || (s.status !== 'in_progress' && new Date(s.scheduled_at).getTime() <= now - 6 * 3600_000))
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [sessions, now]
  )

  const stats = useMemo(() => {
    let ratingsSum = 0
    let ratingsCount = 0
    let minutes = 0
    for (const r of history) {
      minutes += Math.floor((r.duration_seconds || 0) / 60)
      if (r.avg_rating !== null && r.ratings_count > 0) {
        ratingsSum += Number(r.avg_rating) * r.ratings_count
        ratingsCount += r.ratings_count
      }
    }
    return {
      liveNow: liveNow.length,
      upcoming: upcoming.length,
      minutes,
      recordings: recordings.length,
      avg: ratingsCount > 0 ? ratingsSum / ratingsCount : null,
    }
  }, [history, liveNow.length, upcoming.length, recordings.length])

  /* ---- actions ---- */
  const enterRoom = (id: string) => router.push(`/academy/teacher/sessions/${id}/live`)

  const startNow = async (id: string) => {
    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })
      if (res.ok) {
        toast.success('تم تفعيل الجلسة، جاري فتح غرفة البث...')
        enterRoom(id)
      } else {
        toast.error('تعذّر بدء الجلسة')
      }
    } catch {
      toast.error('فشل الاتصال بالخادم')
    }
  }

  const endSession = async (id: string) => {
    if (!confirm('هل أنت متأكد من إنهاء هذه الجلسة؟ لن يتمكن الطلاب من الدخول بعدها.')) return
    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (res.ok) {
        toast.success('تم إنهاء الجلسة')
        fetchSessions()
        fetchHistory()
      } else {
        toast.error('تعذّر إنهاء الجلسة')
      }
    } catch {
      toast.error('فشل الاتصال بالخادم')
    }
  }

  const deleteSession = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة نهائياً؟')) return
    try {
      const res = await fetch(`/api/academy/teacher/sessions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف الجلسة')
        fetchSessions()
      } else {
        toast.error('تعذّر الحذف')
      }
    } catch {
      toast.error('فشل الاتصال بالخادم')
    }
  }

  const openNew = () => {
    setEditingId(null)
    setDialogOpen(true)
  }
  const openEdit = (id: string) => {
    setEditingId(id)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="w-7 h-7 text-primary" />
            الجلسات والبث المباشر
          </h1>
          <p className="text-muted-foreground text-sm">
            أنشئ بثاً مباشراً، أدر جلساتك المجدولة، وراجع سجلك وتسجيلاتك من مكان واحد.
          </p>
        </div>
        <Button size="lg" onClick={openNew} className="shrink-0 shadow-md gap-2">
          <Plus className="w-5 h-5" />
          بث مباشر جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="مباشر الآن" value={String(stats.liveNow)} icon={<Radio className="w-4 h-4 text-red-500" />} highlight={stats.liveNow > 0} />
        <StatBox label="جلسات مجدولة" value={String(stats.upcoming)} icon={<CalendarClock className="w-4 h-4 text-blue-500" />} />
        <StatBox label="دقائق بث" value={String(stats.minutes)} icon={<Clock className="w-4 h-4 text-emerald-500" />} />
        <StatBox
          label="متوسط تقييمك"
          value={stats.avg !== null ? stats.avg.toFixed(1) : '—'}
          icon={<Star className="w-4 h-4 text-amber-500" />}
        />
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-2">
          <TabsTrigger value="live" className="gap-1.5">
            <Radio className="w-4 h-4" />
            البث والجلسات
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-4 h-4" />
            السجل
          </TabsTrigger>
          <TabsTrigger value="recordings" className="gap-1.5">
            <Video className="w-4 h-4" />
            التسجيلات
          </TabsTrigger>
        </TabsList>

        {/* ---- TAB: live & sessions ---- */}
        <TabsContent value="live" className="space-y-6 animate-in fade-in-50 duration-300">
          {loadingSessions ? (
            <SessionSkeletons />
          ) : (
            <>
              {liveNow.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    مباشر الآن
                  </h2>
                  <div className="grid gap-3">
                    {liveNow.map((s) => (
                      <LiveSessionCard key={s.id} s={s} onEnter={enterRoom} onEnd={endSession} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  الجلسات المجدولة
                </h2>
                {upcoming.length > 0 ? (
                  <div className="grid gap-3">
                    {upcoming.map((s) => (
                      <ScheduledSessionCard
                        key={s.id}
                        s={s}
                        onStart={startNow}
                        onEdit={openEdit}
                        onDelete={deleteSession}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Calendar className="w-7 h-7" />}
                    title="لا توجد جلسات مجدولة"
                    body="ابدأ بثاً مباشراً فورياً أو جدول جلسة قادمة للتواصل مع طلابك."
                    action={
                      <Button onClick={openNew} className="gap-2">
                        <Plus className="w-4 h-4" />
                        إنشاء جلسة
                      </Button>
                    }
                  />
                )}
              </section>

              {past.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    الجلسات السابقة
                  </h2>
                  <div className="grid gap-3">
                    {past.map((s) => (
                      <PastSessionCard key={s.id} s={s} onDelete={deleteSession} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </TabsContent>

        {/* ---- TAB: history ---- */}
        <TabsContent value="history" className="space-y-3 animate-in fade-in-50 duration-300">
          {loadingHistory ? (
            <SessionSkeletons />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<History className="w-7 h-7" />}
              title="لا يوجد سجل بعد"
              body="بمجرد أن تبدأ بثاً مباشراً ستظهر تفاصيله هنا تلقائياً مع الحضور والتقييمات."
            />
          ) : (
            history.map((row) => <HistoryCard key={row.id} row={row} />)
          )}
        </TabsContent>

        {/* ---- TAB: recordings ---- */}
        <TabsContent value="recordings" className="animate-in fade-in-50 duration-300">
          {loadingRecordings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : recordings.length === 0 ? (
            <EmptyState
              icon={<Video className="w-7 h-7" />}
              title="لا توجد تسجيلات بعد"
              body="ستظهر هنا تسجيلات الجلسات بعد انتهائها مباشرة (عند تفعيل التسجيل في إعدادات الأكاديمية)."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recordings.map((r) => (
                <RecordingCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courses={courses}
        editingId={editingId}
        sessions={sessions}
        onSaved={() => {
          fetchSessions()
        }}
        onStartedNow={(id) => enterRoom(id)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatBox({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-red-500/40 bg-red-500/5' : ''}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetaRow({ s }: { s: SessionRow }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {fmtDateTime(s.scheduled_at)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {s.duration_minutes || 60} دقيقة
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        حتى {s.max_students || 20} طالب
      </span>
    </div>
  )
}

function LiveSessionCard({
  s,
  onEnter,
  onEnd,
}: {
  s: SessionRow
  onEnter: (id: string) => void
  onEnd: (id: string) => void
}) {
  return (
    <Card className="border-r-4 border-r-red-500 overflow-hidden">
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold truncate">{s.title}</h3>
            <Badge className="bg-red-600 hover:bg-red-700 animate-pulse gap-1">
              <Radio className="w-3 h-3" />
              مباشر الآن
            </Badge>
          </div>
          {s.course_name && <p className="text-sm text-muted-foreground">{s.course_name}</p>}
          <MetaRow s={s} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => onEnter(s.id)} className="bg-red-600 hover:bg-red-700 text-white gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            دخول الغرفة
          </Button>
          <Button variant="outline" onClick={() => onEnd(s.id)} className="border-red-200 text-red-600 hover:bg-red-50">
            إنهاء
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduledSessionCard({
  s,
  onStart,
  onEdit,
  onDelete,
}: {
  s: SessionRow
  onStart: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card className="border-r-4 border-r-primary hover:shadow-md transition-all">
      <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold truncate">{s.title}</h3>
            {s.is_public && (
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 gap-1">
                <Globe2 className="w-3 h-3" />
                عامة
              </Badge>
            )}
            {s.series_title && (
              <Badge variant="secondary" className="gap-1">
                سلسلة: {s.series_title}
              </Badge>
            )}
          </div>
          {s.course_name && <p className="text-sm text-muted-foreground">{s.course_name}</p>}
          <MetaRow s={s} />
        </div>
        <div className="flex flex-col gap-2 lg:min-w-[200px]">
          <Button onClick={() => onStart(s.id)} className="font-bold gap-2 shadow-sm">
            <PlayCircle className="w-4 h-4" />
            بدء البث الآن
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(s.id)} className="gap-1">
              <Edit2 className="w-3.5 h-3.5" />
              تعديل
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(s.id)}
              className="gap-1 text-destructive border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PastSessionCard({ s, onDelete }: { s: SessionRow; onDelete: (id: string) => void }) {
  return (
    <Card className="border-r-4 border-r-muted-foreground/30 hover:shadow-sm transition-all">
      <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-muted text-muted-foreground grid place-items-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold truncate">{s.title}</h3>
              <Badge variant="secondary" className="gap-1 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                مكتملة
              </Badge>
            </div>
            {s.course_name && <p className="text-sm text-muted-foreground">{s.course_name}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {fmtDateTime(s.scheduled_at)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Users className="w-3.5 h-3.5" />
                {s.attendance_count || 0} حضور مسجل
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm" variant="default" className="gap-1">
            <Link href={`/academy/teacher/sessions/${s.id}`}>
              <BarChart3 className="w-3.5 h-3.5" />
              تقرير الحضور
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(s.id)}
            className="text-destructive hover:bg-destructive/10"
            title="حذف السجل"
          >
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">حذف السجل</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface RatingDetail {
  rating: number
  comment: string | null
  audio_quality: number | null
  video_quality: number | null
  teacher_rating: number | null
  created_at: string
  student_name: string | null
}

interface RatingSummary {
  count: number
  avg_rating: number | null
  avg_audio: number | null
  avg_video: number | null
  avg_teacher: number | null
}

function MiniStars({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </span>
  )
}

function SessionRatingsDialog({
  sessionId,
  title,
  count,
  open,
  onOpenChange,
}: {
  sessionId: string
  title: string
  count: number
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<RatingDetail[]>([])
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/video/sessions/${sessionId}/ratings`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'تعذّر تحميل التقييمات')
        return json
      })
      .then((json) => {
        if (cancelled) return
        setDetails(json.data || [])
        setSummary(json.summary || null)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, sessionId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            تقييمات الطلاب
          </DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-4 text-center">{error}</p>
        ) : (
          <div className="space-y-4">
            {summary && summary.count > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> عام
                  </span>
                  <MiniStars value={summary.avg_rating !== null ? Number(summary.avg_rating) : null} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> المعلّم
                  </span>
                  <MiniStars value={summary.avg_teacher !== null ? Number(summary.avg_teacher) : null} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5" /> الصوت
                  </span>
                  <MiniStars value={summary.avg_audio !== null ? Number(summary.avg_audio) : null} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> الفيديو
                  </span>
                  <MiniStars value={summary.avg_video !== null ? Number(summary.avg_video) : null} />
                </div>
              </div>
            )}

            {details.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">لا توجد تقييمات بعد.</p>
            ) : (
              <ul className="space-y-3">
                {details.map((d, idx) => (
                  <li key={idx} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{d.student_name || 'طالب'}</span>
                      <MiniStars value={d.rating} />
                    </div>
                    {d.comment && (
                      <p className="text-sm text-foreground/80 leading-relaxed text-pretty">{d.comment}</p>
                    )}
                    <span className="block text-[11px] text-muted-foreground">{fmtDateTime(d.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HistoryCard({ row }: { row: HistoryRow }) {
  const [ratingsOpen, setRatingsOpen] = useState(false)
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 flex flex-col md:flex-row gap-4 md:items-start">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{row.title || KIND_LABEL[row.kind] || row.kind}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground/70">
              {KIND_LABEL[row.kind] || row.kind}
            </span>
            {!row.ended_at && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
                مباشر الآن
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {fmtDateTime(row.started_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {fmtDuration(row.duration_seconds)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {row.participants_count} (ذروة {row.peak_participants})
            </span>
          </div>
          <Stars value={row.avg_rating !== null ? Number(row.avg_rating) : null} />
        </div>
        <div className="flex flex-col gap-2 shrink-0 md:items-end">
          {row.recording_url ? (
            <VideoPlayerModal url={row.recording_url} title={row.title || KIND_LABEL[row.kind] || row.kind}>
              <Button size="sm" variant="outline" className="gap-1">
                <PlayCircle className="w-4 h-4" />
                شاهد التسجيل
              </Button>
            </VideoPlayerModal>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {row.recording_status === 'recording' ? 'جاري التسجيل...' : 'لا يوجد تسجيل'}
            </span>
          )}
          {row.ratings_count > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => setRatingsOpen(true)}
            >
              <MessageSquare className="w-4 h-4" />
              {`تقييمات الطلاب (${row.ratings_count})`}
            </Button>
          )}
          {row.kind === 'course_session' && (
            <Button asChild size="sm" variant="ghost" className="gap-1">
              <Link href={`/academy/teacher/sessions/${row.ref_id}`}>تفاصيل الدرس</Link>
            </Button>
          )}
        </div>
      </CardContent>
      {row.ratings_count > 0 && (
        <SessionRatingsDialog
          sessionId={row.id}
          title={row.title || KIND_LABEL[row.kind] || row.kind}
          count={row.ratings_count}
          open={ratingsOpen}
          onOpenChange={setRatingsOpen}
        />
      )}
    </Card>
  )
}

function RecordingCard({ r }: { r: RecordingRow }) {
  const title = r.title || KIND_LABEL[r.kind]
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {r.recording_url ? (
        <VideoPlayerModal url={r.recording_url} title={title}>
          <button className="block w-full aspect-video bg-secondary/30 grid place-items-center relative group focus:outline-none">
            <PlayCircle className="w-12 h-12 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {fmtDuration(r.duration_seconds)}
            </span>
          </button>
        </VideoPlayerModal>
      ) : (
        <div className="block aspect-video bg-secondary/30 grid place-items-center relative">
          <PlayCircle className="w-12 h-12 text-muted-foreground opacity-40" />
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {fmtDuration(r.duration_seconds)}
          </span>
        </div>
      )}
      <CardContent className="pt-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold truncate flex-1">{r.title || KIND_LABEL[r.kind]}</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted">{KIND_LABEL[r.kind]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fmtDateTime(r.started_at)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {r.participants_count}
          </span>
        </div>
        {r.recording_url ? (
          <VideoPlayerModal url={r.recording_url} title={title}>
            <button className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              مشاهدة التسجيل
            </button>
          </VideoPlayerModal>
        ) : (
          <span className="text-xs text-muted-foreground">لا يوجد رابط</span>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-14 text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted grid place-items-center text-muted-foreground">
          {icon}
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
        {action && <div className="pt-2">{action}</div>}
      </CardContent>
    </Card>
  )
}

function SessionSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-5 flex justify-between items-center gap-4">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-10 w-28 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Create / edit dialog                                                */
/* ------------------------------------------------------------------ */

function SessionDialog({
  open,
  onOpenChange,
  courses,
  editingId,
  sessions,
  onSaved,
  onStartedNow,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  courses: Course[]
  editingId: string | null
  sessions: SessionRow[]
  onSaved: () => void
  onStartedNow: (id: string) => void
}) {
  const editing = editingId ? sessions.find((s) => s.id === editingId) || null : null

  const [mode, setMode] = useState<'instant' | 'schedule'>('instant')
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [maxStudents, setMaxStudents] = useState('20')
  const [isPublic, setIsPublic] = useState(false)
  const [seriesTitle, setSeriesTitle] = useState('')
  const [announce, setAnnounce] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // hydrate / reset when opened
  useEffect(() => {
    if (!open) return
    if (editing) {
      setMode('schedule')
      setCourseId(editing.course_id)
      setTitle(editing.title || '')
      setDescription(editing.description || '')
      if (editing.scheduled_at) {
        const dt = new Date(editing.scheduled_at)
        setDate(dt.toISOString().split('T')[0])
        setTime(dt.toTimeString().slice(0, 5))
      }
      setDuration(String(editing.duration_minutes || 60))
      setMaxStudents(String(editing.max_students || 20))
      setIsPublic(!!editing.is_public)
      setSeriesTitle(editing.series_title || '')
      setAnnounce(false)
    } else {
      setMode('instant')
      setCourseId('')
      setTitle('')
      setDescription('')
      setDate('')
      setTime('')
      setDuration('60')
      setMaxStudents('20')
      setIsPublic(false)
      setSeriesTitle('')
      setAnnounce(true)
    }
  }, [open, editing])

  const isInstant = !editing && mode === 'instant'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !title) {
      toast.error('يرجى اختيار الدورة وإدخال عنوان الجلسة')
      return
    }
    if (!isInstant && (!date || !time)) {
      toast.error('يرجى تحديد تاريخ ووقت الجلسة')
      return
    }

    setSubmitting(true)
    try {
      const scheduledAt = isInstant ? new Date().toISOString() : new Date(`${date}T${time}`).toISOString()
      const payload: Record<string, unknown> = {
        course_id: courseId,
        title,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(duration) || 60,
        max_students: parseInt(maxStudents) || 20,
        is_public: isPublic,
        series_title: seriesTitle,
        announce_to_students: announce,
      }
      if (isInstant) payload.start_now = true

      const url = editing ? `/api/academy/teacher/sessions/${editing.id}` : '/api/academy/teacher/sessions'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'تعذّر حفظ الجلسة')
        return
      }

      const data = await res.json()
      onOpenChange(false)
      onSaved()

      if (isInstant) {
        const newId = data?.data?.id
        toast.success('تم إنشاء البث، جاري فتح الغرفة...')
        if (newId) onStartedNow(newId)
      } else {
        toast.success(editing ? 'تم تعديل الجلسة' : 'تمت جدولة الجلسة')
      }
    } catch {
      toast.error('فشل الاتصال بالخادم')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editing ? 'تعديل بيانات الجلسة' : 'بث مباشر جديد'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'حدّث تفاصيل الجلسة المجدولة.'
              : 'ابدأ بثاً فورياً يفتح غرفة مباشرة الآن، أو جدول جلسة لوقت لاحق.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 py-1">
          {/* Mode toggle (create only) */}
          {!editing && (
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
              <button
                type="button"
                onClick={() => setMode('instant')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${
                  mode === 'instant' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Zap className="w-4 h-4" />
                ابدأ الآن
              </button>
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${
                  mode === 'schedule' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                جدولة لاحقاً
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="course">
              الدورة التدريبية <span className="text-destructive">*</span>
            </Label>
            <select
              id="course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="" disabled>
                {courses.length === 0 ? 'لا توجد دورات متاحة' : 'اختر الدورة...'}
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              عنوان الجلسة <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-11"
              placeholder="مثال: مراجعة الوحدة الأولى وتطبيقات عملية"
            />
          </div>

          {!isInstant && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  التاريخ <span className="text-destructive">*</span>
                </Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">
                  الوقت <span className="text-destructive">*</span>
                </Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">المدة (دقيقة)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="240"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">عدد الطلاب (الحد الأقصى)</Label>
              <Input
                id="max"
                type="number"
                min="1"
                max="500"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">محاور الجلسة (اختياري)</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
              placeholder="نبذة عمّا سيتم تغطيته"
            />
          </div>

          {/* Options */}
          <div className="rounded-xl border divide-y">
            <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
              <div className="flex items-start gap-2">
                <Megaphone className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-bold">إشعار الطلاب</div>
                  <p className="text-xs text-muted-foreground">تنبيه جميع المسجلين في الدورة بهذه الجلسة</p>
                </div>
              </div>
              <Switch checked={announce} onCheckedChange={setAnnounce} />
            </label>

            <div className="p-4 space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-start gap-2">
                  <Globe2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">جلسة عامة</div>
                    <p className="text-xs text-muted-foreground">إنشاء رابط للدخول كضيف بدون تسجيل</p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </label>
              {isPublic && (
                <Input
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="اسم السلسلة / التصنيف (اختياري)"
                  className="h-10 text-sm"
                />
              )}
            </div>

            <div className="flex items-start gap-2 p-4 bg-muted/30">
              <Video className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                يتم تسجيل الجلسة تلقائياً وحفظها في "التسجيلات" عند تفعيل خاصية التسجيل من إعدادات الأكاديمية.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[140px] gap-2">
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isInstant ? (
                <Radio className="w-4 h-4" />
              ) : (
                <CalendarClock className="w-4 h-4" />
              )}
              {submitting ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : isInstant ? 'ابدأ البث الآن' : 'جدولة الجلسة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
