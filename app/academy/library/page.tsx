"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, BookOpen, Globe, Calendar, FileText, Loader2, Sparkles, Filter, LayoutGrid, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background" dir="rtl">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-background pt-24 pb-32 border-b border-border/40">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <Badge variant="outline" className="px-5 py-2 mb-8 bg-primary/5 text-primary border-primary/20 font-bold rounded-full gap-2 text-sm shadow-sm backdrop-blur-md hover:bg-primary/10 transition-colors cursor-default">
            <Sparkles className="w-4 h-4 animate-pulse" />
            {isAr ? "مكتبة إتقان الرقمية" : "Itqan Digital Library"}
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-foreground tracking-tight leading-[1.1] mb-6 max-w-4xl drop-shadow-sm">
            {lib?.title || "استكشف عوالم المعرفة"}
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl mb-14 font-medium">
            {lib?.subtitle || "آلاف الكتب القيمة والمراجع العلمية بانتظارك لتعزيز معرفتك وتطوير مهاراتك."}
          </p>

          {/* Epic Search Bar */}
          <div className="w-full max-w-3xl relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl transition-all duration-500 group-hover:bg-primary/30 group-hover:blur-3xl opacity-70" />
            <div className="relative flex items-center bg-card/90 backdrop-blur-xl border-2 border-primary/20 rounded-3xl p-2.5 shadow-2xl shadow-black/5 transition-all duration-300 hover:border-primary/40 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lib?.searchPlaceholder || "ابحث بعنوان الكتاب، المؤلف، أو الموضوع..."}
                className="flex-1 bg-transparent border-none shadow-none text-xl font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 px-4 h-14"
              />
              <Button size="lg" className="h-14 px-10 rounded-2xl font-black text-lg hidden sm:flex shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 active:scale-95">
                {search ? "جاري البحث..." : "بحث"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col -mt-12 relative z-20">
        {/* Sleek Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12 bg-card/90 backdrop-blur-2xl border border-border/60 p-3 rounded-3xl shadow-xl shadow-black/5">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-foreground/80 px-5 sm:border-l border-border/60">
            <Filter className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm whitespace-nowrap">تصفية النتائج:</span>
          </div>
          
          <div className="relative flex-1 group">
            <LayoutGrid className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none bg-muted/40 border-0 rounded-2xl pr-12 pl-4 h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer outline-none"
            >
              <option value="">{lib?.allCategories || "كل التصنيفات"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5" />
          </div>

          <div className="relative flex-1 group">
            <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none bg-muted/40 border-0 rounded-2xl pr-12 pl-4 h-14 text-base font-bold hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer outline-none"
            >
              {languageOptions.map((l) => (
                <option key={l.code || "all"} value={l.code}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-0.5" />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-70">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-lg font-bold text-primary animate-pulse">جاري تحميل المكتبة...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-4 bg-card/30 border border-dashed border-border p-12 rounded-3xl backdrop-blur-sm max-w-md w-full">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-primary opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {lib?.noResults || "لا توجد نتائج"}
              </h3>
              <p className="text-muted-foreground text-sm">
                لم نعثر على أي كتب تطابق معايير البحث الخاصة بك. جرب تغيير كلمات البحث أو التصنيفات.
              </p>
              <button 
                onClick={() => { setSearch(''); setCategory(''); setLanguage(''); }}
                className="mt-4 px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors"
              >
                مسح الفلاتر
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
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">بدون غلاف</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-20">
                      <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
                        <BookOpen className="w-4 h-4" />
                        <span>اقرأ الآن</span>
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
                            ? lf.language_label || "أخرى"
                            : getLanguageDisplay(lf.language, lf.language_label, "ar")}
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
                          <span>{book.pages_count} صفحة</span>
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
