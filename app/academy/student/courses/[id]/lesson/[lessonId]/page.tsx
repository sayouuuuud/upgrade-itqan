"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { PlayCircle, ChevronRight, ChevronLeft, ArrowRight, CheckCircle2, ListVideo, BookOpen, Download, FileIcon, Loader2 } from 'lucide-react'

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()

  const courseId = params.id as string
  const lessonId = params.lessonId as string

  const [lessonData, setLessonData] = useState<any>(null)
  const [courseLessons, setCourseLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!lessonId) return;
      try {
        setLoading(true)
        // Fetch lesson
        const lRes = await fetch(`/api/academy/student/lessons/${lessonId}`)
        if (!lRes.ok) {
          const err = await lRes.json()
          setErrorText(err.error || 'حدث خطأ في تحميل الدرس')
          setLoading(false)
          return
        }
        const lData = await lRes.json()
        // Merge is_completed into lesson data for easier access
        const fullLessonData = { ...lData.lesson, is_completed: lData.is_completed };
        setLessonData(fullLessonData)

        // Fetch course for sidebar - Use courseId from params or fallback to lesson's course_id
        const effectiveCourseId = courseId || fullLessonData.course_id
        if (effectiveCourseId) {
          const cRes = await fetch(`/api/academy/student/courses/${effectiveCourseId}`)
          if (cRes.ok) {
            const cData = await cRes.json()
            setCourseLessons(cData.lessons || [])
          }
        }

      } catch (e) {
        setErrorText('حدث خطأ في الاتصال')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [lessonId, courseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorText || !lessonData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <PlayCircle className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">{errorText}</h2>
        <button onClick={() => router.push(`/academy/student/courses/${courseId}`)} className="text-blue-600 hover:underline mt-4">
          العودة لصفحة الدورة
        </button>
      </div>
    )
  }

  // Determine current index for next/prev
  const currentIndex = courseLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null

  const isYouTube = lessonData.video_url?.includes('youtube.com') || lessonData.video_url?.includes('youtu.be')
  const getOutputVideoUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}`
    if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`
    return url;
  }

  const getDownloadUrl = (url: string, name: string) => {
    if (!url) return '#';
    // Use our internal proxy to avoid CORS and Cloudinary 401 issues
    return `/api/academy/student/lessons/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">

      {/* Main Content (Left side in LTR, Right side in RTL natively Flex handles it) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Breadcrumb / Back */}
        <div className="mb-4">
          <Link href={`/academy/student/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            العودة للدورة: {lessonData.course_title}
          </Link>
        </div>

        {/* Video Player */}
        <div className="bg-black w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-border/5 mb-6 relative group">
          {lessonData.video_url ? (
            isYouTube ? (
              <iframe
                src={getOutputVideoUrl(lessonData.video_url)!}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                src={lessonData.video_url}
                controls
                className="w-full h-full object-contain"
                controlsList="nodownload"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-950 flex flex-col items-center justify-center">
              <PlayCircle className="w-20 h-20 text-blue-500/50 mb-4" />
              <p className="text-blue-200 font-medium text-lg">لا يوجد فيديو لهذا الدرس بعد</p>
            </div>
          )}
        </div>

        {/* Lesson Details */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 lg:p-10 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full">
                  الدرس {lessonData.order_index}
                </span>
                {lessonData.duration_minutes && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                    {lessonData.duration_minutes} دقيقة
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {lessonData.title}
              </h1>
            </div>

            <button
              disabled={lessonData.is_completed || isCompleting}
              onClick={async () => {
                if (lessonData.is_completed) return;
                try {
                  setIsCompleting(true)
                  const res = await fetch(`/api/academy/student/lessons/${lessonId}/complete`, { method: 'POST' });
                  if (res.ok) {
                    setLessonData({ ...lessonData, is_completed: true });
                    // Update sidebar status locally
                    setCourseLessons(prev => prev.map(l => l.id === lessonId ? { ...l, is_completed: true } : l))
                  } else {
                    const err = await res.json();
                    alert(err.error || 'حدث خطأ');
                  }
                } catch {
                  alert('حدث خطأ في الاتصال');
                } finally {
                  setIsCompleting(false)
                }
              }}
              className={cn(
                "shrink-0 px-4 py-2 border rounded-xl text-sm font-bold flex items-center gap-2 transition-colors",
                lessonData.is_completed
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  : "border-border hover:bg-muted text-muted-foreground disabled:opacity-50"
              )}
            >
              {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {lessonData.is_completed ? 'مكتمل' : 'تحديد كمكتمل'}
            </button>
          </div>

          {/* Success Banner */}
          {lessonData.is_completed && nextLesson && (
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4 text-center sm:text-right">
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 dark:text-green-300">أحسنت! لقد أتممت هذا الدرس</h3>
                  <p className="text-sm text-green-700/80 dark:text-green-400/80">أنت الآن مستعد للانتقال للدرس التالي</p>
                </div>
              </div>
              <Link
                href={`/academy/student/courses/${courseId}/lesson/${nextLesson.id}`}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
              >
                انتقل للدرس التالي
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          )}

          <div className="prose prose-blue dark:prose-invert max-w-none text-muted-foreground mb-10 leading-relaxed font-medium whitespace-pre-wrap">
            {lessonData.description || lessonData.content || <span className="opacity-50">لا يوجد وصف للدرس.</span>}
          </div>

          {/* Attachments Section */}
          {lessonData.attachments && lessonData.attachments.length > 0 && (
            <div className="mb-10 p-6 bg-muted/30 rounded-2xl border border-border border-dashed">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
                <Download className="w-5 h-5 text-blue-600" />
                المرفقات والملفات التعزيزية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lessonData.attachments.map((att: any) => (
                  <a
                    key={att.id}
                    href={getDownloadUrl(att.file_url, att.file_name)}
                    download={att.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-card border border-border rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{att.file_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{att.file_type}</p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-8 border-t border-border">
            {prevLesson ? (
              <Link
                href={`/academy/student/courses/${courseId}/lesson/${prevLesson.id}`}
                className="px-5 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 text-sm font-bold transition-colors"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                الدرس السابق
              </Link>
            ) : <div />}

            {nextLesson && (
              <Link
                href={`/academy/student/courses/${courseId}/lesson/${nextLesson.id}`}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-sm font-bold transition-colors shadow-sm ml-auto"
              >
                الدرس التالي
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar: Course Content */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-card rounded-2xl border border-border sticky top-24 overflow-hidden shadow-sm flex flex-col max-h-[calc(100vh-120px)]">
          <div className="p-5 border-b border-border bg-muted/30">
            <h3 className="font-bold flex items-center gap-2 text-foreground">
              <ListVideo className="w-5 h-5 text-blue-600" />
              قائمة الدروس
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {lessonData.course_title}
            </p>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="flex flex-col p-2">
              {courseLessons.map((lesson, idx) => {
                const isActive = lesson.id === lessonId
                return (
                  <Link
                    key={lesson.id}
                    href={`/academy/student/courses/${courseId}/lesson/${lesson.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 text-sm rounded-xl transition-all cursor-pointer",
                      isActive
                        ? "bg-blue-600 text-white shadow-md font-bold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                      isActive ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lesson.duration_minutes && (
                          <p className={cn("text-[10px]", isActive ? "text-blue-100" : "opacity-60")}>
                            {lesson.duration_minutes} دقيقة
                          </p>
                        )}
                        {lesson.is_completed && (
                          <CheckCircle2 className={cn("w-3 h-3", isActive ? "text-white" : "text-green-500")} />
                        )}
                      </div>
                    </div>
                    {isActive && <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-white ml-1" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
