"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react"

const MAX_SECONDS = 300 // 5 minutes

type RecordingState = "idle" | "recording" | "uploading" | "saved"

interface AudioRecorderProps {
  /** Existing audio URL (e.g. from previous submission) */
  value?: string | null
  /** Called with the uploaded URL (or null when cleared) */
  onChange: (url: string | null) => void
  disabled?: boolean
}

/**
 * Self-contained audio recorder for academy tasks.
 * Records, previews, and auto-uploads to /api/upload.
 */
export default function AudioRecorder({
  value,
  onChange,
  disabled,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>(value ? "saved" : "idle")
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string>("")

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const localUrlRef = useRef<string | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const mimeRef = useRef<string>("audio/webm")

  const previewUrl = localUrlRef.current || value || null

  const getSupportedMimeType = () => {
    const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
    if (typeof MediaRecorder === "undefined") return "audio/webm"
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t
    }
    return "audio/webm"
  }

  // Recording timer
  useEffect(() => {
    if (state === "recording") {
      intervalRef.current = setInterval(() => {
        setTimer(t => {
          if (t + 1 >= MAX_SECONDS) {
            stopRecording()
            return MAX_SECONDS
          }
          return t + 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop()
      }
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const uploadBlob = async (blob: Blob) => {
    setState("uploading")
    setError("")
    try {
      const ext =
        mimeRef.current.includes("mp4")
          ? "m4a"
          : mimeRef.current.includes("webm")
          ? "webm"
          : "audio"
      const file = new File([blob], `recording_${Date.now()}.${ext}`, {
        type: mimeRef.current,
      })
      const formData = new FormData()
      formData.append("audio", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "فشل رفع التسجيل")
      onChange(json.url || json.audioUrl)
      setState("saved")
    } catch (err: any) {
      setError(err?.message || "فشل رفع التسجيل")
      setState("idle")
    }
  }

  const startRecording = useCallback(async () => {
    if (disabled) return
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      mimeRef.current = mimeType

      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current })
        if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current)
        localUrlRef.current = URL.createObjectURL(blob)
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        // Auto-upload after stopping
        uploadBlob(blob)
      }

      recorder.start()
      setTimer(0)
      setState("recording")
    } catch (err) {
      console.error("[AudioRecorder] Failed to start:", err)
      setError(
        "لا يمكن الوصول إلى الميكروفون. يرجى السماح به في إعدادات المتصفح.",
      )
    }
  }, [disabled])

  const stopRecording = useCallback(() => {
    const r = recorderRef.current
    if (r && r.state === "recording") {
      r.stop()
    }
  }, [])

  const reset = () => {
    setState("idle")
    setTimer(0)
    setIsPlaying(false)
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current)
    localUrlRef.current = null
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current = null
    }
    onChange(null)
  }

  const togglePlayback = () => {
    if (!previewUrl) return
    if (isPlaying && audioElRef.current) {
      audioElRef.current.pause()
      setIsPlaying(false)
      return
    }
    const audio = new Audio(previewUrl)
    audioElRef.current = audio
    audio.onended = () => setIsPlaying(false)
    audio.play().catch(() => setIsPlaying(false))
    setIsPlaying(true)
  }

  const isSaved = state === "saved" || (!!value && state === "idle")
  const isUploading = state === "uploading"

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-mono font-light tracking-widest text-foreground">
            {formatTime(timer)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {state === "idle" && !value && "اضغط على زر التسجيل للبدء"}
            {state === "recording" && "جاري التسجيل... اضغط للإيقاف"}
            {isUploading && "جاري حفظ التسجيل..."}
            {isSaved && "تم تسجيل المقطع - يمكنك المعاينة أو إعادة التسجيل"}
          </p>
        </div>

        {/* Waveform visual */}
        <div className="h-10 w-full max-w-xs flex items-center justify-center gap-[3px]">
          {Array.from({ length: 28 }).map((_, i) => {
            const h = 4 + (Math.sin(i * 0.7) + 1) * 8
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full bg-foreground/40 transition-all ${
                  state === "recording" ? "animate-pulse" : ""
                }`}
                style={{
                  height: `${state === "recording" ? h * 1.6 : h}px`,
                  animationDelay: `${i * 50}ms`,
                  opacity: state === "recording" ? 1 : 0.5,
                }}
              />
            )
          })}
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            disabled={(state === "idle" && !value) || isUploading || disabled}
            onClick={reset}
            className="w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="إعادة التسجيل"
            aria-label="إعادة التسجيل"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {(state === "idle" && !isSaved) && (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 ring-4 ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="بدء التسجيل"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}
          {state === "recording" && (
            <button
              type="button"
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-600 text-white shadow-lg flex items-center justify-center animate-pulse ring-4 ring-red-500/30"
              aria-label="إيقاف التسجيل"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          )}
          {isUploading && (
            <div
              className="w-16 h-16 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center"
              aria-label="جاري الرفع"
            >
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          )}
          {isSaved && (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-card border-2 border-border text-foreground shadow flex items-center justify-center hover:bg-muted transition disabled:opacity-50"
              aria-label="تسجيل جديد"
              title="تسجيل جديد"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}

          <button
            type="button"
            disabled={!previewUrl || isUploading || disabled}
            onClick={togglePlayback}
            className="w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPlaying ? "إيقاف المعاينة" : "تشغيل المعاينة"}
            aria-label={isPlaying ? "إيقاف المعاينة" : "تشغيل المعاينة"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم حفظ التسجيل</span>
          </div>
        )}
      </div>
    </div>
  )
}
