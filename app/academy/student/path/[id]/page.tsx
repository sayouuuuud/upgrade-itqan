"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  BookOpen, Clock, ChevronLeft, Award, PlayCircle, BookMarked, 
  HelpCircle, CheckCircle2, Lock, ArrowRight, ExternalLink, Sparkles, Check
} from 'lucide-react'

interface TajweedPath {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  total_stages: number
  estimated_days: number
  subject: string
  enrollment_status?: 'active' | 'completed' | 'paused' | 'dropped' | null
  price?: number
  enrollment_type?: 'free' | 'paid'
  target_audience?: string
  what_you_will_learn?: string | string[]
  prerequisites?: string | string[]
  promo_video_url?: string
  certification_type?: string
  tags?: string | string[]
}

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
  progress: {
    status: 'locked' | 'unlocked' | 'in_progress' | 'completed'
    audio_url?: string
    notes?: string
  }
}

interface Enrollment {
  id: string
  path_id: string
  student_id: string
  status: 'active' | 'paused' | 'completed' | 'dropped'
  stages_completed: number
}

export default function StudentPathDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pathId = params.id as string

  const [path, setPath] = useState<TajweedPath | null>(null)
  const [stages, setStages] = useState<PathStage[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [completingStageId, setCompletingStageId] = useState<string | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const fetchPathDetails = async () => {
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}`)
      if (res.ok) {
        const data = await res.json()
        setPath(data.path)
        setStages(data.stages || [])
        setEnrollment(data.enrollment)
      } else {
        toast.error('فشل في تحميل تفاصيل المسار')
      }
    } catch (error) {
      console.error('Error fetching path details:', error)
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pathId) {
      fetchPathDetails()
    }
  }, [pathId])

  const handleEnroll = async () => {
    if (!path) return
    setEnrolling(true)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}/enroll`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('تم التسجيل في المسار بنجاح!')
        fetchPathDetails()
      } else {
        toast.error(data.error || 'فشل التسجيل في المسار')
      }
    } catch (error) {
      console.error('Enroll error:', error)
      toast.error('خطأ في الاتصال بالخادم')
    } finally {
      setEnrolling(false)
    }
  }

  const handleCompleteStage = async (stageId: string) => {
    setCompletingStageId(stageId)
    try {
      const res = await fetch(`/api/student/tajweed-paths/${pathId}/stages/${stageId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('تهانينا! تم إكمال المرحلة بنجاح')
        fetchPathDetails()
      } else {
        toast.error(data.error || 'لا يمكن إكمال المرحلة حالياً')
      }
    } catch (error) {
      console.error('Complete stage error:', error)
      toast.error('خطأ في الاتصال بالخادم')
    } finally {
      setCompletingStageId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">جاري تحميل تفاصيل المسار الأكاديمي...</p>
      </div>
    )
  }

  if (!path) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-destructive">المسار غير موجود</h2>
        <p className="text-muted-foreground">عذراً، لم نتمكن من العثور على المسار المطلوب.</p>
        <Link href="/academy/student/path" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المسارات
        </Link>
      </div>
    )
  }

  // Parse arrays from JSON if stored as strings
  const parseJsonField = (field: any): string[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      return JSON.parse(field)
    } catch (e) {
      return [field.toString()]
    }
  }

  const whatYouWillLearn = parseJsonField(path.what_you_will_learn)
  const prerequisites = parseJsonField(path.prerequisites)
  const tags = parseJsonField(path.tags)

  const levelLabels = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  }

  const levelColors = {
    beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    advanced: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
  }

  const subjectLabels: { [key: string]: string } = {
    fiqh: 'الفقه الإسلامي',
    aqeedah: 'العقيدة الإسلامية',
    seerah: 'السيرة النبوية',
    tafsir: 'التفسير وعلوم القرآن',
    tajweed: 'التجويد والمقرأة'
  }

  const isEnrolled = enrollment && enrollment.status === 'active'

  if (!isEnrolled) {
    // ==========================================
    // 1. LANDING PAGE VIEW (الطلاب غير المسجلين)
    // ==========================================
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Back */}
        <Link href="/academy/student/path" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المسارات الأكاديمية
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main Info Column (Left 2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-teal-900/40">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {subjectLabels[path.subject] || path.subject}
                  </span>
                  <span className={cn("px-3 py-1 text-xs font-semibold rounded-full border", levelColors[path.level])}>
                    {levelLabels[path.level]}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  {path.title}
                </h1>
                {path.description && (
                  <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed">
                    {path.description}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs rounded bg-white/10 text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Promo Video Section */}
            {path.promo_video_url && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-emerald-600" />
                  الفيديو الترويجي للمسار
                </h2>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-border/60 group shadow-inner">
                  {!isVideoPlaying ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      {/* Play Button Overlay */}
                      <button 
                        onClick={() => setIsVideoPlaying(true)}
                        className="w-16 h-16 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 z-10 hover:bg-emerald-500"
                      >
                        <PlayCircle className="w-10 h-10 fill-current" />
                      </button>
                      <p className="text-slate-300 text-sm mt-3 font-medium z-10">شاهد مقدمة تعريفية قصيرة بالمسار</p>
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                    </div>
                  ) : (
                    <iframe 
                      src={path.promo_video_url.replace("watch?v=", "embed/")} 
                      title="Promo Video" 
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            )}

            {/* What you will learn */}
            {whatYouWillLearn.length > 0 && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  ماذا ستتعلم في هذا المسار الأكاديمي؟
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {whatYouWillLearn.map((outcome, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-emerald-50/20 dark:bg-emerald-950/10 p-3 rounded-2xl border border-emerald-500/10">
                      <div className="w-5 h-5 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Audience & Prerequisites */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Target Audience */}
              {path.target_audience && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-emerald-600" />
                    الفئة المستهدفة
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {path.target_audience}
                  </p>
                </div>
              )}

              {/* Prerequisites */}
              {prerequisites.length > 0 && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-600" />
                    المتطلبات المسبقة
                  </h3>
                  <ul className="space-y-2">
                    {prerequisites.map((reqItem, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        {reqItem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Checkout/Registration Side Widget */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 bg-card border border-border rounded-3xl shadow-lg overflow-hidden">
            {/* Widget Header Image / Icon */}
            <div className="h-36 bg-gradient-to-tr from-emerald-800 to-teal-900 flex flex-col items-center justify-center p-6 text-white text-center">
              <Award className="w-12 h-12 text-emerald-300 mb-2" />
              <span className="text-xs tracking-widest text-emerald-200 uppercase font-bold">شهادة معتمدة عند الإتمام</span>
              <p className="text-sm font-semibold opacity-90">{path.certification_type || 'شهادة إنجاز للمسار'}</p>
            </div>

            {/* Price & Details */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">قيمة الاستثمار في المسار</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    {path.enrollment_type === 'paid' ? `${path.price} ر.س` : 'مجاني'}
                  </span>
                  {path.enrollment_type === 'paid' && (
                    <span className="text-xs text-muted-foreground">رسوم تدفع لمرة واحدة</span>
                  )}
                </div>
              </div>

              {/* General Metadata */}
              <div className="space-y-3 border-y border-border/60 py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    مجموع المراحل الدراسيّة
                  </span>
                  <span className="font-semibold text-foreground">{path.total_stages} دورات</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    الوقت المقدر للدراسة
                  </span>
                  <span className="font-semibold text-foreground">{path.estimated_days} ساعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    الشهادة المقدمة
                  </span>
                  <span className="font-semibold text-foreground text-xs text-right max-w-[120px] truncate" title={path.certification_type}>
                    {path.certification_type || 'شهادة إتمام'}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التسجيل...
                  </>
                ) : (
                  'سجل وابدأ دراسة المسار الآن'
                )}
              </button>

              <p className="text-[10px] text-center text-muted-foreground/80 leading-relaxed">
                بالتسجيل في هذا المسار، ستحصل على وصول فوري لجميع الدورات المربوطة بمراحل المسار وتخضع لشروط تتبع التقدم والتقييم.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. CURRICULUM VIEW (الطلاب المسجلين)
  // ==========================================
  const progressPercent = path.total_stages > 0 
    ? Math.round(((enrollment.stages_completed || 0) / path.total_stages) * 100) 
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Back */}
      <Link href="/academy/student/path" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة لقائمة المسارات الأكاديمية
      </Link>

      {/* Header Profile Dashboard */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {subjectLabels[path.subject] || path.subject}
          </span>
          <h1 className="text-2xl font-bold mt-2 text-foreground">{path.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            أنت مسجل في هذا المسار، تابع تقدمك في المراحل الموضحة أدناه
          </p>
        </div>

        {/* Progress Circle/Widget */}
        <div className="flex items-center gap-4 bg-muted/30 border border-border/40 p-4 rounded-2xl shrink-0 w-full md:w-auto">
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-emerald-600/10 text-emerald-600 font-bold text-sm">
            {progressPercent}%
            {/* SVG circle stroke representation could be added, but simple percent inside circle is premium too */}
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">التقدم العام</span>
            <div className="h-1.5 w-32 bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              أكملت {enrollment.stages_completed} من أصل {path.total_stages} مرحلة
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border/80 pb-4">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          منهج ومراحل المسار
        </h2>

        <div className="relative pr-6 border-r-2 border-border/80 space-y-8 mr-3">
          {stages.map((stage, idx) => {
            const isStageCompleted = stage.progress?.status === 'completed'
            const isStageLocked = stage.progress?.status === 'locked'
            const isStageCurrent = stage.progress?.status === 'unlocked' || stage.progress?.status === 'in_progress'

            return (
              <div key={stage.id} className="relative">
                {/* Timeline node icon indicator */}
                <div className={cn(
                  "absolute -right-[35px] top-1.5 w-6 h-6 rounded-full border-4 border-card flex items-center justify-center z-10 shadow-sm",
                  isStageCompleted && "bg-emerald-600 text-white",
                  isStageCurrent && "bg-amber-500 text-white ring-4 ring-amber-500/20",
                  isStageLocked && "bg-slate-200 dark:bg-slate-800 text-slate-400"
                )}>
                  {isStageCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                  ) : isStageLocked ? (
                    <Lock className="w-2.5 h-2.5" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>

                {/* Stage card */}
                <div className={cn(
                  "rounded-2xl border p-5 sm:p-6 transition-all duration-300",
                  isStageCompleted && "border-emerald-500/30 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]",
                  isStageCurrent && "border-amber-500/40 bg-amber-500/[0.02] shadow-sm hover:bg-amber-500/[0.04]",
                  isStageLocked && "border-border/60 bg-muted/20 opacity-60 pointer-events-none select-none"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground/80">المرحلة {idx + 1}</span>
                        {isStageCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                            مكتملة
                          </span>
                        )}
                        {isStageCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold animate-pulse">
                            قيد التعلم
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-foreground mt-1">{stage.title}</h3>
                      {stage.description && (
                        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
                          {stage.description}
                        </p>
                      )}
                    </div>

                    {/* Integrated course gating cards */}
                    {stage.course_id && (
                      <div className="flex flex-col items-stretch sm:items-end gap-2.5 shrink-0">
                        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-border/60 text-xs flex items-center gap-2 max-w-[240px]">
                          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-muted-foreground">تتطلب هذه المرحلة إكمال دورة أكاديمية</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Complete stage checking */}
                          {!isStageCompleted && (
                            <button
                              onClick={() => handleCompleteStage(stage.id)}
                              disabled={completingStageId === stage.id || isStageLocked}
                              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50"
                            >
                              {completingStageId === stage.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                'إكمال المرحلة'
                              )}
                            </button>
                          )}
                          <Link
                            href={`/academy/student/courses/${stage.course_id}`}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors flex items-center gap-1"
                          >
                            انتقل للدورة
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Regular stage interaction */}
                    {!stage.course_id && !isStageCompleted && isStageCurrent && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCompleteStage(stage.id)}
                          disabled={completingStageId === stage.id}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm"
                        >
                          {completingStageId === stage.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'إكمال المرحلة فوراً'
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stage detailed resources (unlocked/completed stages show content) */}
                  {!isStageLocked && (stage.content || stage.video_url || stage.pdf_url) && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      {stage.content && (
                        <div className="text-sm text-foreground/95 bg-muted/20 p-4 rounded-xl leading-relaxed whitespace-pre-line border border-border/40">
                          {stage.content}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        {stage.video_url && (
                          <a 
                            href={stage.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10"
                          >
                            <PlayCircle className="w-4 h-4" />
                            مشاهدة الفيديو المرفق
                          </a>
                        )}
                        {stage.pdf_url && (
                          <a 
                            href={stage.pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10"
                          >
                            <BookOpen className="w-4 h-4" />
                            تحميل الملف المرفق (PDF)
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
