"use client"


const t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  Chat,
  ConnectionStateToast,
  useTracks,
  useLocalParticipant,
  useParticipants,
  formatChatMessageLinks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import {
  Loader2,
  LogOut,
  Radio,
  Star,
  Video,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  X,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { ClientRecorder } from './client-recorder'

export type VideoCallKind = 'halaqa' | 'booking' | 'session' | 'course_session'

interface Props {
  kind: VideoCallKind
  refId: string
  title?: string
  subtitle?: string
  /** Where to go when the user clicks "leave" / disconnects. */
  exitHref: string
  /** Hex/Tailwind colour for the accent badge, e.g. 'emerald'. */
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose'
  /** Join as a hidden stealth admin */
  stealth?: boolean
}

interface TokenResponse {
  token: string
  url: string
  roomName: string
  role: 'host' | 'participant' | 'viewer'
  identity: string
  name?: string
  platform: 'academy' | 'maqraa'
  videoSessionId: string | null
  settings: {
    recording_enabled: boolean
    recording_auto_start: boolean
    allow_chat: boolean
    allow_screen_share: boolean
    allow_student_unmute: boolean
    allow_student_video: boolean
    default_video_quality: string
    default_audio_only: boolean
    show_participant_count: boolean
    watermark_text: string | null
    max_participants: number
  }
}

type Locale = 'ar' | 'en'

interface T {
  preparing: string
  checking: string
  cantOpen: string
  unknownError: string
  tokenError: string
  urlError: string
  back: string
  roomFallback: string
  live: string
  host: string
  participant: string
  leave: string
  mic: string
  micOff: string
  camera: string
  cameraOff: string
  share: string
  stopShare: string
  chat: string
  participants: string
  leaveTitle: string
  leaveDesc: string
  stay: string
  ratingTitle: string
  ratingDesc: string
  overall: string
  audioQ: string
  videoQ: string
  teacherPerf: string
  notesPlaceholder: string
  skip: string
  submit: string
  submitting: string
  thanksTitle: string
  thanksDesc: string
  starsLabel: (n: number) => string
  waitingTitle: string
  waitingDesc: string
}

const STR: Record<Locale, T> = {
  ar: {
    preparing: ((t as any).extracted_2026_v2?.["جاري تجهيز غرفة البث المباشر…"] || "جاري تجهيز غرفة البث المباشر…"),
    checking: ((t as any).extracted_2026_v2?.["يتم التحقق من الصلاحيات والاتصال بالخادم"] || "يتم التحقق من الصلاحيات والاتصال بالخادم"),
    cantOpen: ((t as any).extracted_2026_v2?.["تعذر فتح الغرفة"] || "تعذر فتح الغرفة"),
    unknownError: ((t as any).extracted_2026_v2?.["خطأ غير معروف"] || "خطأ غير معروف"),
    tokenError: ((t as any).extracted_2026_v2?.["تعذر إنشاء رمز الدخول"] || "تعذر إنشاء رمز الدخول"),
    urlError: ((t as any).extracted_2026_v2?.["عنوان خادم البث غير معرّف"] || "عنوان خادم البث غير معرّف"),
    back: ((t as any).extracted_2026_v2?.["رجوع"] || "رجوع"),
    roomFallback: ((t as any).extracted_2026_v2?.["غرفة الجلسة"] || "غرفة الجلسة"),
    live: ((t as any).extracted_2026_v2?.["مباشر"] || "مباشر"),
    host: ((t as any).extracted_2026_v2?.["المضيف"] || "المضيف"),
    participant: ((t as any).extracted_2026_v2?.["مشارك"] || "مشارك"),
    leave: ((t as any).extracted_2026_v2?.["خروج"] || "خروج"),
    mic: ((t as any).extracted_2026_v2?.["الميكروفون"] || "الميكروفون"),
    micOff: ((t as any).extracted_2026_v2?.["كتم"] || "كتم"),
    camera: ((t as any).extracted_2026_v2?.["الكاميرا"] || "الكاميرا"),
    cameraOff: ((t as any).extracted_2026_v2?.["إيقاف الكاميرا"] || "إيقاف الكاميرا"),
    share: ((t as any).extracted_2026_v2?.["مشاركة الشاشة"] || "مشاركة الشاشة"),
    stopShare: ((t as any).extracted_2026_v2?.["إيقاف المشاركة"] || "إيقاف المشاركة"),
    chat: ((t as any).extracted_2026_v2?.["المحادثة"] || "المحادثة"),
    participants: ((t as any).extracted_2026_v2?.["المشاركون"] || "المشاركون"),
    leaveTitle: ((t as any).extracted_2026_v2?.["هل تريد الخروج؟"] || "هل تريد الخروج؟"),
    leaveDesc: ((t as any).extracted_2026_v2?.["سيتم قطع الاتصال بهذه الجلسة."] || "سيتم قطع الاتصال بهذه الجلسة."),
    stay: ((t as any).extracted_2026_v2?.["البقاء"] || "البقاء"),
    ratingTitle: ((t as any).extracted_2026_v2?.["قيّم هذه الجلسة"] || "قيّم هذه الجلسة"),
    ratingDesc: ((t as any).extracted_2026_v2?.["رأيك يهمنا — سيظهر للمدرّس والإدارة فقط."] || "رأيك يهمنا — سيظهر للمدرّس والإدارة فقط."),
    overall: ((t as any).extracted_2026_v2?.["التقييم العام"] || "التقييم العام"),
    audioQ: ((t as any).extracted_2026_v2?.["جودة الصوت"] || "جودة الصوت"),
    videoQ: ((t as any).extracted_2026_v2?.["جودة الفيديو"] || "جودة الفيديو"),
    teacherPerf: ((t as any).extracted_2026_v2?.["أداء المدرّس"] || "أداء المدرّس"),
    notesPlaceholder: ((t as any).extracted_2026_v2?.["ملاحظات إضافية (اختياري)"] || "ملاحظات إضافية (اختياري)"),
    skip: ((t as any).extracted_2026_v2?.["تخطي"] || "تخطي"),
    submit: ((t as any).extracted_2026_v2?.["إرسال التقييم"] || "إرسال التقييم"),
    submitting: ((t as any).extracted_2026_v2?.["جاري الإرسال…"] || "جاري الإرسال…"),
    thanksTitle: ((t as any).extracted_2026_v2?.["شكراً على تقييمك"] || "شكراً على تقييمك"),
    thanksDesc: ((t as any).extracted_2026_v2?.["سيساعدنا في تحسين الجلسات القادمة."] || "سيساعدنا في تحسين الجلسات القادمة."),
    starsLabel: (n: number) => `${n} نجوم`,
    waitingTitle: ((t as any).extracted_2026_v2?.["بانتظار انضمام المشاركين"] || "بانتظار انضمام المشاركين"),
    waitingDesc: ((t as any).extracted_2026_v2?.["سيظهر المشاركون هنا بمجرد دخولهم الغرفة."] || "سيظهر المشاركون هنا بمجرد دخولهم الغرفة."),
  },
  en: {
    preparing: 'Preparing the live room…',
    checking: 'Verifying permissions and connecting to the server',
    cantOpen: 'Couldn’t open the room',
    unknownError: 'Unknown error',
    tokenError: 'Failed to create an access token',
    urlError: 'Streaming server URL is not configured',
    back: 'Back',
    roomFallback: 'Session room',
    live: 'Live',
    host: 'Host',
    participant: 'Participant',
    leave: 'Leave',
    mic: 'Microphone',
    micOff: 'Mute',
    camera: 'Camera',
    cameraOff: 'Stop camera',
    share: 'Share screen',
    stopShare: 'Stop sharing',
    chat: 'Chat',
    participants: 'Participants',
    leaveTitle: 'Leave the session?',
    leaveDesc: 'You’ll be disconnected from this session.',
    stay: 'Stay',
    ratingTitle: 'Rate this session',
    ratingDesc: 'Your feedback matters — visible only to the teacher and admins.',
    overall: 'Overall rating',
    audioQ: 'Audio quality',
    videoQ: 'Video quality',
    teacherPerf: 'Teacher performance',
    notesPlaceholder: 'Additional notes (optional)',
    skip: 'Skip',
    submit: 'Submit rating',
    submitting: 'Submitting…',
    thanksTitle: 'Thanks for your feedback',
    thanksDesc: 'It helps us improve future sessions.',
    starsLabel: (n: number) => `${n} stars`,
    waitingTitle: 'Waiting for participants',
    waitingDesc: 'Participants will appear here once they join the room.',
  },
}

const ACCENTS: Record<NonNullable<Props['accent']>, { chip: string; gradient: string; solid: string }> = {
  emerald: {
    chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    gradient: 'from-emerald-600/20 via-emerald-500/5 to-transparent',
    solid: 'bg-emerald-500 hover:bg-emerald-600',
  },
  indigo: {
    chip: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    gradient: 'from-indigo-600/20 via-indigo-500/5 to-transparent',
    solid: 'bg-indigo-500 hover:bg-indigo-600',
  },
  amber: {
    chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    gradient: 'from-amber-600/20 via-amber-500/5 to-transparent',
    solid: 'bg-amber-500 hover:bg-amber-600',
  },
  rose: {
    chip: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    gradient: 'from-rose-600/20 via-rose-500/5 to-transparent',
    solid: 'bg-rose-500 hover:bg-rose-600',
  },
}

export function HalaqaVideoRoom({ kind, refId, title, subtitle, exitHref, accent = 'emerald', stealth }: Props) {
  const router = useRouter()
  const { locale } = useI18n()
  const lang: Locale = locale === 'en' ? 'en' : 'ar'
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const t = STR[lang]

  const [data, setData] = useState<TokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  const apiKind = kind === 'session' ? 'session' : kind

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: apiKind, id: refId, stealth }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || t.tokenError)
        if (cancelled) return
        if (!json.url) throw new Error(t.urlError)
        setData(json as TokenResponse)
        startedAtRef.current = Date.now()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t.unknownError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKind, refId])

  useEffect(() => {
    if (!data) return
    const i = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(i)
  }, [data])

  const accentTheme = useMemo(() => ACCENTS[accent], [accent])
  const isHost = data?.role === 'host'
  const sessionId = data?.videoSessionId

  const handleLeave = useCallback(() => {
    if (sessionId && data?.role !== 'host') {
      setShowLeaveConfirm(false)
      setShowRating(true)
      return
    }
    router.push(exitHref)
  }, [router, exitHref, sessionId, data?.role])

  if (loading) {
    return (
      <div dir={dir} className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-6">
        <div className="relative">
          <div className={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${accentTheme.gradient}`} />
          <Loader2 className="relative w-12 h-12 animate-spin text-emerald-400" />
        </div>
        <p className="text-base font-medium text-foreground">{t.preparing}</p>
        <p className="text-xs text-muted-foreground">{t.checking}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div dir={dir} className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-4 mt-12">
        <Video className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">{t.cantOpen}</h2>
        <p className="text-sm text-muted-foreground">{error || t.unknownError}</p>
        <button
          onClick={() => router.push(exitHref)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 rtl:rotate-180" /> {t.back}
        </button>
      </div>
    )
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div dir={dir} className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col">
      {/* Header bar */}
      <div className={`relative shrink-0 border-b border-white/10 bg-gradient-to-b ${accentTheme.gradient}`}>
        <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center ${accentTheme.chip} border`}>
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold truncate text-sm sm:text-base">{title || t.roomFallback}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs opacity-70 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full border ${accentTheme.chip}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {t.live} · {timeStr}
            </span>
            <span className="hidden md:inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-white/10 border border-white/10">
              {data.role === 'host' ? t.host : t.participant}
            </span>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              {t.leave}
            </button>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="relative flex-1 min-h-0" data-lk-theme="default">
        <LiveKitRoom
          serverUrl={data.url}
          token={data.token}
          connect
          audio={data.settings.allow_student_unmute || isHost}
          video={!data.settings.default_audio_only && (data.settings.allow_student_video || isHost)}
          onDisconnected={() => {
            if (sessionId && data.role !== 'host') {
              setShowRating(true)
            } else {
              router.push(exitHref)
            }
          }}
          style={{ height: '100%' }}
        >
          <ConferenceView
            t={t}
            dir={dir}
            isHost={isHost}
            settings={data.settings}
            accent={accentTheme}
            onLeave={() => setShowLeaveConfirm(true)}
          />
          <RoomAudioRenderer />
          {isHost && sessionId && data.settings.recording_enabled && (
            <div className="absolute top-2 ltr:left-2 rtl:right-2 z-20 pointer-events-auto">
              <ClientRecorder sessionId={sessionId} enabled autoStart={data.settings.recording_auto_start} />
            </div>
          )}
        </LiveKitRoom>
        {data.settings.watermark_text && (
          <div className="pointer-events-none absolute bottom-20 ltr:right-3 rtl:left-3 text-[11px] font-bold opacity-40 select-none">
            {data.settings.watermark_text}
          </div>
        )}
      </div>

      {showLeaveConfirm && (
        <LeaveConfirm t={t} dir={dir} onCancel={() => setShowLeaveConfirm(false)} onConfirm={handleLeave} />
      )}

      {showRating && sessionId && (
        <RatingModal
          t={t}
          dir={dir}
          accentSolid={accentTheme.solid}
          sessionId={sessionId}
          onClose={() => {
            setShowRating(false)
            router.push(exitHref)
          }}
        />
      )}
    </div>
  )
}

