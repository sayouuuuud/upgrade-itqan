"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Mic,
  Video,
  FileText,
  ImageIcon,
  Paperclip,
  X,
  Loader2,
  Calendar,
  Trophy,
  BookOpen,
  Clock,
  FileCheck2,
  AlertTriangle,
  Info,
  Save,
  PenTool
} from "lucide-react"
import AudioRecorder from "@/components/academy/audio-recorder"
import { cn } from "@/lib/utils"

type TaskType =
  | "written"
  | "audio"
  | "video"
  | "project"
  | "quiz"
  | "file"
  | "image"
  | string

interface Task {
  id: string
  title: string
  description?: string
  type: TaskType
  due_date?: string
  max_score: number
  course_title?: string
  teacher_name?: string
  submission_instructions?: string
}

interface Submission {
  id: string
  content?: string
  file_url?: string
  file_name?: string
  file_type?: string
  file_size?: number
  audio_url?: string
  video_url?: string
  submission_type?: string
  status: string
  score?: number | null
  feedback?: string | null
  attempts?: number
  submitted_at?: string
  graded_at?: string
}

export default function SubmitTaskPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState<null | "file" | "image" | "video">(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [textContent, setTextContent] = useState("")
  const [fileData, setFileData] = useState<{ url: string; name: string; type: string; size: number } | null>(null)
  const [imageData, setImageData] = useState<{ url: string; name: string; type: string; size: number } | null>(null)
  const [videoData, setVideoData] = useState<{ url: string; name: string; type: string; size: number } | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    async function fetchTask() {
      try {
        const res = await fetch(`/api/academy/student/tasks/${taskId}`)
        if (!res.ok) {
          setError("لم يتم العثور على المهمة أو ليس لديك صلاحية الوصول إليها.")
          return
        }
        const json = await res.json()
        if (!mounted) return
        setTask(json.task)
        if (json.submission) {
          setSubmission(json.submission)
          setTextContent(json.submission.content || "")
          if (json.submission.audio_url) setAudioUrl(json.submission.audio_url)
          if (json.submission.video_url) {
            setVideoData({
              url: json.submission.video_url,
              name: json.submission.file_name || "مقطع فيديو",
              type: json.submission.file_type || "video/mp4",
              size: json.submission.file_size || 0,
            })
          }
          if (json.submission.file_url) {
            const isImg = (json.submission.file_type || "").startsWith("image/")
            const data = {
              url: json.submission.file_url,
              name: json.submission.file_name || "ملف مرفق",
              type: json.submission.file_type || "",
              size: json.submission.file_size || 0,
            }
            if (isImg) setImageData(data)
            else setFileData(data)
          }
        }
      } catch {
        if (mounted) setError("خطأ في الاتصال بالخادم.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchTask()
    return () => { mounted = false }
  }, [taskId])

  const taskType: TaskType = task?.type || "written"
  const requiresAudio = taskType === "audio" || taskType === "recitation"
  const requiresVideo = taskType === "video"
  const requiresFile = taskType === "project" || taskType === "file"
  const requiresImage = taskType === "image"
  // Written or unknown type defaults to text. Also quiz can have text.
  const allowsText = taskType === "written" || taskType === "quiz" || taskType === "project" || !["audio", "video", "image", "file", "recitation"].includes(taskType)

  const isOverdue = task?.due_date ? new Date() > new Date(task.due_date) : false
  const isGraded = submission?.status === "graded"

  const hasAnyContent = !!textContent.trim() || !!fileData || !!imageData || !!audioUrl || !!videoData

  const missingRequiredType =
    (requiresAudio && !audioUrl) ||
    (requiresVideo && !videoData) ||
    (requiresImage && !imageData) ||
    (requiresFile && !fileData && !imageData)

  const canSubmit = !submitting && !uploading && hasAnyContent && !missingRequiredType

  const uploadFile = async (file: File, field: "audio" | "image" | "file", bucket: "file" | "image" | "video") => {
    setUploading(bucket)
    setError("")
    try {
      const formData = new FormData()
      formData.append(field, file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || "فشل رفع الملف")
      }
      return { url: json.url, name: file.name, type: file.type, size: file.size }
    } finally {
      setUploading(null)
    }
  }

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>, bucket: "file" | "image" | "video") => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const field = bucket === "image" ? "image" : "file"
      const data = await uploadFile(file, field, bucket)
      if (bucket === "file") setFileData(data)
      if (bucket === "image") setImageData(data)
      if (bucket === "video") setVideoData(data)
    } catch (err: any) {
      setError(err?.message || "فشل رفع الملف")
    } finally {
      e.target.value = ""
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (requiresAudio && !audioUrl) return setError("هذه المهمة تتطلب تسجيلاً صوتياً كمتطلب أساسي.")
    if (requiresVideo && !videoData) return setError("هذه المهمة تتطلب رفع مقطع فيديو.")
    if (requiresImage && !imageData) return setError("هذه المهمة تتطلب إرفاق صورة.")
    if (requiresFile && !fileData && !imageData) return setError("هذه المهمة تتطلب إرفاق ملف.")
    if (!hasAnyContent) return setError("لا يمكن إرسال تسليم فارغ. اكتب إجابة أو أرفق ملفاً.")

    setSubmitting(true)
    try {
      const attachments = [
        audioUrl && "audio",
        videoData && "video",
        imageData && "image",
        fileData && "file",
        textContent.trim() && "text",
      ].filter(Boolean) as string[]

      const submission_type = attachments.length > 1 ? "mixed" : attachments[0] || "text"
      const primaryFile = fileData || imageData

      const payload = {
        content: textContent.trim() || null,
        submission_type,
        file_url: primaryFile?.url || null,
        file_name: primaryFile?.name || null,
        file_type: primaryFile?.type || null,
        file_size: primaryFile?.size || null,
        audio_url: audioUrl || null,
        video_url: videoData?.url || null,
      }

      const res = await fetch(`/api/academy/student/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "فشل التسليم")

      setSuccess(true)
      // Removed the setTimeout reload/push based on user request.
      // The user will see the success message and can manually go back.
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التسليم")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">جاري تحميل المهمة...</p>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="max-w-2xl mx-auto py-12" dir="rtl">
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">خطأ في استرجاع المهمة</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/academy/student/tasks" className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة للمهام
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" dir="rtl">
      {/* Header Back Link */}
      <div className="flex items-center gap-4">
        <Link
          href="/academy/student/tasks"
          className="flex items-center justify-center w-10 h-10 border border-border bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/20 text-muted-foreground rounded-xl transition-colors"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-foreground truncate">{task?.title}</h1>
            <TaskTypeBadge type={taskType} />
          </div>
          <p className="text-muted-foreground font-medium mt-1">تجهيز وإرسال متطلبات المهمة</p>
        </div>
      </div>

      {/* Already graded banner */}
      {isGraded && (
        <div className="relative overflow-hidden p-6 bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl shadow-sm">
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-primary mb-1">
                تم تقييم المهمة وتصحيحها!
              </h3>
              <p className="text-primary/80 font-bold mb-4">
                النتيجة: <span className="text-2xl">{submission?.score}</span> من {task?.max_score}
              </p>
              {submission?.feedback && (
                <div className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-primary/10 text-sm">
                  <span className="font-bold text-primary block mb-2 flex items-center gap-2">
                    <PenTool className="w-4 h-4" /> تعليق المعلم:
                  </span>
                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Late & Re-submission Banners */}
      <div className="space-y-3">
        {isOverdue && !isGraded && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">لقد تجاوزت الموعد المحدد. تسليمك الآن سيُسجل كمهمة متأخرة.</span>
          </div>
        )}
        {submission && !isGraded && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-primary">
            <Info className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">تم تسليم هذه المهمة مسبقاً (المحاولة #{submission.attempts || 1}). يمكنك تعديل المرفقات وإعادة الإرسال.</span>
          </div>
        )}
      </div>

      {/* Task Details Card */}
      <section className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-muted/50 p-5 border-b border-border flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground">
          {task?.course_title && (
            <span className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border/50 shadow-sm text-foreground">
              <BookOpen className="w-4 h-4 text-primary" /> {task.course_title}
            </span>
          )}
          <span className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm",
            isOverdue && !isGraded ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" : "bg-background border-border/50 text-foreground"
          )}>
            <Calendar className="w-4 h-4" />
            {task?.due_date ? new Date(task.due_date).toLocaleDateString("ar-EG", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "غير محدد"}
          </span>
          <span className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border/50 shadow-sm text-foreground">
            <Trophy className="w-4 h-4 text-primary" /> {task?.max_score} نقطة
          </span>
        </div>

        {task?.description && (
          <div className="p-6">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> وصف المهمة المطلوب
            </h3>
            <p className="whitespace-pre-wrap text-foreground leading-relaxed text-[15px]">
              {task.description}
            </p>
          </div>
        )}
        
        {task?.submission_instructions && (
          <div className="p-6 bg-primary/5 border-t border-border">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> تعليمات هامة للتسليم
            </h3>
            <p className="whitespace-pre-wrap text-primary/80 leading-relaxed text-[14px]">
              {task.submission_instructions}
            </p>
          </div>
        )}
      </section>

      {/* Submission Form Area */}
      {success ? (
        <div className="p-12 bg-primary/10 border border-primary/20 rounded-3xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="font-black text-2xl text-primary mb-4">تم استلام عملك بنجاح!</h3>
          <Link href="/academy/student/tasks" className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors">
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            العودة لقائمة المهام
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3 font-bold text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Audio Recording */}
            {requiresAudio && (
              <section className="col-span-1 md:col-span-2 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <SectionHeader icon={<Mic className="w-5 h-5 text-primary" />} title="تسجيل التلاوة / الإجابة الصوتية" required />
                <div className="mt-4">
                  <AudioRecorder value={audioUrl} onChange={setAudioUrl} disabled={submitting || isGraded} />
                </div>
              </section>
            )}

            {/* Video Upload */}
            {requiresVideo && (
              <section className="col-span-1 md:col-span-2 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <SectionHeader icon={<Video className="w-5 h-5 text-primary" />} title="إرفاق مقطع فيديو" required />
                <div className="mt-4">
                  <UploadField
                    accept="video/*"
                    inputRef={videoInputRef}
                    isUploading={uploading === "video"}
                    isDisabled={submitting || isGraded}
                    data={videoData}
                    onPick={(e: React.ChangeEvent<HTMLInputElement>) => handleFilePick(e, "video")}
                    onClear={() => setVideoData(null)}
                    placeholder="اسحب الفيديو هنا أو اضغط للاختيار (MP4, WebM)"
                    icon={<Video className="w-8 h-8 text-primary/50" />}
                    preview={videoData && <video src={videoData.url} controls className="w-full rounded-xl bg-black shadow-md mt-4" />}
                  />
                </div>
              </section>
            )}

            {/* Image Upload */}
            {requiresImage && (
              <section className="col-span-1 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <SectionHeader icon={<ImageIcon className="w-5 h-5 text-primary" />} title="إرفاق صورة" required />
                <div className="mt-4">
                  <UploadField
                    accept="image/*"
                    inputRef={imageInputRef}
                    isUploading={uploading === "image"}
                    isDisabled={submitting || isGraded}
                    data={imageData}
                    onPick={(e: React.ChangeEvent<HTMLInputElement>) => handleFilePick(e, "image")}
                    onClear={() => setImageData(null)}
                    placeholder="اضغط لاختيار صورة (JPG, PNG)"
                    icon={<ImageIcon className="w-8 h-8 text-primary/50" />}
                    preview={imageData && <img src={imageData.url} alt="Preview" className="w-full object-cover rounded-xl shadow-md mt-4 max-h-48 bg-muted" />}
                  />
                </div>
              </section>
            )}

            {/* General File Upload */}
            {requiresFile && (
              <section className="col-span-1 md:col-span-2 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <SectionHeader icon={<Paperclip className="w-5 h-5 text-primary" />} title="رفع ملف المشروع" required />
                <div className="mt-4">
                  <UploadField
                    accept=".pdf,.doc,.docx,.zip,.rar,.txt,.ppt,.pptx"
                    inputRef={fileInputRef}
                    isUploading={uploading === "file"}
                    isDisabled={submitting || isGraded}
                    data={fileData}
                    onPick={(e: React.ChangeEvent<HTMLInputElement>) => handleFilePick(e, "file")}
                    onClear={() => setFileData(null)}
                    placeholder="اضغط لاختيار ملف (PDF, Word, ZIP, PPTX)"
                    icon={<Paperclip className="w-8 h-8 text-primary/50" />}
                  />
                </div>
              </section>
            )}

            {/* Optional Attachment (if no required files) */}
            {!requiresFile && !requiresImage && !requiresVideo && !requiresAudio && (
              <section className="col-span-1 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <SectionHeader icon={<Paperclip className="w-5 h-5 text-primary/70" />} title="مرفق اختياري" />
                <div className="mt-4">
                  <UploadField
                    accept=".pdf,.doc,.docx,.jpg,.png,.zip"
                    inputRef={fileInputRef}
                    isUploading={uploading === "file"}
                    isDisabled={submitting || isGraded}
                    data={fileData}
                    onPick={(e: React.ChangeEvent<HTMLInputElement>) => handleFilePick(e, "file")}
                    onClear={() => setFileData(null)}
                    placeholder="إرفاق ملف داعم لإجابتك"
                    icon={<Paperclip className="w-8 h-8 text-primary/30" />}
                  />
                </div>
              </section>
            )}

            {/* Text Answer Area */}
            {(allowsText || requiresAudio || requiresVideo || requiresImage || requiresFile) && (
              <section className={cn(
                "bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors flex flex-col",
                (!requiresImage && !requiresFile && !requiresVideo && !requiresAudio) ? "col-span-1 md:col-span-2" : "col-span-1 md:col-span-2"
              )}>
                <SectionHeader 
                  icon={<PenTool className="w-5 h-5 text-primary" />} 
                  title={allowsText && !requiresAudio && !requiresVideo && !requiresImage && !requiresFile ? "إجابتك النصية" : "ملاحظات للطالب (اختياري)"} 
                  required={allowsText && !requiresAudio && !requiresVideo && !requiresImage && !requiresFile} 
                />
                <textarea
                  rows={6}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder={
                    allowsText && !requiresAudio && !requiresVideo && !requiresImage && !requiresFile
                      ? "اكتب إجابتك هنا بشكل واضح ومفصل..."
                      : "هل لديك أي ملاحظات ترغب بإيصالها للمعلم بخصوص هذا التسليم؟"
                  }
                  className="w-full mt-4 p-4 rounded-xl border border-border/50 bg-background/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-y transition-all"
                  disabled={submitting || isGraded}
                />
              </section>
            )}
          </div>

          {!hasAnyContent && (
            <div className="flex items-center gap-2 justify-center text-sm font-bold text-primary bg-primary/5 p-3 rounded-xl border border-primary/10">
              <AlertCircle className="w-4 h-4" /> يجب استكمال عنصر واحد على الأقل للمهمة ليتم التفعيل
            </div>
          )}

          {/* Submit Actions */}
          {!isGraded && (
            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-border mt-8">
              <Link
                href="/academy/student/tasks"
                className="flex-1 sm:flex-none px-8 py-4 border-2 border-border bg-transparent hover:bg-muted text-foreground font-black rounded-xl transition-colors text-center"
              >
                إلغاء والعودة
              </Link>
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "flex-1 px-8 py-4 text-primary-foreground font-black rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm",
                  canSubmit 
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-muted text-muted-foreground border-2 border-border cursor-not-allowed shadow-none"
                )}
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري رفع البيانات...</>
                ) : (
                  <><Save className="w-5 h-5" /> {submission ? "حفظ التعديلات وإعادة التسليم" : "تأكيد وتسليم المهمة"}</>
                )}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )

  function SectionHeader({ icon, title, required }: { icon: React.ReactNode; title: string; required?: boolean }) {
    return (
      <div className="flex items-center gap-3 pb-3 border-b border-border/40">
        <div className="p-2 bg-background rounded-lg border border-border shadow-sm">{icon}</div>
        <h2 className="text-lg font-black text-foreground">
          {title} {required && <span className="text-red-500 text-sm">*</span>}
        </h2>
      </div>
    )
  }

  function UploadField({ accept, inputRef, isUploading, isDisabled, data, onPick, onClear, placeholder, icon, preview }: any) {
    return (
      <div className="relative group/uploader">
        <input ref={inputRef} type="file" accept={accept} onChange={onPick} className="hidden" disabled={isUploading || isDisabled} />
        {!data ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || isDisabled}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl transition-all duration-200",
              "border-border hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10",
              (isUploading || isDisabled) && "opacity-60 cursor-not-allowed hover:border-border hover:bg-transparent"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="font-bold text-sm">جاري الرفع بسيرفرات الأكاديمية...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover/uploader:text-primary transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center group-hover/uploader:scale-110 transition-transform">
                  {icon}
                </div>
                <span className="font-bold text-sm text-center">{placeholder}</span>
              </div>
            )}
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-background shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate" dir="ltr">{data.name}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{formatBytes(data.size)}</p>
              </div>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={onClear}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500 hover:text-white text-muted-foreground transition-all shrink-0 border border-transparent hover:border-red-600"
                  aria-label="إزالة الملف"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {preview}
          </div>
        )}
      </div>
    )
  }
}

function TaskTypeBadge({ type }: { type: TaskType }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    written: { label: "مهمة كتابية", cls: "bg-primary text-primary-foreground", icon: PenTool },
    quiz: { label: "اختبار", cls: "bg-primary text-primary-foreground", icon: FileText },
    audio: { label: "تسجيل صوتي", cls: "bg-primary text-primary-foreground", icon: Mic },
    recitation: { label: "تسميع مقطعي", cls: "bg-primary text-primary-foreground", icon: Mic },
    video: { label: "مقطع فيديو", cls: "bg-primary text-primary-foreground", icon: Video },
    image: { label: "مرفق صورة", cls: "bg-primary text-primary-foreground", icon: ImageIcon },
    project: { label: "ملف مشروع", cls: "bg-primary text-primary-foreground", icon: Paperclip },
    file: { label: "إرفاق ملف", cls: "bg-primary text-primary-foreground", icon: Paperclip },
  }
  const info = map[type] || map.written
  const Icon = info.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${info.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {info.label}
    </span>
  )
}
