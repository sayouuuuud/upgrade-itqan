'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, ArrowLeft, BookOpen, Clock, ExternalLink, FileText,
  Image as ImageIcon, Loader2, PlayCircle, Users, Video, XCircle,
  CheckCircle2, ShieldCheck, Calendar, Tag, GraduationCap, AlertTriangle,
  Edit2, Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected'
type Level = 'beginner' | 'intermediate' | 'advanced'

interface Attachment {
  id: string
  name: string
  url: string
  type: string
}

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  order_index: number
  duration_minutes: number | null
  status: string | null
  attachments?: Attachment[]
}

interface CourseDetail {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: CourseStatus
  level: Level
  category_id: string | null
  teacher_id: string | null
  category_name: string | null
  teacher_name: string | null
  teacher_email: string | null
  is_published: boolean
  is_active: boolean
  rejection_reason: string | null
  reviewed_at: string | null
  reviewed_by_name: string | null
  submitted_for_review_at: string | null
  created_at: string
  updated_at: string
}

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'مسودة',
  pending_review: 'بانتظار المراجعة',
  published: 'منشورة',
  rejected: 'مرفوضة',
  archived: 'مؤرشفة',
}

const STATUS_BADGE_CLS: Record<CourseStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
  pending_review: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  rejected: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  archived: 'bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
}

const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function youtubeEmbed(url: string): string | null {
  if (!url) return null
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0]
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (url.includes('youtube.com/watch')) {
    const id = url.split('v=')[1]?.split('&')[0]
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  return null
}

