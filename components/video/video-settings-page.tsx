"use client"


import { useI18n } from '@/lib/i18n/context';
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  Film,
  Loader2,
  Mic,
  MonitorPlay,
  Radio,
  Save,
  Settings as SettingsIcon,
  Star,
  Users,
  Video as VideoIcon,
  XCircle,
} from 'lucide-react'

type Platform = 'academy' | 'maqraa'

interface VideoSettings {
  platform: Platform
  max_participants: number
  default_video_quality: 'h180' | 'h360' | 'h540' | 'h720' | 'h1080'
  default_audio_only: boolean
  recording_enabled: boolean
  recording_auto_start: boolean
  recording_storage_url: string | null
  allow_chat: boolean
  allow_screen_share: boolean
  allow_student_unmute: boolean
  allow_student_video: boolean
  require_approval_to_join: boolean
  max_duration_minutes: number
  inactivity_timeout_minutes: number
  show_participant_count: boolean
  enable_post_session_rating: boolean
  watermark_text: string | null
  updated_at: string
}

interface Stats {
  total_sessions: number
  total_minutes: number
  total_unique_participants: number
  active_sessions: number
  sessions_last_7_days: number
  avg_duration_minutes: number
  avg_rating: number | null
  rated_sessions: number
  live_rooms: number
  live_participants: number
  livekit_configured: boolean
  by_kind: Array<{ kind: string; count: number }>
}

interface SessionRow {
  id: string
  kind: string
  title: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  peak_participants: number
  total_participants: number
  participants_count: number
  recording_status: string
  recording_url: string | null
  ratings_count: number
  avg_rating: number | null
  started_by_name: string | null
}

interface Props {
  platform: Platform
  /** Where the "كل الجلسات" link should point. */
  sessionsBasePath: string
}

function getKindLabel(kind: string, vs: Record<string, string> | undefined): string {
  if (kind === 'halaqa') return vs?.kindHalaqa ?? 'Halaqa'
  if (kind === 'booking') return vs?.kindBooking ?? 'Private Session'
  if (kind === 'course_session') return vs?.kindCourse ?? 'Live Lesson'
  return kind
}

function getQualityLabel(q: string, vs: Record<string, string> | undefined): string {
  if (q === 'h180') return vs?.q180 ?? '180p (Very Low)'
  if (q === 'h360') return vs?.q360 ?? '360p (Low)'
  if (q === 'h540') return vs?.q540 ?? '540p (Medium)'
  if (q === 'h720') return vs?.q720 ?? '720p HD (Recommended)'
  if (q === 'h1080') return vs?.q1080 ?? '1080p Full HD'
  return q
}

