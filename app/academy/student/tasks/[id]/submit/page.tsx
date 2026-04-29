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
} from "lucide-react"
import AudioRecorder from "@/components/academy/audio-recorder"

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
  const [fileData, setFileData] = useState<{
    url: string
    name: string
    type: string
    size: number
  } | null>(null)
  const [imageData, setImageData] = useState<{
    url: string
    name: string
    type: string
    size: number
  } | null>(null)
  const [videoData, setVideoData] = useState<{
    url: string
    name: string
    type: string
    size: number
  } | null>(null)
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
          setError("لم يتم العثور على المهمة")
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
              name: json.submission.file_name || "video",
              type: json.submission.file_type || "video/mp4",
              size: json.submission.file_size || 0,
            })
          }
          if (json.submission.file_url) {
            const isImg = (json.submission.file_type || "").startsWith("image/")
            const data = {
              url: json.submission.file_url,
              name: json.submission.file_name || "file",
              type: json.submission.file_type || "",
              size: json.submission.file_size || 0,
            }
            if (isImg) setImageData(data)
            else setFileData(data)
          }
        }
      } catch {
        if (mounted) setError("خطأ في الاتصال")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchTask()
    return () => {
      mounted = false
    }
  }, [taskId])

  const taskType: TaskType = task?.type || "written"
  const requiresAudio = taskType === "audio"
  const requiresVideo = taskType === "video"
  const requiresFile = taskType === "project" || taskType === "file"
  const requiresImage = taskType === "image"
  const allowsText =
    taskType === "written" ||
    taskType === "quiz" ||
    taskType === "project" ||
    !["audio", "video", "image", "file"].includes(taskType)

  const isOverdue = task?.due_date ? new Date() > new Date(task.due_date) : false
  const isGraded = submission?.status === "graded"

  // At least one of these must be provided before submitting
  const hasAnyContent =
    !!textContent.trim() || !!fileData || !!imageData || !!audioUrl || !!videoData

  // Specific media type missing for tasks that require it
  const missingRequiredType =
    (requiresAudio && !audioUrl) ||
    (requiresVideo && !videoData) ||
    (requiresImage && !imageData) ||
    (requiresFile && !fileData && !imageData)

  const canSubmit = !submitting && !uploading && hasAnyContent && !missingRequiredType

  const uploadFile = async (
    file: File,
    field: "audio" | "image" | "file",
    bucket: "file" | "image" | "video",
  ) => {
    setUploading(bucket)
    setError("")
    try {
      const formData = new FormData()
      formData.append(field, file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "فشل الرفع")
      return {
        url: json.url as string,
        name: file.name,
        type: file.type,
        size: file.size,
      }
    } finally {
      setUploading(null)
    }
  }

  const handleFilePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: "file" | "image" | "video",
  ) => {
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
      // reset input so picking the same file again still triggers change
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

    // Type-specific required media
    if (requiresAudio && !audioUrl) {
      return setError("هذه المهمة تتطلب تسجيلاً صوتياً")
    }
    if (requiresVideo && !videoData) {
      return setError("هذه المهمة تتطلب رفع مقطع فيديو")
    }
    if (requiresImage && !imageData) {
      return setError("هذه المهمة تتطلب رفع صورة")
    }
    if (requiresFile && !fileData && !imageData) {
      return setError("هذه المهمة تتطلب رفع ملف")
    }

    // At minimum, one of: text / file / image / audio / video
    if (!hasAnyContent) {
      return setError("لا يمكن إرسال تسليم فارغ. اكتب إجابة أو أرفق ملفاً.")
    }

    setSubmitting(true)
    try {
      // Decide submission_type
      const attachments = [
        audioUrl && "audio",
        videoData && "video",
        imageData && "image",
        fileData && "file",
        textContent.trim() && "text",
      ].filter(Boolean) as string[]

      const submission_type =
        attachments.length > 1
          ? "mixed"
          : attachments[0] || "text"

      // Pick the primary file_url (file or image)
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
      setTimeout(() => router.push("/academy/student/tasks"), 1800)
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التسليم")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/academy/student/tasks"
          className="p-2 border border-border bg-card rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">{task?.title}</h1>
          <p className="text-muted-foreground text-sm">تسليم المهمة</p>
        </div>
      </div>

      {/* Already graded banner */}
      {isGraded && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
          <div className="flex items-start gap-3">
            <FileCheck2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300">
                تم تصحيح هذه المهمة
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                درجتك: <span className="font-bold">{submission?.score}</span> /{" "}
                {task?.max_score}
              </p>
              {submission?.feedback && (
                <div className="mt-2 p-3 bg-white/60 dark:bg-black/20 rounded-lg text-sm text-emerald-900 dark:text-emerald-200">
                  <strong>ملاحظات المعلم: </strong>
                  <span className="whitespace-pre-wrap">{submission.feedback}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Late warning */}
      {isOverdue && !isGraded && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>تجاوزت الموعد المحدد، التسليم مازال مفتوحاً لكنه سيُسجَّل كمتأخر.</span>
        </div>
      )}

      {/* Already submitted banner (not graded) */}
      {submission && !isGraded && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            سبق تسليم هذه المهمة (محاولة #{submission.attempts || 1}). يمكنك تعديل
            تسليمك وإعادة الإرسال.
          </span>
        </div>
      )}

      {/* Task details card */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <div className="flex flex-wrap gap-3 items-center text-sm">
            {task?.course_title && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                {task.course_title}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {task?.due_date
                ? new Date(task.due_date).toLocaleDateString("ar-EG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "بدون موعد"}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="w-4 h-4" />
              {task?.max_score} درجة
            </span>
            <TaskTypeBadge type={taskType} />
          </div>
        </div>
        {task?.description && (
          <div className="p-5">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-2">
              وصف المهمة
            </h3>
            <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}
        {task?.submission_instructions && (
          <div className="p-5 border-t border-border bg-blue-50/50 dark:bg-blue-950/10">
            <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              تعليمات التسليم
            </h3>
            <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
              {task.submission_instructions}
            </p>
          </div>
        )}
      </section>

      {success ? (
        <div className="p-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-300">
            تم تسليم المهمة بنجاح
          </h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
            جاري العودة لقائمة المهام...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Audio submission */}
          {requiresAudio && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <SectionHeader
                icon={<Mic className="w-4 h-4" />}
                title="التسجيل الصوتي"
                required
              />
              <AudioRecorder
                value={audioUrl}
                onChange={setAudioUrl}
                disabled={submitting}
              />
            </section>
          )}

          {/* Video submission */}
          {requiresVideo && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <SectionHeader
                icon={<Video className="w-4 h-4" />}
                title="مقطع الفيديو"
                required
              />
              <UploadField
                accept="video/*"
                inputRef={videoInputRef}
                isUploading={uploading === "video"}
                data={videoData}
                onPick={e => handleFilePick(e, "video")}
                onClear={() => setVideoData(null)}
                placeholder="اضغط لاختيار مقطع فيديو (MP4, WebM)"
                icon={<Video className="w-5 h-5" />}
                preview={
                  videoData ? (
                    <video
                      src={videoData.url}
                      controls
                      className="w-full max-h-64 rounded-lg bg-black"
                    />
                  ) : null
                }
              />
            </section>
          )}

          {/* Image submission */}
          {requiresImage && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <SectionHeader
                icon={<ImageIcon className="w-4 h-4" />}
                title="الصورة"
                required
              />
              <UploadField
                accept="image/*"
                inputRef={imageInputRef}
                isUploading={uploading === "image"}
                data={imageData}
                onPick={e => handleFilePick(e, "image")}
                onClear={() => setImageData(null)}
                placeholder="اضغط لاختيار صورة (JPG, PNG)"
                icon={<ImageIcon className="w-5 h-5" />}
                preview={
                  imageData ? (
                    <img
                      src={imageData.url || "/placeholder.svg"}
                      alt="معاينة"
                      className="w-full max-h-64 object-contain rounded-lg bg-muted"
                    />
                  ) : null
                }
              />
            </section>
          )}

          {/* File submission (project/file) */}
          {requiresFile && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <SectionHeader
                icon={<Paperclip className="w-4 h-4" />}
                title="الملف المرفق"
                required
              />
              <UploadField
                accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.png"
                inputRef={fileInputRef}
                isUploading={uploading === "file"}
                data={fileData}
                onPick={e => handleFilePick(e, "file")}
                onClear={() => setFileData(null)}
                placeholder="اضغط لاختيار ملف (PDF, Word, ZIP...)"
                icon={<Paperclip className="w-5 h-5" />}
              />
            </section>
          )}

          {/* Text answer (always shown for written/quiz, optional for others) */}
          {(allowsText || requiresAudio || requiresVideo || requiresImage || requiresFile) && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <SectionHeader
                icon={<FileText className="w-4 h-4" />}
                title={allowsText && !requiresAudio && !requiresVideo && !requiresImage && !requiresFile ? "إجابتك" : "ملاحظات إضافية"}
                required={allowsText && !requiresAudio && !requiresVideo && !requiresImage && !requiresFile}
              />
              <textarea
                rows={5}
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder={
                  allowsText && !requiresAudio && !requiresVideo && !requiresImage && !requiresFile
                    ? "اكتب إجابتك هنا..."
                    : "أضف ملاحظات أو شرحاً مع التسليم (اختياري)"
                }
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={submitting}
              />
            </section>
          )}

          {/* Optional extra file for written/quiz */}
          {!requiresFile && !requiresImage && !requiresVideo && !requiresAudio && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <SectionHeader
                icon={<Paperclip className="w-4 h-4" />}
                title="مرفق اختياري"
              />
              <UploadField
                accept=".pdf,.doc,.docx,.jpg,.png,.zip"
                inputRef={fileInputRef}
                isUploading={uploading === "file"}
                data={fileData}
                onPick={e => handleFilePick(e, "file")}
                onClear={() => setFileData(null)}
                placeholder="اضغط لإضافة ملف داعم لإجابتك"
                icon={<Paperclip className="w-5 h-5" />}
              />
            </section>
          )}

          {/* Persistent hint */}
          {!hasAnyContent && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                يجب إكمال حقل واحد على الأقل قبل التسليم: اكتب الإجابة أو أرفق
                ملفاً/صورة/تسجيلاً.
              </span>
            </div>
          )}

          {/* Submit button */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end pt-2">
            <Link
              href="/academy/student/tasks"
              className="px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-lg transition-colors text-center"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              title={!hasAnyContent ? "أكمل حقلاً واحداً على الأقل" : undefined}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التسليم...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {submission ? "إعادة التسليم" : "تسليم المهمة"}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )

  function SectionHeader({
    icon,
    title,
    required,
  }: {
    icon: React.ReactNode
    title: string
    required?: boolean
  }) {
    return (
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-bold text-foreground">
          {title} {required && <span className="text-red-500">*</span>}
        </h2>
      </div>
    )
  }

  function UploadField({
    accept,
    inputRef,
    isUploading,
    data,
    onPick,
    onClear,
    placeholder,
    icon,
    preview,
  }: {
    accept: string
    inputRef: React.RefObject<HTMLInputElement | null>
    isUploading: boolean
    data: { url: string; name: string; type: string; size: number } | null
    onPick: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
    placeholder: string
    icon: React.ReactNode
    preview?: React.ReactNode
  }) {
    return (
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onPick}
          className="hidden"
          disabled={isUploading || submitting}
        />
        {!data ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || submitting}
            className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-muted-foreground"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-sm font-medium">جاري الرفع...</span>
              </>
            ) : (
              <>
                <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {icon}
                </span>
                <span className="text-sm font-medium">{placeholder}</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
              <span className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center flex-shrink-0">
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{data.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(data.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClear}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors"
                aria-label="إزالة"
                disabled={submitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {preview}
          </div>
        )}
      </div>
    )
  }
}

function TaskTypeBadge({ type }: { type: TaskType }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    written: { label: "كتابي", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", Icon: FileText },
    quiz: { label: "اختبار", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300", Icon: FileText },
    audio: { label: "تسجيل صوتي", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300", Icon: Mic },
    video: { label: "فيديو", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", Icon: Video },
    image: { label: "صورة", cls: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300", Icon: ImageIcon },
    project: { label: "مشروع/ملف", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", Icon: Paperclip },
    file: { label: "ملف", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", Icon: Paperclip },
  }
  const info = map[type] || map.written
  const Icon = info.Icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${info.cls}`}
    >
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  )
}
