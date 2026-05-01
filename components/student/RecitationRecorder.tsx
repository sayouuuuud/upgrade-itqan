"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mic, Square, Play, Pause, RotateCcw, Send, Info, Loader2, BookOpen, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { useUploadThing } from "@/lib/uploadthing-client"
import { SURAHS } from "@/lib/data/surahs"

const MAX_SECONDS = 180 // 3 minutes

type RecitationType = "hifd" | "muraja3a" | "tilawa"

type RecordingState = "idle" | "recording" | "saved"

interface RecitationRecorderProps {
  onSuccess?: () => void
}

export function RecitationRecorder({ onSuccess }: RecitationRecorderProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [timer, setTimer] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [qiraah, setQiraah] = useState("hafs")
  const [surahNumber, setSurahNumber] = useState<number>(1)
  const [ayahFrom, setAyahFrom] = useState<number>(1)
  const [ayahTo, setAyahTo] = useState<number>(7)
  const [recitationType, setRecitationType] = useState<RecitationType>("tilawa")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)

  const selectedSurah = SURAHS.find((s) => s.number === surahNumber) || SURAHS[0]
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBlobRef = useRef<Blob | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mimeTypeRef = useRef<string>("audio/webm")

  const getSupportedMimeType = () => {
    // Prefer mp4 (Safari/iOS compatible) then webm (Android/Desktop)
    // Note: audio/wav is NOT supported by MediaRecorder on any browser —
    // WAV conversion happens client-side in handleSubmit if needed.
    const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return "audio/webm" // safe universal fallback
  }

  /**
   * Converts any audio Blob to WAV format using Web Audio API.
   * WAV is universally supported by Safari/iOS and all browsers.
   * This runs entirely in the browser - no server needed.
   */
  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer()
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close()

    // Downmix to mono to keep file size manageable:
    // 3 min × 44100 Hz × 1 ch × 2 bytes = ~15.9 MB (safely under 32MB)
    const numChannels = 1
    const sampleRate = Math.min(audioBuffer.sampleRate, 44100)
    const srcChannels = audioBuffer.numberOfChannels
    const numFrames = audioBuffer.length
    const bytesPerSample = 2 // 16-bit PCM
    const dataSize = numFrames * numChannels * bytesPerSample
    const wavBuffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(wavBuffer)

    // Write WAV header (RIFF format)
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
    }
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)           // PCM chunk size
    view.setUint16(20, 1, true)            // PCM format
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
    view.setUint16(32, numChannels * bytesPerSample, true)
    view.setUint16(34, 16, true)           // bits per sample
    writeStr(36, 'data')
    view.setUint32(40, dataSize, true)

    // Process in chunks to avoid freezing the UI on mobile devices
    return new Promise((resolve) => {
      let offset = 44
      let i = 0
      const CHUNK_SIZE = 44100 // Process 1 second of audio at a time

      const processChunk = () => {
        const end = Math.min(i + CHUNK_SIZE, numFrames)
        for (; i < end; i++) {
          let sum = 0
          for (let ch = 0; ch < srcChannels; ch++) sum += audioBuffer.getChannelData(ch)[i]
          const sample = sum / srcChannels
          const clamped = Math.max(-1, Math.min(1, sample))
          view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF, true)
          offset += 2
        }

        if (i < numFrames) {
          // Yield to main thread
          setTimeout(processChunk, 0)
        } else {
          // Done
          resolve(new Blob([wavBuffer], { type: 'audio/wav' }))
        }
      }

      // Start processing
      processChunk()
    })
  }

  const waveformBars = [
    3.2, 5.1, 2.8, 6.4, 4.2, 7.8, 3.5, 5.9,
    2.1, 6.7, 4.5, 3.8, 7.1, 2.9, 5.4, 4.1,
    6.2, 3.7, 5.8, 2.4, 7.5, 4.8, 3.1, 6.9,
    5.2, 2.7, 7.3, 4.6, 3.9, 6.1, 2.5, 5.5
  ]

  // When surah changes, snap ayah range to full surah by default
  useEffect(() => {
    setAyahFrom(1)
    setAyahTo(selectedSurah.verses)
    setValidationError(null)
  }, [surahNumber, selectedSurah.verses])

  useEffect(() => {
    if (recordingState === "recording") {
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t + 1 >= MAX_SECONDS) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop()
            }
            setRecordingState("saved")
            return MAX_SECONDS
          }
          return t + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [recordingState])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Determine MIME type
      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current })
        audioBlobRef.current = blob
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = URL.createObjectURL(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      console.log(`[Recorder] Starting with MIME type: ${mimeType}`)
      mediaRecorder.start()
      setRecordingState("recording")
      setTimer(0)
    } catch (err) {
      console.error("[Recorder] Error starting media recorder:", err)
      alert(t.student.allowMicAlert)
    }
  }, [t])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setRecordingState("saved")
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (recordingState !== "idle") return
    // On iOS, we need to ensure the action is considered user-initiated.
    // Calling startRecording directly or within the same tick is best.
    startRecording()
  }, [recordingState, startRecording])

  const handlePointerUp = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }
    if (recordingState === "recording") {
      stopRecording()
    }
  }, [holdTimer, recordingState, stopRecording])

  const resetAll = () => {
    setRecordingState("idle")
    setTimer(0)
    setIsPlaying(false)
    audioBlobRef.current = null
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const togglePlayback = () => {
    if (!audioUrlRef.current) return
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    const audio = new Audio(audioUrlRef.current)
    audioRef.current = audio
    audio.onended = () => setIsPlaying(false)
    audio.onerror = (e) => console.error("[Recorder] Audio preview error:", e)
    
    audio.play().catch(err => {
      console.error("[Recorder] Playback failed:", err)
      setIsPlaying(false)
    })
    setIsPlaying(true)
  }

  const { startUpload } = useUploadThing("audioUploader")

  const validateBeforeSubmit = (): string | null => {
    if (ayahFrom < 1 || ayahFrom > selectedSurah.verses) {
      return `«من الآية» يجب أن يكون بين 1 و ${selectedSurah.verses}`
    }
    if (ayahTo < 1 || ayahTo > selectedSurah.verses) {
      return `«إلى الآية» يجب أن يكون بين 1 و ${selectedSurah.verses}`
    }
    if (ayahFrom > ayahTo) {
      return "«من الآية» لا يمكن أن تكون أكبر من «إلى الآية»"
    }
    return null
  }

  const handleSubmit = async () => {
    if (!audioBlobRef.current) return
    const err = validateBeforeSubmit()
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setSubmitting(true)
    try {
      const timestamp = Date.now()

      let audioBlob = audioBlobRef.current
      let extension = "wav"

      if (mimeTypeRef.current.includes("mp4") || mimeTypeRef.current.includes("aac")) {
        extension = "mp4"
      } else if (mimeTypeRef.current.includes("wav")) {
        extension = "wav"
      } else {
        // WebM or unknown → convert to WAV (Safari/iOS compatible)
        console.log('[Recorder] Converting WebM to WAV...')
        try {
          audioBlob = await convertToWav(audioBlobRef.current)
          extension = "wav"
          console.log('[Recorder] Conversion OK, size:', audioBlob.size)
        } catch (convErr) {
          console.warn('[Recorder] WAV conversion failed, using original:', convErr)
          audioBlob = audioBlobRef.current
          extension = "webm"
        }
      }

      // رفع مباشر من المتصفح لـ UploadThing - لا يمر على Hostinger
      const audioFile = new File([audioBlob], `recitation_${timestamp}.${extension}`, {
        type: audioBlob.type || `audio/${extension}`,
      })

      const uploaded = await startUpload([audioFile])
      if (!uploaded || uploaded.length === 0) throw new Error("Upload failed")

      const audioUrl = uploaded[0].url

      const recRes = await fetch("/api/recitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl,
          audioDuration: timer,
          qiraah: t.qiraat[qiraah],
          surahNumber: selectedSurah.number,
          surahName: selectedSurah.name,
          ayahFrom,
          ayahTo,
          recitationType,
        }),
      })

      if (!recRes.ok) {
        const errData = await recRes.json()
        if (recRes.status === 409) {
          alert(errData.error)
          if (onSuccess) onSuccess()
          else router.push('/student')
          return
        }
        throw new Error(errData.error || "Create recitation failed")
      }

      setSubmitted(true)
      if (onSuccess) {
        setTimeout(onSuccess, 2000)
      }
    } catch (err) {
      console.error("Submit error:", err)
      alert(t.student.submitError)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Send className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t.student.recitationReceived}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t.student.recitationReceivedDesc}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Recitation metadata form */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h3 className="text-sm md:text-base font-bold text-foreground">معلومات التسميع</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Surah selector */}
          <div className="md:col-span-2">
            <label className="block text-[11px] md:text-xs font-bold text-muted-foreground mb-1.5">
              السورة
            </label>
            <select
              value={surahNumber}
              onChange={(e) => setSurahNumber(parseInt(e.target.value, 10))}
              disabled={recordingState === "recording" || submitting}
              className="w-full bg-muted/50 border border-border rounded-xl py-2.5 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer disabled:opacity-50"
              style={{ direction: 'rtl' }}
            >
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.verses} آية)
                </option>
              ))}
            </select>
          </div>

          {/* Ayah from */}
          <div>
            <label className="block text-[11px] md:text-xs font-bold text-muted-foreground mb-1.5">
              <span className="inline-flex items-center gap-1">
                <Hash className="w-3 h-3" />
                من الآية
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={selectedSurah.verses}
              value={ayahFrom}
              onChange={(e) => setAyahFrom(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={recordingState === "recording" || submitting}
              className="w-full bg-muted/50 border border-border rounded-xl py-2.5 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
            />
          </div>

          {/* Ayah to */}
          <div>
            <label className="block text-[11px] md:text-xs font-bold text-muted-foreground mb-1.5">
              <span className="inline-flex items-center gap-1">
                <Hash className="w-3 h-3" />
                إلى الآية
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={selectedSurah.verses}
              value={ayahTo}
              onChange={(e) => setAyahTo(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={recordingState === "recording" || submitting}
              className="w-full bg-muted/50 border border-border rounded-xl py-2.5 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
            />
          </div>

          {/* Recitation type */}
          <div className="md:col-span-2">
            <label className="block text-[11px] md:text-xs font-bold text-muted-foreground mb-1.5">
              نوع التسميع
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "hifd", label: "حفظ" },
                { value: "muraja3a", label: "مراجعة" },
                { value: "tilawa", label: "تلاوة" },
              ] as { value: RecitationType; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecitationType(opt.value)}
                  disabled={recordingState === "recording" || submitting}
                  className={`py-2.5 md:py-3 px-3 rounded-xl text-sm md:text-base font-bold transition-all border ${recitationType === opt.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {validationError && (
          <p className="mt-3 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            {validationError}
          </p>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-8 flex flex-col items-center justify-center relative min-h-[400px] md:min-h-[450px]">
        <div className="mb-6 md:mb-10 text-center">
          <div className="text-5xl md:text-7xl font-mono font-light tracking-widest text-foreground mb-3">
            {formatTime(timer)}
          </div>
          <span className="text-sm md:text-base text-muted-foreground font-medium px-4 block">
            {recordingState === "idle" && t.student.readyToRecord}
            {recordingState === "recording" && t.student.recordingStatus}
            {recordingState === "saved" && t.student.recordingSavedStatus}
          </span>
        </div>

        <div className="h-12 md:h-16 w-full max-w-[280px] md:max-w-sm flex items-center justify-center gap-[3px] md:gap-[4px] mb-8 md:mb-14 overflow-hidden">
          {waveformBars.map((h, i) => (
            <div
              key={i}
              className={`w-1 md:w-1.5 rounded-full bg-muted-foreground transition-all duration-300 ${recordingState === "recording" ? "animate-pulse opacity-100" : "opacity-40"} ${i > 20 ? "hidden xs:block" : ""}`}
              style={{
                height: recordingState === "recording" ? `${h * 6}px` : `${h * 4}px`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>

        <div className="flex items-end justify-center gap-6 md:gap-12 mb-8 md:mb-10">
          <div className="flex flex-col items-center gap-2">
            <button
              disabled={recordingState === "idle"}
              onClick={resetAll}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full border border-border text-muted-foreground flex items-center justify-center transition-all ${recordingState === "idle" ? "cursor-not-allowed opacity-50" : "hover:bg-muted hover:text-foreground cursor-pointer"}`}
            >
              <RotateCcw className="w-6 h-6 md:w-7 md:h-7" />
            </button>
            <span className="text-[10px] md:text-sm text-muted-foreground font-bold">{t.student.resetBtn}</span>
          </div>

          <div className="flex flex-col items-center gap-4 relative -top-4 md:-top-6">
            {recordingState === "idle" && (
              <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center ring-4 ring-accent/20 select-none touch-none"
              >
                <Mic className="w-10 h-10 md:w-14 md:h-14" />
              </button>
            )}
            {recordingState === "recording" && (
              <button
                onPointerUp={handlePointerUp}
                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-destructive text-destructive-foreground shadow-lg animate-pulse hover:shadow-xl flex items-center justify-center ring-4 ring-destructive/20 select-none touch-none"
              >
                <Square className="w-8 h-8 md:w-12 md:h-12" />
              </button>
            )}
            {recordingState === "saved" && (
              <button
                disabled
                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-muted text-muted-foreground/30 flex items-center justify-center select-none touch-none"
              >
                <Mic className="w-10 h-10 md:w-14 md:h-14" />
              </button>
            )}
            <span className="text-xs md:text-base font-bold text-primary dark:text-accent whitespace-nowrap">
              {recordingState === "recording" ? t.student.releaseToStop : t.student.holdToRecord}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              disabled={recordingState !== "saved"}
              onClick={togglePlayback}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full border border-border text-muted-foreground flex items-center justify-center transition-all ${recordingState !== "saved" ? "cursor-not-allowed opacity-50" : "hover:bg-muted hover:text-foreground cursor-pointer"}`}
            >
              {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7" /> : <Play className="w-6 h-6 md:w-7 md:h-7 ml-1" />}
            </button>
            <span className="text-[10px] md:text-sm text-muted-foreground font-bold">{isPlaying ? t.student.stopBtn : t.student.playBtn}</span>
          </div>
        </div>

        <div className="w-full max-w-xs md:max-w-sm">
          <label className="block text-[10px] md:text-xs font-bold text-muted-foreground mb-1 md:mb-2 mr-1">{t.student.selectedQiraahLabel}</label>
          <select
            value={qiraah}
            onChange={(e) => setQiraah(e.target.value)}
            disabled={recordingState === "recording"}
            className="w-full bg-muted/50 border border-border rounded-xl py-3 md:py-4 px-4 md:px-5 text-sm md:text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all appearance-none cursor-pointer"
            style={{ direction: 'rtl' }}
          >
            <option value="hafs">{t.qiraat.hafs}</option>
            <option value="warsh">{t.qiraat.warsh}</option>
            <option value="qaloon">{t.qiraat.qaloon}</option>
            <option value="duri_abu_amr">{t.qiraat.duri_abu_amr}</option>
            <option value="shuba">{t.qiraat.shuba}</option>
            <option value="bazzi">{t.qiraat.bazzi}</option>
            <option value="qunbul">{t.qiraat.qunbul}</option>
            <option value="hisham">{t.qiraat.hisham}</option>
            <option value="ibn_dhakwan">{t.qiraat.ibn_dhakwan}</option>
            <option value="khalaf">{t.qiraat.khalaf}</option>
            <option value="khallad">{t.qiraat.khallad}</option>
            <option value="abi_al_harith">{t.qiraat.abi_al_harith}</option>
            <option value="duri_kisai">{t.qiraat.duri_kisai}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !audioBlobRef.current || recordingState !== "saved"}
                className="w-full sm:w-auto px-8 font-tajawal bg-teal-600 hover:bg-teal-700 h-12 text-lg shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    {mimeTypeRef.current.includes("webm") && !mimeTypeRef.current.includes("wav") ? "جاري التجهيز للرفع..." : t.common.submitting}
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-5 w-5" />
                    {t.student.submitBtn}
                  </>
                )}
              </Button>
      </div>

      <div className="text-center p-4 md:p-6 bg-accent/5 rounded-2xl border border-accent/20">
        <p className="text-accent font-bold text-xs md:text-sm leading-relaxed flex items-center justify-center gap-2">
          <Info className="w-3 h-3 md:w-4 md:h-4" />
          {t.student.recordingNote}
        </p>
      </div>
    </div>
  )
}
