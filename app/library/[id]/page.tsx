"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  FileText,
  Globe,
  Loader2,
  User as UserIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import TajweedPdfViewer from "@/components/tajweed/pdf-viewer"
import {
  BOOK_CATEGORIES,
  OTHER_LANGUAGE_CODE,
  getLanguageDisplay,
} from "@/lib/library/languages"

interface BookFile {
  id: string
  language: string
  language_label: string | null
  pdf_url: string
  file_size_bytes: string | null
}

interface Book {
  id: string
  title: string
  author: string | null
  description: string | null
  cover_image_url: string | null
  pages_count: number | null
  publish_date: string | null
  category: string | null
}

interface RelatedBook {
  id: string
  title: string
  author: string | null
  cover_image_url: string | null
  pages_count: number | null
  publish_date: string | null
  category: string | null
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

export default function BookDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [book, setBook] = useState<Book | null>(null)
  const [files, setFiles] = useState<BookFile[]>([])
  const [related, setRelated] = useState<RelatedBook[]>([])
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/library/books/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "تعذر تحميل الكتاب")
        }
        const data = await res.json()
        if (cancelled) return
        setBook(data.book)
        setFiles(Array.isArray(data.files) ? data.files : [])
        setRelated(Array.isArray(data.related) ? data.related : [])
        if (Array.isArray(data.files) && data.files.length > 0) {
          setActiveLanguage(data.files[0].language)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "حدث خطأ")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id])

  const activeFile = useMemo(
    () => files.find((f) => f.language === activeLanguage) ?? files[0] ?? null,
    [files, activeLanguage]
  )

  const categoryLabel = useMemo(() => {
    if (!book?.category) return null
    return BOOK_CATEGORIES.find((c) => c.code === book.category)?.labelAr || book.category
  }, [book])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-12" dir="rtl">
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-destructive font-bold">{error || "الكتاب غير موجود"}</p>
            <Link href="/library">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 ml-2 rtl:rotate-180" />
                العودة للمكتبة
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-8" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/library" className="hover:text-primary transition-colors">
          المكتبة
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{book.title}</span>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 lg:w-56 shrink-0">
              <div className="relative aspect-[3/4] rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/10 overflow-hidden border border-border">
                {book.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary/40" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                {categoryLabel && (
                  <Badge variant="secondary" className="font-bold">
                    {categoryLabel}
                  </Badge>
                )}
                <h1 className="text-2xl sm:text-3xl font-black leading-tight">{book.title}</h1>
                {book.author && (
                  <p className="text-base text-muted-foreground flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    {book.author}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {book.pages_count != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {book.pages_count} صفحة
                  </span>
                )}
                {book.publish_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(book.publish_date).getFullYear()}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  {files.length} لغة
                </span>
              </div>

              {book.description && (
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">
                  {book.description}
                </p>
              )}

              {files.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Globe className="w-4 h-4 text-primary" />
                    اختر اللغة
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {files.map((f) => {
                      const label = getLanguageDisplay(f.language, f.language_label, "ar")
                      const sizeLabel = formatFileSize(
                        f.file_size_bytes != null ? Number(f.file_size_bytes) : null
                      )
                      const isActive = activeFile?.id === f.id
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActiveLanguage(f.language)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {label}
                          {sizeLabel && (
                            <span className="opacity-70 mr-1">({sizeLabel})</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {activeFile && (
                    <a
                      href={activeFile.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Button className="gap-2 font-bold">
                        <Download className="w-4 h-4" />
                        تحميل (
                        {getLanguageDisplay(activeFile.language, activeFile.language_label, "ar")}
                        )
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer */}
      {activeFile ? (
        <div className="space-y-2">
          <h2 className="text-xl font-black">معاينة الكتاب</h2>
          <TajweedPdfViewer
            src={activeFile.pdf_url}
            label={getLanguageDisplay(activeFile.language, activeFile.language_label, "ar")}
            className="min-h-[60vh]"
          />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            لا توجد نسخة للعرض حالياً
          </CardContent>
        </Card>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-black">كتب ذات صلة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {related.map((r) => (
              <Link key={r.id} href={`/library/${r.id}`} className="group">
                <Card className="overflow-hidden border-border hover:border-primary/50 transition-all">
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/10 to-emerald-500/10 overflow-hidden">
                    {r.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.cover_image_url}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2 space-y-1">
                    <h3 className="font-bold text-xs line-clamp-2 group-hover:text-primary transition-colors">
                      {r.title}
                    </h3>
                    {r.author && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{r.author}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
