"use client"


import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Users,
  Loader2,
  Video,
  Radio,
  CalendarClock,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  PlayCircle,
  TrendingUp,
  CalendarDays,
  ClipboardList,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { GENDER_LABELS, type HalaqaPlatform } from '@/lib/halaqat'
import { useI18n } from '@/lib/i18n/context'

interface Halaqa {
  id: string
  name: string
  description: string | null
  teacher_id: string | null
  teacher_name: string | null
  gender: string
  max_students: number
  current_students: number
  meeting_link: string | null
  is_active: boolean
  platform: HalaqaPlatform
  scheduled_at: string | null
  duration_minutes: number | null
  is_live: boolean
}

interface Classmate {
  enrollment_id: string
  student_id: string
  student_name: string
  avatar_url: string | null
  is_active: boolean
}

interface AttendanceRecord {
  id: string
  session_date: string
  status: string
  notes: string | null
}

interface SessionRecord {
  id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  recording_status: string | null
  recording_url: string | null
  total_participants: number
}

interface Overview {
  joined_at: string | null
  attendance: AttendanceRecord[]
  sessions: SessionRecord[]
  stats: {
    total: number
    present: number
    late: number
    absent: number
    excused: number
    attendance_rate: number
    total_sessions_held: number
  }
}

type Tab = 'overview' | 'sessions' | 'attendance' | 'classmates'

