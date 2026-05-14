"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Trash2, Upload, Loader2, Play, Pause } from "lucide-react"

type Props = {
    value?: string | null
    onChange: (url: string | null) => void
    maxSeconds?: number
    label?: string
}

/**
 * Records audio in the browser via MediaRecorder, lets the applicant preview /
 * re-record, then uploads the resulting blob to UploadThing's
 * `audioUploader`. The final URL is propagated through `onChange`.
 */
export default function AudioRecorder({ value, onChange, maxSeconds = 300, label }: Props) {
    const [recording, setRecording] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [blob, setBlob] = useState<Blob | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [playing, setPlaying] = useState(false)

    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<BlobPart[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        if (blobUrl) URL.revokeObjectURL(blobUrl)
    }, [blobUrl])

    const start = async () => {
        setError(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const rec = new MediaRecorder(stream)
            recorderRef.current = rec
            chunksRef.current = []
            rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            rec.onstop = () => {
                const b = new Blob(chunksRef.current, { type: "audio/webm" })
                setBlob(b)
                setBlobUrl(URL.createObjectURL(b))
                streamRef.current?.getTracks().forEach(t => t.stop())
                streamRef.current = null
            }
            rec.start()
            setRecording(true)
            setElapsed(0)
            timerRef.current = setInterval(() => {
                setElapsed(prev => {
                    if (prev + 1 >= maxSeconds) { stop(); return maxSeconds }
                    return prev + 1
                })
            }, 1000)
        } catch (err: any) {
            setError(err?.message || "تعذّر الوصول إلى الميكروفون. تأكد من السماح للمتصفح.")
        }
    }

    const stop = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        try { recorderRef.current?.stop() } catch { }
        setRecording(false)
    }

    const reset = () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        setBlob(null)
        setBlobUrl(null)
        setElapsed(0)
        setPlaying(false)
        onChange(null)
    }

    const upload = async () => {
        if (!blob) return
        setUploading(true)
        setError(null)
        try {
            const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" })
            const fd = new FormData()
            fd.append("file", file)
            const res = await fetch("/api/upload-audio", { method: "POST", body: fd })
            if (!res.ok) throw new Error("فشل رفع الملف")
            const json = await res.json()
            onChange(json.url)
        } catch (err: any) {
            setError(err?.message || "فشل الرفع")
        } finally {
            setUploading(false)
        }
    }

    const togglePlay = () => {
        if (!audioRef.current) return
        if (playing) audioRef.current.pause()
        else audioRef.current.play()
    }

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

    return (
        <div className="border border-border bg-card rounded-xl p-4 space-y-3">
            {label && <h4 className="font-bold text-sm">{label}</h4>}

            {value && !blobUrl && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
                    <audio src={value} controls className="flex-1" />
                    <button onClick={reset} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="إعادة التسجيل">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {!value && !blobUrl && (
                <div className="flex flex-col items-center gap-3 py-4">
                    <button
                        type="button"
                        onClick={recording ? stop : start}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${recording
                            ? "bg-red-500 hover:bg-red-600 animate-pulse"
                            : "bg-blue-500 hover:bg-blue-600"
                            }`}
                    >
                        {recording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <p className="text-sm text-muted-foreground">
                        {recording ? `جاري التسجيل... ${fmt(elapsed)}` : "اضغط لبدء التسجيل"}
                    </p>
                </div>
            )}

            {blobUrl && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
                        >
                            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <audio
                            ref={audioRef}
                            src={blobUrl}
                            onPlay={() => setPlaying(true)}
                            onPause={() => setPlaying(false)}
                            onEnded={() => setPlaying(false)}
                            controls
                            className="flex-1"
                        />
                        <button onClick={reset} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="مسح">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    {!value && (
                        <button
                            type="button"
                            onClick={upload}
                            disabled={uploading}
                            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? "جاري الرفع..." : "رفع التسجيل"}
                        </button>
                    )}
                </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
