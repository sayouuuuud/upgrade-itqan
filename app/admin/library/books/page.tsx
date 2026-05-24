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
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟ سيتم حذف كل ملفاته نهائياً.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/library/books/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("تم حذف الكتاب")
      setBooks((prev) => prev.filter((b) => b.id !== id))
    } catch {
      toast.error("تعذر حذف الكتاب")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            مكتبة الكتب
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الكتب المتاحة لكل المستخدمين في الأكاديمية والمقرأة
          </p>
        </div>
        <Link href="/admin/library/books/new">
          <Button className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            إضافة كتاب
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بعنوان الكتاب أو المؤلف..."
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            لا يوجد كتب بعد. ابدأ بإضافة كتاب جديد.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3">الكتاب</th>
                  <th className="text-start px-4 py-3">المؤلف</th>
                  <th className="text-start px-4 py-3">اللغات</th>
                  <th className="text-start px-4 py-3">الصفحات</th>
                  <th className="text-start px-4 py-3">الحالة</th>
                  <th className="text-start px-4 py-3">إجراءات</th>
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
                          <span className="text-xs text-muted-foreground">لا توجد ملفات</span>
                        ) : (
                          b.languages.map((lf) => (
                            <Badge
                              key={lf.language}
                              variant="secondary"
                              className="text-[11px]"
                            >
                              <Globe className="w-3 h-3 ml-1" />
                              {lf.language === OTHER_LANGUAGE_CODE
                                ? lf.language_label || "أخرى"
                                : getLanguageDisplay(lf.language, lf.language_label, "ar")}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.pages_count ?? "—"}</td>
                    <td className="px-4 py-3">
                      {b.is_published ? (
                        <Badge variant="default">منشور</Badge>
                      ) : (
                        <Badge variant="outline">مسودة</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/library/books/${b.id}/edit`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Edit2 className="w-3.5 h-3.5" />
                            تعديل
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
                          حذف
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
