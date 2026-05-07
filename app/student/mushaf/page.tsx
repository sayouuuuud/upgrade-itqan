'use client'

import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { ChevronLeft, ChevronRight, Loader2, BookOpen, Search, List, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

const TOTAL_PAGES = 604
// QCF v1 fonts — the same fonts quran.com uses. One .woff2 per page (1-604).
const FONT_CDN = 'https://cdn.jsdelivr.net/gh/mustafa0x/qpc-fonts@master/mushaf-woff2'
const STORAGE_KEY = 'mushaf:lastPage'

type Word = {
  id: number
  position: number
  code_v1: string
  line_number: number
  page_number: number
  verse_key: string
  char_type_name: string
}

type Verse = {
  id: number
  verse_number: number
  verse_key: string
  page_number: number
  juz_number: number
  hizb_number: number
  chapter_id: number
  words: Word[]
}

type Surah = {
  id: number
  name_simple: string
  name_arabic: string
  revelation_place: string
  verses_count: number
  pages: [number, number]
  bismillah_pre: boolean
}

const loadedFonts = new Set<number>()

async function loadPageFont(pageNumber: number): Promise<string> {
  const family = `QCF_P${pageNumber}`
  if (loadedFonts.has(pageNumber)) return family
  if (typeof window === 'undefined' || !('FontFace' in window)) return family
  const url = `${FONT_CDN}/p${pageNumber}.woff2`
  try {
    const ff = new FontFace(family, `url(${url}) format('woff2')`)
    const loaded = await ff.load()
    document.fonts.add(loaded)
    loadedFonts.add(pageNumber)
  } catch (e) {
    console.error('[v0] Font load failed for page', pageNumber, e)
  }
  return family
}

function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

export default function MushafPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [pageNumber, setPageNumber] = useState(1)
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [fontFamily, setFontFamily] = useState('')
  const [pageInput, setPageInput] = useState('1')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [error, setError] = useState(false)

  // Restore last viewed page
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const n = parseInt(saved)
      if (n >= 1 && n <= TOTAL_PAGES) {
        setPageNumber(n)
        setPageInput(String(n))
      }
    }
  }, [])

  // Load surahs list once
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/chapters?language=en')
      .then(r => r.json())
      .then(d => setSurahs(d.chapters || []))
      .catch(e => console.error('[v0] Failed to load chapters', e))
  }, [])

  // Load page verses + QCF font whenever page changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setVerses([])

    const apiUrl = `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true&word_fields=code_v1,line_number,page_number,position,char_type_name&fields=chapter_id,page_number,juz_number,hizb_number&per_page=50`

    Promise.all([
      fetch(apiUrl).then(r => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      }),
      loadPageFont(pageNumber),
    ])
      .then(([data, family]) => {
        if (cancelled) return
        setVerses(data.verses || [])
        setFontFamily(family)
        setLoading(false)
        try {
          localStorage.setItem(STORAGE_KEY, String(pageNumber))
        } catch {}
        // Preload neighbor fonts in background
        if (pageNumber > 1) loadPageFont(pageNumber - 1)
        if (pageNumber < TOTAL_PAGES) loadPageFont(pageNumber + 1)
      })
      .catch(e => {
        console.error('[v0] Page load failed', e)
        if (!cancelled) {
          setLoading(false)
          setError(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pageNumber])

  // Group words by visual line (1..15)
  const lineGroups = useMemo(() => {
    const groups: Record<number, { word: Word; verse: Verse }[]> = {}
    for (const verse of verses) {
      for (const word of verse.words || []) {
        if (!groups[word.line_number]) groups[word.line_number] = []
        groups[word.line_number].push({ word, verse })
      }
    }
    for (const ln of Object.keys(groups)) {
      groups[Number(ln)].sort((a, b) => a.word.position - b.word.position)
    }
    return groups
  }, [verses])

  // Detect surah boundaries to render surah banner + bismillah
  const surahBreaks = useMemo(() => {
    const breaks: Record<number, { chapterId: number; showBismillah: boolean }> = {}
    const seen = new Set<number>()
    for (const verse of verses) {
      if (!seen.has(verse.chapter_id) && verse.verse_number === 1) {
        seen.add(verse.chapter_id)
        const firstLine = verse.words[0]?.line_number ?? 1
        breaks[firstLine] = {
          chapterId: verse.chapter_id,
          showBismillah: verse.chapter_id !== 1 && verse.chapter_id !== 9,
        }
      }
    }
    return breaks
  }, [verses])

  const lineNumbers = useMemo(
    () => Object.keys(lineGroups).map(Number).sort((a, b) => a - b),
    [lineGroups]
  )

  const currentSurahs = useMemo(() => {
    const ids: number[] = []
    for (const v of verses) if (!ids.includes(v.chapter_id)) ids.push(v.chapter_id)
    return ids.map(id => surahs.find(s => s.id === id)).filter(Boolean) as Surah[]
  }, [verses, surahs])

  const juzNumber = verses[0]?.juz_number

  const goToPage = (n: number) => {
    if (isNaN(n)) return
    if (n < 1) n = 1
    if (n > TOTAL_PAGES) n = TOTAL_PAGES
    setPageNumber(n)
    setPageInput(String(n))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return surahs
    const q = search.toLowerCase()
    return surahs.filter(
      s =>
        String(s.id).includes(q) ||
        s.name_arabic.includes(search) ||
        s.name_simple.toLowerCase().includes(q)
    )
  }, [surahs, search])

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') goToPage(isAr ? pageNumber - 1 : pageNumber + 1)
      if (e.key === 'ArrowRight') goToPage(isAr ? pageNumber + 1 : pageNumber - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, isAr])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black truncate">
                {t.student?.mushaf || (isAr ? 'مصحفي' : 'My Mushaf')}
              </h1>
              {currentSurahs.length > 0 && (
                <p className="text-[11px] sm:text-xs text-muted-foreground font-bold truncate">
                  {currentSurahs.map(s => (isAr ? s.name_arabic : s.name_simple)).join(' · ')}
                  {juzNumber ? ` · ${isAr ? 'الجزء' : 'Juz'} ${juzNumber}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center px-3 h-9 rounded-full bg-primary/10 text-primary text-xs font-black">
              {isAr
                ? `صفحة ${toArabicDigits(pageNumber)} / ${toArabicDigits(TOTAL_PAGES)}`
                : `Page ${pageNumber} / ${TOTAL_PAGES}`}
            </span>

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={isAr ? 'فهرس السور' : 'Surah index'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={isAr ? 'right' : 'left'}
                className="w-full sm:max-w-md p-0 flex flex-col"
              >
                <SheetTitle className="sr-only">{isAr ? 'فهرس السور' : 'Surah Index'}</SheetTitle>
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-black mb-3">
                    {isAr ? 'فهرس السور' : 'Surah Index'}
                  </h2>
                  <div className="relative">
                    <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder={
                        t.student?.searchSurah || (isAr ? 'ابحث عن سورة...' : 'Search for a surah...')
                      }
                      className="ps-10 h-9"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {filteredSurahs.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          goToPage(s.pages[0])
                          setDrawerOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-start transition-colors"
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-black text-xs shrink-0">
                          {isAr ? toArabicDigits(s.id) : s.id}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className="block font-bold truncate text-base"
                            style={{ fontFamily: 'var(--font-quran), serif' }}
                          >
                            {s.name_arabic}
                          </span>
                          <span className="block text-[11px] text-muted-foreground font-bold truncate">
                            {s.name_simple} ·{' '}
                            {isAr
                              ? `${toArabicDigits(s.verses_count)} آية`
                              : `${s.verses_count} verses`}
                          </span>
                        </span>
                        <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                          {isAr ? `ص ${toArabicDigits(s.pages[0])}` : `p. ${s.pages[0]}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mushaf page */}
      <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-10 max-w-3xl">
        <div className="relative rounded-2xl bg-[#FBF7EE] dark:bg-[#1a1612] shadow-xl border border-border overflow-hidden">
          {/* Decorative double border */}
          <div className="absolute inset-3 sm:inset-4 border border-amber-700/30 rounded-xl pointer-events-none" />
          <div className="absolute inset-4 sm:inset-5 border border-amber-700/20 rounded-lg pointer-events-none" />

          <div className="relative p-6 sm:p-10 min-h-[70vh] flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-bold">
                  {t.student?.loadingMushaf ||
                    (isAr ? 'جاري تحميل المصحف...' : 'Loading the Mushaf...')}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-destructive font-bold">
                  {t.student?.mushafError ||
                    (isAr ? 'تعذر تحميل المصحف، حاول مرة أخرى' : 'Failed to load the Mushaf')}
                </p>
                <Button variant="outline" onClick={() => goToPage(pageNumber)} className="font-black">
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            ) : (
              <div
                dir="rtl"
                className="flex-1 flex flex-col justify-between gap-1"
                style={{ fontFamily: `${fontFamily}, var(--font-quran), serif` }}
              >
                {lineNumbers.map(lineNum => {
                  const wordsInLine = lineGroups[lineNum] || []
                  const surahBreak = surahBreaks[lineNum]
                  const surahData = surahBreak
                    ? surahs.find(s => s.id === surahBreak.chapterId)
                    : null

                  return (
                    <div key={lineNum}>
                      {surahData && <SurahBanner surah={surahData} isAr={isAr} />}
                      {surahBreak?.showBismillah && <BismillahLine />}
                      <div className="mushaf-line">
                        {wordsInLine.map(({ word }) => (
                          <span key={word.id} className="select-text whitespace-nowrap">
                            {word.code_v1}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Page number footer */}
          <div className="relative px-6 sm:px-10 pb-5 flex justify-center">
            <div className="flex items-center justify-center w-14 h-9 rounded-full border border-amber-700/30 bg-amber-50/40 dark:bg-amber-900/10">
              <span
                className="text-sm font-black text-amber-900 dark:text-amber-200"
                dir="rtl"
              >
                {toArabicDigits(pageNumber)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="outline"
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= TOTAL_PAGES}
              className="flex-1 h-11 font-black"
            >
              <ChevronRight className="w-4 h-4 me-2 rtl:rotate-180" />
              {t.student?.nextPage || (isAr ? 'الصفحة التالية' : 'Next Page')}
            </Button>
            <Button
              variant="outline"
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="flex-1 h-11 font-black"
            >
              {t.student?.prevPage || (isAr ? 'الصفحة السابقة' : 'Previous Page')}
              <ChevronLeft className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Button>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault()
              const n = parseInt(pageInput)
              if (!isNaN(n)) goToPage(n)
            }}
            className="flex items-center gap-2"
          >
            <Input
              type="number"
              min={1}
              max={TOTAL_PAGES}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              className="h-11 w-20 text-center font-black"
              aria-label={isAr ? 'رقم الصفحة' : 'Page number'}
            />
            <Button type="submit" className="h-11 font-black px-4">
              {isAr ? 'انتقال' : 'Go'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground font-bold">
          {isAr
            ? 'استخدم أزرار الأسهم في لوحة المفاتيح للتنقل بين الصفحات'
            : 'Use keyboard arrow keys to navigate between pages'}
        </p>
      </main>

      {/* Mushaf line layout */}
      <style jsx global>{`
        .mushaf-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-size: clamp(1.5rem, 4.5vw, 2.5rem);
          line-height: 2.4;
          color: hsl(var(--foreground));
          direction: rtl;
        }
        .mushaf-line > span {
          display: inline-block;
        }
      `}</style>
    </div>
  )
}

function SurahBanner({ surah, isAr }: { surah: Surah; isAr: boolean }) {
  return (
    <div className="my-3 mx-auto max-w-md">
      <div className="relative h-14 sm:h-16 rounded-md border-2 border-amber-700/40 bg-gradient-to-b from-amber-100/40 to-amber-50/20 dark:from-amber-900/20 dark:to-amber-900/5 flex items-center justify-center">
        <div className="absolute inset-x-2 inset-y-1 border border-amber-700/30 rounded" />
        <span className="absolute start-2 inset-y-1 w-8 flex items-center justify-center text-[10px] font-black text-amber-900/80 dark:text-amber-200/80 border-e border-amber-700/30">
          {isAr ? toArabicDigits(surah.id) : surah.id}
        </span>
        <span
          className="relative text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200"
          style={{ fontFamily: 'var(--font-quran), serif' }}
        >
          سورة {surah.name_arabic}
        </span>
        <span className="absolute end-2 inset-y-1 px-2 flex items-center text-[10px] font-black text-amber-900/80 dark:text-amber-200/80 border-s border-amber-700/30">
          {surah.revelation_place === 'makkah'
            ? isAr
              ? 'مكية'
              : 'Meccan'
            : isAr
              ? 'مدنية'
              : 'Medinan'}
        </span>
      </div>
    </div>
  )
}

function BismillahLine() {
  return (
    <div
      className="my-2 text-center text-3xl sm:text-4xl font-bold text-foreground leading-loose"
      style={{ fontFamily: 'var(--font-quran), serif' }}
    >
      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
    </div>
  )
}
