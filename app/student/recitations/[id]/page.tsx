"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Mic, Clock, CheckCircle, Calendar, Loader2, User, Volume2, BookOpen, Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward, Award, Info } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"

type Recitation = {
  id: string
  surah_name: string
  ayah_from: number
  ayah_to: number
  status: string
  created_at: string
  audio_url: string | null
  audio_duration_seconds: number | null
  student_notes: string | null
  reader_name: string | null
}

type Review = {
  id: string
  detailed_feedback: string | null
  verdict: string
}

type WordMistake = {
  word: string
  created_at: string
}

export default function RecitationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: t.student.statusPending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    in_review: { label: t.student.statusInReview, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    mastered: { label: t.student.statusMastered, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    needs_session: { label: t.student.statusNeedsSession, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    session_booked: { label: t.student.statusBooked, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  }
  const [recitation, setRecitation] = useState<Recitation | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [wordMistakes, setWordMistakes] = useState<WordMistake[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const handleDelete = async () => {
    if (!recitation) return
    if (!confirm(t.student.deleteRecitationConfirm)) return

    try {
      const res = await fetch(`/api/recitations/${recitation.id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/student/recitations")
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || t.student.bookingError)
      }
    } catch (err) {
      alert(t.student.serverError)
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0")
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (audioRef.current && recitation?.audio_url) {
      audioRef.current.playbackRate = parseFloat(playbackSpeed)
    }
  }, [playbackSpeed, recitation])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      const duration = audioRef.current.duration
      setCurrentTime(current)
      setProgress((current / duration) * 100 || 0)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (!id) return
    fetch(`/api/recitations/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.recitation) { setNotFound(true) } else {
          setRecitation(data.recitation)
          if (data.reviews && data.reviews.length > 0) setReview(data.reviews[0])
          if (data.wordMistakes) setWordMistakes(data.wordMistakes)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const formatDuration = (secs: number | null) => {
    if (!secs) return "—"
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" /></div>
  )

  if (notFound || !recitation) return (
    <div className="text-center py-20">
      <p className="text-slate-500 dark:text-slate-400">{t.student.recitationNotFound}</p>
      <Link href="/student/recitations" className="mt-4 inline-block text-[#1B5E3B] dark:text-emerald-500 font-medium hover:underline">{t.student.back}</Link>
    </div>
  )

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  const cfg = STATUS_CONFIG[recitation.status] || STATUS_CONFIG.pending

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/student/recitations" className="text-xs font-bold text-slate-400 hover:text-[#1B5E3B] transition-colors flex items-center gap-1">
          {isAr ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          {t.student.backToRecitationsHistory}
        </Link>
      </div>

      {/* Compact Header */}
      <header className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#1B5E3B]/5 dark:bg-[#1B5E3B]/10 flex items-center justify-center shrink-0 border border-[#1B5E3B]/10 dark:border-white/5">
            <Mic className="w-8 h-8 text-[#1B5E3B] dark:text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{recitation.surah_name}</h1>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider
                ${recitation.status === 'mastered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  recitation.status === 'needs_session' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    recitation.status === 'session_booked' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 underline dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#C9A227]" /> {t.student.ayah} {recitation.ayah_from} — {recitation.ayah_to}</span>
              <span className="w-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full" />
              <span>{new Date(recitation.created_at).toLocaleDateString(locale === 'ar' ? "ar-SA" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          {recitation.status !== 'pending' && recitation.status !== 'in_review' && (
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2 rounded-2xl transition-colors font-medium border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
              title={t.student.deleteRecitationBtn}
            >
              {t.student.deleteRecitationBtn}
            </button>
          )}
        </div>
      </header>

      <audio
        ref={audioRef}
        src={recitation.audio_url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          if (!duration) setDuration(e.currentTarget.duration)
        }}
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Modern Compact Audio Player */}
        <div className="bg-[#1B5E3B] rounded-2xl p-5 shadow-sm text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-transparent opacity-50 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 animate-pulse">
                  <div className="w-4 h-1 bg-white/40 rounded-full mx-0.5" />
                  <div className="w-4 h-3 bg-emerald-400 rounded-full mx-0.5" />
                  <div className="w-4 h-2 bg-white/40 rounded-full mx-0.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">{isAr ? 'تلاوة الطالب' : 'Student Recitation'}</span>
                  <span className="text-sm font-bold truncate max-w-[150px]">{recitation.surah_name}</span>
                </div>
              </div>

              {/* Refined Speed Selection */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
                {["0.8", "1.0", "1.2", "1.5"].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold transition-all
                      ${playbackSpeed === speed ? 'bg-white text-[#1B5E3B] shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-8 px-4">
              <button
                onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <SkipBack className="w-6 h-6 rtl:rotate-180" />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-white text-[#1B5E3B] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 rtl:mr-0.5 rtl:ml-0 fill-current" />}
              </button>

              <button
                onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <SkipForward className="w-6 h-6 rtl:rotate-180" />
              </button>

              <div className="flex-1 space-y-2 mt-1">
                <div className="relative w-full h-2.5 bg-white/10 rounded-full cursor-pointer overflow-hidden backdrop-blur-md" onClick={handleSeek}>
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-200" style={{ width: `${progressPercentage}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/40 tracking-widest font-mono">
                  <span>{formatSecs(currentTime)}</span>
                  <span>{formatSecs(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes from Student */}
        {recitation.student_notes && (
          <div className="bg-card border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/20">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.student.myNotesLabel}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{isAr ? "ملاحظاتك عند تسجيل التلاوة" : "Your notes when recording the recitation"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full min-h-[80px] p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {recitation.student_notes}
              </div>
            </div>
          </div>
        )}

        {/* Review from Reader */}
        {review && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                <Award className="w-4 h-4 text-[#C9A227]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t.student.readerEvaluation}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? "مراجعة وتقييم التلاوة من المقرئ" : "Reader's review and assessment of your recitation"}</p>
              </div>
            </div>

            {review.detailed_feedback && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700">{t.student.readerNotes}</label>
                  <div className="h-px flex-1 bg-slate-100 mx-4" />
                  <Info className="w-4 h-4 text-slate-300" />
                </div>
                <div className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 leading-relaxed">
                  {review.detailed_feedback}
                </div>
              </div>
            )}

            {wordMistakes && wordMistakes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">الكلمات التي تحتاج إلى تحسين</label>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 mx-4" />
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                    {wordMistakes.length} كلمات
                  </span>
                </div>
                <div className="w-full p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                  <div className="flex flex-wrap gap-2">
                    {wordMistakes.map((mistake, index) => (
                      <span
                        key={index}
                        className="inline-block bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
                      >
                        {mistake.word}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 text-center">
                    💡 انتبه لهذه الكلمات وركز على نطقها الصحيح في التلاوات القادمة
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA for needs_session */}
        {recitation.status === "needs_session" && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">{t.student.detailNeedsSessionTitle}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300/60 mt-1 leading-relaxed">{t.student.detailNeedsSessionDesc}</p>
                </div>
              </div>
              <Link href="/student/booking" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]">
                {t.student.bookSessionCTA}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
