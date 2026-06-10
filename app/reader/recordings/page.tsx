'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, PlayCircle, Search, Users, Clock, Calendar, Filter, Video } from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

interface Recording {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  platform: 'academy' | 'maqraa'
  title: string | null
  started_at: string
  ended_at: string | null
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

function fmtDuration(seconds: number | null): string {
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
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(s))
  } catch {
    return s
  }
}

export default function ReaderRecordingsPage() {
  const [data, setData] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<'all' | 'halaqa' | 'booking'>('all')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ scope: 'mine', platform: 'maqraa', limit: '200' })
      if (kind !== 'all') params.set('kind', kind)
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/video/recordings?${params.toString()}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'فشل تحميل التسجيلات')
      }
      const json = await res.json()
      setData(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }, [kind, q])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => data, [data])

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <PlayCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">تسجيلات الجلسات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            استعرض تسجيلات حلقاتك وجلساتك الفردية السابقة التي قمت بها أو حضرتها.
          </p>
        </div>
      </div>

      <Card className="border-border rounded-2xl">
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث بعنوان الجلسة أو اسم الطالب..."
                className="pr-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { v: 'all', label: 'الكل' },
                { v: 'booking', label: 'الجلسات الفردية' },
                { v: 'halaqa', label: 'الحلقات' },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setKind(opt.v)}
                  className={`h-10 px-4 rounded-xl text-sm font-bold transition-colors border ${
                    kind === opt.v
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-card text-muted-foreground border-border hover:border-emerald-500/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <Card className="border-border rounded-2xl">
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={load} className="bg-emerald-600 hover:bg-emerald-700 text-white">إعادة المحاولة</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-border rounded-2xl">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted grid place-items-center">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground">لا توجد تسجيلات</h3>
            <p className="text-sm text-muted-foreground">لم يتم العثور على تسجيلات مطابقة. ستظهر التسجيلات هنا بعد انتهاء الجلسات.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="border-border rounded-2xl hover:shadow-lg transition-shadow overflow-hidden">
              {r.recording_url ? (
                <VideoPlayerModal url={r.recording_url} title={r.title || KIND_LABEL[r.kind]}>
                  <button className="block aspect-video w-full bg-gradient-to-br from-emerald-500/10 to-amber-400/10 grid place-items-center group focus:outline-none">
                    <PlayCircle className="w-14 h-14 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </button>
                </VideoPlayerModal>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Video className="w-14 h-14 text-muted-foreground/30" />
                </div>
              )}
              <CardContent className="pt-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground truncate flex-1">{r.title || KIND_LABEL[r.kind]}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                    {KIND_LABEL[r.kind]}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmtDate(r.started_at)}</p>
                  <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtDuration(r.duration_seconds)}</p>
                  <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{r.participants_count} حاضر</p>
                </div>
                <div className="pt-1">
                  {r.recording_url ? (
                    <VideoPlayerModal url={r.recording_url} title={r.title || KIND_LABEL[r.kind]} />
                  ) : (
                    <Button size="sm" disabled className="w-full">لا يوجد رابط</Button>
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
