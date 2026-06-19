'use client'

import { useEffect, useState, use } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Clock, CheckCircle, XCircle, GraduationCap,
  User, FileText, Loader2, Mail, Layers, PlayCircle,
  ShieldAlert, Sparkles
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  status: string
  order_index: number | null
}

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string | null
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_for_review_at: string | null
  created_at: string
  teacher_id: string
  teacher_name: string
  teacher_email: string
  teacher_avatar: string | null
  reviewer_name: string | null
}

export default function CourseReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    fetch(`/api/academy/supervisor/courses/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.course) {
          setCourse(d.course)
          setLessons(d.lessons || [])
          setReason(d.course.rejection_reason || '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && reason.trim().length < 3) {
      toast.error(isAr ? 'يجب كتابة سبب الرفض' : 'Rejection reason is required')
      return
    }
    setSubmitting(action)
    try {
      const res = await fetch(`/api/academy/admin/courses/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(action === 'approve' 
          ? (isAr ? 'تم اعتماد الدورة ونشرها' : 'Course approved and published') 
          : (isAr ? 'تم رفض الدورة' : 'Course rejected'))
        router.push('/academy/content-supervisor/courses')
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error occurred')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 text-rose-500/50 mb-4" />
        <p className="text-xl font-bold text-foreground mb-2">{isAr ? 'الدورة غير موجودة' : 'Course not found'}</p>
        <p className="text-muted-foreground text-sm mb-6">
          {isAr ? 'قد تكون تم حذفها أو ليس لديك صلاحية للوصول إليها.' : 'It may have been deleted or you do not have permission to access it.'}
        </p>
        <Link href="/academy/content-supervisor/courses" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          <ArrowRight className="w-4 h-4" />
          {isAr ? 'العودة إلى القائمة' : 'Back to List'}
        </Link>
      </div>
    )
  }

  const isPending = course.status === 'pending_review'

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/academy/content-supervisor/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-card hover:bg-muted border border-border/50 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          {isAr ? 'العودة إلى الدورات' : 'Back to Courses'}
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {course.level && (
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/10">
                  {course.level}
                </span>
              )}
              <StatusBadge status={course.status} isAr={isAr} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
              {course.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <strong className="text-foreground">{lessons.length}</strong> {isAr ? 'درس' : 'lessons'}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {isAr ? 'رُفعت للمراجعة في' : 'Submitted for review on'} {new Date(course.submitted_for_review_at || course.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Teacher Info Card-let */}
          <div className="shrink-0 flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm">
              {course.teacher_avatar ? (
                <img src={course.teacher_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'المعلم' : 'Teacher'}</p>
              <p className="font-bold text-foreground text-sm">{course.teacher_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {course.teacher_email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Description */}
        {course.description && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              {isAr ? 'وصف الدورة والأهداف' : 'Course Description & Objectives'}
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          </div>
        )}

        {/* Lessons List */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg">
            <PlayCircle className="w-5 h-5 text-blue-500" />
            {isAr ? `محتوى الدورة (${lessons.length} درس)` : `Course Content (${lessons.length} lessons)`}
          </h2>
          
          {lessons.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-xl border border-border/50 border-dashed">
              <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد دروس في هذه الدورة بعد.' : 'No lessons in this course yet.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((l, idx) => (
                <div
                  key={l.id}
                  className="flex items-center gap-4 bg-background border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors shadow-sm"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center justify-center border border-primary/20">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">{l.title}</p>
                    {l.duration_minutes ? (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {l.duration_minutes} {isAr ? 'دقيقة' : 'mins'}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={l.status} isAr={isAr} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Section */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-sm border-2 ${isPending ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/50'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 text-xl">
            {isPending ? (
              <>
                <Sparkles className="w-6 h-6 text-primary" />
                {isAr ? 'قرار المراجعة للدورة بأكملها' : 'Review Decision for Entire Course'}
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-muted-foreground" />
                {isAr ? 'سجل المراجعة' : 'Review Log'}
              </>
            )}
          </h2>
          
          {!isPending && course.reviewer_name && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg border border-border/50">
              <User className="w-3 h-3 text-muted-foreground" />
              {isAr ? 'المراجع:' : 'Reviewer:'} {course.reviewer_name}
              {course.reviewed_at && <span className="text-muted-foreground ml-1">({new Date(course.reviewed_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')})</span>}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{isAr ? 'ملاحظات / أسباب الرفض' : 'Notes / Rejection Reasons'}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!isPending}
              placeholder={isPending ? (isAr ? "أضف أسباب الرفض أو ملاحظاتك على الدورة... (مطلوبة عند الرفض وتظهر للمعلم)" : "Add rejection reasons or notes on the course... (Required for rejection and visible to teacher)") : (isAr ? "لا توجد ملاحظات." : "No notes.")}
              rows={4}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none disabled:opacity-70 disabled:bg-muted/50 transition-all shadow-sm"
            />
          </div>

          {isPending && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleReview('approve')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'approve' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isAr ? 'اعتماد ونشر' : 'Approve and Publish'}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
              
              <button
                type="button"
                onClick={() => handleReview('reject')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'reject' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isAr ? 'رفض الدورة' : 'Reject Course'}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const config: Record<string, { labelAr: string; labelEn: string; cls: string; icon: any }> = {
    pending_review: { labelAr: 'بانتظار المراجعة', labelEn: 'Pending Review', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400', icon: Clock },
    published:      { labelAr: 'منشورة',          labelEn: 'Published',      cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    approved:       { labelAr: 'معتمدة',          labelEn: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    rejected:       { labelAr: 'مرفوضة',          labelEn: 'Rejected',       cls: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400', icon: XCircle },
    draft:          { labelAr: 'مسودة',          labelEn: 'Draft',          cls: 'bg-muted text-muted-foreground border-border/50', icon: GraduationCap },
    archived:       { labelAr: 'مؤرشفة',          labelEn: 'Archived',       cls: 'bg-muted text-muted-foreground border-border/50', icon: GraduationCap },
  }
  const c = config[status] || config.draft
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${c.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {isAr ? c.labelAr : c.labelEn}
    </span>
  )
}
