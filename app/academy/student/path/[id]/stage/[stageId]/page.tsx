"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  BookOpen, PlayCircle, CheckCircle2, Lock, ArrowRight, ArrowLeft,
  ExternalLink, GraduationCap, FileText, Award, ChevronRight,
} from 'lucide-react'
import { useI18n } from "@/lib/i18n/context";

interface PathStage {
  id: string
  path_id: string
  position: number
  title: string
  description?: string
  content?: string
  video_url?: string
  pdf_url?: string
  passage_text?: string
  course_id?: string
  course_title?: string
  course_thumbnail_url?: string
  course_progress?: number
  course_status?: string
  halaqa_id?: string
  halaqa_name?: string
  lesson_id?: string
  lesson_title?: string
  lesson_description?: string
  lesson_video_url?: string
  lesson_audio_url?: string
  lesson_transcript?: string
  lesson_attachments?: {
    id: string
    file_name: string
    file_url: string
    file_type: string
  }[]
  progress: {
    status: 'locked' | 'unlocked' | 'in_progress' | 'completed'
    audio_url?: string
    notes?: string
  }
}

interface TajweedPath {
  id: string
  title: string
  subject: string
}

interface Enrollment {
  id: string
  status: 'active' | 'paused' | 'completed' | 'dropped'
}

