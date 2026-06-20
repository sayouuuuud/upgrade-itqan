"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Edit2,
  Globe,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  OTHER_LANGUAGE_CODE,
  getLanguageDisplay,
} from "@/lib/library/languages"
import { BookCategoriesManager } from "@/components/library/book-categories-manager"
import { useI18n } from "@/lib/i18n/context"

interface AdminBookRow {
  id: string
  title: string
  author: string | null
  cover_image_url: string | null
  pages_count: number | null
  publish_date: string | null
  category: string | null
  is_published: boolean
  display_order: number
  languages_count: number
  languages: { language: string; language_label: string | null }[]
  created_at: string
}

export default function AdminLibraryBooksPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const tr = (ar: string, en: string) => (isAr ? ar : en)

  const [books, setBooks] = useState<AdminBookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchBooks = useMemo(
    () => async (q: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set("search", q)
        const res = await fetch(`/api/admin/library/books?${params.toString()}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setBooks(Array.isArray(data.books) ? data.books : [])
      } catch {
        setBooks([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchBooks(search)
    }, 250)
    return () => clearTimeout(t)
  }, [search, fetchBooks])

  const onDelete = async (id: string) => {
    if (!confirm(tr("هل أنت متأكد من حذف هذا الكتاب؟ سيتم حذف كل ملفاته نهائياً.", "Are you sure you want to delete this book? All its files will be permanently deleted."))) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/library/books/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(tr("تم حذف الكتاب", "Book deleted successfully"))
      setBooks((prev) => prev.filter((b) => b.id !== id))
    } catch {
      toast.error(tr("تعذر حذف الكتاب", "Could not delete the book"))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {tr("مكتبة الكتب", "Books Library")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tr("إدارة الكتب المتاحة لكل المستخدمين في الأكاديمية والمقرأة", "Manage books available to all users in the academy and recitation portal")}
          </p>
        </div>
        <Link href="/admin/library/books/new">
          <Button className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            {tr("إضافة كتاب", "Add Book")}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className={isAr ? "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" : "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"} />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tr("ابحث بعنوان الكتاب أو المؤلف...", "Search by book title or author...")}
                  className={isAr ? "pr-9" : "pl-9"}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <BookCategoriesManager />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            {tr("لا يوجد كتب بعد. ابدأ بإضافة كتاب جديد.", "No books yet. Start by adding a new book.")}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3">{tr("الكتاب", "Book")}</th>
                  <th className="text-start px-4 py-3">{tr("المؤلف", "Author")}</th>
                  <th className="text-start px-4 py-3">{tr("اللغات", "Languages")}</th>
                  <th className="text-start px-4 py-3">{tr("الصفحات", "Pages")}</th>
                  <th className="text-start px-4 py-3">{tr("الحالة", "Status")}</th>
                  <th className="text-start px-4 py-3">{tr("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
                          {b.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.cover_image_url}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold truncate">{b.title}</div>
                          {b.publish_date && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(b.publish_date).getFullYear()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.author || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {b.languages.length === 0 ? (
                          <span className="text-xs text-muted-foreground">{tr("لا توجد ملفات", "No files")}</span>
                        ) : (
                          b.languages.map((lf) => (
                            <Badge
                              key={lf.language}
                              variant="secondary"
                              className="text-[11px]"
                            >
                              <Globe className={isAr ? "w-3 h-3 ml-1" : "w-3 h-3 mr-1"} />
                              {lf.language === OTHER_LANGUAGE_CODE
                                ? lf.language_label || tr("أخرى", "Other")
                                : getLanguageDisplay(lf.language, lf.language_label, locale)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.pages_count ?? "—"}</td>
                    <td className="px-4 py-3">
                      {b.is_published ? (
                        <Badge variant="default">{tr("منشور", "Published")}</Badge>
                      ) : (
                        <Badge variant="outline">{tr("مسودة", "Draft")}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/library/books/${b.id}/edit`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Edit2 className="w-3.5 h-3.5" />
                            {tr("تعديل", "Edit")}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          disabled={deletingId === b.id}
                          onClick={() => onDelete(b.id)}
                        >
                          {deletingId === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          {tr("حذف", "Delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