function getAttendanceStyles(th: Record<string, string> | undefined): Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> {
  return {
    present: { label: th?.attendPresent ?? 'Present', cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15', Icon: CheckCircle2 },
    late: { label: th?.attendLate ?? 'Late', cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/15', Icon: Clock },
    excused: { label: th?.attendExcused ?? 'Excused', cls: 'text-sky-600 dark:text-sky-400 bg-sky-500/15', Icon: AlertCircle },
    absent: { label: th?.attendAbsent ?? 'Absent', cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/15', Icon: XCircle },
  }
}

function fmtDate(value: string | null, withTime = false): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

function fmtDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

export function StudentHalaqaDetail({
  halaqaId,
  basePath,
}: {
  halaqaId: string
  basePath: string
}) {
  const { t } = useI18n();
  const th = (t as any).halaqat as Record<string, string> | undefined
  const attendanceStyles = getAttendanceStyles(th)

  const [halaqa, setHalaqa] = useState<Halaqa | null>(null)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  const refresh = useCallback(async () => {
    try {
      const [hRes, sRes, oRes] = await Promise.all([
        fetch(`/api/halaqat/${halaqaId}`),
        fetch(`/api/halaqat/${halaqaId}/students`),
        fetch(`/api/halaqat/${halaqaId}/student-overview`),
      ])
      if (hRes.status === 403 || hRes.status === 404) {
        setForbidden(true)
        return
      }
      if (hRes.ok) {
        const json = await hRes.json()
        setHalaqa(json.data)
      }
      if (sRes.ok) {
        const json = await sRes.json()
        setClassmates(json.students || [])
      }
      if (oRes.ok) {
        setOverview(await oRes.json())
      }
    } catch (e) {
      console.error('failed to load student halaqa detail', e)
    } finally {
      setLoading(false)
    }
  }, [halaqaId])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (forbidden || !halaqa) {
    return (
      <div className="text-center py-16">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-muted-foreground">{th?.notFoundOrNotEnrolled ?? 'Halaqa not found or you are not enrolled'}</p>
        <Link href={basePath} className="inline-block mt-4 text-indigo-600 hover:underline">
          {th?.backToHalaqat ?? 'Back to Halaqat'}</Link>
      </div>
    )
  }

  const stats = overview?.stats
  const scheduled = fmtDate(halaqa.scheduled_at, true)
  const activeClassmates = classmates.filter((c) => c.is_active)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-500 p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              href={basePath}
              className="shrink-0 p-2 -m-2 hover:bg-white/15 rounded-lg transition-colors"
              aria-label={th?.back ?? 'Back'}
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 flex-wrap">
                {halaqa.name}
                {halaqa.is_live && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse" /> {th?.liveNowBadge ?? th?.statusLive ?? 'Live'}</span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/90">
                {halaqa.teacher_name && (
                  <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                    <GraduationCap className="w-3 h-3" /> {halaqa.teacher_name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" /> {halaqa.current_students}/{halaqa.max_students}
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                  {GENDER_LABELS[halaqa.gender] || (th?.mixed ?? 'Mixed')}
                </span>
                {halaqa.duration_minutes && (
                  <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> {halaqa.duration_minutes} {th?.minute ?? 'min'}</span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`${basePath}/${halaqaId}/live`}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors ${
              halaqa.is_live
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            {halaqa.is_live ? (th?.joinLiveNow ?? 'Join Live Now') : (th?.enterRoom ?? 'Enter Room')}
          </Link>
        </div>
        {halaqa.description && (
          <p className="text-sm text-white/85 mt-4 leading-relaxed">{halaqa.description}</p>
        )}
      </div>

      {/* Personal stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label={th?.myAttendanceRate ?? th?.attendanceRate ?? 'Attendance Rate'}
          value={`${stats?.attendance_rate ?? 0}%`}
          accent="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label={th?.timesPresent ?? th?.attendance ?? 'Times Present'}
          value={stats?.present ?? 0}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={<CalendarDays className="w-4 h-4" />}
          label={th?.sessionsHeld ?? 'Sessions Held'}
          value={stats?.total_sessions_held ?? 0}
          accent="text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label={th?.myClassmates ?? 'My Classmates'}
          value={activeClassmates.length}
          accent="text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {([
          { key: 'overview', label: th?.tabOverview ?? 'Overview', Icon: Sparkles },
          { key: 'sessions', label: th?.tabSessionsRecordings ?? 'Sessions & Recordings', Icon: PlayCircle },
          { key: 'attendance', label: th?.tabMyAttendance ?? 'My Attendance', Icon: ClipboardList },
          { key: 'classmates', label: `${th?.tabClassmates ?? 'Classmates'} (${activeClassmates.length})`, Icon: Users },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key
                ? 'border-indigo-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile title={th?.infoStatus ?? 'Status'} value={halaqa.is_active ? (th?.activeBadge ?? 'Active') : (th?.inactiveBadge ?? 'Inactive')} accent={halaqa.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'} />
          <InfoTile title={th?.infoTeacher ?? 'Teacher'} value={halaqa.teacher_name || (th?.unspecified ?? 'Unspecified')} />
          <InfoTile title={th?.infoNextSchedule ?? 'Next Session'} value={halaqa.scheduled_at ? scheduled : (th?.toBeAnnounced ?? 'To be announced')} />
          <InfoTile title={th?.infoJoinDate ?? 'My Join Date'} value={fmtDate(overview?.joined_at ?? null)} />
          <InfoTile title={th?.timesLate ?? 'Times Late'} value={stats?.late ?? 0} accent="text-amber-600 dark:text-amber-400" />
          <InfoTile title={th?.timesAbsent ?? 'Times Absent'} value={stats?.absent ?? 0} accent="text-rose-600 dark:text-rose-400" />
          {halaqa.meeting_link && (
            <InfoTile
              title={th?.infoAltLink ?? 'External Meeting Link'}
              value={<a className="text-indigo-600 dark:text-indigo-400 underline" href={halaqa.meeting_link} target="_blank" rel="noreferrer">{th?.openLink ?? 'Open Link'}</a>}
            />
          )}
        </div>
      )}

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="space-y-3">
          {!overview || overview.sessions.length === 0 ? (
            <EmptyState icon={<PlayCircle className="w-8 h-8" />} text={th?.noSessionsYet ?? 'No sessions held yet'} />
          ) : (
            overview.sessions.map((s) => {
              const live = !s.ended_at
              const hasRecording = s.recording_status === 'ready' && s.recording_url
              return (
                <div key={s.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${live ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'}`}>
                    {live ? <Radio className="w-5 h-5 animate-pulse" /> : <CalendarClock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{fmtDate(s.started_at, true)}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                      <span>{live ? (th?.liveNowBadge ?? 'Live Now') : `${th?.duration ?? 'Duration'}: ${fmtDuration(s.duration_seconds)}`}</span>
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {s.total_participants} {th?.participants ?? 'participants'}</span>
                    </div>
                  </div>
                  {live ? (
                    <Link
                      href={`${basePath}/${halaqaId}/live`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      <Video className="w-4 h-4" /> {th?.joinLiveNow ?? 'Join'}</Link>
                  ) : hasRecording ? (
                    <a
                      href={s.recording_url!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" /> {th?.recording ?? 'Recording'}</a>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">{th?.noRecording ?? 'No recording'}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Attendance tab */}
      {tab === 'attendance' && (
        <div className="space-y-3">
          {!overview || overview.attendance.length === 0 ? (
            <EmptyState icon={<ClipboardList className="w-8 h-8" />} text={th?.noAttendanceYet ?? 'No attendance records yet'} />
          ) : (
            overview.attendance.map((a) => {
              const style = attendanceStyles[a.status] || attendanceStyles.present
              return (
                <div key={a.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.cls}`}>
                    <style.Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{fmtDate(a.session_date)}</p>
                    {a.notes && <p className="text-xs text-muted-foreground truncate">{a.notes}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.cls}`}>
                    {style.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Classmates tab */}
      {tab === 'classmates' && (
        <div className="space-y-3">
          {activeClassmates.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8" />} text={th?.noClassmatesYet ?? 'No classmates in this halaqa yet'} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeClassmates.map((c) => (
                <div key={c.enrollment_id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center overflow-hidden shrink-0">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url || "/placeholder.svg"} alt={c.student_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">{c.student_name.charAt(0)}</span>
                    )}
                  </div>
                  <p className="font-bold text-sm truncate">{c.student_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent?: string
}) {
  const { t } = useI18n();

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span className={accent || 'text-muted-foreground'}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-extrabold ${accent || ''}`}>{value}</p>
    </div>
  )
}

function InfoTile({
  title,
  value,
  accent,
}: {
  title: string
  value: React.ReactNode
  accent?: string
}) {
  const { t } = useI18n();

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className={`font-bold ${accent || ''}`}>{value}</p>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { t } = useI18n();

  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-3 text-muted-foreground opacity-70">
        {icon}
      </div>
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}
