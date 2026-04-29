"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react"

const MAX_SECONDS = 300 // 5 minutes

type RecordingState = "idle" | "recording" | "saved"

interface AcademyAudioRecorderProps {
  onRecorded: (blob: Blob, durationSec: number, mimeType: string) => void
  onCleared?: () => void
  disabled?: boolean
  // Show "saved" state externally (e.g. after upload completes)
  externallySaved?: boolean
}

export function AcademyAudioRecorder({
  onRecorded,
  onCleared,
  disabled,
  externallySaved,
}: AcademyAudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const urlRef = useRef<string | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const mimeRef = useRef<string>("audio/webm")

  const getSupportedMimeType = () => {
    const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
    for (const t of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t
    }
    return "audio/webm"
  }

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

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
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

  const startRecording = useCallback(async () => {
    if (disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
        blobRef.current = blob
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = URL.createObjectURL(blob)
        stream.getTracks().forEach(t => t.stop())
        onRecorded(blob, timer, mimeRef.current)
      }

      recorder.start()
      setTimer(0)
      setState("recording")
    } catch (err) {
      console.error("[AudioRecorder] Failed to start:", err)
      alert("لا يمكن الوصول إلى الميكروفون. يرجى السماح به في إعدادات المتصفح.")
    }
  }, [disabled, timer, onRecorded])

  const stopRecording = useCallback(() => {
    const r = recorderRef.current
    if (r && r.state === "recording") {
      r.stop()
    }
    setState("saved")
  }, [])

  const reset = () => {
    setState("idle")
    setTimer(0)
    setIsPlaying(false)
    blobRef.current = null
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current = null
    }
    onCleared?.()
  }

  const togglePlayback = () => {
    if (!urlRef.current) return
    if (isPlaying && audioElRef.current) {
      audioElRef.current.pause()
      setIsPlaying(false)
      return
    }
    const audio = new Audio(urlRef.current)
    audioElRef.current = audio
    audio.onended = () => setIsPlaying(false)
    audio.play().catch(() => setIsPlaying(false))
    setIsPlaying(true)
  }

  const showSaved = state === "saved" || externallySaved

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-mono font-light tracking-widest text-foreground">
            {formatTime(timer)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {state === "idle" && "اضغط على زر التسجيل للبدء"}
            {state === "recording" && "جاري التسجيل... اضغط للإيقاف"}
            {showSaved && "تم تسجيل المقطع — يمكنك المعاينة أو إعادة التسجيل"}
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
            disabled={state === "idle" || disabled}
            onClick={reset}
            className="w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="إعادة التسجيل"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {state === "idle" && (
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
          {showSaved && state !== "recording" && (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-card border-2 border-border text-foreground shadow flex items-center justify-center hover:bg-muted transition disabled:opacity-50"
              aria-label="إعادة التسجيل"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}

          <button
            type="button"
            disabled={!showSaved || disabled}
            onClick={togglePlayback}
            className="w-11 h-11 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPlaying ? "إيقاف" : "تشغيل"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>

        {showSaved && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>التسجيل جاهز للإرسال</span>
          </div>
        )}
      </div>
    </div>
  )
}
