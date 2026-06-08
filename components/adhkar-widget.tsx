"use client"

import { useEffect, useMemo, useState } from "react"
import { Sunrise, Moon, RotateCcw, Check, ChevronLeft, ChevronRight } from "lucide-react"

type Dhikr = {
  id: string
  text: string
  /** Total repetitions required */
  count: number
  /** Optional virtue / source note */
  note?: string
}

const MORNING_ADHKAR: Dhikr[] = [
  {
    id: "m-ayat-kursi",
    text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ...",
    count: 1,
    note: "آية الكرسي — حِفظ حتى تُمسي",
  },
  {
    id: "m-ikhlas",
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ ... (الإخلاص والمعوذتان)",
    count: 3,
    note: "تكفيك من كل شيء",
  },
  {
    id: "m-sayyid",
    text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ...",
    count: 1,
    note: "سيد الاستغفار",
  },
  {
    id: "m-asbahna",
    text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    count: 1,
  },
  {
    id: "m-afana",
    text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    count: 1,
  },
  {
    id: "m-subhan",
    text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    count: 100,
    note: "حُطّت خطاياه وإن كانت مثل زبد البحر",
  },
  {
    id: "m-rabbi",
    text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
    count: 3,
  },
  {
    id: "m-hasbi",
    text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    count: 7,
  },
]

const EVENING_ADHKAR: Dhikr[] = [
  {
    id: "e-ayat-kursi",
    text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ... (آية الكرسي)",
    count: 1,
    note: "حِفظ حتى تُصبح",
  },
  {
    id: "e-ikhlas",
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ ... (الإخلاص والمعوذتان)",
    count: 3,
  },
  {
    id: "e-amsayna",
    text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    count: 1,
  },
  {
    id: "e-audhu",
    text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    count: 3,
    note: "لم يضرّه شيء تلك الليلة",
  },
  {
    id: "e-bismillah",
    text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ",
    count: 3,
  },
  {
    id: "e-subhan",
    text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    count: 100,
  },
  {
    id: "e-sayyid",
    text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ ... (سيد الاستغفار)",
    count: 1,
  },
  {
    id: "e-rabbi",
    text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
    count: 3,
  },
]

type Period = "morning" | "evening"

function todayKey(period: Period) {
  return `adhkar-${period}-${new Date().toISOString().split("T")[0]}`
}

/** Default to evening adhkar after Asr-ish (15:00), else morning. */
function defaultPeriod(): Period {
  const h = new Date().getHours()
  return h >= 15 || h < 4 ? "evening" : "morning"
}

export function AdhkarWidget({ className = "" }: { className?: string }) {
  const [period, setPeriod] = useState<Period>("morning")
  const [progress, setProgress] = useState<Record<string, number>>({})

  // Pick initial period on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    setPeriod(defaultPeriod())
  }, [])

  const list = period === "morning" ? MORNING_ADHKAR : EVENING_ADHKAR

  // Load saved progress whenever period changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(todayKey(period))
      setProgress(stored ? JSON.parse(stored) : {})
    } catch {
      setProgress({})
    }
  }, [period])

  const persist = (next: Record<string, number>) => {
    setProgress(next)
    try {
      localStorage.setItem(todayKey(period), JSON.stringify(next))
    } catch {}
  }

  const tap = (d: Dhikr) => {
    const current = progress[d.id] || 0
    if (current >= d.count) return
    persist({ ...progress, [d.id]: current + 1 })
  }

  const resetAll = () => persist({})

  const { done, total } = useMemo(() => {
    const total = list.length
    const done = list.filter((d) => (progress[d.id] || 0) >= d.count).length
    return { done, total }
  }, [list, progress])

  const pct = total ? Math.round((done / total) * 100) : 0
  const allDone = done === total && total > 0

  const PeriodIcon = period === "morning" ? Sunrise : Moon

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <PeriodIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-foreground">
              {period === "morning" ? "أذكار الصباح" : "أذكار المساء"}
            </h3>
            <p className="text-xs text-muted-foreground">{done}/{total} مكتمل</p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          <button
            onClick={() => setPeriod("morning")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              period === "morning"
                ? "bg-card text-teal-600 dark:text-teal-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={period === "morning"}
          >
            <Sunrise className="w-3.5 h-3.5" /> الصباح
          </button>
          <button
            onClick={() => setPeriod("evening")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              period === "evening"
                ? "bg-card text-teal-600 dark:text-teal-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={period === "evening"}
          >
            <Moon className="w-3.5 h-3.5" /> المساء
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-muted rounded-full h-2 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 transition-all duration-500 ease-in-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {allDone ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
          </div>
          <p className="text-sm font-bold text-foreground">
            أتممت {period === "morning" ? "أذكار الصباح" : "أذكار المساء"}، تقبّل الله
          </p>
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> إعادة
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 -mr-1">
          {list.map((d) => {
            const c = progress[d.id] || 0
            const finished = c >= d.count
            const remaining = d.count - c
            return (
              <button
                key={d.id}
                onClick={() => tap(d)}
                disabled={finished}
                className={`w-full text-right rounded-xl px-3 md:px-4 py-3 transition-all border ${
                  finished
                    ? "bg-emerald-500/5 border-emerald-500/30 cursor-default"
                    : "bg-muted/30 border-transparent hover:bg-muted/60 active:scale-[0.99]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                      finished
                        ? "bg-emerald-500 text-white"
                        : "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                    }`}
                  >
                    {finished ? <Check className="w-4 h-4" strokeWidth={3} /> : remaining}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed text-foreground ${finished ? "opacity-60" : ""}`}>
                      {d.text}
                    </p>
                    {d.note && (
                      <p className="text-[11px] text-muted-foreground mt-1">{d.note}</p>
                    )}
                    {d.count > 1 && !finished && (
                      <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-1">
                        {c} / {d.count}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-4 text-center">
        انقر على الذِّكر لاحتساب التكرار — يُعاد التعيين كل يوم
      </p>
    </div>
  )
}

export default AdhkarWidget
