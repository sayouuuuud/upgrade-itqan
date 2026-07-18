"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, BookOpen, Globe, Calendar, FileText, Loader2, Sparkles, Filter, LayoutGrid, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const academy = (t as any).academy as Record<string, string> | undefined
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
        const res = await fetch("/api/library/categories?domain=academy")
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
      params.set("domain", "academy")
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
      { code: "", label: lib?.allLanguages || "كل اللغات" },
      ...BOOK_LANGUAGES.map((l) => ({
        code: l.code,
        label: isAr ? l.labelAr : l.labelEn,
      })),
    ],
    [isAr, lib?.allLanguages]
  )

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>


      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col relative z-20">
        <div className="mb-6">
          <h1 className="text-3xl font-black">{isAr ? "المكتبة الرقمية" : "Digital Library"}</h1>
          <p className="text-muted-foreground mt-2">{isAr ? "ابحث وتصفح آلاف الكتب العلمية والمراجع" : "Search and browse thousands of books"}</p>
        </div>

        {/* Sleek Filters Section with Search */}
        <div className="flex flex-col md:flex-row gap-3 mb-10 bg-card/90 backdrop-blur-2xl border border-border/60 p-3 rounded-3xl shadow-lg shadow-black/5">
          <div className="relative flex-[2] group">
            <div className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-center pointer-events-none`}>
              <Search className="w-5 h-5" />
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lib?.searchPlaceholder || (isAr ? "ابحث بعنوان الكتاب، المؤلف، أو الموضوع..." : "Search by title, author, or subject...")}
              className={`w-full appearance-none bg-muted/40 border-0 rounded-2xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all placeholder:font-normal placeholder:text-muted-foreground/50 shadow-none`}
            />
          </div>
          
          <div className="hidden md:block w-px bg-border/60 my-2 mx-1" />
          <div className="relative flex-1 group">
            <LayoutGrid className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors`} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full appearance-none bg-muted/40 border-0 rounded-2xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer outline-none`}
            >
              <option value="">{lib?.allCategories || (isAr ? "كل التصنيفات" : "All Categories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className={`absolute ${isAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5`} />
          </div>

          <div className="relative flex-1 group">
            <Globe className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors`} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-full appearance-none bg-muted/40 border-0 rounded-2xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer outline-none`}
            >
              {languageOptions.map((l) => (
                <option key={l.code || "all"} value={l.code}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className={`absolute ${isAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5`} />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-70">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-lg font-bold text-primary animate-pulse">{isAr ? "جاري تحميل المكتبة..." : "Loading library..."}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-4 bg-card/30 border border-dashed border-border p-12 rounded-3xl backdrop-blur-sm max-w-md w-full">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-primary opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {lib?.noResults || (isAr ? "لا توجد نتائج" : "No results found")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isAr ? "لم نعثر على أي كتب تطابق معايير البحث الخاصة بك. جرب تغيير كلمات البحث أو التصنيفات." : "No books found matching your search criteria. Try changing search terms or categories."}
              </p>
              <button 
                onClick={() => { setSearch(''); setCategory(''); setLanguage(''); }}
                className="mt-4 px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors"
              >
                {isAr ? "مسح الفلاتر" : "Clear filters"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/academy/library/${book.id}`}
                className="group focus:outline-none h-full"
              >
                <div className="h-full flex flex-col bg-card border border-border/40 rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 group-focus-visible:ring-2 ring-primary ring-offset-2 ring-offset-background">
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden p-4 sm:p-6 flex items-center justify-center bg-transparent">
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
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{isAr ? "بدون غلاف" : "No Cover"}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-20">
                      <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
                        <BookOpen className="w-4 h-4" />
                        <span>{isAr ? "اقرأ الآن" : "Read Now"}</span>
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
                            ? lf.language_label || (isAr ? "أخرى" : "Other")
                            : getLanguageDisplay(lf.language, lf.language_label, isAr ? "ar" : "en")}
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
                        <div className="flex items-center gap-1.5" title="عدد الصفحات">
                          <FileText className="w-3.5 h-3.5 text-primary/60" />
                          <span>{book.pages_count} {isAr ? "صفحة" : "pages"}</span>
                        </div>
                      ) : (
                        <div /> // Spacer
                      )}
                      
                      {formatDate(book.publish_date) && (
                        <div className="flex items-center gap-1.5" title="سنة النشر">
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