export default function AdminCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [totalEnrolled, setTotalEnrolled] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({})

  // Review modal
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/academy/admin/courses/${courseId}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || 'تعذر تحميل بيانات الدورة')
        return
      }
      setCourse(json.course)
      setLessons(json.lessons || [])
      setTotalEnrolled(json.total_enrolled || 0)
      setPendingRequests(json.pending_requests || 0)
    } catch (err) {
      console.error(err)
      toast.error('فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchCourse() }, [courseId])

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSubmitReview = async () => {
    if (!reviewMode) return
    if (reviewMode === 'reject' && rejectionReason.trim().length < 3) {
      toast.error('يجب كتابة سبب الرفض')
      return
    }
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/academy/admin/courses/${courseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewMode,
          reason: reviewMode === 'reject' ? rejectionReason.trim() : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || 'حدث خطأ أثناء الحفظ')
        return
      }
      toast.success(reviewMode === 'approve' ? 'تم قبول الدورة ونشرها للطلاب' : 'تم رفض الدورة وإبلاغ المدرس')
      setReviewMode(null)
      setRejectionReason('')
      fetchCourse()
    } catch (err) {
      console.error(err)
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center p-8 bg-card rounded-xl border border-border">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
        <p className="font-bold mb-2">الدورة غير موجودة</p>
        <Link
          href="/academy/admin/courses"
          className="inline-flex items-center gap-2 px-4 py-2 mt-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          العودة لقائمة الدورات
        </Link>
      </div>
    )
  }

  const status = (course.status || 'draft') as CourseStatus
  const isPendingReview = status === 'pending_review'
  const wasRejected = status === 'rejected'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/academy/admin/courses"
          className="text-sm font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          العودة لإدارة الدورات
        </Link>

        <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700"></div>
          <div className="px-6 pb-6 relative">
            <div className="flex gap-4 items-end -mt-12 mb-4">
              <div className="w-24 h-24 rounded-xl border-4 border-card bg-muted shadow-md overflow-hidden flex items-center justify-center shrink-0">
                {course.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-10 h-10 text-muted-foreground opacity-50" />
                )}
              </div>
              <div className="flex-1 pb-2 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold">{course.title}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium">
                        {LEVEL_LABELS[course.level] || course.level}
                      </span>
                      {course.category_name && <span>• {course.category_name}</span>}
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-bold border',
                        STATUS_BADGE_CLS[status]
                      )}>
                        {STATUS_LABELS[status]}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoChip icon={<GraduationCap className="w-4 h-4" />} label="المدرس" value={course.teacher_name || '—'} subValue={course.teacher_email || undefined} />
              <InfoChip icon={<PlayCircle className="w-4 h-4" />} label="عدد الدروس" value={`${lessons.length} درس`} />
              <InfoChip icon={<Users className="w-4 h-4" />} label="الطلاب المسجلون" value={`${totalEnrolled}${pendingRequests ? ` (${pendingRequests} قيد المراجعة)` : ''}`} />
              <InfoChip icon={<Calendar className="w-4 h-4" />} label="تاريخ الإنشاء" value={formatDate(course.created_at)} />
            </div>
          </div>
        </div>
      </div>

      {/* Review panel — only for pending courses */}
      {isPendingReview && (
        <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-base text-amber-900 dark:text-amber-100">هذه الدورة بانتظار مراجعتك</h2>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                راجع وصف الدورة والدروس والمحتوى أدناه، ثم اتخذ القرار. إذا قبلت تُنشر للطلاب، وإذا رفضت يصل للمدرس سبب الرفض ليُعدِّل ويعيد الإرسال.
              </p>
              {course.submitted_for_review_at && (
                <p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-1">
                  أُرسلت للمراجعة: {formatDate(course.submitted_for_review_at)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setReviewMode('approve')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> قبول ونشر الدورة
            </button>
            <button
              onClick={() => setReviewMode('reject')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              <XCircle className="w-4 h-4" /> رفض مع كتابة السبب
            </button>
          </div>
        </div>
      )}

      {/* Previous rejection banner (informational) */}
      {wasRejected && course.rejection_reason && (
        <div className="bg-red-50 dark:bg-red-900/15 border border-red-300 dark:border-red-800/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-700 dark:text-red-300 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">آخر سبب رفض</h3>
              <p className="text-sm text-red-800 dark:text-red-200/90 whitespace-pre-wrap">{course.rejection_reason}</p>
              <p className="text-xs text-red-700/70 dark:text-red-300/70 mt-2">
                {course.reviewed_at && <>تم الرفض بواسطة {course.reviewed_by_name || 'الأدمن'} • {formatDate(course.reviewed_at)}</>}
              </p>
              <p className="text-xs text-red-700/70 dark:text-red-300/70 mt-1">المدرس يستطيع تعديل الدورة وإعادة إرسالها للمراجعة.</p>
            </div>
          </div>
        </div>
      )}

      {/* Course description */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-base mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          وصف الدورة
        </h2>
        {course.description ? (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{course.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">— لم يكتب المدرس وصفاً للدورة —</p>
        )}
      </div>

      {/* Lessons */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10">
          <h2 className="font-bold text-base flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-600" />
            دروس الدورة ({lessons.length})
          </h2>
        </div>

        {lessons.length === 0 ? (
          <div className="p-10 text-center">
            <PlayCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium text-muted-foreground">لم يُضِف المدرس أي دروس لهذه الدورة بعد.</p>
            {isPendingReview && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                يُفضّل رفض الدورة وطلب رفع المحتوى قبل إعادة الإرسال.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lessons.map((lesson, idx) => {
              const isOpen = !!expandedLessons[lesson.id]
              const ytEmbed = lesson.video_url ? youtubeEmbed(lesson.video_url) : null
              return (
                <div key={lesson.id} className="p-5">
                  <button
                    type="button"
                    onClick={() => toggleLesson(lesson.id)}
                    className="w-full flex items-center justify-between gap-3 text-right"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                          {lesson.duration_minutes ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {lesson.duration_minutes} د
                            </span>
                          ) : null}
                          {lesson.video_url ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Video className="w-3 h-3" /> فيديو
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">بدون فيديو</span>
                          )}
                          {lesson.attachments && lesson.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <FileText className="w-3 h-3" /> {lesson.attachments.length} مرفق
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowLeft className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform rtl:rotate-180',
                      isOpen && '-rotate-90 rtl:rotate-90'
                    )} />
                  </button>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {lesson.description && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{lesson.description}</p>
                      )}

                      {lesson.video_url && (
                        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-border">
                          {ytEmbed ? (
                            <iframe src={ytEmbed} className="w-full h-full" allowFullScreen />
                          ) : (
                            // eslint-disable-next-line jsx-a11y/media-has-caption
                            <video src={lesson.video_url} controls className="w-full h-full object-contain" />
                          )}
                        </div>
                      )}

                      {lesson.attachments && lesson.attachments.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-muted-foreground">المرفقات</div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {lesson.attachments.map(att => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="flex items-center gap-2 px-3 py-2 border border-border bg-muted/30 hover:bg-muted rounded-lg text-sm transition-colors"
                              >
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="flex-1 truncate">{att.name}</span>
                                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating review modal */}
      {reviewMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && !submittingReview && setReviewMode(null)}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              {reviewMode === 'approve' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="font-bold">قبول الدورة</h3>
                    <p className="text-xs text-muted-foreground">ستُنشر الدورة للطلاب فوراً</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-700 dark:text-red-300" />
                  </div>
                  <div>
                    <h3 className="font-bold">رفض الدورة</h3>
                    <p className="text-xs text-muted-foreground">يصل سبب الرفض للمدرس لتعديل الدورة وإعادة إرسالها</p>
                  </div>
                </>
              )}
            </div>
            <div className="p-5 space-y-4">
              {reviewMode === 'reject' ? (
                <div>
                  <label className="text-sm font-bold block mb-2">سبب الرفض <span className="text-red-500">*</span></label>
                  <textarea
                    rows={5}
                    autoFocus
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="مثال: المحتوى ناقص في الدرس الثاني، ولا يوجد وصف كافٍ للدورة. الرجاء إضافة..."
                    className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">سيرى المدرس النص أعلاه بالكامل.</p>
                </div>
              ) : (
                <p className="text-sm">
                  هل أنت متأكد من قبول الدورة <span className="font-bold">{course.title}</span> ونشرها للطلاب؟
                </p>
              )}
            </div>
            <div className="p-5 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
              <button
                disabled={submittingReview}
                onClick={() => setReviewMode(null)}
                className="px-4 py-2 border border-border bg-card hover:bg-muted rounded-lg font-bold text-sm transition-colors disabled:opacity-60"
              >
                إلغاء
              </button>
              <button
                disabled={submittingReview || (reviewMode === 'reject' && rejectionReason.trim().length < 3)}
                onClick={handleSubmitReview}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm text-white transition-colors disabled:opacity-60',
                  reviewMode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
                )}
              >
                {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                {reviewMode === 'approve' ? 'تأكيد القبول' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoChip({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-xl p-3 flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">{label}</div>
        <div className="text-sm font-bold truncate">{value}</div>
        {subValue && <div className="text-[11px] text-muted-foreground truncate">{subValue}</div>}
      </div>
    </div>
  )
}
