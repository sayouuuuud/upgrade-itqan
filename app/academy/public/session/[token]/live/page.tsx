'use client'


import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  formatChatMessageLinks,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2, LogOut, Radio, Video } from 'lucide-react'

interface PublicTokenResponse {
  token: string
  url: string
  roomName: string
  role: 'viewer'
  identity: string
  name: string
  platform: 'academy'
  videoSessionId: string | null
  sessionTitle: string
  settings: {
    recording_enabled: boolean
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

export default function PublicSessionLivePage() {
  const params = useParams()
  const router = useRouter()
  const token = (params?.token as string) || ''

  const [name, setName] = useState('')
  const [data, setData] = useState<PublicTokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  const exitHref = `/academy/public/session/${token}`

  const join = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/livekit/public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر الانضمام للبث")
      setData(json as PublicTokenResponse)
      startedAtRef.current = Date.now()
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }, [token, name])

  // Tick elapsed timer
  useEffect(() => {
    if (!data) return
    const i = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(i)
  }, [data])

  const timeStr = useMemo(() => {
    const m = Math.floor(elapsed / 60)
    const s = elapsed % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [elapsed])

  // Pre-join screen
  if (!data) {
    return (
      <main
        dir="rtl"
        className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center">
              <Video className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold">{"انضم إلى البث المباشر"}</h1>
            <p className="text-sm text-muted-foreground">
              {"لا تحتاج إلى تسجيل دخول. أدخل اسمك للظهور في قائمة الحضور."}</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">{"الاسم (اختياري)"}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={"ضيف"}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              maxLength={60}
            />
          </label>

          {error && (
            <div className="rounded-lg bg-rose-50 text-rose-800 border border-rose-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={join}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
              {"ادخل البث الآن"}</button>
            <Link
              href={exitHref}
              className="inline-flex items-center justify-center h-11 px-4 rounded-lg border border-input hover:bg-muted text-sm font-medium"
            >
              {"العودة"}</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col">
      <div className="shrink-0 border-b border-white/10 bg-gradient-to-b from-emerald-700/30 via-emerald-500/5 to-transparent">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold truncate text-sm sm:text-base">{data.sessionTitle}</h2>
              <p className="text-[11px] sm:text-xs opacity-70 truncate">{"بث مباشر عام · مشاهدة فقط"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {"مباشر ·"}{timeStr}
            </span>
            <button
              onClick={() => router.push(exitHref)}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              {"خروج"}</button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0" data-lk-theme="default">
        <LiveKitRoom
          serverUrl={data.url}
          token={data.token}
          connect
          audio={false}
          video={false}
          onDisconnected={() => router.push(exitHref)}
          style={{ height: '100%' }}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
          <RoomAudioRenderer />
        </LiveKitRoom>
        {data.settings.watermark_text && (
          <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-bold opacity-40 select-none">
            {data.settings.watermark_text}
          </div>
        )}
      </div>
    </div>
  )
}
