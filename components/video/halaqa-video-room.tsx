"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2, LogOut, Video } from 'lucide-react'

export type VideoCallKind = 'halaqa' | 'booking' | 'session'

interface Props {
  kind: VideoCallKind
  refId: string
  title?: string
  subtitle?: string
  /** Where to go when the user clicks "leave" / disconnects. */
  exitHref: string
  /** Hex/Tailwind colour for the accent badge, e.g. 'emerald'. */
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose'
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  amber: 'from-amber-500/20 to-amber-600/5 text-amber-700 dark:text-amber-300 border-amber-500/30',
  rose: 'from-rose-500/20 to-rose-600/5 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

/**
 * Self-contained client component that handles the full LiveKit lifecycle:
 *  - fetches a token from /api/livekit/token for the given (kind, refId)
 *  - renders <LiveKitRoom> with the high-level <VideoConference> UI which
 *    already provides camera, microphone, screen-share, chat and an active
 *    speaker layout
 *  - on disconnect, routes the user back to `exitHref`
 */
export function HalaqaVideoRoom({
  kind,
  refId,
  title,
  subtitle,
  exitHref,
  accent = 'emerald',
}: Props) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, id: refId }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'تعذر إنشاء رمز الدخول')
        }
        if (cancelled) return
        if (!data.url) {
          throw new Error('LIVEKIT_URL غير معرّف على الخادم')
        }
        setToken(data.token)
        setServerUrl(data.url)
        setRole(data.role)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [kind, refId])

  const accentClass = useMemo(() => ACCENTS[accent], [accent])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground">جاري تجهيز غرفة البث المباشر…</p>
      </div>
    )
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <Video className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">تعذر فتح الغرفة</h2>
        <p className="text-sm text-muted-foreground">{error || 'خطأ غير معروف'}</p>
        <button
          onClick={() => router.push(exitHref)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> رجوع
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] min-h-[500px] -m-4 sm:-m-6 lg:-m-8">
      <div className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-gradient-to-l ${accentClass}`}>
        <div className="min-w-0">
          <h2 className="font-bold truncate">{title || 'غرفة الجلسة'}</h2>
          {subtitle && (
            <p className="text-xs opacity-80 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {role && (
            <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-background/70 border border-border">
              {role === 'host' ? 'المضيف' : 'مشارك'}
            </span>
          )}
          <button
            onClick={() => router.push(exitHref)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-background/80 hover:bg-background border border-border transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0" data-lk-theme="default">
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect
          audio
          video
          onDisconnected={() => router.push(exitHref)}
          style={{ height: '100%' }}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
        </LiveKitRoom>
      </div>
    </div>
  )
}
