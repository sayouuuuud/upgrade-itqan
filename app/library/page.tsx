"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, BookOpen, Globe, Calendar, FileText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  BOOK_CATEGORIES,
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
  languages: { language: string; language_label: string | null }[]
}

export default function PublicLibraryPage() {
  const [books, setBooks] = useState<BookListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [language, setLanguage] = useState("")

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
      { code: "", label: "كل اللغات" },
      ...BOOK_LANGUAGES.map((l) => ({ code: l.code, label: l.labelAr })),
    ],
    []
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            المكتبة العامة
          </h1>
          <p className="text-muted-foreground mt-1">
            مجموعة من الكتب المترجمة المتاحة بعدة لغات
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالعنوان أو المؤلف..."
              className="pr-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-border bg-background rounded-md px-3 h-10 text-sm"
          >
            <option value="">كل التصنيفات</option>
            {BOOK_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.labelAr}
              </option>
            ))}
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-border bg-background rounded-md px-3 h-10 text-sm"
          >
            {languageOptions.map((l) => (
              <option key={l.code || "all"} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            لا توجد كتب متاحة حالياً
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/library/${book.id}`}
              className="group focus:outline-none"
            >
              <Card className="h-full overflow-hidden border-border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/10 to-emerald-500/10 overflow-hidden">
                  {book.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {book.languages.slice(0, 3).map((lf) => (
                      <Badge
                        key={lf.language}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {lf.language === OTHER_LANGUAGE_CODE
                          ? lf.language_label || "أخرى"
                          : getLanguageDisplay(lf.language, lf.language_label, "ar")}
                      </Badge>
                    ))}
                    {book.languages.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        +{book.languages.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {book.pages_count != null && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {book.pages_count}
                      </span>
                    )}
                    {formatDate(book.publish_date) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(book.publish_date)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {book.languages.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
