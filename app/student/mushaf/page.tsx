'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useI18n } from '@/lib/i18n/context'
import {
  ChevronLeft, ChevronRight, Loader2, BookOpen, Search, List, AlertCircle,
  Play, Pause, Square, SkipForward, SkipBack, Repeat, X, Mic2, Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TOTAL_PAGES = 604
const STORAGE_KEY = 'mushaf:lastPage'
const RECITER_STORAGE_KEY = 'mushaf:reciter'
const AUTOPLAY_STORAGE_KEY = 'mushaf:autoContinue'

// Reciters from EveryAyah CDN — folder slug + display names in AR/EN
type Reciter = { id: string; nameAr: string; nameEn: string }

const RECITERS: Reciter[] = [
  { id: 'Alafasy_128kbps', nameAr: 'مشاري راشد العفاسي', nameEn: 'Mishary Rashid Alafasy' },
  { id: 'Husary_128kbps', nameAr: 'محمود خليل الحصري', nameEn: 'Mahmoud Khalil Al-Husary' },
  { id: 'Husary_Mujawwad_64kbps', nameAr: 'الحصري (مجوّد)', nameEn: 'Al-Husary (Mujawwad)' },
  { id: 'Abdul_Basit_Murattal_64kbps', nameAr: 'عبد الباسط عبد الصمد', nameEn: 'Abdul Basit Abdul Samad' },
  { id: 'Abdul_Basit_Mujawwad_128kbps', nameAr: 'عبد الباسط (مجوّد)', nameEn: 'Abdul Basit (Mujawwad)' },
  { id: 'Minshawy_Murattal_128kbps', nameAr: 'محمد صديق المنشاوي', nameEn: 'Mohammad Al-Minshawy' },
  { id: 'Minshawy_Mujawwad_64kbps', nameAr: 'المنشاوي (مجوّد)', nameEn: 'Al-Minshawy (Mujawwad)' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', nameAr: 'عبد الرحمن السديس', nameEn: 'Abdul Rahman As-Sudais' },
  { id: 'Saood_ash-Shuraym_128kbps', nameAr: 'سعود الشريم', nameEn: 'Saud Ash-Shuraym' },
  { id: 'Maher_AlMuaiqly_64kbps', nameAr: 'ماهر المعيقلي', nameEn: 'Maher Al-Muaiqly' },
  { id: 'Ghamadi_40kbps', nameAr: 'سعد الغامدي', nameEn: 'Saad Al-Ghamidi' },
  { id: 'Hudhaify_128kbps', nameAr: 'علي الحذيفي', nameEn: 'Ali Al-Hudhaify' },
  { id: 'Muhammad_Ayyoub_128kbps', nameAr: 'محمد أيوب', nameEn: 'Muhammad Ayyoub' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', nameAr: 'أبو بكر الشاطري', nameEn: 'Abu Bakr Ash-Shaatree' },
  { id: 'Hani_Rifai_192kbps', nameAr: 'هاني الرفاعي', nameEn: 'Hani Ar-Rifai' },
]

const DEFAULT_RECITER = 'Alafasy_128kbps'

function ayahAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number) {
  const s = String(surahNumber).padStart(3, '0')
  const a = String(ayahNumber).padStart(3, '0')
  return `https://everyayah.com/data/${reciterId}/${s}${a}.mp3`
}

// Use alquran.cloud — returns text_uthmani (Unicode Arabic) per ayah on a page.
type ApiAyah = {
  number: number
  text: string
  numberInSurah: number
  juz: number
  page: number
  surah: { number: number; name: string; englishName: string; revelationType: string; numberOfAyahs: number }
}

type Surah = {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

type PageData = {
  pageNumber: number
  ayahs: ApiAyah[]
  // ayahs grouped by surah for rendering surah headers + bismillah at start of each surah on the page
  groups: { surah: ApiAyah['surah']; ayahs: ApiAyah[]; isStart: boolean }[]
}

function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'

// Remove all Arabic diacritics (tashkeel) so we can compare/match plain letters
function stripTashkeel(text: string): string {
  return text.replace(/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED\u08D3-\u08FF]/g, '')
}

// Strip leading "سورة" / "سُورَةُ" prefix (with any tashkeel) from a surah name
function stripSurahPrefix(name: string): string {
  if (!name) return name
  const plain = stripTashkeel(name).trim()
  if (!plain.startsWith('سورة')) return name

  // Find the actual end of the prefix in the original (with tashkeel) string
  // by walking through both strings in parallel.
  const prefixPlainLen = 'سورة'.length
  let plainSeen = 0
  let i = 0
  while (i < name.length && plainSeen < prefixPlainLen) {
    const ch = name[i]
    if (!/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED\u08D3-\u08FF]/.test(ch)) {
      plainSeen++
    }
    i++
  }
  // Also consume any trailing tashkeel + whitespace after the prefix
  while (i < name.length && /[\u064B-\u0652\u0670\u0640\u06D6-\u06ED\u08D3-\u08FF\s]/.test(name[i])) {
    i++
  }
  return name.slice(i).trim() || name
}

// Strip leading bismillah from first ayah of any surah.
// Skip Al-Fatiha (#1) — there the Bismillah IS ayah 1 and must be kept.
// Skip At-Tawbah (#9) — has no bismillah at all.
//
// Implementation: tashkeel (and the various alif forms) can vary between API responses,
// so instead of relying on a tashkeel-sensitive regex we walk the text char by char,
// normalizing each character and matching against the bare "بسماللهالرحمنالرحيم" signature.
// Once matched, we also consume any trailing tashkeel + whitespace before returning the rest.
function stripLeadingBismillah(text: string, surahNumber: number, ayahNumber: number): string {
  if (ayahNumber !== 1) return text
  if (surahNumber === 1 || surahNumber === 9) return text
  if (!text) return text

  const PLAIN_TARGET = 'بسماللهالرحمنالرحيم'
  const TASHKEEL_RE = /[\u064B-\u0652\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640]/

  const normalize = (ch: string): string => {
    if (TASHKEEL_RE.test(ch)) return ''
    if (ch === 'ٱ' || ch === 'أ' || ch === 'إ' || ch === 'آ') return 'ا'
    if (/\s/.test(ch)) return ''
    return ch
  }

  let normalized = ''
  let i = 0
  while (i < text.length && normalized.length < PLAIN_TARGET.length) {
    const n = normalize(text[i])
    if (n) {
      if (n !== PLAIN_TARGET[normalized.length]) {
        // Mismatch — text doesn't start with bismillah, leave as-is
        return text
      }
      normalized += n
    }
    i++
  }

  if (normalized.length < PLAIN_TARGET.length) return text

  // Consume any trailing tashkeel / whitespace right after the matched bismillah
  while (i < text.length && (TASHKEEL_RE.test(text[i]) || /\s/.test(text[i]))) {
    i++
  }

  const rest = text.slice(i).trim()
  return rest || text
}

export default function MushafPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [pageNumber, setPageNumber] = useState(1)
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageInput, setPageInput] = useState('1')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Audio playback state
  const [reciterId, setReciterId] = useState<string>(DEFAULT_RECITER)
  const [autoContinue, setAutoContinue] = useState<boolean>(true)
  const [playing, setPlaying] = useState<{ surah: number; ayah: number; globalNumber: number } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [openAyahPopover, setOpenAyahPopover] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pageDataRef = useRef<PageData | null>(null)
  pageDataRef.current = pageData

  // Restore reciter & autoplay preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const r = localStorage.getItem(RECITER_STORAGE_KEY)
    if (r && RECITERS.some(rec => rec.id === r)) setReciterId(r)
    const ap = localStorage.getItem(AUTOPLAY_STORAGE_KEY)
    if (ap !== null) setAutoContinue(ap === '1')
  }, [])

  // Persist reciter
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(RECITER_STORAGE_KEY, reciterId)
  }, [reciterId])

  // Persist autoplay
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(AUTOPLAY_STORAGE_KEY, autoContinue ? '1' : '0')
  }, [autoContinue])

  const currentReciter = useMemo(
    () => RECITERS.find(r => r.id === reciterId) || RECITERS[0],
    [reciterId]
  )

  // Play a specific ayah
  const playAyah = useCallback((a: ApiAyah) => {
    setAudioError(null)
    setOpenAyahPopover(null)
    const audio = audioRef.current
    if (!audio) return
    const url = ayahAudioUrl(reciterId, a.surah.number, a.numberInSurah)
    audio.src = url
    audio.play()
      .then(() => {
        setPlaying({ surah: a.surah.number, ayah: a.numberInSurah, globalNumber: a.number })
        setIsPlaying(true)
      })
      .catch(err => {
        console.error('[v0] audio play error', err)
        setAudioError('تعذّر تشغيل الصوت')
        setIsPlaying(false)
      })
  }, [reciterId])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !playing) return
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [playing])

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setPlaying(null)
    setIsPlaying(false)
  }, [])

  // Find an ayah on the current page by global number
  const findAyah = useCallback((globalNumber: number): ApiAyah | null => {
    const data = pageDataRef.current
    if (!data) return null
    return data.ayahs.find(a => a.number === globalNumber) || null
  }, [])

  // Pending auto-continue: when a page changes due to playAdjacent, play the appropriate ayah after load
  const pendingAutoContinue = useRef<'first' | 'last' | null>(null)

  const playAdjacent = useCallback((direction: 1 | -1) => {
    if (!playing) return
    const data = pageDataRef.current
    if (!data) return
    const idx = data.ayahs.findIndex(a => a.number === playing.globalNumber)
    if (idx < 0) return
    const next = data.ayahs[idx + direction]
    if (next) {
      playAyah(next)
    } else if (direction === 1 && pageNumber < TOTAL_PAGES) {
      // jump to next page and start from its first ayah after load
      pendingAutoContinue.current = 'first'
      setPageNumber(p => Math.min(TOTAL_PAGES, p + 1))
    } else if (direction === -1 && pageNumber > 1) {
      // jump to previous page and start from its last ayah after load
      pendingAutoContinue.current = 'last'
      setPageNumber(p => Math.max(1, p - 1))
    }
  }, [playing, pageNumber, playAyah])

  useEffect(() => {
    if (!loading && pageData && pendingAutoContinue.current) {
      const which = pendingAutoContinue.current
      pendingAutoContinue.current = null
      const target = which === 'first' ? pageData.ayahs[0] : pageData.ayahs[pageData.ayahs.length - 1]
      if (target) playAyah(target)
    }
  }, [loading, pageData, playAyah])

  // When the active reciter changes during playback, swap the audio source for the same ayah
  useEffect(() => {
    if (!playing) return
    const audio = audioRef.current
    if (!audio) return
    const url = ayahAudioUrl(reciterId, playing.surah, playing.ayah)
    if (audio.src !== url) {
      const wasPlaying = !audio.paused
      audio.src = url
      if (wasPlaying) audio.play().catch(() => {})
    }
  }, [reciterId, playing])

  // Restore last page on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? Number(localStorage.getItem(STORAGE_KEY)) : NaN
    if (Number.isFinite(saved) && saved >= 1 && saved <= TOTAL_PAGES) {
      setPageNumber(saved)
      setPageInput(String(saved))
    }
  }, [])

  // Persist page when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(pageNumber))
      setPageInput(String(pageNumber))
    }
  }, [pageNumber])

  // Load surahs list once
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('https://api.alquran.cloud/v1/surah', { signal: ctrl.signal })
      .then(r => r.json())
      .then(j => setSurahs(j?.data || []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  // Load page content whenever pageNumber changes
  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)

    const fetchPage = async () => {
      try {
        // alquran.cloud has /page/{N}/quran-uthmani returning ayahs
        const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const ayahs: ApiAyah[] = json?.data?.ayahs || []
        if (cancelled) return

        // Group consecutive ayahs by surah
        const groups: PageData['groups'] = []
        for (const a of ayahs) {
          const last = groups[groups.length - 1]
          if (last && last.surah.number === a.surah.number) {
            last.ayahs.push(a)
          } else {
            groups.push({
              surah: a.surah,
              ayahs: [a],
              // A surah is "starting" on this page only if its first ayah appears on this page
              isStart: a.numberInSurah === 1,
            })
          }
        }

        setPageData({ pageNumber, ayahs, groups })
        setLoading(false)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        console.error('[v0] mushaf load error', e)
        if (!cancelled) {
          setError(t.student?.mushafError || 'Failed to load page')
          setLoading(false)
        }
      }
    }

    fetchPage()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [pageNumber, t.student?.mushafError])

  // Keyboard nav: ArrowRight goes to previous page in RTL (visual "back"), ArrowLeft goes to next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') {
        // In a Mushaf, the "previous" page (lower number) is on the right
        setPageNumber(p => Math.max(1, p - 1))
      } else if (e.key === 'ArrowLeft') {
        setPageNumber(p => Math.min(TOTAL_PAGES, p + 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filteredSurahs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return surahs
    return surahs.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    )
  }, [search, surahs])

  // Determine current surah & juz info to show at top
  const headerInfo = useMemo(() => {
    if (!pageData?.ayahs.length) return null
    const first = pageData.ayahs[0]
    return {
      surahName: first.surah.name,
      surahEnglish: first.surah.englishName,
      juz: first.juz,
    }
  }, [pageData])

  const goToSurah = (surahNumber: number) => {
    // For surah jumps, use alquran.cloud surah endpoint to find first page
    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
      .then(r => r.json())
      .then(j => {
        const firstPage = j?.data?.ayahs?.[0]?.page
        if (firstPage) {
          setPageNumber(firstPage)
          setDrawerOpen(false)
        }
      })
      .catch(() => {})
  }

  const handleGoToPage = () => {
    const n = parseInt(pageInput, 10)
    if (Number.isFinite(n) && n >= 1 && n <= TOTAL_PAGES) setPageNumber(n)
  }

  return (
    <>
      {/* Inject Amiri Quran (Uthmani) font from Google Fonts — designed specifically for Quran rendering */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Reem+Kufi:wght@500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-background">
        {/* Top toolbar */}
        <div className="bg-card/60 border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Left: Surah/Juz info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-foreground truncate">{t.student?.mushaf || 'مصحفي'}</div>
                {headerInfo && (
                  <div className="text-xs text-muted-foreground font-bold truncate">
                    {isAr ? stripSurahPrefix(headerInfo.surahName) : headerInfo.surahEnglish}
                    {' · '}
                    {isAr ? `${t.student?.juz || 'الجزء'} ${toArabicDigits(headerInfo.juz)}` : `Juz ${headerInfo.juz}`}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Reciter + Page indicator + index button */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Reciter selector */}
              <Select value={reciterId} onValueChange={setReciterId}>
                <SelectTrigger className="h-9 rounded-xl text-xs font-bold w-[180px] sm:w-[220px] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <SelectValue placeholder={isAr ? 'اختر القارئ' : 'Select reciter'} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {RECITERS.map(r => (
                    <SelectItem key={r.id} value={r.id} className="font-bold">
                      {isAr ? r.nameAr : r.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black">
                {isAr
                  ? `${t.student?.pageNumber || 'صفحة'} ${toArabicDigits(pageNumber)} / ${toArabicDigits(TOTAL_PAGES)}`
                  : `Page ${pageNumber} / ${TOTAL_PAGES}`}
              </div>
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl">
                    <List className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={isAr ? 'left' : 'right'} className="w-80 p-0 flex flex-col">
                  <div className="p-4 border-b border-border/50">
                    <SheetTitle className="text-lg font-black mb-3">
                      {isAr ? 'فهرس السور' : 'Surah Index'}
                    </SheetTitle>
                    <div className="relative">
                      <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t.student?.searchSurah || 'ابحث عن سورة...'}
                        className="ps-9 rounded-xl"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {filteredSurahs.map(s => (
                        <button
                          key={s.number}
                          onClick={() => goToSurah(s.number)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-start"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">
                            {isAr ? toArabicDigits(s.number) : s.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-foreground text-base" style={{ fontFamily: "'Amiri Quran', serif" }}>
                              {s.name}
                            </div>
                            <div className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                              <span>{s.englishName}</span>
                              <span>·</span>
                              <span>{isAr ? toArabicDigits(s.numberOfAyahs) : s.numberOfAyahs} {t.student?.versesCount || 'آية'}</span>
                              <span>·</span>
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {s.revelationType === 'Meccan' ? (t.student?.revelationMakkah || 'مكية') : (t.student?.revelationMadinah || 'مدنية')}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mushaf page */}
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 flex gap-4">
          {/* Main mushaf card — left/center */}
          <div className="flex-1 min-w-0">
            <div className="mushaf-page relative bg-[#fbf6e6] dark:bg-card rounded-3xl shadow-2xl shadow-amber-900/10 dark:shadow-black/30 border-[6px] border-double border-amber-700/30 dark:border-primary/30 p-6 sm:p-10 min-h-[70vh]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground">
                  {t.student?.loadingMushaf || 'جاري تحميل المصحف...'}
                </p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-sm font-bold text-foreground">{error}</p>
                <Button onClick={() => setPageNumber(p => p)} variant="outline" className="mt-2">
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            ) : pageData && (
              <div dir="rtl" className="quran-text">
                {pageData.groups.map((g, gi) => (
                  <div key={`${g.surah.number}-${gi}`} className="mb-6 last:mb-0">
                    {/* Surah header — shown only when surah starts on this page */}
                    {g.isStart && (
                      <div className="surah-header relative mx-auto my-6 max-w-xl">
                        <div className="rounded-2xl border-2 border-amber-700/40 dark:border-primary/40 bg-gradient-to-b from-amber-50 to-amber-100/60 dark:from-primary/10 dark:to-primary/5 px-6 py-4 text-center relative overflow-hidden">
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-700/50 dark:via-primary/50 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-700/50 dark:via-primary/50 to-transparent" />
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-[10px] font-black tracking-widest text-amber-800 dark:text-primary/80 uppercase">
                              {g.surah.revelationType === 'Meccan' ? (t.student?.revelationMakkah || 'مكية') : (t.student?.revelationMadinah || 'مدنية')}
                            </div>
                            <div
                              className="text-3xl sm:text-4xl text-amber-900 dark:text-foreground"
                              style={{ fontFamily: "'Amiri Quran', serif", fontWeight: 400 }}
                            >
                              سُورَةُ {stripSurahPrefix(g.surah.name)}
                            </div>
                            <div className="text-sm font-black text-amber-800 dark:text-primary/80">
                              {toArabicDigits(g.surah.number)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bismillah — at start of every surah except Al-Fatiha (it's part of the surah) and At-Tawbah */}
                    {g.isStart && g.surah.number !== 1 && g.surah.number !== 9 && (
                      <div
                        className="text-center text-2xl sm:text-3xl my-5 text-foreground"
                        style={{ fontFamily: "'Amiri Quran', serif", fontWeight: 400 }}
                      >
                        {BISMILLAH}
                      </div>
                    )}

                    {/* Ayahs flowing as one justified block */}
                    <p
                      className="quran-flow text-foreground"
                      style={{
                        fontFamily: "'Amiri Quran', serif",
                        fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)',
                        lineHeight: 2.2,
                        textAlign: 'justify',
                        textAlignLast: 'center',
                        wordSpacing: '0.05em',
                      }}
                    >
                      {g.ayahs.map((a, idx) => {
                        const text = stripLeadingBismillah(a.text, a.surah.number, a.numberInSurah)
                        const isActive = playing?.globalNumber === a.number
                        return (
                          <span key={a.number}>
                            {idx > 0 ? ' ' : ''}
                            <Popover
                              open={openAyahPopover === a.number}
                              onOpenChange={(o) => setOpenAyahPopover(o ? a.number : null)}
                            >
                              <PopoverTrigger asChild>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      setOpenAyahPopover(a.number)
                                    }
                                  }}
                                  aria-label={isAr ? `الآية ${a.numberInSurah}` : `Ayah ${a.numberInSurah}`}
                                  className={`cursor-pointer rounded-md px-1 -mx-1 transition-colors hover:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                                    isActive ? 'bg-primary/15 dark:bg-primary/25' : ''
                                  }`}
                                >
                                  {text}
                                  {' '}
                                  <span
                                    className={`ayah-marker inline-block align-middle text-base sm:text-lg font-black mx-1 transition-all ${
                                      isActive
                                        ? 'text-primary scale-110'
                                        : 'text-amber-800 dark:text-primary'
                                    }`}
                                    style={{ fontFamily: 'system-ui, sans-serif' }}
                                  >
                                    ﴿{toArabicDigits(a.numberInSurah)}﴾
                                  </span>
                                </span>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-64 p-2"
                                side="bottom"
                                align="center"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                              >
                                <div className="px-2 py-1.5 mb-1 border-b border-border/50">
                                  <div className="text-[11px] text-muted-foreground font-bold">
                                    {isAr ? 'الآية' : 'Ayah'}
                                  </div>
                                  <div className="text-sm font-black text-foreground">
                                    {stripSurahPrefix(a.surah.name)} · {isAr ? toArabicDigits(a.numberInSurah) : a.numberInSurah}
                                  </div>
                                </div>
                                {isActive && isPlaying ? (
                                  <Button
                                    variant="ghost"
                                    onClick={togglePlayPause}
                                    className="w-full justify-start gap-2 h-9 font-bold"
                                  >
                                    <Pause className="w-4 h-4 text-primary" />
                                    {isAr ? 'إيقاف مؤقت' : 'Pause'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    onClick={() => playAyah(a)}
                                    className="w-full justify-start gap-2 h-9 font-bold"
                                  >
                                    <Play className="w-4 h-4 text-primary" />
                                    {isActive
                                      ? (isAr ? 'متابعة التشغيل' : 'Resume')
                                      : (isAr ? 'تشغيل الآية' : 'Listen to ayah')}
                                  </Button>
                                )}
                                {isActive && (
                                  <Button
                                    variant="ghost"
                                    onClick={stopPlayback}
                                    className="w-full justify-start gap-2 h-9 font-bold text-rose-600 dark:text-rose-400 hover:text-rose-600"
                                  >
                                    <Square className="w-4 h-4" />
                                    {isAr ? 'إيقاف' : 'Stop'}
                                  </Button>
                                )}
                                <div className="mt-1 px-2 py-1.5 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold">
                                  <Volume2 className="w-3 h-3" />
                                  <span className="truncate">{isAr ? currentReciter.nameAr : currentReciter.nameEn}</span>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </span>
                        )
                      })}
                    </p>
                  </div>
                ))}

                {/* Page number footer — small ornament */}
                <div className="mt-8 flex items-center justify-center">
                  <div className="px-5 py-1.5 rounded-full border border-amber-700/30 dark:border-primary/30 bg-amber-50/50 dark:bg-primary/5 text-xs font-black text-amber-800 dark:text-primary tracking-widest">
                    {toArabicDigits(pageNumber)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation controls */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="rounded-2xl h-11 px-5 font-black w-full sm:w-auto bg-[#fbf6e6]/90 dark:bg-card border-amber-700/40 hover:bg-[#fbf6e6] dark:hover:bg-card/80"
            >
              <ChevronRight className="w-4 h-4 me-2" />
              {t.student?.prevPage || 'الصفحة السابقة'}
            </Button>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={TOTAL_PAGES}
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGoToPage()
                }}
                className="w-24 h-11 rounded-2xl text-center font-black bg-[#fbf6e6]/90 dark:bg-card border-amber-700/40"
              />
              <Button onClick={handleGoToPage} className="rounded-2xl h-11 px-5 font-black">
                {isAr ? 'انتقال' : 'Go'}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setPageNumber(p => Math.min(TOTAL_PAGES, p + 1))}
              disabled={pageNumber >= TOTAL_PAGES}
              className="rounded-2xl h-11 px-5 font-black w-full sm:w-auto bg-[#fbf6e6]/90 dark:bg-card border-amber-700/40 hover:bg-[#fbf6e6] dark:hover:bg-card/80"
            >
              {t.student?.nextPage || 'الصفحة التالية'}
              <ChevronLeft className="w-4 h-4 ms-2" />
            </Button>
          </div>
            </div>
          </div>

          {/* Sidebar — audio player (only shown when playing) */}
          {playing && (
            <div className="w-80 flex-shrink-0 hidden md:flex flex-col">
              <div className="bg-card rounded-2xl border border-border shadow-lg p-4 space-y-4 h-fit sticky top-24">
                {/* Now playing header */}
                <div className="border-b border-border pb-3">
                  <div className="text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'الآن يشغّل' : 'Now Playing'}
                  </div>
                  <div className="text-sm font-black text-foreground flex items-center gap-2 truncate" style={{ fontFamily: "'Amiri Quran', serif" }}>
                    <span className="truncate">
                      {(() => {
                        const a = findAyah(playing.globalNumber)
                        return a ? stripSurahPrefix(a.surah.name) : ''
                      })()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {isAr ? `الآية ${toArabicDigits(playing.ayah)}` : `Ayah ${playing.ayah}`}
                  </div>
                </div>

                {/* Reciter info */}
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                  <Mic2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="text-xs font-bold text-foreground truncate">
                    {isAr ? currentReciter.nameAr : currentReciter.nameEn}
                  </div>
                </div>

                {/* Play/Pause indicator */}
                <div className="flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPlaying ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {isPlaying ? <Volume2 className="w-7 h-7 animate-pulse" /> : <Play className="w-7 h-7" />}
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-2">
                  <Button
                    onClick={togglePlayPause}
                    className="w-full rounded-xl h-11 font-bold gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        {isAr ? 'إيقاف مؤقت' : 'Pause'}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {isAr ? 'تشغيل' : 'Play'}
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => playAdjacent(-1)}
                      className="rounded-xl h-10 font-bold gap-1 text-xs"
                      aria-label={isAr ? 'الآية السابقة' : 'Previous ayah'}
                    >
                      <SkipBack className="w-4 h-4" />
                      {isAr ? 'السابقة' : 'Prev'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => playAdjacent(1)}
                      className="rounded-xl h-10 font-bold gap-1 text-xs"
                      aria-label={isAr ? 'الآية التالية' : 'Next ayah'}
                    >
                      {isAr ? 'التالية' : 'Next'}
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant={autoContinue ? 'default' : 'outline'}
                    onClick={() => setAutoContinue(v => !v)}
                    className="w-full rounded-xl h-10 font-bold gap-2"
                    title={isAr ? 'تكرار/متابعة الآيات' : 'Auto-continue'}
                  >
                    <Repeat className="w-4 h-4" />
                    {isAr ? 'متابعة تلقائية' : 'Auto-continue'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={stopPlayback}
                    className="w-full rounded-xl h-10 font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-2"
                  >
                    <Square className="w-4 h-4" />
                    {isAr ? 'إيقاف' : 'Stop'}
                  </Button>
                </div>

                {/* Audio error message */}
                {audioError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 text-center">
                    {audioError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden audio element controlled by refs */}
        <audio
          ref={audioRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false)
            if (!autoContinue || !playing) {
              setPlaying(null)
              return
            }
            // Auto-continue: play next ayah on this page, or jump to next page
            const data = pageDataRef.current
            if (!data) return
            const idx = data.ayahs.findIndex(a => a.number === playing.globalNumber)
            const next = idx >= 0 ? data.ayahs[idx + 1] : null
            if (next) {
              playAyah(next)
            } else if (pageNumber < TOTAL_PAGES) {
              pendingAutoContinue.current = 'first'
              setPageNumber(p => Math.min(TOTAL_PAGES, p + 1))
            } else {
              setPlaying(null)
            }
          }}
          onError={() => {
            setAudioError(isAr ? 'تعذّر تشغيل الصوت، حاول قارئاً آخر' : 'Audio failed to load, try another reciter')
            setIsPlaying(false)
          }}
        />

        {/* Hidden audio element - controlled by refs above */}
      </div>
    </>
  )
}
