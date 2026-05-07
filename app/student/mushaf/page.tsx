"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  ChevronLeft, ChevronRight, Search, BookOpen, ArrowRight,
  Loader2, AlertCircle, LayoutGrid, FileText
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

type Surah = {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: "Meccan" | "Medinan"
}

type Ayah = {
  number: number
  text: string
  numberInSurah: number
  juz: number
  page: number
  surah?: { number: number; name: string; englishName: string; numberOfAyahs: number }
}

type SurahDetail = Surah & { ayahs: Ayah[] }
type PageData = { number: number; ayahs: Ayah[] }

type Mode = "surahs" | "pages"
type View = "list" | "reader"

const TOTAL_PAGES = 604

// Bismillah text in Uthmani script
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"

const toArabicNum = (n: number) =>
  n.toString().replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d, 10)])

export default function MushafPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  // List of all surahs (cached after first fetch)
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // Mode and view
  const [mode, setMode] = useState<Mode>("surahs")
  const [view, setView] = useState<View>("list")

  // Surah reader state
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null)
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null)
  const [loadingSurah, setLoadingSurah] = useState(false)

  // Page reader state
  const [pageNum, setPageNum] = useState(1)
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loadingPage, setLoadingPage] = useState(false)
  const [pageInput, setPageInput] = useState("1")

  // Search
  const [search, setSearch] = useState("")

  const readerScrollRef = useRef<HTMLDivElement>(null)

  // Fetch surah list
  useEffect(() => {
    let cancelled = false
    setLoadingList(true)
    fetch("https://api.alquran.cloud/v1/surah")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d?.data && Array.isArray(d.data)) {
          setSurahs(d.data)
          setListError(null)
        } else {
          setListError(t.student.mushafError || "Failed to load")
        }
      })
      .catch(() => {
        if (!cancelled) setListError(t.student.mushafError || "Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false)
      })

    // Restore last position
    try {
      const last = localStorage.getItem("mushaf:last")
      if (last) {
        const parsed = JSON.parse(last) as { mode: Mode; surah?: number; page?: number }
        if (parsed.mode === "surahs" && parsed.surah) {
          // Don't auto-open, just remember preference
          setMode("surahs")
        } else if (parsed.mode === "pages" && parsed.page) {
          setMode("pages")
          setPageNum(parsed.page)
          setPageInput(String(parsed.page))
        }
      }
    } catch { }

    return () => { cancelled = true }
  }, [])

  // Fetch surah detail when selected
  useEffect(() => {
    if (!selectedSurah) return
    let cancelled = false
    setLoadingSurah(true)
    setSurahDetail(null)

    fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah}/quran-uthmani`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.data) setSurahDetail(d.data)
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingSurah(false) })

    try {
      localStorage.setItem(
        "mushaf:last",
        JSON.stringify({ mode: "surahs", surah: selectedSurah })
      )
    } catch { }

    if (readerScrollRef.current) readerScrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
    return () => { cancelled = true }
  }, [selectedSurah])

  // Fetch page when in pages mode
  useEffect(() => {
    if (mode !== "pages" || view !== "reader") return
    let cancelled = false
    setLoadingPage(true)
    setPageData(null)

    fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.data) setPageData(d.data)
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingPage(false) })

    try {
      localStorage.setItem("mushaf:last", JSON.stringify({ mode: "pages", page: pageNum }))
    } catch { }

    if (readerScrollRef.current) readerScrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
    return () => { cancelled = true }
  }, [mode, view, pageNum])

  const filteredSurahs = useMemo(() => {
    const s = search.trim()
    if (!s) return surahs
    const lower = s.toLowerCase()
    return surahs.filter(
      (x) =>
        x.name.includes(s) ||
        x.englishName.toLowerCase().includes(lower) ||
        x.englishNameTranslation.toLowerCase().includes(lower) ||
        String(x.number) === s ||
        toArabicNum(x.number).includes(s)
    )
  }, [search, surahs])

  // Group ayahs in pages mode by surah for display
  const ayahsBySurah = useMemo(() => {
    if (!pageData?.ayahs) return []
    const groups: { surah: { number: number; name: string; englishName: string; numberOfAyahs: number }; ayahs: Ayah[] }[] = []
    for (const ayah of pageData.ayahs) {
      const last = groups[groups.length - 1]
      if (last && last.surah.number === ayah.surah?.number) {
        last.ayahs.push(ayah)
      } else if (ayah.surah) {
        groups.push({ surah: ayah.surah, ayahs: [ayah] })
      }
    }
    return groups
  }, [pageData])

  const openSurah = (n: number) => {
    setSelectedSurah(n)
    setMode("surahs")
    setView("reader")
  }

  const openPages = () => {
    setMode("pages")
    setView("reader")
  }

  const backToList = () => {
    setView("list")
    setSelectedSurah(null)
    setSurahDetail(null)
  }

  // Reading view (surah mode)
  if (view === "reader" && mode === "surahs" && selectedSurah) {
    return (
      <div className="max-w-4xl mx-auto pb-12 space-y-4">
        <ReaderHeader
          title={surahDetail?.name || `${t.student.surahNumber || "سورة"} ${toArabicNum(selectedSurah)}`}
          subtitle={
            surahDetail
              ? `${toArabicNum(surahDetail.numberOfAyahs)} ${t.student.versesCount || "آية"} • ${surahDetail.revelationType === "Meccan" ? (t.student.revelationMakkah || "مكية") : (t.student.revelationMadinah || "مدنية")}`
              : ""
          }
          onBack={backToList}
          isAr={isAr}
          backLabel={t.student.backToList || "العودة للقائمة"}
        />

        <div ref={readerScrollRef} className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-b from-primary/5 to-transparent p-6 md:p-10 lg:p-14">
            {loadingSurah ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">{t.student.loadingMushaf || "جاري التحميل..."}</p>
              </div>
            ) : surahDetail ? (
              <>
                {/* Surah header */}
                <div className="text-center mb-8 md:mb-10">
                  <div className="inline-flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border-2 border-primary/30 bg-card">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/70">
                      {t.student.surahNumber || "سورة"} {toArabicNum(surahDetail.number)}
                    </span>
                    <h2 className="font-quran text-3xl md:text-4xl text-foreground">
                      {surahDetail.name}
                    </h2>
                  </div>
                </div>

                {/* Bismillah (except surah 9) */}
                {surahDetail.number !== 1 && surahDetail.number !== 9 && (
                  <div className="text-center mb-8 md:mb-10">
                    <p
                      className="font-quran text-2xl md:text-3xl text-foreground leading-loose"
                      dir="rtl"
                    >
                      {BISMILLAH}
                    </p>
                  </div>
                )}

                {/* Ayahs flowing as a paragraph */}
                <div
                  dir="rtl"
                  className="font-quran text-foreground text-justify leading-[2.4] text-2xl md:text-3xl tracking-wide"
                  style={{ wordSpacing: "0.05em" }}
                >
                  {surahDetail.ayahs.map((ayah, idx) => {
                    // For surah 1, ayah 1 IS bismillah - show normally
                    // For other surahs, the API may include bismillah inline in ayah 1 - strip it
                    let text = ayah.text
                    if (surahDetail.number !== 1 && surahDetail.number !== 9 && ayah.numberInSurah === 1) {
                      text = text.replace(/^بِسْمِ\s*ٱللَّهِ\s*ٱلرَّحْمَٰنِ\s*ٱلرَّحِيمِ\s*/u, "")
                    }
                    return (
                      <span key={ayah.number}>
                        {idx > 0 && " "}
                        {text}
                        <span className="inline-flex items-center justify-center mx-1.5 align-middle">
                          <span className="relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10">
                            <svg viewBox="0 0 40 40" className="w-full h-full text-primary/70" fill="none">
                              <path
                                d="M20 2 L24 8 L32 8 L34 16 L38 20 L34 24 L32 32 L24 32 L20 38 L16 32 L8 32 L6 24 L2 20 L6 16 L8 8 L16 8 Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="absolute font-sans text-[11px] md:text-xs font-bold text-primary leading-none">
                              {toArabicNum(ayah.numberInSurah)}
                            </span>
                          </span>
                        </span>
                      </span>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t.student.mushafError || "حدث خطأ"}</p>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          {surahDetail && (
            <div className="border-t border-border bg-muted/30 flex items-center justify-between p-4">
              <button
                onClick={() => selectedSurah > 1 && openSurah(selectedSurah - 1)}
                disabled={selectedSurah <= 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">{t.student.prevSurah || "السورة السابقة"}</span>
              </button>
              <span className="text-xs text-muted-foreground font-bold">
                {toArabicNum(selectedSurah)} / {toArabicNum(114)}
              </span>
              <button
                onClick={() => selectedSurah < 114 && openSurah(selectedSurah + 1)}
                disabled={selectedSurah >= 114}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">{t.student.nextSurah || "السورة التالية"}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Reading view (pages mode)
  if (view === "reader" && mode === "pages") {
    return (
      <div className="max-w-4xl mx-auto pb-12 space-y-4">
        <ReaderHeader
          title={`${t.student.pageNumber || "صفحة"} ${toArabicNum(pageNum)}`}
          subtitle={pageData?.ayahs?.[0] ? `${t.student.juz || "الجزء"} ${toArabicNum(pageData.ayahs[0].juz)}` : ""}
          onBack={backToList}
          isAr={isAr}
          backLabel={t.student.backToList || "العودة للقائمة"}
        />

        <div ref={readerScrollRef} className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-b from-primary/5 to-transparent p-6 md:p-10 lg:p-14 min-h-[60vh]">
            {loadingPage ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">{t.student.loadingMushaf || "جاري التحميل..."}</p>
              </div>
            ) : ayahsBySurah.length > 0 ? (
              <div dir="rtl" className="space-y-8">
                {ayahsBySurah.map((group, gi) => {
                  const isFirstAyahOfSurah = group.ayahs[0]?.numberInSurah === 1
                  const showSurahHeader = isFirstAyahOfSurah
                  const showBismillah = isFirstAyahOfSurah && group.surah.number !== 1 && group.surah.number !== 9
                  return (
                    <div key={`${group.surah.number}-${gi}`}>
                      {showSurahHeader && (
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-primary/30 bg-card">
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/70">
                              {t.student.surahNumber || "سورة"} {toArabicNum(group.surah.number)}
                            </span>
                            <span className="font-quran text-2xl md:text-3xl text-foreground">{group.surah.name}</span>
                          </div>
                        </div>
                      )}
                      {showBismillah && (
                        <p className="font-quran text-center text-2xl md:text-3xl text-foreground leading-loose mb-6">
                          {BISMILLAH}
                        </p>
                      )}
                      <div
                        className="font-quran text-foreground text-justify leading-[2.4] text-2xl md:text-3xl tracking-wide"
                        style={{ wordSpacing: "0.05em" }}
                      >
                        {group.ayahs.map((ayah, idx) => {
                          let text = ayah.text
                          if (idx === 0 && isFirstAyahOfSurah && group.surah.number !== 1 && group.surah.number !== 9) {
                            text = text.replace(/^بِسْمِ\s*ٱللَّهِ\s*ٱلرَّحْمَٰنِ\s*ٱلرَّحِيمِ\s*/u, "")
                          }
                          return (
                            <span key={ayah.number}>
                              {idx > 0 && " "}
                              {text}
                              <span className="inline-flex items-center justify-center mx-1.5 align-middle">
                                <span className="relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10">
                                  <svg viewBox="0 0 40 40" className="w-full h-full text-primary/70" fill="none">
                                    <path
                                      d="M20 2 L24 8 L32 8 L34 16 L38 20 L34 24 L32 32 L24 32 L20 38 L16 32 L8 32 L6 24 L2 20 L6 16 L8 8 L16 8 Z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span className="absolute font-sans text-[11px] md:text-xs font-bold text-primary leading-none">
                                    {toArabicNum(ayah.numberInSurah)}
                                  </span>
                                </span>
                              </span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t.student.mushafError || "حدث خطأ"}</p>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="border-t border-border bg-muted/30 flex items-center justify-between p-4 gap-3">
            <button
              onClick={() => pageNum > 1 && setPageNum(pageNum - 1)}
              disabled={pageNum <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">{t.student.prevPage || "الصفحة السابقة"}</span>
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const n = parseInt(pageInput, 10)
                if (!isNaN(n) && n >= 1 && n <= TOTAL_PAGES) setPageNum(n)
                else setPageInput(String(pageNum))
              }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                min={1}
                max={TOTAL_PAGES}
                className="w-16 text-center bg-card border border-border rounded-lg px-2 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">
                / {toArabicNum(TOTAL_PAGES)}
              </span>
            </form>

            <button
              onClick={() => pageNum < TOTAL_PAGES && setPageNum(pageNum + 1)}
              disabled={pageNum >= TOTAL_PAGES}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="hidden sm:inline">{t.student.nextPage || "الصفحة التالية"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Index/list view
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {t.student.mushaf || "مصحفي"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t.student.mushafDesc || "اقرأ القرآن الكريم بالرسم العثماني"}
            </p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setMode("surahs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "surahs"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <LayoutGrid className="w-4 h-4" />
          {t.student.surahsTab || "السور"}
        </button>
        <button
          onClick={() => setMode("pages")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "pages"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <FileText className="w-4 h-4" />
          {t.student.pagesTab || "الصفحات"}
        </button>
      </div>

      {mode === "surahs" ? (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className={`w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 ${isAr ? "right-4" : "left-4"}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.student.searchSurah || "ابحث عن سورة..."}
              className={`w-full bg-card border border-border rounded-2xl py-3 ${isAr ? "pr-11 pl-4" : "pl-11 pr-4"} text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all`}
            />
          </div>

          {/* Surah grid */}
          {loadingList ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-28" />
              ))}
            </div>
          ) : listError ? (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-sm font-bold text-destructive">{listError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {filteredSurahs.map((s) => (
                <button
                  key={s.number}
                  onClick={() => openSurah(s.number)}
                  className="group bg-card border border-border rounded-2xl p-4 text-right hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <svg viewBox="0 0 40 40" className="w-full h-full text-primary/30" fill="none">
                        <path
                          d="M20 2 L24 8 L32 8 L34 16 L38 20 L34 24 L32 32 L24 32 L20 38 L16 32 L8 32 L6 24 L2 20 L6 16 L8 8 L16 8 Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                          fill="currentColor"
                          fillOpacity="0.2"
                        />
                      </svg>
                      <span className="absolute font-sans text-[11px] font-bold text-primary leading-none">
                        {toArabicNum(s.number)}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${s.revelationType === "Meccan"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                      {s.revelationType === "Meccan"
                        ? (t.student.revelationMakkah || "مكية")
                        : (t.student.revelationMadinah || "مدنية")}
                    </span>
                  </div>
                  <h3 className="font-quran text-2xl text-foreground group-hover:text-primary transition-colors mb-1 leading-tight">
                    {s.name}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {toArabicNum(s.numberOfAyahs)} {t.student.versesCount || "آية"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        // Pages picker
        <div className="bg-card border border-border rounded-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-1">
              {t.student.pagesTab || "الصفحات"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {toArabicNum(TOTAL_PAGES)} {t.student.pageNumber || "صفحة"}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const n = parseInt(pageInput, 10)
              if (!isNaN(n) && n >= 1 && n <= TOTAL_PAGES) {
                setPageNum(n)
                openPages()
              }
            }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              min={1}
              max={TOTAL_PAGES}
              placeholder={t.student.pageNumber || "صفحة"}
              className="w-32 text-center bg-muted border border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {isAr ? "اذهب" : "Go"}
            </button>
          </form>

          {/* Quick jump grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-96 overflow-y-auto p-2 bg-muted/30 rounded-xl">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => {
              const n = i + 1
              return (
                <button
                  key={n}
                  onClick={() => {
                    setPageNum(n)
                    setPageInput(String(n))
                    openPages()
                  }}
                  className="aspect-square rounded-lg bg-card border border-border hover:border-primary hover:bg-primary/5 hover:text-primary text-xs font-bold text-muted-foreground transition-all"
                >
                  {toArabicNum(n)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ReaderHeader({
  title,
  subtitle,
  onBack,
  isAr,
  backLabel,
}: {
  title: string
  subtitle?: string
  onBack: () => void
  isAr: boolean
  backLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors"
      >
        <ArrowRight className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
        <span className="hidden sm:inline">{backLabel}</span>
      </button>
      <div className="text-center min-w-0">
        <h2 className="font-quran text-xl md:text-2xl text-foreground truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground font-bold mt-0.5">{subtitle}</p>}
      </div>
      <div className="w-10" />
    </div>
  )
}
