"use client"

import { useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react"

/**
 * Compact audio player for admin review of applicant recordings.
 * Shows play/pause, scrubber, time, volume mute, and direct-download.
 */
export default function AdminAudioPlayer({ src, label }: { src: string; label?: string }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [muted, setMuted] = useState(false)

    const toggle = () => {
        if (!audioRef.current) return
        if (playing) audioRef.current.pause()
        else audioRef.current.play()
    }

    const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return
        const v = Number(e.target.value)
        audioRef.current.currentTime = (v / 100) * (audioRef.current.duration || 0)
        setProgress(v)
    }

    const onTime = () => {
        if (!audioRef.current) return
        const d = audioRef.current.duration || 0
        const c = audioRef.current.currentTime || 0
        setProgress(d > 0 ? (c / d) * 100 : 0)
    }

    const fmt = (s: number) => {
        if (!isFinite(s)) return "0:00"
        const m = Math.floor(s / 60)
        const r = Math.floor(s % 60)
        return `${m}:${r.toString().padStart(2, "0")}`
    }

    const toggleMute = () => {
        if (!audioRef.current) return
        audioRef.current.muted = !audioRef.current.muted
        setMuted(audioRef.current.muted)
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
            {label && <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">{label}</h4>}

            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onTimeUpdate={onTime}
                onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
                preload="metadata"
            />

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={toggle}
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm transition-colors shrink-0"
                >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1 min-w-0">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.1}
                        value={progress}
                        onChange={seek}
                        className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-blue-900/70 dark:text-blue-200/70 mt-1">
                        <span>{fmt(audioRef.current?.currentTime || 0)}</span>
                        <span>{fmt(duration)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={toggleMute}
                    className="text-blue-900/70 dark:text-blue-200/70 hover:bg-blue-100 dark:hover:bg-blue-800 p-2 rounded-lg shrink-0"
                    title={muted ? "تشغيل الصوت" : "كتم الصوت"}
                >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-blue-900/70 dark:text-blue-200/70 hover:bg-blue-100 dark:hover:bg-blue-800 p-2 rounded-lg shrink-0"
                    title="تحميل"
                >
                    <Download className="w-4 h-4" />
                </a>
            </div>
        </div>
    )
}
