'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  BookOpen,
  Calendar,
  Trophy,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Shield,
  BarChart3,
  Sparkles,
  Award,
  Layers,
  Video,
  GraduationCap,
  Download,
  Pencil,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ScheduleItem {
  id: string
  type: 'booking' | 'course_session'
  title: string | null
  counterpart_name: string | null
  scheduled_at: string
  status: string
  meeting_link: string | null
  course_title: string | null
}

interface CertificateItem {
  id: string
  kind: string
  status: string
  source_label: string | null
  certificate_number: string | null
  pdf_url: string | null
  issued_at: string | null
  requested_at: string | null
}

interface SeriesItem {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  subject: string | null
  item_count: number
}

interface PathItem {
  id: string
  type: 'memorization' | 'tajweed'
  title: string
  level: string | null
  thumbnail_url: string | null
  status: string
  completed: number
  total: number | null
  last_activity_at: string | null
}

interface ChildDetail {
  link: {
    id: string
    relation: string
    linked_at: string
    confirmed_at: string | null
  }
  child: {
    id: string
    name: string
    email: string
    avatar_url: string | null
    gender: string | null
    created_at: string
    has_academy_access: boolean
    has_quran_access: boolean
  }
  progress: {
    total_courses: number
    active_courses: number
    completed_courses: number
    avg_progress: number
    total_recitations_30d: number
  }
  enrollments: Array<{
    id: string
    course_id: string
    course_title: string
    status: string
    progress: number
    enrolled_at: string
  }>
  recent_recitations: Array<{
    id: string
    surah_name: string
    surah_number: number
    verdict: string | null
    notes: string | null
    created_at: string
  }>
  upcoming_bookings: Array<{
    id: string
    reader_name: string
    scheduled_at: string
    status: string
    meeting_link: string | null
  }>
  weekly_activity: Array<{
    day_offset: number
    count: number
  }>
  badges: Array<{
    id: string
    badge_name: string
    badge_description: string | null
    badge_icon: string | null
    earned_at: string
  }>
  schedule: ScheduleItem[]
  certificates: CertificateItem[]
  series: SeriesItem[]
  paths: PathItem[]
}

const relationLabels: Record<string, { ar: string; en: string }> = {
  father: { ar: 'أب', en: 'Father' },
  mother: { ar: 'أم', en: 'Mother' },
  guardian: { ar: 'ولي أمر', en: 'Guardian' },
  other: { ar: 'أخرى', en: 'Other' },
}

