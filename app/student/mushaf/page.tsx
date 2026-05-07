'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { ChevronLeft, ChevronRight, Loader2, BookOpen, Search, List, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

const TOTAL_PAGES = 604
const STORAGE_KEY = 'mushaf:lastPage'

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

// Strip leading bismillah from first ayah of any surah (except Al-Fatiha #1 and At-Tawbah #9 which has none)
function stripLeadingBismillah(text: string, surahNumber: number, ayahNumber: number): string {
  if (ayahNumber !== 1) return text
  if (surahNumber === 1 || surahNumber === 9) return text
  // The text usually starts with "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ " — remove it
  const variants = [
    /^بِسۡمِ\s*ٱللَّهِ\s*ٱلرَّحۡمَٰنِ\s*ٱلرَّحِيمِ\s*/u,
    /^بِسْمِ\s*ٱللَّهِ\s*ٱلرَّحْمَٰنِ\s*ٱلرَّحِيمِ\s*/u,
    /^بِسۡمِ\s*ٱللَّهِ\s*ٱلرَّحۡمَٰنِ\s*ٱلرَّحِيمِ\s*/u,
  ]
  for (const re of variants) {
    const stripped = text.replace(re, '').trim()
    if (stripped !== text) return stripped
  }
  return text
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

      <div className="min-h-screen bg-gradient-to-b from-[#f5efdf] via-[#f8f1e0] to-[#f3ecda] dark:from-background dark:via-background dark:to-background">
        {/* Top toolbar */}
        <div className="sticky top-0 z-30 backdrop-blur-md bg-card/80 border-b border-border/50">
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
                    {isAr ? headerInfo.surahName : headerInfo.surahEnglish}
                    {' · '}
                    {isAr ? `${t.student?.juz || 'الجزء'} ${toArabicDigits(headerInfo.juz)}` : `Juz ${headerInfo.juz}`}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Page indicator + index button */}
            <div className="flex items-center gap-2">
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
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
          <div className="mushaf-page relative bg-[#fbf6e6] dark:bg-card rounded-3xl shadow-2xl shadow-amber-900/10 dark:shadow-black/30 border-[6px] border-double border-amber-700/30 dark:border-primary/30 p-6 sm:p-10 min-h-[70vh]">
            {loading ? (
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
                              سُورَةُ {g.surah.name.replace(/^سورة\s*/u, '')}
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
                        return (
                          <span key={a.number}>
                            {idx > 0 ? ' ' : ''}
                            <span>{text}</span>
                            {' '}
                            <span
                              className="ayah-marker inline-block align-middle text-base sm:text-lg font-black text-amber-800 dark:text-primary mx-1"
                              style={{ fontFamily: 'system-ui, sans-serif' }}
                              aria-label={`Ayah ${a.numberInSurah}`}
                            >
                              ﴿{toArabicDigits(a.numberInSurah)}﴾
                            </span>
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
              className="rounded-2xl h-11 px-5 font-black w-full sm:w-auto"
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
                className="w-24 h-11 rounded-2xl text-center font-black"
              />
              <Button onClick={handleGoToPage} className="rounded-2xl h-11 px-5 font-black">
                {isAr ? 'انتقال' : 'Go'}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setPageNumber(p => Math.min(TOTAL_PAGES, p + 1))}
              disabled={pageNumber >= TOTAL_PAGES}
              className="rounded-2xl h-11 px-5 font-black w-full sm:w-auto"
            >
              {t.student?.nextPage || 'الصفحة التالية'}
              <ChevronLeft className="w-4 h-4 ms-2" />
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground font-bold">
            {isAr
              ? 'استخدم أسهم الكيبورد ◄ ► للتنقل بين الصفحات'
              : 'Use ◄ ► arrow keys to navigate between pages'}
          </p>
        </div>
      </div>
    </>
  )
}
