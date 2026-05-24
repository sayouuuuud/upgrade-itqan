"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BookForm, emptyBookForm, type BookFormValue } from "@/components/library/book-form"
import {
  BOOK_LANGUAGES,
  OTHER_LANGUAGE_CODE,
  getLanguageDisplay,
} from "@/lib/library/languages"

interface BookFileRow {
  id: string
  language: string
  language_label: string | null
  pdf_url: string
  pdf_key: string | null
  file_size_bytes: string | null
  created_at: string
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—"
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

export default function EditBookPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [form, setForm] = useState<BookFormValue>({ ...emptyBookForm })
  const [files, setFiles] = useState<BookFileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New language uploader state
  const [newLanguage, setNewLanguage] = useState<string>("")
  const [newLanguageLabel, setNewLanguageLabel] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const usedLanguageCodes = useMemo(
    () => new Set(files.map((f) => f.language)),
    [files]
  )

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/library/books/${id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (cancelled) return
        const b = data.book
        setForm({
          title: b.title || "",
          author: b.author || "",
          description: b.description || "",
          cover_image_url: b.cover_image_url || null,
          cover_image_key: b.cover_image_key || null,
          pages_count: b.pages_count == null ? "" : String(b.pages_count),
          publish_date: b.publish_date ? String(b.publish_date).slice(0, 10) : "",
          category: b.category || "",
          is_published: !!b.is_published,
          display_order: b.display_order == null ? "0" : String(b.display_order),
        })
        setFiles(Array.isArray(data.files) ? data.files : [])
      } catch {
        toast.error("تعذر تحميل الكتاب")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("العنوان مطلوب")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/library/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          author: form.author.trim() || null,
          description: form.description.trim() || null,
          cover_image_url: form.cover_image_url,
          cover_image_key: form.cover_image_key,
          pages_count:
            form.pages_count.trim() === "" ? null : Number(form.pages_count),
          publish_date: form.publish_date || null,
          category: form.category || null,
          is_published: form.is_published,
          display_order:
            form.display_order.trim() === "" ? 0 : Number(form.display_order),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "تعذر الحفظ")
      toast.success("تم حفظ التعديلات")
    } catch (e: any) {
      toast.error(e?.message || "تعذر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  const uploadLanguageFile = async (file: File) => {
    if (!newLanguage) {
      toast.error("اختر اللغة أولاً")
      return
    }
    if (newLanguage === OTHER_LANGUAGE_CODE && !newLanguageLabel.trim()) {
      toast.error("اكتب اسم اللغة")
      return
    }
    if (file.type !== "application/pdf") {
      toast.error("الملف يجب أن يكون PDF")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const upRes = await fetch("/api/upload", { method: "POST", body: fd })
      const upData = await upRes.json().catch(() => ({}))
      if (!upRes.ok) {
        throw new Error(upData.error || "تعذر رفع الملف")
      }
      const saveRes = await fetch(`/api/admin/library/books/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: newLanguage,
          language_label:
            newLanguage === OTHER_LANGUAGE_CODE ? newLanguageLabel.trim() : null,
          pdf_url: upData.url,
          pdf_key: upData.public_id,
          file_size_bytes: file.size,
        }),
      })
      const saveData = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) throw new Error(saveData.error || "تعذر حفظ الملف")
      toast.success("تم رفع الملف")
      setNewLanguage("")
      setNewLanguageLabel("")
      // Reload list
      const fresh = await fetch(`/api/admin/library/books/${id}`)
      if (fresh.ok) {
        const data = await fresh.json()
        setFiles(Array.isArray(data.files) ? data.files : [])
      }
    } catch (e: any) {
      toast.error(e?.message || "تعذر رفع الملف")
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return
    setDeletingFileId(fileId)
    try {
      const res = await fetch(`/api/admin/library/books/${id}/files/${fileId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast.success("تم حذف الملف")
    } catch {
      toast.error("تعذر حذف الملف")
    } finally {
      setDeletingFileId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/admin/library/books">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="w-4 h-4 rotate-180" />
              رجوع
            </Button>
          </Link>
          <h1 className="text-xl font-black flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            تعديل الكتاب
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/library/${id}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="w-4 h-4" />
              معاينة
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ
          </Button>
        </div>
      </div>

      <BookForm value={form} onChange={setForm} />

      {/* Language files manager */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-black text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                نسخ الكتاب باللغات
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                لكل لغة ملف PDF واحد. عند اختيار لغة موجودة بالفعل، سيتم استبدال ملفها.
              </p>
            </div>
            <Badge variant="secondary">{files.length} لغة</Badge>
          </div>

          {/* Existing files */}
          <div className="space-y-2">
            {files.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/40 p-4 rounded-lg text-center">
                لا توجد ملفات بعد — أضف لغة من النموذج أسفل.
              </div>
            ) : (
              files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 border border-border bg-card rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm">
                        {getLanguageDisplay(f.language, f.language_label, "ar")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatBytes(f.file_size_bytes != null ? Number(f.file_size_bytes) : null)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={f.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      عرض
                    </a>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      disabled={deletingFileId === f.id}
                      onClick={() => deleteFile(f.id)}
                    >
                      {deletingFileId === f.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      حذف
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add new file */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Plus className="w-4 h-4 text-primary" />
              إضافة لغة
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="bk-newlang">اللغة</Label>
                <select
                  id="bk-newlang"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full border border-border bg-background rounded-md px-3 h-10 text-sm"
                >
                  <option value="">اختر لغة...</option>
                  {BOOK_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.labelAr}
                      {usedLanguageCodes.has(l.code) ? " (مستبدل)" : ""}
                    </option>
                  ))}
                  <option value={OTHER_LANGUAGE_CODE}>أخرى (نص حر)</option>
                </select>
              </div>
              {newLanguage === OTHER_LANGUAGE_CODE && (
                <div className="space-y-1.5">
                  <Label htmlFor="bk-langlabel">اسم اللغة</Label>
                  <Input
                    id="bk-langlabel"
                    value={newLanguageLabel}
                    onChange={(e) => setNewLanguageLabel(e.target.value)}
                    placeholder="مثلاً: السواحلية"
                  />
                </div>
              )}
              <div className={newLanguage === OTHER_LANGUAGE_CODE ? "" : "md:col-span-2"}>
                <label
                  htmlFor="bk-newfile"
                  className={`inline-flex items-center gap-2 font-bold rounded-md px-4 h-10 text-sm ${
                    uploading || !newLanguage
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  ارفع PDF
                </label>
                <input
                  id="bk-newfile"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploading || !newLanguage}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadLanguageFile(f)
                    e.target.value = ""
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
