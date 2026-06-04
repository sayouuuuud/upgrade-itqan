'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Loader2, PlayCircle, Users, Video } from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

interface Recording {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  title: string | null
  started_at: string
  duration_seconds: number | null
  recording_url: string | null
  started_by_name: string | null
  participants_count: number
}

const KIND_LABEL: Record<string, string> = {
  halaqa: 'حلقة',
  booking: 'جلسة فردية',
  course_session: 'درس دورة',
}

function fmtDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h > 0) return `${h}س ${rem}د`
  return `${m}د`
}

function fmtDate(s: string) {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(s))
  } catch {
    return s
  }
}

export default function StudentRecordingsPage() {
  const [data, setData] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/video/recordings?scope=mine&platform=academy&limit=200')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'فشل التحميل')
      }
      const json = await res.json()
      setData(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-emerald-600" />
          تسجيلاتي
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          راجع جلساتك السابقة في أي وقت — تشمل دروس الدورات والحلقات.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={load}>إعادة المحاولة</Button>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted grid place-items-center">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">لا توجد تسجيلات بعد</h3>
            <p className="text-sm text-muted-foreground">
              بمجرد أن تنتهي جلسة كنت حاضراً فيها بتسجيل، ستجدها هنا.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate flex-1">
                    {r.title || KIND_LABEL[r.kind]}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted">
                    {KIND_LABEL[r.kind]}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {fmtDate(r.started_at)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {fmtDuration(r.duration_seconds)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {r.participants_count} حاضر
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.recording_url ? (
                    <VideoPlayerModal url={r.recording_url} title={r.title || KIND_LABEL[r.kind]} />
                  ) : (
                    <Button size="sm" disabled className="flex-1">
                      لا يوجد رابط
                    </Button>
                  )}
                  {r.kind === 'course_session' && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/academy/student/sessions/${r.ref_id}`}>التفاصيل</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
