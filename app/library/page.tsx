"use client"


import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Globe, Calendar, FileText, Loader2, Filter, LayoutGrid, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import {
  BOOK_LANGUAGES,
  OTHER_LANGUAGE_CODE,
  getLanguageDisplay,
} from "@/lib/library/languages"

interface BookListItem {
  id: string
  title: string
  author: string | null
  description: string | null
  cover_image_url: string | null
  pages_count: number | null
  publish_date: string | null
  category: string | null
  category_id: string | null
  category_name: string | null
  category_slug: string | null
  languages: { language: string; language_label: string | null }[]
}

interface CategoryOption {
  id: string
  name: string
  slug: string
}

export default function PublicLibraryPage() {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const lib = t.library
  const isAr = t.locale === "ar"
  const [books, setBooks] = useState<BookListItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [language, setLanguage] = useState("")

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch("/api/library/categories")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setCategories(Array.isArray(data.categories) ? data.categories : [])
      } catch {
        // ignore
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (category) params.set("category", category)
      if (language) params.set("language", language)
      try {
        const res = await fetch(`/api/library/books?${params.toString()}`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (!cancelled) setBooks(Array.isArray(data.books) ? data.books : [])
      } catch {
        if (!cancelled) setBooks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [search, category, language])

  const formatDate = (d: string | null) => {
    if (!d) return null
    try {
      return new Date(d).getFullYear().toString()
    } catch {
      return null
    }
  }

  const languageOptions = useMemo(
    () => [
      { code: "", label: lib?.allLanguages || (t.addedTranslations_2026?.['كل اللغات'] || 'كل اللغات') },
      ...BOOK_LANGUAGES.map((l) => ({
        code: l.code,
        label: isAr ? l.labelAr : l.labelEn,
      })),
    ],
    [isAr, lib?.allLanguages]
  )

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Sleek Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12 bg-card/90 backdrop-blur-2xl border border-border/60 p-3 rounded-3xl shadow-xl shadow-black/5">
          <div className={cn("flex items-center justify-center sm:justify-start gap-2 text-foreground/80 px-5", isAr ? "sm:border-l" : "sm:border-r", "border-border/60")}>
            <Filter className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm whitespace-nowrap">{lib?.filterResults || ((t.addedTranslations_2026?.['تصفية النتائج:'] || (t.addedTranslations_2026?.['تصفية النتائج:'] || 'تصفية النتائج:')))}</span>
          </div>
          
          <div className="relative flex-1 group">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors", isAr ? "right-4" : "left-4")} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lib?.searchPlaceholder || (t.addedTranslations_2026?.['ابحث بعنوان الكتاب، المؤلف...'] || 'ابحث بعنوان الكتاب، المؤلف...')}
              className={cn("w-full bg-muted/40 border-0 rounded-2xl h-14 text-base font-bold placeholder:font-normal hover:bg-muted/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30 transition-all outline-none shadow-none", isAr ? "pr-12 pl-4" : "pl-12 pr-4")}
            />
          </div>

          <div className="relative flex-1 group">
            <LayoutGrid className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors", isAr ? "right-4" : "left-4")} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn("w-full appearance-none bg-muted/40 border-0 rounded-2xl h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer outline-none", isAr ? "pr-12 pl-4" : "pl-12 pr-4")}
            >
              <option value="">{lib?.allCategories || (t.addedTranslations_2026?.['كل التصنيفات'] || 'كل التصنيفات')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5", isAr ? "left-4" : "right-4")} />
          </div>

          <div className="relative flex-1 group">
            <Globe className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors", isAr ? "right-4" : "left-4")} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={cn("w-full appearance-none bg-muted/40 border-0 rounded-2xl h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer outline-none", isAr ? "pr-12 pl-4" : "pl-12 pr-4")}
            >
              {languageOptions.map((l) => (
                <option key={l.code || "all"} value={l.code}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5", isAr ? "left-4" : "right-4")} />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-70">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-lg font-bold text-primary animate-pulse">{lib?.loading || ((t.addedTranslations_2026?.['جاري تحميل المكتبة...'] || (t.addedTranslations_2026?.['جاري تحميل المكتبة...'] || 'جاري تحميل المكتبة...')))}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-4 bg-card/30 border border-dashed border-border p-12 rounded-3xl backdrop-blur-sm max-w-md w-full">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-primary opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {lib?.noResults || (t.addedTranslations_2026?.['لا توجد نتائج'] || 'لا توجد نتائج')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {lib?.noResultsDesc || ((t.addedTranslations_2026?.['لم نعثر على أي كتب تطابق معايير البحث الخاصة بك. جرب تغيير كلمات البحث أو التصنيفات.'] || (t.addedTranslations_2026?.['لم نعثر على أي كتب تطابق معايير البحث الخاصة بك. جرب تغيير كلمات البحث أو التصنيفات.'] || 'لم نعثر على أي كتب تطابق معايير البحث الخاصة بك. جرب تغيير كلمات البحث أو التصنيفات.')))}
              </p>
              <button 
                onClick={() => { setSearch(''); setCategory(''); setLanguage(''); }}
                className="mt-4 px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors"
              >
                {lib?.clearFilters || ((t.addedTranslations_2026?.['مسح الفلاتر'] || (t.addedTranslations_2026?.['مسح الفلاتر'] || 'مسح الفلاتر')))}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/library/${book.id}`}
                className="group focus:outline-none h-full"
              >
                <div className="h-full flex flex-col bg-card border border-border/40 rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 group-focus-visible:ring-2 ring-primary ring-offset-2 ring-offset-background">
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted/30 p-4 sm:p-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                    <div className="relative w-full h-full rounded-md sm:rounded-lg overflow-hidden shadow-md shadow-black/10 border border-black/5 group-hover:shadow-2xl group-hover:shadow-black/20 transition-all duration-500 group-hover:scale-105">
                      {/* Spine highlight */}
                      <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-l from-white/40 to-transparent z-10 mix-blend-overlay" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      {book.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 text-primary/30 gap-3 border border-primary/10">
                          <BookOpen className="w-12 h-12" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{lib?.noCover || ((t.addedTranslations_2026?.['بدون غلاف'] || (t.addedTranslations_2026?.['بدون غلاف'] || 'بدون غلاف')))}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-20">
                      <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
                        <BookOpen className="w-4 h-4" />
                        <span>{lib?.readNow || ((t.addedTranslations_2026?.['اقرأ الآن'] || (t.addedTranslations_2026?.['اقرأ الآن'] || 'اقرأ الآن')))}</span>
                      </div>
                    </div>

                    {/* Category Badge Floating */}
                    {book.category_name && (
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-md text-foreground text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-border/50 z-30">
                        {book.category_name}
                      </div>
                    )}
                  </div>
                  
                  {/* Content Container */}
                  <div className="p-5 flex-1 flex flex-col space-y-3 relative">
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors decoration-primary decoration-2 underline-offset-4 group-hover:underline">
                        {book.title}
                      </h3>
                      {book.author && (
                        <p className="text-xs font-medium text-muted-foreground line-clamp-1 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary/50" />
                          {book.author}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {book.languages.slice(0, 2).map((lf) => (
                        <span
                          key={lf.language}
                          className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold border border-primary/10"
                        >
                          {lf.language === OTHER_LANGUAGE_CODE
                            ? lf.language_label || lib?.otherLanguage || ((t.addedTranslations_2026?.['أخرى'] || (t.addedTranslations_2026?.['أخرى'] || 'أخرى')))
                            : getLanguageDisplay(lf.language, lf.language_label, t.locale as 'ar' | 'en')}
                        </span>
                      ))}
                      {book.languages.length > 2 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold">
                          +{book.languages.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[11px] font-semibold text-muted-foreground/80">
                      {book.pages_count ? (
                        <div className="flex items-center gap-1.5" title={(t.addedTranslations_2026?.['عدد الصفحات'] || (t.addedTranslations_2026?.['عدد الصفحات'] || 'عدد الصفحات'))}>
                          <FileText className="w-3.5 h-3.5 text-primary/60" />
                          <span>{book.pages_count} {lib?.pages || ((t.addedTranslations_2026?.['صفحة'] || (t.addedTranslations_2026?.['صفحة'] || 'صفحة')))}</span>
                        </div>
                      ) : (
                        <div /> // Spacer
                      )}
                      
                      {formatDate(book.publish_date) && (
                        <div className="flex items-center gap-1.5" title={(t.addedTranslations_2026?.['سنة النشر'] || (t.addedTranslations_2026?.['سنة النشر'] || 'سنة النشر'))}>
                          <Calendar className="w-3.5 h-3.5 text-primary/60" />
                          <span>{formatDate(book.publish_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