const verdictLabels: Record<string, { ar: string; en: string; tone: 'good' | 'warn' | 'bad' }> = {
  approved: { ar: 'مقبولة', en: 'Approved', tone: 'good' },
  accepted: { ar: 'مقبولة', en: 'Accepted', tone: 'good' },
  passed: { ar: 'ناجحة', en: 'Passed', tone: 'good' },
  needs_improvement: { ar: 'تحتاج تحسين', en: 'Needs work', tone: 'warn' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', tone: 'bad' },
  failed: { ar: 'غير مقبولة', en: 'Failed', tone: 'bad' },
}

const certStatusLabels: Record<string, { ar: string; en: string; tone: 'good' | 'warn' | 'bad' | 'info' }> = {
  issued: { ar: 'صادرة', en: 'Issued', tone: 'good' },
  approved: { ar: 'معتمدة', en: 'Approved', tone: 'good' },
  submitted: { ar: 'قيد المراجعة', en: 'Under review', tone: 'info' },
  data_required: { ar: 'بانتظار البيانات', en: 'Data required', tone: 'warn' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', tone: 'bad' },
}

function fmtDate(s: string | null, isAr: boolean) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fmtDateTime(s: string | null, isAr: boolean) {
  if (!s) return '—'
  return new Date(s).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [detail, setDetail] = useState<ChildDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingRelation, setSavingRelation] = useState(false)

  useEffect(() => {
    fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/detail`)
      if (res.ok) {
        const data = await res.json()
        setDetail(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const updateRelation = async (relation: string) => {
    if (!detail || relation === detail.link.relation) return
    setSavingRelation(true)
    try {
      const res = await fetch(`/api/academy/parent/children/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relation }),
      })
      if (res.ok) {
        setDetail((prev) => (prev ? { ...prev, link: { ...prev.link, relation } } : prev))
        toast.success(isAr ? 'تم تحديث صلة القرابة' : 'Relation updated')
      } else {
        toast.error(isAr ? 'تعذر التحديث' : 'Update failed')
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setSavingRelation(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!detail?.child) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {isAr ? 'الطالب غير موجود أو غير مربوط بحسابك.' : 'Student not found or not linked.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    child,
    link,
    progress,
    enrollments,
    recent_recitations,
    weekly_activity,
    badges,
    schedule,
    certificates,
    series,
    paths,
  } = detail

  const hasAcademy = child.has_academy_access
  const hasQuran = child.has_quran_access
  const isMixed = hasAcademy && hasQuran
  const showAcademy = hasAcademy || (!hasAcademy && !hasQuran)
  const showQuran = hasQuran

  const accountTypeLabel = isMixed
    ? isAr ? 'أكاديمية ومقرأة' : 'Academy & Maqraa'
    : showQuran && !hasAcademy
      ? isAr ? 'مقرأة' : 'Maqraa'
      : isAr ? 'أكاديمية' : 'Academy'

  // Chart data with real weekday labels (offset 6 = oldest, 0 = today)
  const chartData = [...weekly_activity]
    .sort((a, b) => b.day_offset - a.day_offset)
    .map((d) => {
      const dt = new Date(Date.now() - d.day_offset * 86_400_000)
      return {
        name: dt.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short' }),
        count: d.count,
      }
    })
  const hasWeeklyActivity = weekly_activity.some((d) => d.count > 0)
  const weeklyTotal = weekly_activity.reduce((s, d) => s + d.count, 0)

  const now = Date.now()
  const upcomingSchedule = schedule
    .filter((s) => new Date(s.scheduled_at).getTime() >= now && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const pastSchedule = schedule.filter(
    (s) => new Date(s.scheduled_at).getTime() < now || s.status === 'cancelled'
  )

  const issuedCerts = certificates.filter((c) => c.status === 'issued')
  const otherCerts = certificates.filter((c) => c.status !== 'issued')

  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const tabs: Array<{ value: string; label: string }> = [
    { value: 'overview', label: isAr ? 'نظرة' : 'Overview' },
    { value: 'courses', label: isAr ? 'الدورات' : 'Courses' },
    { value: 'series', label: isAr ? 'السلاسل والمسارات' : 'Series & Paths' },
    { value: 'schedule', label: isAr ? 'المواعيد' : 'Schedule' },
    { value: 'certificates', label: isAr ? 'الشهادات' : 'Certificates' },
    ...(showQuran ? [{ value: 'recitations', label: isAr ? 'التلاوات' : 'Recitations' }] : []),
    { value: 'badges', label: isAr ? 'الشارات' : 'Badges' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back Link */}
      <Link
        href="/academy/parent/children"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة لقائمة الأبناء' : 'Back to children'}
      </Link>

      {/* Hero Profile */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border border-primary/10 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.06),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 shrink-0 ring-4 ring-background shadow-lg">
            <AvatarImage src={child.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
              {child.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-foreground">{child.name}</h1>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isMixed
                    ? 'border-violet-500/30 text-violet-600 dark:text-violet-400'
                    : showQuran && !hasAcademy
                      ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'border-blue-500/30 text-blue-600 dark:text-blue-400'
                }`}
              >
                {accountTypeLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {child.email}
            </p>
            {/* Editable relation */}
            <div className="flex items-center gap-2 mt-3">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {isAr ? 'صلة القرابة:' : 'Relation:'}
              </span>
              <Select
                value={link.relation}
                onValueChange={updateRelation}
                disabled={savingRelation}
              >
                <SelectTrigger className="h-8 w-36 rounded-lg text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(relationLabels).map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {relationLabels[r][locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {savingRelation && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isAr ? 'ربط منذ' : 'Linked since'} {fmtDate(link.linked_at, isAr)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={`/academy/parent/messages?child_id=${id}`}>
              <Button variant="outline" size="sm" className="rounded-xl font-bold">
                <MessageSquare className="w-4 h-4 me-1.5" />
                {isAr ? 'مراسلة' : 'Message'}
              </Button>
            </Link>
            <Link href={`/academy/parent/children/${id}/restrictions`}>
              <Button variant="outline" size="sm" className="rounded-xl font-bold">
                <Shield className="w-4 h-4 me-1.5" />
                {isAr ? 'تقييد' : 'Restrict'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {showAcademy && (
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-emerald-500" />}
            tint="bg-emerald-500/10"
            label={isAr ? 'الدورات' : 'Courses'}
            value={progress.total_courses}
            sub={`${progress.active_courses} ${isAr ? 'نشط' : 'active'} · ${progress.completed_courses} ${isAr ? 'مكتمل' : 'done'}`}
          />
        )}
        {showAcademy && (
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isAr ? 'التقدم' : 'Progress'}
                </span>
              </div>
              <div className="text-3xl font-black text-foreground">{progress.avg_progress}%</div>
              <Progress value={progress.avg_progress} className="h-1.5 mt-2 bg-primary/10" />
            </CardContent>
          </Card>
        )}
        {showQuran && (
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-violet-500" />}
            tint="bg-violet-500/10"
            label={isAr ? 'تلاوات' : 'Recitations'}
            value={progress.total_recitations_30d}
            sub={isAr ? 'آخر ٣٠ يوم' : 'Last 30 days'}
          />
        )}
        <StatCard
          icon={<Award className="w-5 h-5 text-amber-500" />}
          tint="bg-amber-500/10"
          label={isAr ? 'الشهادات' : 'Certificates'}
          value={issuedCerts.length}
          sub={isAr ? 'شهادة صادرة' : 'issued'}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  {isAr ? 'نشاط الأسبوع' : 'Weekly Activity'}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {weeklyTotal} {isAr ? 'نشاط' : 'activities'}
                </Badge>
              </div>
              {hasWeeklyActivity ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        reversed={isAr}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        orientation={isAr ? 'right' : 'left'}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '13px',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                        name={isAr ? 'النشاط' : 'Activity'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
                  {isAr ? 'لا يوجد نشاط هذا الأسبوع' : 'No activity this week'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming preview */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'أقرب المواعيد' : 'Next Sessions'}
              </h3>
              {upcomingSchedule.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {isAr ? 'لا توجد مواعيد قادمة.' : 'No upcoming sessions.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingSchedule.slice(0, 3).map((s) => (
                    <ScheduleRow key={s.id} item={s} isAr={isAr} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'الدورات المسجَّلة' : 'Enrolled Courses'}
              </h3>
              {enrollments.length === 0 ? (
                <EmptyState
                  icon={<GraduationCap className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'لا يوجد دورات مسجلة.' : 'No enrolled courses.'}
                />
              ) : (
                <div className="space-y-3">
                  {enrollments.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {e.course_title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={e.progress} className="h-1.5 flex-1 bg-primary/10" />
                          <span className="text-xs font-bold text-muted-foreground shrink-0">
                            {e.progress}%
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={e.status === 'completed' ? 'default' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {e.status === 'completed'
                          ? isAr ? 'مكتمل' : 'Done'
                          : e.status === 'pending'
                            ? isAr ? 'قيد الانتظار' : 'Pending'
                            : isAr ? 'نشط' : 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Series & Paths Tab */}
        <TabsContent value="series" className="mt-6 space-y-6">
          {/* Learning Paths */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {isAr ? 'مسارات الحفظ والتجويد' : 'Memorization & Tajweed Paths'}
              </h3>
              {paths.length === 0 ? (
                <EmptyState
                  icon={<GraduationCap className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'غير مشترك في أي مسار.' : 'Not enrolled in any path.'}
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {paths.map((p) => {
                    const pct =
                      p.total && p.total > 0
                        ? Math.min(100, Math.round((p.completed / p.total) * 100))
                        : 0
                    return (
                      <div
                        key={`${p.type}-${p.id}`}
                        className="p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              p.type === 'memorization'
                                ? 'bg-violet-500/10'
                                : 'bg-blue-500/10'
                            }`}
                          >
                            <GraduationCap
                              className={`w-5 h-5 ${
                                p.type === 'memorization' ? 'text-violet-500' : 'text-blue-500'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {p.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {p.type === 'memorization'
                                ? isAr ? 'حفظ' : 'Memorization'
                                : isAr ? 'تجويد' : 'Tajweed'}
                              {p.level ? ` · ${p.level}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5 flex-1 bg-primary/10" />
                          <span className="text-xs font-bold text-muted-foreground shrink-0">
                            {p.completed}/{p.total ?? '—'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Series */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {isAr ? 'السلاسل التعليمية' : 'Learning Series'}
              </h3>
              {series.length === 0 ? (
                <EmptyState
                  icon={<Layers className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'غير مشترك في أي سلسلة.' : 'Not part of any series.'}
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {series.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground truncate">{s.title}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {s.subject ? `${s.subject} · ` : ''}
                          {s.item_count} {isAr ? 'عنصر' : 'items'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'المواعيد القادمة' : 'Upcoming Sessions'}
              </h3>
              {upcomingSchedule.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'لا توجد مواعيد قادمة.' : 'No upcoming sessions.'}
                />
              ) : (
                <div className="space-y-2">
                  {upcomingSchedule.map((s) => (
                    <ScheduleRow key={s.id} item={s} isAr={isAr} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {pastSchedule.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {isAr ? 'مواعيد سابقة' : 'Past Sessions'}
                </h3>
                <div className="space-y-2">
                  {pastSchedule.slice(0, 20).map((s) => (
                    <ScheduleRow key={s.id} item={s} isAr={isAr} past />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'الشهادات الصادرة' : 'Issued Certificates'}
              </h3>
              {issuedCerts.length === 0 ? (
                <EmptyState
                  icon={<Award className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'لا توجد شهادات صادرة بعد.' : 'No certificates issued yet.'}
                />
              ) : (
                <div className="space-y-3">
                  {issuedCerts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-amber-200/40 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10"
                    >
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {c.source_label || (isAr ? 'شهادة' : 'Certificate')}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {c.certificate_number ? `${c.certificate_number} · ` : ''}
                          {fmtDate(c.issued_at, isAr)}
                        </p>
                      </div>
                      {c.pdf_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-8 text-xs shrink-0"
                          asChild
                        >
                          <a href={c.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3.5 h-3.5 me-1" />
                            {isAr ? 'تحميل' : 'Download'}
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {otherCerts.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {isAr ? 'قيد الإصدار' : 'In Progress'}
                </h3>
                <div className="space-y-2">
                  {otherCerts.map((c) => {
                    const st = certStatusLabels[c.status]
                    const cls =
                      st?.tone === 'good'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : st?.tone === 'bad'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : st?.tone === 'info'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm text-foreground truncate">
                            {c.source_label || (isAr ? 'شهادة' : 'Certificate')}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${cls}`}>
                          {st ? st[locale] : c.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recitations Tab */}
        {showQuran && (
          <TabsContent value="recitations" className="mt-6">
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {isAr ? 'التلاوات الأخيرة' : 'Recent Recitations'}
                </h3>
                {recent_recitations.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles className="w-10 h-10 text-muted-foreground/30" />}
                    text={isAr ? 'لا توجد تلاوات بعد.' : 'No recitations yet.'}
                  />
                ) : (
                  <div className="space-y-2">
                    {recent_recitations.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{r.surah_name}</h4>
                            {r.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {r.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {r.verdict &&
                            (() => {
                              const v = verdictLabels[r.verdict.toLowerCase()]
                              const tone = v?.tone ?? 'warn'
                              const cls =
                                tone === 'good'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : tone === 'bad'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              return (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cls}`}>
                                  {v ? v[locale] : r.verdict}
                                </span>
                              )
                            })()}
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(r.created_at, isAr)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'الشارات المكتسبة' : 'Earned Badges'}
              </h3>
              {badges.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-10 h-10 text-muted-foreground/30" />}
                  text={isAr ? 'لم يحصل على شارات بعد.' : 'No badges earned yet.'}
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border/50 hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground">{b.badge_name}</h4>
                        {b.badge_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {b.badge_description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {fmtDate(b.earned_at, isAr)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon,
  tint,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  tint: string
  label: string
  value: number
  sub?: string
}) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="text-3xl font-black text-foreground">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
      {icon}
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function ScheduleRow({
  item,
  isAr,
  past,
}: {
  item: ScheduleItem
  isAr: boolean
  past?: boolean
}) {
  const isBooking = item.type === 'booking'
  const title = isBooking
    ? `${isAr ? 'حجز تلاوة' : 'Recitation'}${item.counterpart_name ? ' — ' + item.counterpart_name : ''}`
    : item.title || item.course_title || (isAr ? 'حصة' : 'Session')
  const statusCancelled = item.status === 'cancelled'
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isBooking ? 'bg-blue-500/10' : 'bg-emerald-500/10'
          }`}
        >
          {isBooking ? (
            <Calendar className="w-5 h-5 text-blue-500" />
          ) : (
            <Video className="w-5 h-5 text-emerald-500" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-foreground truncate">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtDateTime(item.scheduled_at, isAr)}
            {!isBooking && item.course_title && (
              <span className="truncate"> · {item.course_title}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!past && item.meeting_link && !statusCancelled && (
          <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs" asChild>
            <a href={item.meeting_link} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="w-3 h-3 me-1" />
              {isAr ? 'انضمام' : 'Join'}
            </a>
          </Button>
        )}
        <Badge variant={statusCancelled ? 'destructive' : past ? 'outline' : 'secondary'} className="text-[10px]">
          {statusCancelled
            ? isAr ? 'ملغاة' : 'Cancelled'
            : past
              ? isAr ? 'منتهية' : 'Done'
              : isAr ? 'قادم' : 'Upcoming'}
        </Badge>
      </div>
    </div>
  )
}
