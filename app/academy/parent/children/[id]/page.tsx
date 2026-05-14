'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Loader2,
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Mail,
  ShieldAlert,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface OverviewData {
  child: { id: string; name: string; email: string; avatar_url: string | null } | null
  link: { id: string; relation: string; confirmed_at: string | null }
  recitations: { total: number; mastered: number; pending: number; last_at: string | null }
  sessions: { total: number; attended: number; upcoming: number; last_at: string | null }
  badges: { total: number; recent_at: string | null }
  paths: {
    memorization: { title: string; units_completed: number; total_units: number } | null
    tajweed: { title: string; stages_completed: number; total_stages: number } | null
  }
  enrollments: { active_count: number }
}

function fmtDate(s: string | null, isAr: boolean) {
  if (!s) return isAr ? '—' : '—'
  return new Date(s).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function statusLabel(s: string, isAr: boolean) {
  const map: Record<string, { ar: string; en: string }> = {
    pending: { ar: 'قيد المراجعة', en: 'Pending' },
    in_review: { ar: 'قيد المراجعة', en: 'In Review' },
    mastered: { ar: 'متقن', en: 'Mastered' },
    needs_session: { ar: 'بحاجة لجلسة', en: 'Needs Session' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    confirmed: { ar: 'مؤكد', en: 'Confirmed' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' },
  }
  const l = map[s]
  return l ? (isAr ? l.ar : l.en) : s
}

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [recitations, setRecitations] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [courseSessions, setCourseSessions] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reportSending, setReportSending] = useState(false)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, rec, ses, bds] = await Promise.all([
          fetch(`/api/academy/parent/children/${id}/overview`).then((r) => r.json()),
          fetch(`/api/academy/parent/children/${id}/recitations`).then((r) => r.json()),
          fetch(`/api/academy/parent/children/${id}/sessions`).then((r) => r.json()),
          fetch(`/api/academy/parent/children/${id}/badges`).then((r) => r.json()),
        ])
        if (ov && !ov.error) setOverview(ov)
        if (rec.recitations) setRecitations(rec.recitations)
        if (ses.bookings) setBookings(ses.bookings)
        if (ses.course_sessions) setCourseSessions(ses.course_sessions)
        if (bds.badges) setBadges(bds.badges)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const sendReport = async () => {
    setReportSending(true)
    setReportMessage(null)
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/send-report`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.ok) {
        setReportMessage(isAr ? 'تم إرسال التقرير الأسبوعي إلى بريدك.' : 'Weekly report sent to your email.')
      } else {
        setReportMessage(
          (isAr ? 'تعذر الإرسال: ' : 'Could not send: ') + (data.error || 'unknown')
        )
      }
    } catch {
      setReportMessage(isAr ? 'فشل الاتصال بالخادم' : 'Connection error')
    } finally {
      setReportSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!overview?.child) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {isAr ? 'الطالب غير موجود أو غير مربوط بحسابك.' : 'Student not found or not linked.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const child = overview.child
  const allSessions = [...bookings, ...courseSessions].sort(
    (a, b) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at)
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <Link
        href="/academy/parent/children"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة لقائمة الأبناء' : 'Back to children'}
      </Link>

      {/* Header */}
      <Card className="rounded-3xl border-border/50 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {child.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-black">{child.name}</h1>
              <div className="text-sm text-muted-foreground" dir="ltr">
                <Mail className="w-3 h-3 inline" /> {child.email}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={sendReport} disabled={reportSending}>
              {reportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 me-2" />
                  {isAr ? 'إرسال التقرير الأسبوعي' : 'Send weekly report'}
                </>
              )}
            </Button>
            <Link href={`/academy/parent/children/${id}/restrictions`}>
              <Button variant="outline">
                <ShieldAlert className="w-4 h-4 me-2" />
                {isAr ? 'تقييد المحتوى' : 'Restrictions'}
              </Button>
            </Link>
            <Link href={`/academy/parent/messages?child_id=${id}`}>
              <Button>
                <MessageSquare className="w-4 h-4 me-2" />
                {isAr ? 'مراسلة المعلم' : 'Message teacher'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {reportMessage && (
        <div className="p-3 rounded-xl border bg-muted/30 text-sm">{reportMessage}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">
                {isAr ? 'تلاوات' : 'Recitations'}
              </span>
            </div>
            <div className="text-3xl font-black">{overview.recitations.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isAr
                ? `${overview.recitations.mastered} متقنة • ${overview.recitations.pending} قيد المراجعة`
                : `${overview.recitations.mastered} mastered • ${overview.recitations.pending} pending`}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-muted-foreground">
                {isAr ? 'جلسات' : 'Sessions'}
              </span>
            </div>
            <div className="text-3xl font-black">{overview.sessions.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isAr
                ? `${overview.sessions.attended} حضر • ${overview.sessions.upcoming} قادم`
                : `${overview.sessions.attended} attended • ${overview.sessions.upcoming} upcoming`}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span className="text-xs text-muted-foreground">
                {isAr ? 'شارات' : 'Badges'}
              </span>
            </div>
            <div className="text-3xl font-black">{overview.badges.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {fmtDate(overview.badges.recent_at, isAr)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <span className="text-xs text-muted-foreground">
                {isAr ? 'مسارات نشطة' : 'Active paths'}
              </span>
            </div>
            <div className="text-3xl font-black">{overview.enrollments.active_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current level */}
      {(overview.paths.memorization || overview.paths.tajweed) && (
        <div className="grid md:grid-cols-2 gap-4">
          {overview.paths.memorization && (
            <Card className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-emerald-700/80 mb-1">
                  {isAr ? 'مسار الحفظ' : 'Memorization path'}
                </div>
                <div className="font-bold text-lg">{overview.paths.memorization.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {overview.paths.memorization.units_completed}/{overview.paths.memorization.total_units}{' '}
                  {isAr ? 'وحدة' : 'units'}
                </div>
              </CardContent>
            </Card>
          )}
          {overview.paths.tajweed && (
            <Card className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-blue-700/80 mb-1">
                  {isAr ? 'مسار التجويد' : 'Tajweed path'}
                </div>
                <div className="font-bold text-lg">{overview.paths.tajweed.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {overview.paths.tajweed.stages_completed}/{overview.paths.tajweed.total_stages}{' '}
                  {isAr ? 'مرحلة' : 'stages'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="recitations" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="recitations">
            {isAr ? 'التلاوات' : 'Recitations'}
          </TabsTrigger>
          <TabsTrigger value="sessions">
            {isAr ? 'الجلسات' : 'Sessions'}
          </TabsTrigger>
          <TabsTrigger value="badges">
            {isAr ? 'الشارات' : 'Badges'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recitations" className="mt-4">
          {recitations.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                {isAr ? 'لا توجد تلاوات بعد.' : 'No recitations yet.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recitations.map((r) => (
                <Card key={r.id} className="rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold">{r.surah_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isAr ? 'من آية' : 'From'} {r.ayah_from} {isAr ? 'إلى' : 'to'} {r.ayah_to}{' '}
                        {r.reader_name ? `• ${r.reader_name}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {statusLabel(r.status, isAr)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(r.created_at, isAr)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          {allSessions.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                {isAr ? 'لا توجد جلسات.' : 'No sessions.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {allSessions.map((s, idx) => (
                <Card key={`${s.id}-${idx}`} className="rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold">{s.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDate(s.scheduled_at, isAr)}
                        {s.counterpart_name ? ` • ${s.counterpart_name}` : ''}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {statusLabel(s.status, isAr)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          {badges.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                {isAr ? 'لم يحصل على شارات بعد.' : 'No badges yet.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {badges.map((b) => (
                <Card key={b.id} className="rounded-xl">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold">{b.badge_name}</div>
                      {b.badge_description && (
                        <div className="text-sm text-muted-foreground">{b.badge_description}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmtDate(b.awarded_at, isAr)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
