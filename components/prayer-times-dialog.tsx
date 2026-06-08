"use client"

import { useEffect, useMemo, useState } from "react"
import { Sun, Sunrise, Sunset, Moon, MoonStar, Clock, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type PrayerTimes = {
  timings: {
    fajr: string
    sunrise: string
    dhuhr: string
    asr: string
    maghrib: string
    isha: string
  }
  date?: { readable?: string; hijri?: any }
  location?: { city: string; country: string }
  nextPrayer: { name: string; time: string; remainingMinutes?: number } | null
}

const PRAYER_META: Record<string, { label: string; icon: any }> = {
  fajr: { label: "الفجر", icon: Sunrise },
  sunrise: { label: "الشروق", icon: Sun },
  dhuhr: { label: "الظهر", icon: Sun },
  asr: { label: "العصر", icon: Sunset },
  maghrib: { label: "المغرب", icon: Moon },
  isha: { label: "العشاء", icon: MoonStar },
}

const ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const

function formatRemaining(mins?: number) {
  if (mins == null || mins < 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0) return `بعد ${h} س ${m} د`
  return `بعد ${m} د`
}

export function PrayerTimesDialog({
  trigger,
}: {
  /** Optional custom trigger. Defaults to a compact button. */
  trigger?: React.ReactNode
}) {
  const [data, setData] = useState<PrayerTimes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/prayer-times")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.success) setData(d.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const nextLabel = useMemo(() => {
    const key = data?.nextPrayer?.name?.toLowerCase()
    return key ? PRAYER_META[key]?.label || data?.nextPrayer?.name : null
  }, [data])

  const defaultTrigger = (
    <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-sm font-bold text-foreground hover:bg-muted/60 transition-colors">
      <Clock className="w-4 h-4 text-primary" />
      <span>مواقيت الصلاة</span>
      {nextLabel && (
        <span className="text-xs text-primary font-bold">· {nextLabel}</span>
      )}
    </button>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Sun className="w-5 h-5 text-primary" />
            مواقيت الصلاة
            {data?.location?.city && (
              <span className="text-sm font-normal text-muted-foreground">
                — {data.location.city}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Next prayer highlight */}
            {data.nextPrayer && (
              <div className="rounded-2xl bg-primary/10 ring-1 ring-primary/20 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  الصلاة القادمة
                </p>
                <p className="text-2xl font-black text-primary mt-1">{nextLabel}</p>
                <p className="text-sm font-mono text-foreground mt-0.5">{data.nextPrayer.time}</p>
                {formatRemaining(data.nextPrayer.remainingMinutes) && (
                  <p className="text-xs font-bold text-primary mt-1">
                    {formatRemaining(data.nextPrayer.remainingMinutes)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {ORDER.map((key) => {
                const meta = PRAYER_META[key]
                const Icon = meta.icon
                const isNext = data.nextPrayer?.name?.toLowerCase() === key
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors ${
                      isNext ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isNext ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-bold ${isNext ? "text-primary" : "text-foreground"}`}>
                        {meta.label}
                      </span>
                    </div>
                    <span className={`text-sm font-mono ${isNext ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {data.timings[key]}
                    </span>
                  </div>
                )
              })}
            </div>

            {data.date?.readable && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">{data.date.readable}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-sm text-muted-foreground">
            تعذر جلب مواقيت الصلاة
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PrayerTimesDialog
