"use client"


import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Clock,
  Loader2,
  PlayCircle,
  Star,
  Users,
  Video as VideoIcon,
} from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  sessionId: string
  backHref: string
}

interface SessionInfo {
  data: {
    id: string
    kind: string
    ref_id: string
    platform: 'academy' | 'maqraa'
    room_name: string
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    peak_participants: number
    total_participants: number
    recording_status: string
    recording_url: string | null
    notes: string | null
    title: string | null
  }
  participants: Array<{
    user_id: string
    name: string
    email: string
    role: string
    joined_at: string
    left_at: string | null
    duration_seconds: number | null
  }>
  ratings: Array<{
    id: string
    user_id: string
    name: string
    rating: number
    comment: string | null
    audio_quality: number | null
    video_quality: number | null
    teacher_rating: number | null
    created_at: string
  }>
}

const KIND_LABEL: Record<string, string> = {
  halaqa: 'حلقة',
  booking: 'جلسة 1:1',
  course_session: 'درس مباشر',
}

export function VideoSessionDetail({ sessionId, backHref }: Props) {
  const { t } = useI18n();

  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/video/sessions/${sessionId}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || ((t as any).extracted_2026_v2?.["تعذر تحميل الجلسة"] || "تعذر تحميل الجلسة"))
        if (!cancelled) setInfo(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : ((t as any).extracted_2026_v2?.["حدث خطأ"] || "حدث خطأ"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center mt-12 shadow-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <VideoIcon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{((t as any).extracted_2026_v2?.["عذراً، حدث خطأ"] || "عذراً، حدث خطأ")}</h2>
        <p className="text-sm text-rose-500 mb-6">{error || ((t as any).extracted_2026_v2?.["تعذر تحميل بيانات الجلسة"] || "تعذر تحميل بيانات الجلسة")}</p>
        <Link href={backHref} className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors font-medium text-sm">
          {((t as any).extracted_2026_v2?.["العودة للسجل"] || "العودة للسجل")}</Link>
      </div>
    )
  }

  const s = info.data
  const avgRating =
    info.ratings.length > 0
      ? info.ratings.reduce((sum, r) => sum + r.rating, 0) / info.ratings.length
      : null

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href={backHref} className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
          <ArrowRight className="w-4 h-4" /> 
          <span>{((t as any).extracted_2026_v2?.["العودة لسجل الجلسات"] || "العودة لسجل الجلسات")}</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-bold tracking-wide">
                {KIND_LABEL[s.kind] || s.kind}
              </span>
              {!s.ended_at && !s.recording_url && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                  <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse" /> 
                  {((t as any).extracted_2026_v2?.["مباشر الآن"] || "مباشر الآن")}</span>
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {s.title || KIND_LABEL[s.kind]}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(s.started_at).toLocaleString('ar-EG', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {!s.ended_at && !s.recording_url && s.platform === 'academy' && (
              <Link
                href={`/academy/admin/video-settings/sessions/${sessionId}/monitor`}
                className="inline-flex flex-1 md:flex-none justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 transition-colors text-sm font-bold shadow-sm"
                target="_blank"
              >
                <VideoIcon className="w-4 h-4" /> 
                {((t as any).extracted_2026_v2?.["مراقبة خفية"] || "مراقبة خفية")}</Link>
            )}
            
            {s.recording_url && (
              <VideoPlayerModal url={s.recording_url} title={s.title || KIND_LABEL[s.kind]}>
                <button className="inline-flex flex-1 md:flex-none justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-bold shadow-sm">
                  <PlayCircle className="w-4 h-4" /> 
                  {((t as any).extracted_2026_v2?.["تشغيل التسجيل"] || "تشغيل التسجيل")}</button>
              </VideoPlayerModal>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={<Clock className="w-5 h-5 text-blue-500" />} 
          label={((t as any).extracted_2026_v2?.["مدة الجلسة"] || "مدة الجلسة")} 
          value={s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} دقيقة` : '—'} 
        />
        <MetricCard 
          icon={<Users className="w-5 h-5 text-emerald-500" />} 
          label={((t as any).extracted_2026_v2?.["ذروة المشاركين"] || "ذروة المشاركين")} 
          value={s.peak_participants} 
        />
        <MetricCard 
          icon={<VideoIcon className="w-5 h-5 text-indigo-500" />} 
          label={((t as any).extracted_2026_v2?.["إجمالي الحضور"] || "إجمالي الحضور")} 
          value={info.participants.length} 
        />
        <MetricCard 
          icon={<Star className="w-5 h-5 text-amber-500" />} 
          label={((t as any).extracted_2026_v2?.["متوسط التقييم"] || "متوسط التقييم")} 
          value={avgRating != null ? `${avgRating.toFixed(1)} من 5` : ((t as any).extracted_2026_v2?.["لم يتم التقييم"] || "لم يتم التقييم")} 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Participants Section */}
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
            <h3 className="font-bold text-lg inline-flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" /> 
              {((t as any).extracted_2026_v2?.["سجل المشاركين"] || "سجل المشاركين")}<span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full ml-1">
                {info.participants.length}
              </span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {info.participants.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{((t as any).extracted_2026_v2?.["لم يسجل أي مشارك الدخول لهذه الجلسة."] || "لم يسجل أي مشارك الدخول لهذه الجلسة.")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {info.participants.map((p) => (
                  <li key={`${p.user_id}-${p.joined_at}`} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          p.role === 'host' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                            {p.name}
                            {p.role === 'host' && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                {((t as any).extracted_2026_v2?.["مضيف"] || "مضيف")}</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{p.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-lg w-fit">
                        <div className="flex flex-col">
                          <span className="text-zinc-400 mb-0.5 text-[10px] uppercase">{((t as any).extracted_2026_v2?.["دخول - خروج"] || "دخول - خروج")}</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                            {new Date(p.joined_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            {p.left_at ? ` ← ${new Date(p.left_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ((t as any).extracted_2026_v2?.[" ← مستمر"] || " ← مستمر")}
                          </span>
                        </div>
                        {p.duration_seconds != null && (
                          <div className="flex flex-col pl-4 border-l border-zinc-200 dark:border-zinc-700">
                            <span className="text-zinc-400 mb-0.5 text-[10px] uppercase">{((t as any).extracted_2026_v2?.["البقاء"] || "البقاء")}</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{Math.round(p.duration_seconds / 60)} {((t as any).extracted_2026_v2?.["د"] || "د")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Ratings Section */}
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
            <h3 className="font-bold text-lg inline-flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> 
              {((t as any).extracted_2026_v2?.["التقييمات"] || "التقييمات")}<span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full ml-1">
                {info.ratings.length}
              </span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {info.ratings.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{((t as any).extracted_2026_v2?.["لم يقم أي طالب بتقييم هذه الجلسة بعد."] || "لم يقم أي طالب بتقييم هذه الجلسة بعد.")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {info.ratings.map((r) => (
                  <li key={r.id} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-xs">
                             {r.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-bold text-sm text-zinc-900 dark:text-white">{r.name}</p>
                             <p className="text-[11px] text-zinc-500">
                               {new Date(r.created_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
                          <Stars value={r.rating} />
                        </div>
                      </div>
                      
                      {(r.audio_quality || r.video_quality || r.teacher_rating) && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {r.audio_quality && (
                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md">
                              {((t as any).extracted_2026_v2?.["الصوت:"] || "الصوت:")}<strong className="text-zinc-900 dark:text-white ml-1">{r.audio_quality}/5</strong>
                            </span>
                          )}
                          {r.video_quality && (
                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md">
                              {((t as any).extracted_2026_v2?.["الفيديو:"] || "الفيديو:")}<strong className="text-zinc-900 dark:text-white ml-1">{r.video_quality}/5</strong>
                            </span>
                          )}
                          {r.teacher_rating && (
                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md">
                              {((t as any).extracted_2026_v2?.["المدرّس:"] || "المدرّس:")}<strong className="text-zinc-900 dark:text-white ml-1">{r.teacher_rating}/5</strong>
                            </span>
                          )}
                        </div>
                      )}
                      
                      {r.comment && (
                        <div className="mt-1 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{r.comment}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  const { t } = useI18n();

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
      <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  const { t } = useI18n();

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-700'}`}
        />
      ))}
    </div>
  )
}
