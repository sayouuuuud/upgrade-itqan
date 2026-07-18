"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Globe,
  Loader2,
  User as UserIcon,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import TajweedPdfViewer from "@/components/tajweed/pdf-viewer"
import { useI18n } from "@/lib/i18n/context"
import {
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
  category_id: string | null
  category_name: string | null
  category_slug: string | null
}

interface RelatedBook {
  id: string
  title: string
  author: string | null
  cover_image_url: string | null
  pages_count: number | null
  publish_date: string | null
  category: string | null
  category_name: string | null
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
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const lib = t.library
  const isAr = t.locale === "ar"

  const [book, setBook] = useState<Book | null>(null)
  const [files, setFiles] = useState<BookFile[]>([])
  const [related, setRelated] = useState<RelatedBook[]>([])
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

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
          throw new Error(data.error || (t.addedTranslations_2026?.['تعذر تحميل الكتاب'] || 'تعذر تحميل الكتاب'))
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
        if (!cancelled) setError(err?.message || (t.addedTranslations_2026?.['حدث خطأ'] || 'حدث خطأ'))
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
    if (!book) return null
    return book.category_name || book.category || null
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
            <p className="text-destructive font-bold">{error || ((t.addedTranslations_2026?.['الكتاب غير موجود'] || (t.addedTranslations_2026?.['الكتاب غير موجود'] || 'الكتاب غير موجود')))}</p>
            <Link href="/library">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 ml-2 rtl:rotate-180" />
                {lib?.backToLibrary || ((t.addedTranslations_2026?.['العودة للمكتبة'] || (t.addedTranslations_2026?.['العودة للمكتبة'] || 'العودة للمكتبة')))}
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
          {lib?.title || ((t.addedTranslations_2026?.['مكتبة الكتب'] || (t.addedTranslations_2026?.['مكتبة الكتب'] || 'مكتبة الكتب')))}
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
                    {book.pages_count} {lib?.pages || ((t.addedTranslations_2026?.['صفحة'] || (t.addedTranslations_2026?.['صفحة'] || 'صفحة')))}
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
                  {files.length} {lib?.languages || ((t.addedTranslations_2026?.['لغة'] || (t.addedTranslations_2026?.['لغة'] || 'لغة')))}
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
                    {lib?.selectLanguage || ((t.addedTranslations_2026?.['اختر اللغة'] || (t.addedTranslations_2026?.['اختر اللغة'] || 'اختر اللغة')))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {files.map((f) => {
                      const label = getLanguageDisplay(f.language, f.language_label, isAr ? "ar" : "en")
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        className="gap-2 font-bold"
                        onClick={() => setViewerOpen(true)}
                      >
                        <Eye className="w-4 h-4" />
                        {(t.addedTranslations_2026?.['عرض الكتاب'] || (t.addedTranslations_2026?.['عرض الكتاب'] || 'عرض الكتاب'))}
                      </Button>
                      <a
                        href={activeFile.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button variant="outline" className="gap-2 font-bold">
                          <Download className="w-4 h-4" />
                          {lib?.downloadFile || ((t.addedTranslations_2026?.['تحميل الملف'] || (t.addedTranslations_2026?.['تحميل الملف'] || 'تحميل الملف')))}
                          {" "}(
                          {getLanguageDisplay(activeFile.language, activeFile.language_label, isAr ? "ar" : "en")}
                          )
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer modal — opens when the user clicks (t.addedTranslations_2026?.['عرض الكتاب'] || 'عرض الكتاب') */}
      {!activeFile && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            {lib?.noFiles || ((t.addedTranslations_2026?.['لا توجد نسخة للعرض حالياً'] || (t.addedTranslations_2026?.['لا توجد نسخة للعرض حالياً'] || 'لا توجد نسخة للعرض حالياً')))}
          </CardContent>
        </Card>
      )}

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 py-2 border-b shrink-0 flex flex-row items-center justify-between gap-2 space-y-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 shrink-0 text-primary" />
              <span className="truncate">{book.title}</span>
              {activeFile && (
                <Badge variant="secondary" className="shrink-0">
                  {getLanguageDisplay(activeFile.language, activeFile.language_label, isAr ? "ar" : "en")}
                </Badge>
              )}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              aria-label={(t.addedTranslations_2026?.['إغلاق'] || (t.addedTranslations_2026?.['إغلاق'] || 'إغلاق'))}
              className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden bg-muted/30">
            {activeFile && viewerOpen && (
              <TajweedPdfViewer
                src={activeFile.pdf_url}
                label={getLanguageDisplay(activeFile.language, activeFile.language_label, isAr ? "ar" : "en")}
                className="h-full w-full border-0 rounded-none"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Related */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-black">{lib?.relatedBooks || ((t.addedTranslations_2026?.['كتب مقترحة'] || (t.addedTranslations_2026?.['كتب مقترحة'] || 'كتب مقترحة')))}</h2>
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