export function VideoSettingsPage({ platform, sessionsBasePath }: Props) {
  const { t, locale } = useI18n();
  const isAr = locale === 'ar';
  const vs = (t as any).videoSettings as Record<string, string> | undefined;
  const [settings, setSettings] = useState<VideoSettings | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [capabilities, setCapabilities] = useState<{
    livekit_configured: boolean
    recording_configured: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'settings' | 'log'>('overview')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sr, st, ss] = await Promise.all([
        fetch(`/api/video/settings?platform=${platform}`).then((r) => r.json()),
        fetch(`/api/video/stats?platform=${platform}`).then((r) => r.json()),
        fetch(`/api/video/sessions?platform=${platform}&limit=50`).then((r) => r.json()),
      ])
      if (sr.error) throw new Error(sr.error)
      setSettings(sr.data)
      setCapabilities(sr.capabilities)
      setStats(st.data)
      setSessions(ss.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : (isAr ? 'تعذر تحميل البيانات' : 'Failed to load data'))
    } finally {
      setLoading(false)
    }
  }, [platform])

  useEffect(() => {
    load()
  }, [load])

  const update = useCallback(
    <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
    },
    []
  )

  const save = useCallback(async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/video/settings?platform=${platform}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || (isAr ? 'فشل الحفظ' : 'Save failed'))
      setSettings(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : (isAr ? 'فشل الحفظ' : 'Save failed'))
    } finally {
      setSaving(false)
    }
  }, [settings, platform])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error || !settings || !stats) {
    return (
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 text-center mt-12">
        <p className="text-sm text-rose-500 mb-3">{error || (isAr ? 'تعذر تحميل البيانات' : 'Failed to load data')}</p>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold">
          {isAr ? 'إعادة المحاولة' : 'Retry'}</button>
      </div>
    )
  }

  const platformLabel = platform === 'academy'
    ? (vs?.academy ?? 'Academy')
    : (vs?.maqraah ?? 'Maqraah')
  const accent = platform === 'academy' ? 'indigo' : 'emerald'
  const accentBg = accent === 'indigo' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  const accentBtn = accent === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-emerald-500 hover:bg-emerald-600'
  const accentGrad = accent === 'indigo' ? 'from-indigo-500/10 via-indigo-500/0' : 'from-emerald-500/10 via-emerald-500/0'

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${accentGrad} to-transparent p-6`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className={`inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full border ${accentBg} mb-3`}>
              <Radio className="w-3 h-3" /> {vs?.platform ?? 'Platform'}: {platformLabel}
            </div>
            <h1 className="text-2xl font-bold mb-1">{vs?.pageTitle ?? 'Stream & Video Settings'}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {vs?.pageDesc ?? 'Full control over video quality, recording, and live statistics.'}</p>
          </div>
          <CapabilitiesBadge caps={capabilities} vs={vs} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={<Activity className="w-4 h-4" />} label={vs?.tabOverview ?? 'Overview'} />
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<SettingsIcon className="w-4 h-4" />} label={vs?.tabSettings ?? 'Settings'} />
        <TabButton active={tab === 'log'} onClick={() => setTab('log')} icon={<Film className="w-4 h-4" />} label={vs?.tabLog ?? 'Session Log'} />
      </div>

      {tab === 'overview' && (
        <OverviewTab stats={stats} onViewAll={() => setTab('log')} />
      )}

      {tab === 'settings' && (
        <SettingsTab
          settings={settings}
          update={update}
          onSave={save}
          saving={saving}
          accentBtn={accentBtn}
          capabilities={capabilities}
        />
      )}

      {tab === 'log' && (
        <SessionLogTab sessions={sessions} sessionsBasePath={sessionsBasePath} />
      )}
    </div>
  )
}

function CapabilitiesBadge({
  caps,
  vs,
}: {
  caps: { livekit_configured: boolean; recording_configured: boolean } | null
  vs: Record<string, string> | undefined
}) {
  if (!caps) return null
  return (
    <div className="flex flex-col gap-1.5">
      <CapabilityRow ok={caps.livekit_configured} label="LiveKit" />
      <CapabilityRow ok={caps.recording_configured} label={vs?.recordingStorage ?? 'Recording Storage (S3)'} />
    </div>
  )
}

function CapabilityRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
      ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {label}
    </span>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
        active
          ? 'border-emerald-500 text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'live' | 'success' | 'warning'
}) {
  const tones = {
    default: 'bg-card border-border',
    live: 'bg-rose-500/5 border-rose-500/30',
    success: 'bg-emerald-500/5 border-emerald-500/30',
    warning: 'bg-amber-500/5 border-amber-500/30',
  }
  return (
    <div className={`rounded-2xl p-4 border ${tones[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function OverviewTab({ stats, onViewAll }: { stats: Stats; onViewAll: () => void }) {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const vs = (t as any).videoSettings as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Radio className="w-4 h-4" />}
          label={vs?.liveRooms ?? 'Live Rooms Now'}
          value={stats.live_rooms}
          hint={`${stats.live_participants} ${vs?.participantsNow ?? 'participants now'}`}
          tone={stats.live_rooms > 0 ? 'live' : 'default'}
        />
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label={vs?.totalSessions ?? 'Total Sessions'}
          value={stats.total_sessions.toLocaleString()}
          hint={`${stats.sessions_last_7_days} ${vs?.last7Days ?? 'in last 7 days'}`}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label={vs?.totalMinutes ?? 'Total Minutes'}
          value={stats.total_minutes.toLocaleString()}
          hint={`${vs?.avg ?? 'Avg'} ${stats.avg_duration_minutes} ${vs?.minPerSession ?? 'min/session'}`}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label={vs?.uniqueUsers ?? 'Unique Users'}
          value={stats.total_unique_participants.toLocaleString()}
          hint={vs?.joinedAtLeastOne ?? 'Joined at least one session'}
        />
        <StatCard
          icon={<Star className="w-4 h-4" />}
          label={vs?.avgRating ?? 'Avg. Rating'}
          value={stats.avg_rating != null ? `${Number(stats.avg_rating).toFixed(2)} / 5` : '—'}
          hint={`${stats.rated_sessions} ${vs?.ratedSessions ?? 'rated sessions'}`}
          tone={stats.avg_rating && stats.avg_rating >= 4 ? 'success' : 'default'}
        />
        <StatCard
          icon={<MonitorPlay className="w-4 h-4" />}
          label={getKindLabel('halaqa', vs)}
          value={stats.by_kind.find((k) => k.kind === 'halaqa')?.count || 0}
        />
        <StatCard
          icon={<Mic className="w-4 h-4" />}
          label={getKindLabel('booking', vs)}
          value={stats.by_kind.find((k) => k.kind === 'booking')?.count || 0}
        />
        <StatCard
          icon={<VideoIcon className="w-4 h-4" />}
          label={getKindLabel('course_session', vs)}
          value={stats.by_kind.find((k) => k.kind === 'course_session')?.count || 0}
        />
      </div>

      {!stats.livekit_configured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="font-bold text-amber-700 dark:text-amber-300 mb-1">{vs?.livekitNotConfigured ?? 'LiveKit not configured'}</p>
          <p className="text-muted-foreground">
            {vs?.livekitHint1 ?? 'Add'} <code className="text-xs px-1 py-0.5 bg-muted rounded">LIVEKIT_API_KEY</code> {vs?.and ?? 'and'} <code className="text-xs px-1 py-0.5 bg-muted rounded mx-1">LIVEKIT_API_SECRET</code> {vs?.and ?? 'and'} <code className="text-xs px-1 py-0.5 bg-muted rounded">LIVEKIT_URL</code> {vs?.toEnvVars ?? 'to environment variables to enable streaming.'}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-bold">{vs?.recentSessions ?? 'Recent Sessions'}</h3>
        <button type="button" onClick={onViewAll} className="text-xs text-emerald-600 hover:underline">
          {vs?.viewAll ?? 'View All'}</button>
      </div>
    </div>
  )
}

function SettingsTab({
  settings,
  capabilities,
  saving,
  update,
  onSave,
  accentBtn,
}: {
  settings: VideoSettings
  capabilities: { livekit_configured: boolean; recording_configured: boolean } | null
  saving: boolean
  update: <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => void
  onSave: () => void
  accentBtn: string
}) {
  const { t } = useI18n()
  const vs = (t as any).videoSettings as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      <SettingsCard title={vs?.cardQuality ?? 'Video Quality & Limits'}>
        <SelectRow
          label={vs?.defaultQuality ?? 'Default Video Quality'}
          value={settings.default_video_quality}
          onChange={(v) => update('default_video_quality', v as VideoSettings['default_video_quality'])}
          options={[
            { value: 'h180', label: getQualityLabel('h180', vs) },
            { value: 'h360', label: getQualityLabel('h360', vs) },
            { value: 'h540', label: getQualityLabel('h540', vs) },
            { value: 'h720', label: getQualityLabel('h720', vs) },
            { value: 'h1080', label: getQualityLabel('h1080', vs) },
          ]}
        />
        <NumberRow
          label={vs?.maxParticipants ?? 'Max Participants'}
          value={settings.max_participants}
          onChange={(v) => update('max_participants', v)}
          min={2}
          max={500}
          hint={vs?.maxParticipantsHint ?? 'Number of participants who can join any session simultaneously'}
        />
        <NumberRow
          label={vs?.maxDuration ?? 'Max Session Duration (minutes)'}
          value={settings.max_duration_minutes}
          onChange={(v) => update('max_duration_minutes', v)}
          min={15}
          max={720}
        />
        <NumberRow
          label={vs?.inactivityTimeout ?? 'Inactivity Timeout (minutes)'}
          value={settings.inactivity_timeout_minutes}
          onChange={(v) => update('inactivity_timeout_minutes', v)}
          min={1}
          max={120}
          hint={vs?.inactivityTimeoutHint ?? 'Auto-close room after inactivity'}
        />
        <ToggleRow
          label={vs?.audioOnly ?? 'Audio-only sessions (default)'}
          hint={vs?.audioOnlyHint ?? 'Reduces internet usage'}
          value={settings.default_audio_only}
          onChange={(v) => update('default_audio_only', v)}
        />
      </SettingsCard>

      <SettingsCard title={vs?.cardRecording ?? 'Recording'}>
        <ToggleRow
          label={vs?.allowRecording ?? 'Allow session recording'}
          hint={vs?.allowRecordingHint ?? 'Enables the recording button inside the broadcast room for the host'}
          value={settings.recording_enabled}
          onChange={(v) => update('recording_enabled', v)}
        />
        <ToggleRow
          label={vs?.autoRecording ?? 'Auto-start recording when session begins'}
          hint={vs?.autoRecordingHint ?? 'Starts recording every session as soon as it opens'}
          value={settings.recording_auto_start}
          onChange={(v) => update('recording_auto_start', v)}
          disabled={!settings.recording_enabled}
        />
        {capabilities && settings.recording_enabled && (
          capabilities.recording_configured ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>{vs?.s3Enabled ?? 'Cloud storage is active. Recordings are saved automatically and appear in the Sessions & Live tab under Recordings.'}</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              <span className="mt-0.5 text-amber-600">⚠️</span>
              <span>
                {vs?.s3NotConfigured ?? 'Cloud storage (S3) is not configured on the server, so recording will not start. The system administrator needs to set:'}{' '}
                <code className="font-mono">AWS_ACCESS_KEY_ID</code>{', '}
                <code className="font-mono">AWS_SECRET_ACCESS_KEY</code>{', '}
                <code className="font-mono">AWS_S3_BUCKET_NAME</code>{', '}
                <code className="font-mono">AWS_REGION</code>.
              </span>
            </div>
          )
        )}
      </SettingsCard>

      <SettingsCard title={vs?.cardPermissions ?? 'Participant Permissions'}>
        <ToggleRow label={vs?.allowChat ?? 'Allow in-room chat'} value={settings.allow_chat} onChange={(v) => update('allow_chat', v)} />
        <ToggleRow label={vs?.allowScreenShare ?? 'Allow screen sharing'} value={settings.allow_screen_share} onChange={(v) => update('allow_screen_share', v)} />
        <ToggleRow label={vs?.allowStudentUnmute ?? 'Allow students to unmute'} value={settings.allow_student_unmute} onChange={(v) => update('allow_student_unmute', v)} />
        <ToggleRow label={vs?.allowStudentVideo ?? 'Allow students to turn on camera'} value={settings.allow_student_video} onChange={(v) => update('allow_student_video', v)} />
        <ToggleRow label={vs?.requireApproval ?? 'Require host approval before joining'} value={settings.require_approval_to_join} onChange={(v) => update('require_approval_to_join', v)} />
      </SettingsCard>

      <SettingsCard title={vs?.cardUX ?? 'User Experience'}>
        <ToggleRow label={vs?.showParticipantCount ?? 'Show participant count'} value={settings.show_participant_count} onChange={(v) => update('show_participant_count', v)} />
        <ToggleRow label={vs?.enableRating ?? 'Enable post-session rating'} value={settings.enable_post_session_rating} onChange={(v) => update('enable_post_session_rating', v)} />
        <TextRow
          label={vs?.watermark ?? 'Watermark (optional)'}
          placeholder={vs?.watermarkPlaceholder ?? 'e.g. itqan academy'}
          value={settings.watermark_text || ''}
          onChange={(v) => update('watermark_text', v || null)}
          hint={vs?.watermarkHint ?? 'Text displayed semi-transparently in the broadcast room'}
        />
      </SettingsCard>

      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold shadow-lg ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? (vs?.saving ?? 'Saving...') : (vs?.saveSettings ?? 'Save Settings')}
        </button>
      </div>
    </div>
  )
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h3 className="font-bold mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-emerald-500' : 'bg-muted'
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            value ? '-translate-x-5' : '-translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function NumberRow({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  hint?: string
}) {
  return (
    <div className="grid sm:grid-cols-[1fr_auto] sm:items-center gap-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 px-3 py-2 rounded-lg bg-background border border-border text-sm font-bold text-center"
      />
    </div>
  )
}

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="grid sm:grid-cols-[1fr_auto] sm:items-center gap-2">
      <p className="text-sm font-medium">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-background border border-border text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextRow({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function SessionLogTab({
  sessions,
  sessionsBasePath,
}: {
  sessions: SessionRow[]
  sessionsBasePath: string
}) {
  const { t } = useI18n()
  const vs = (t as any).videoSettings as Record<string, string> | undefined

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{vs?.noSessionsYet ?? 'No sessions yet.'}</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <Link
          key={s.id}
          href={`/${sessionsBasePath}/${s.id}`.replace('//', '/')}
          className="block rounded-xl border border-border bg-card hover:border-emerald-500/40 transition-colors p-4"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {getKindLabel(s.kind, vs)}
                </span>
                {!s.ended_at && !s.recording_url && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> {vs?.liveBadge ?? 'Live'}</span>
                )}
                {s.recording_url && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    <Circle className="w-2 h-2 fill-current" /> {vs?.recordingAvailable ?? 'Recording available'}</span>
                )}
                {s.avg_rating != null && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Star className="w-2.5 h-2.5 fill-current" /> {Number(s.avg_rating).toFixed(1)} ({s.ratings_count})
                  </span>
                )}
              </div>
              <p className="font-bold truncate">{s.title || getKindLabel(s.kind, vs)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(s.started_at).toLocaleString()}
                {s.started_by_name && ` · ${vs?.startedBy ?? 'Started by'} ${s.started_by_name}`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center shrink-0">
              <SessionStat label={vs?.duration ?? 'Duration'} value={s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}m` : '—'} />
              <SessionStat label={vs?.peak ?? 'Peak'} value={s.peak_participants} icon={<Users className="w-3 h-3" />} />
              <SessionStat label={vs?.participants ?? 'Participants'} value={s.participants_count} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function SessionStat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1 justify-center">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  )
}