export default function StudentPathStagePage() {
    const { t } = useI18n();
  const academyStudent = (t as any).academyStudent as Record<string, string> | undefined
  const params = useParams()
  const router = useRouter()
  const pathId = params.id as string
  const stageId = params.stageId as string

  const [path, setPath] = useState<TajweedPath | null>(null)
  const [stages, setStages] = useState<PathStage[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}`)
      if (res.ok) {
        const data = await res.json()
        setPath(data.path)
        setStages(data.stages || [])
        setEnrollment(data.enrollment)
      } else {
        toast.error((t.addedTranslations_2026?.['فشل في تحميل المرحلة'] || 'فشل في تحميل المرحلة'))
      }
    } catch (error) {
      console.error('Error fetching stage:', error)
      toast.error((t.addedTranslations_2026?.['حدث خطأ أثناء تحميل البيانات'] || 'حدث خطأ أثناء تحميل البيانات'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pathId) fetchDetails()
  }, [pathId])

  const stage = stages.find((s) => s.id === stageId) || null
  const stageIdx = stages.findIndex((s) => s.id === stageId)
  const prevStage = stageIdx > 0 ? stages[stageIdx - 1] : null
  const nextStage = stageIdx >= 0 && stageIdx < stages.length - 1 ? stages[stageIdx + 1] : null

  const handleComplete = async () => {
    if (!stage) return
    setCompleting(true)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}/stages/${stage.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.finished) {
          toast.success((t.addedTranslations_2026?.['تهانينا! أكملت المسار بالكامل'] || 'تهانينا! أكملت المسار بالكامل'))
        } else {
          toast.success((t.addedTranslations_2026?.['تهانينا! تم إكمال المرحلة بنجاح'] || 'تهانينا! تم إكمال المرحلة بنجاح'))
        }
        await fetchDetails()
        if (data.finished) {
          router.push(`/academy/student/path/${pathId}`)
        } else if (data.next_stage_id) {
          router.push(`/academy/student/path/${pathId}/stage/${data.next_stage_id}`)
        }
      } else {
        toast.error(data.error || (t.addedTranslations_2026?.['لا يمكن إكمال المرحلة حالياً'] || 'لا يمكن إكمال المرحلة حالياً'))
      }
    } catch (error) {
      console.error('Complete stage error:', error)
      toast.error((t.addedTranslations_2026?.['خطأ في الاتصال بالخادم'] || 'خطأ في الاتصال بالخادم'))
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">{(t.addedTranslations_2026?.['جاري تحميل المرحلة...'] || 'جاري تحميل المرحلة...')}</p>
      </div>
    )
  }

  // Not enrolled or stage missing → bounce to path detail.
  if (!path || !stage || !enrollment || enrollment.status === 'dropped') {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-destructive">{(t.addedTranslations_2026?.['المرحلة غير متاحة'] || 'المرحلة غير متاحة')}</h2>
        <p className="text-muted-foreground">
          {(t.addedTranslations_2026?.['عذراً، لم نتمكن من فتح هذه المرحلة. قد تكون غير مسجل في المسار أو أن المرحلة غير موجودة.'] || 'عذراً، لم نتمكن من فتح هذه المرحلة. قد تكون غير مسجل في المسار أو أن المرحلة غير موجودة.')}
                        </p>
        <Link
          href={`/academy/student/path/${pathId}`}
          className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {(t.addedTranslations_2026?.['العودة لصفحة المسار'] || 'العودة لصفحة المسار')}
                        </Link>
      </div>
    )
  }

  const isLocked = stage.progress?.status === 'locked'
  const isCompleted = stage.progress?.status === 'completed'

  if (isLocked) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{(t.addedTranslations_2026?.['هذه المرحلة مقفولة'] || 'هذه المرحلة مقفولة')}</h2>
        <p className="text-muted-foreground">{(t.addedTranslations_2026?.['يجب إكمال المراحل السابقة أولاً للوصول إلى هذه المرحلة.'] || 'يجب إكمال المراحل السابقة أولاً للوصول إلى هذه المرحلة.')}</p>
        <Link
          href={`/academy/student/path/${pathId}`}
          className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {(t.addedTranslations_2026?.['العودة لصفحة المسار'] || 'العودة لصفحة المسار')}
                        </Link>
      </div>
    )
  }

  const courseDone = Number(stage.course_progress || 0) === 100 || stage.course_status === 'completed'
  const canComplete = (!stage.course_id || stage.lesson_id) ? true : courseDone

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/academy/student/path" className="hover:text-emerald-600 transition-colors">{(t.addedTranslations_2026?.['المسارات'] || 'المسارات')}</Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <Link href={`/academy/student/path/${pathId}`} className="hover:text-emerald-600 transition-colors line-clamp-1">
          {path.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="text-foreground font-semibold">{(t.addedTranslations_2026?.['المرحلة'] || 'المرحلة')} {stageIdx + 1}</span>
      </nav>

      {/* Stage Header */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {(t.addedTranslations_2026?.['المرحلة'] || 'المرحلة')} {stageIdx + 1} {(t.addedTranslations_2026?.['من'] || 'من')} {stages.length}
          </span>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {(t.addedTranslations_2026?.['مكتملة'] || 'مكتملة')}
                                      </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
              {(t.addedTranslations_2026?.['قيد التعلم'] || 'قيد التعلم')}
                                          </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 text-foreground leading-snug">{stage.title}</h1>
        {stage.description && (
          <p className="text-muted-foreground mt-2 leading-relaxed">{stage.description}</p>
        )}
      </div>

      {/* Stage Content */}
      {stage.content && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            {(t.addedTranslations_2026?.['محتوى المرحلة'] || 'محتوى المرحلة')}
                                </h2>
          <div className="text-sm text-foreground/95 leading-relaxed whitespace-pre-line">
            {stage.content}
          </div>
        </div>
      )}

      {/* Passage text */}
      {stage.passage_text && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {(t.addedTranslations_2026?.['النص المرجعي'] || 'النص المرجعي')}
                                </h2>
          <div className="text-base text-foreground leading-loose whitespace-pre-line bg-muted/30 p-5 rounded-2xl border border-border/40">
            {stage.passage_text}
          </div>
        </div>
      )}

      {/* Lesson Content (If it's a lesson from a course) */}
      {stage.lesson_id && (
        <div className="space-y-6">
          {/* Lesson Video */}
          {stage.lesson_video_url && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
                {(t.addedTranslations_2026?.['فيديو الدرس ('] || 'فيديو الدرس (')}{stage.lesson_title})
              </h2>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-border/50">
                <iframe
                  src={stage.lesson_video_url.replace('watch?v=', 'embed/')}
                  title="Lesson Video"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Lesson Audio */}
          {stage.lesson_audio_url && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
                {(t.addedTranslations_2026?.['مقطع صوتي'] || 'مقطع صوتي')}
                                            </h2>
              <audio controls className="w-full">
                <source src={stage.lesson_audio_url} type="audio/mpeg" />
                {(t.addedTranslations_2026?.['متصفحك لا يدعم مشغل الصوت.'] || 'متصفحك لا يدعم مشغل الصوت.')}
                                            </audio>
            </div>
          )}

          {/* Lesson Transcript */}
          {stage.lesson_transcript && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {(t.addedTranslations_2026?.['نص الدرس'] || 'نص الدرس')}
                                            </h2>
              <div className="prose prose-emerald max-w-none text-foreground/90 whitespace-pre-wrap bg-muted/30 p-6 rounded-2xl border border-border/40">
                {stage.lesson_transcript}
              </div>
            </div>
          )}

          {/* Lesson Attachments */}
          {stage.lesson_attachments && stage.lesson_attachments.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {(t.addedTranslations_2026?.['مرفقات الدرس'] || 'مرفقات الدرس')}
                                            </h2>
              <div className="flex flex-wrap gap-3">
                {stage.lesson_attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-500/5 px-4 py-2.5 rounded-xl border border-blue-500/10"
                  >
                    <FileText className="w-4 h-4" />
                    {att.file_name || (t.addedTranslations_2026?.['تحميل المرفق'] || 'تحميل المرفق')}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources */}
      {(stage.video_url || stage.pdf_url) && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-emerald-600" />
            {(t.addedTranslations_2026?.['مصادر المرحلة'] || 'مصادر المرحلة')}
                                </h2>
          <div className="flex flex-wrap gap-3">
            {stage.video_url && (
              <a
                href={stage.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline bg-emerald-500/5 px-4 py-2.5 rounded-xl border border-emerald-500/10"
              >
                <PlayCircle className="w-4 h-4" />
                {(t.addedTranslations_2026?.['مشاهدة الفيديو المرفق'] || 'مشاهدة الفيديو المرفق')}
                                            </a>
            )}
            {stage.pdf_url && (
              <a
                href={stage.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-500/5 px-4 py-2.5 rounded-xl border border-blue-500/10"
              >
                <FileText className="w-4 h-4" />
                {(t.addedTranslations_2026?.['تحميل الملف المرفق (PDF)'] || 'تحميل الملف المرفق (PDF)')}
                                            </a>
            )}
          </div>
        </div>
      )}

      {/* Linked course requirement (Only if it's a full course stage, NOT a specific lesson) */}
      {stage.course_id && !stage.lesson_id && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            {(t.addedTranslations_2026?.['الدورة المرتبطة بالمرحلة'] || 'الدورة المرتبطة بالمرحلة')}
                                </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/40">
            <div className="flex gap-4 items-center min-w-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 relative">
                {stage.course_thumbnail_url ? (
                  <img src={stage.course_thumbnail_url || "/placeholder.svg"} alt={stage.course_title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground truncate">{stage.course_title || (t.addedTranslations_2026?.['دورة أكاديمية مرتبطة'] || 'دورة أكاديمية مرتبطة')}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1.5 w-28 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', courseDone ? 'bg-emerald-500' : 'bg-amber-500')}
                      style={{ width: `${Number(stage.course_progress || 0)}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-bold', courseDone ? 'text-emerald-600' : 'text-amber-600')}>
                    {Number(stage.course_progress || 0)}%
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/academy/student/courses/${stage.course_id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-white dark:bg-slate-950 text-foreground border border-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shrink-0"
            >
              {(t.addedTranslations_2026?.['صفحة الدورة'] || 'صفحة الدورة')}
                                        <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          {!courseDone && (
            <p className="text-xs text-amber-600 font-medium">
              {(t.addedTranslations_2026?.['يجب إكمال الدورة المرتبطة بنسبة 100% قبل أن تتمكن من اعتماد إكمال هذه المرحلة.'] || 'يجب إكمال الدورة المرتبطة بنسبة 100% قبل أن تتمكن من اعتماد إكمال هذه المرحلة.')}
                                      </p>
          )}
        </div>
      )}

      {/* Linked halaqa */}
      {stage.halaqa_id && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            {(t.addedTranslations_2026?.['الحلقة التطبيقية'] || 'الحلقة التطبيقية')}
                                </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex gap-4 items-center min-w-0">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-foreground truncate">{stage.halaqa_name}</h3>
            </div>
            <Link
              href={`/academy/student/halaqat/${stage.halaqa_id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md shrink-0"
            >
              {(t.addedTranslations_2026?.['الذهاب للحلقة'] || 'الذهاب للحلقة')}
                                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* Completion action */}
      {!isCompleted && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{(t.addedTranslations_2026?.['اعتماد إكمال المرحلة'] || 'اعتماد إكمال المرحلة')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {canComplete
                ? (t.addedTranslations_2026?.['بمجرد اعتماد الإكمال، سيتم فتح المرحلة التالية تلقائياً.'] || 'بمجرد اعتماد الإكمال، سيتم فتح المرحلة التالية تلقائياً.')
                : 'أكمل متطلبات هذه المرحلة أولاً لتتمكن من اعتمادها.'}
            </p>
          </div>
          <button
            onClick={handleComplete}
            disabled={completing || !canComplete}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shrink-0"
          >
            {completing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {(t.addedTranslations_2026?.['اعتماد الإكمال'] || 'اعتماد الإكمال')}
                                </button>
        </div>
      )}

      {isCompleted && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {(t.addedTranslations_2026?.['أكملت هذه المرحلة بنجاح. يمكنك مراجعتها في أي وقت.'] || 'أكملت هذه المرحلة بنجاح. يمكنك مراجعتها في أي وقت.')}
                                </p>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {prevStage ? (
          <Link
            href={`/academy/student/path/${pathId}/stage/${prevStage.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            {(t.addedTranslations_2026?.['المرحلة السابقة'] || 'المرحلة السابقة')}
                                </Link>
        ) : (
          <span />
        )}
        {nextStage && nextStage.progress?.status !== 'locked' ? (
          <Link
            href={`/academy/student/path/${pathId}/stage/${nextStage.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
          >
            {(t.addedTranslations_2026?.['المرحلة التالية'] || 'المرحلة التالية')}
                                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        ) : (
          <Link
            href={`/academy/student/path/${pathId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Award className="w-4 h-4" />
            {(t.addedTranslations_2026?.['عرض كل المراحل'] || 'عرض كل المراحل')}
                                    </Link>
        )}
      </div>
    </div>
  )
}