/* ----------------------------- Conference View ---------------------------- */

function ConferenceView({
  t,
  dir,
  isHost,
  settings,
  accent,
  onLeave,
}: {
  t: T
  dir: 'rtl' | 'ltr'
  isHost: boolean
  settings: TokenResponse['settings']
  accent: { chip: string; gradient: string; solid: string }
  onLeave: () => void
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(false)

  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  })
  const screenTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }], {
    onlySubscribed: false,
  })
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()

  const hasScreen = screenTracks.length > 0

  const allParticipants = useMemo(() => {
    return localParticipant ? [localParticipant, ...participants] : participants
  }, [localParticipant, participants])

  const getParticipantRoleInfo = (p: any) => {
    let role = ''
    if (p.metadata) {
      try {
        const meta = JSON.parse(p.metadata)
        role = meta.role || ''
      } catch (e) {
        // ignore
      }
    }
    const isAr = dir === 'rtl'
    if (role === 'teacher') return { label: ((t as any).extracted_2026_v2?.[((t as any).extracted_2026_v2?.["المعلم"] || "المعلم")] || ((t as any).extracted_2026_v2?.["المعلم"] || "المعلم")), color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' }
    if (role === 'reader') return { label: ((t as any).extracted_2026_v2?.[((t as any).extracted_2026_v2?.["المقرئ"] || "المقرئ")] || ((t as any).extracted_2026_v2?.["المقرئ"] || "المقرئ")), color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' }
    if (role === 'admin' || role === 'academy_admin') return { label: ((t as any).extracted_2026_v2?.[((t as any).extracted_2026_v2?.["مشرف"] || "مشرف")] || ((t as any).extracted_2026_v2?.["مشرف"] || "مشرف")), color: 'text-rose-300 border-rose-500/30 bg-rose-500/10' }
    if (role === 'reciter_supervisor') return { label: ((t as any).extracted_2026_v2?.[((t as any).extracted_2026_v2?.["مشرف"] || "مشرف")] || ((t as any).extracted_2026_v2?.["مشرف"] || "مشرف")), color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10' }
    if (role === 'student') return { label: ((t as any).extracted_2026_v2?.[((t as any).extracted_2026_v2?.["طالب"] || "طالب")] || ((t as any).extracted_2026_v2?.["طالب"] || "طالب")), color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' }
    return null
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Tiles */}
      <div className="flex-1 min-h-0 p-2 sm:p-3 pb-24">
        {cameraTracks.length === 0 && !hasScreen ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-zinc-400">
            <Users className="w-10 h-10 opacity-50" />
            <p className="font-semibold text-zinc-200">{t.waitingTitle}</p>
            <p className="text-sm max-w-xs">{t.waitingDesc}</p>
          </div>
        ) : hasScreen ? (
          <div className="h-full flex flex-col gap-2">
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/10">
              <ParticipantTile trackRef={screenTracks[0]} />
            </div>
            {cameraTracks.length > 0 && (
              <div className="h-24 sm:h-28 flex gap-2 overflow-x-auto shrink-0">
                {cameraTracks.map((track) => (
                  <div
                    key={`${track.participant.identity}-${track.source}`}
                    className="w-36 sm:w-44 shrink-0 rounded-lg overflow-hidden bg-black/40 ring-1 ring-white/10"
                  >
                    <ParticipantTile trackRef={track} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <GridLayout tracks={cameraTracks} className="h-full">
            <ParticipantTile />
          </GridLayout>
        )}
      </div>

      {/* Floating control bar */}
      <ControlBar
        t={t}
        isHost={isHost}
        settings={settings}
        accent={accent}
        participantCount={allParticipants.length}
        chatOpen={chatOpen}
        onToggleChat={() => {
          setChatOpen((v) => !v)
          setParticipantsOpen(false)
        }}
        participantsOpen={participantsOpen}
        onToggleParticipants={() => {
          setParticipantsOpen((v) => !v)
          setChatOpen(false)
        }}
        onLeave={onLeave}
      />

      {/* Chat panel */}
      {settings.allow_chat && (
        <div
          className={`absolute top-0 bottom-0 ltr:right-0 rtl:left-0 w-full sm:w-80 bg-zinc-900/95 backdrop-blur border-white/10 ltr:border-l rtl:border-r z-30 flex flex-col transition-transform duration-300 ${
            chatOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> {t.chat}
            </h3>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={t.chat}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0" dir={dir}>
            <Chat messageFormatter={formatChatMessageLinks} style={{ height: '100%' }} />
          </div>
        </div>
      )}

      {/* Participants panel */}
      {settings.show_participant_count && (
        <div
          className={`absolute top-0 bottom-0 ltr:right-0 rtl:left-0 w-full sm:w-80 bg-zinc-900/95 backdrop-blur border-white/10 ltr:border-l rtl:border-r z-30 flex flex-col transition-transform duration-300 ${
            participantsOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> {t.participants}
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-zinc-300">
                {allParticipants.length}
              </span>
            </h3>
            <button
              onClick={() => setParticipantsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={t.participants}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" dir={dir}>
            {allParticipants.map((p) => {
              const name = p.name || p.identity
              const isLocal = p.identity === localParticipant?.identity
              const roleInfo = getParticipantRoleInfo(p)
              const initial = name ? name.trim().charAt(0).toUpperCase() : '?'

              return (
                <div
                  key={p.identity}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center font-bold text-sm text-zinc-200 shrink-0 select-none">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-zinc-100 truncate">
                          {name}
                        </span>
                        {isLocal && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1 py-0.5 rounded">
                            {dir === 'rtl' ? ((t as any).extracted_2026_v2?.["أنت"] || "أنت") : 'You'}
                          </span>
                        )}
                      </div>
                      {roleInfo && (
                        <div className="mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`p-1.5 rounded-lg ${p.isMicrophoneEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {p.isMicrophoneEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-1.5 rounded-lg ${p.isCameraEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {p.isCameraEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConnectionStateToast />
    </div>
  )
}

/* ------------------------------- Control Bar ------------------------------ */

function ControlBar({
  t,
  isHost,
  settings,
  accent,
  participantCount,
  chatOpen,
  onToggleChat,
  participantsOpen,
  onToggleParticipants,
  onLeave,
}: {
  t: T
  isHost: boolean
  settings: TokenResponse['settings']
  accent: { chip: string; gradient: string; solid: string }
  participantCount: number
  chatOpen: boolean
  onToggleChat: () => void
  participantsOpen: boolean
  onToggleParticipants: () => void
  onLeave: () => void
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant()

  const canMic = isHost || settings.allow_student_unmute
  const canCam = isHost || (settings.allow_student_video && !settings.default_audio_only)
  const canShare = isHost || settings.allow_screen_share

  return (
    <div className="absolute bottom-3 inset-x-0 z-30 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-zinc-900/85 backdrop-blur-md border border-white/10 shadow-2xl px-2 py-2">
        {canMic && (
          <CtrlButton
            active={isMicrophoneEnabled}
            label={t.mic}
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            iconOn={<Mic className="w-5 h-5" />}
            iconOff={<MicOff className="w-5 h-5" />}
          />
        )}
        {canCam && (
          <CtrlButton
            active={isCameraEnabled}
            label={t.camera}
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            iconOn={<Video className="w-5 h-5" />}
            iconOff={<VideoOff className="w-5 h-5" />}
          />
        )}
        {canShare && (
          <CtrlButton
            active={isScreenShareEnabled}
            highlight={isScreenShareEnabled}
            label={isScreenShareEnabled ? t.stopShare : t.share}
            onClick={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
            iconOn={<MonitorUp className="w-5 h-5" />}
            iconOff={<MonitorUp className="w-5 h-5" />}
          />
        )}
        {settings.allow_chat && (
          <CtrlButton
            active={chatOpen}
            highlight={chatOpen}
            label={t.chat}
            onClick={onToggleChat}
            iconOn={<MessageSquare className="w-5 h-5" />}
            iconOff={<MessageSquare className="w-5 h-5" />}
          />
        )}

        {settings.show_participant_count && (
          <button
            onClick={onToggleParticipants}
            title={t.participants}
            aria-label={t.participants}
            aria-pressed={participantsOpen}
            className={`flex items-center gap-1.5 px-3 h-11 rounded-xl text-sm font-bold mx-0.5 transition-colors ${
              participantsOpen
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-zinc-200 hover:bg-white/10 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            {participantCount}
          </button>
        )}

        <div className="w-px h-7 bg-white/10 mx-0.5" />

        <button
          onClick={onLeave}
          className="flex items-center gap-2 h-11 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-colors"
        >
          <LogOut className="w-5 h-5 rtl:rotate-180" />
          <span className="hidden sm:inline">{t.leave}</span>
        </button>
      </div>
    </div>
  )
}

function CtrlButton({
  active,
  highlight,
  label,
  onClick,
  iconOn,
  iconOff,
}: {
  active: boolean
  highlight?: boolean
  label: string
  onClick: () => void
  iconOn: React.ReactNode
  iconOff: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center w-12 sm:w-14 h-11 rounded-xl transition-colors ${
        highlight
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : active
            ? 'bg-white/10 text-white hover:bg-white/15'
            : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
      }`}
    >
      {active ? iconOn : iconOff}
    </button>
  )
}

/* ------------------------------ Leave confirm ----------------------------- */

function LeaveConfirm({
  t,
  dir,
  onCancel,
  onConfirm,
}: {
  t: T
  dir: 'rtl' | 'ltr'
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div dir={dir} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold mb-2">{t.leaveTitle}</h3>
        <p className="text-sm text-zinc-400 mb-5">{t.leaveDesc}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold">
            {t.stay}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold">
            {t.leave}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Rating modal ----------------------------- */

function RatingModal({
  t,
  dir,
  accentSolid,
  sessionId,
  onClose,
}: {
  t: T
  dir: 'rtl' | 'ltr'
  accentSolid: string
  sessionId: string
  onClose: () => void
}) {
  const [rating, setRating] = useState(0)
  const [audio, setAudio] = useState(0)
  const [video, setVideo] = useState(0)
  const [teacher, setTeacher] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!rating) return
    setSubmitting(true)
    try {
      await fetch(`/api/video/sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          audio_quality: audio || undefined,
          video_quality: video || undefined,
          teacher_rating: teacher || undefined,
          comment: comment.trim() || undefined,
        }),
      })
      setDone(true)
      setTimeout(onClose, 800)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div dir={dir} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
        {done ? (
          <div className="text-center py-6">
            <Star className="w-10 h-10 mx-auto mb-3 fill-amber-400 text-amber-400" />
            <h3 className="text-lg font-bold mb-1">{t.thanksTitle}</h3>
            <p className="text-sm text-zinc-400">{t.thanksDesc}</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-bold mb-1">{t.ratingTitle}</h3>
              <p className="text-xs text-zinc-400">{t.ratingDesc}</p>
            </div>
            <RatingRow t={t} label={t.overall} value={rating} onChange={setRating} required />
            <RatingRow t={t} label={t.audioQ} value={audio} onChange={setAudio} />
            <RatingRow t={t} label={t.videoQ} value={video} onChange={setVideo} />
            <RatingRow t={t} label={t.teacherPerf} value={teacher} onChange={setTeacher} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={3}
              maxLength={500}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold"
              >
                {t.skip}
              </button>
              <button
                onClick={submit}
                disabled={!rating || submitting}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${accentSolid}`}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RatingRow({
  t,
  label,
  value,
  onChange,
  required,
}: {
  t: T
  label: string
  value: number
  onChange: (v: number) => void
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 transition-transform hover:scale-110"
            aria-label={t.starsLabel(n)}
          >
            <Star className={`w-5 h-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
