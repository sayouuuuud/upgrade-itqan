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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { BookForm, emptyBookForm, type BookFormValue } from "@/components/library/book-form"
import {
  BOOK_LANGUAGES,
  OTHER_LANGUAGE_CODE,
  getLanguageDisplay,
} from "@/lib/library/languages"
import { useI18n } from "@/lib/i18n/context"

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
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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
          category_id: b.category_id || "",
          is_published: !!b.is_published,
          display_order: b.display_order == null ? "0" : String(b.display_order),
        })
        setFiles(Array.isArray(data.files) ? data.files : [])
      } catch {
        toast.error(t.admin.bookLoadError)
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
      toast.error(t.admin.bookTitleRequired)
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
          category_id: form.category_id || null,
          is_published: form.is_published,
          display_order:
            form.display_order.trim() === "" ? 0 : Number(form.display_order),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.admin.bookSaveError)
      toast.success(t.admin.bookSaveSuccess)
    } catch (e: any) {
      toast.error(e?.message || t.admin.bookSaveError)
    } finally {
      setSaving(false)
    }
  }

  const uploadLanguageFile = async (file: File) => {
    if (!newLanguage) {
      toast.error(t.admin.bookSelectLangFirst2)
      return
    }
    if (newLanguage === OTHER_LANGUAGE_CODE && !newLanguageLabel.trim()) {
      toast.error(t.admin.bookWriteLangName)
      return
    }
    if (file.type !== "application/pdf") {
      toast.error(t.admin.bookMustBePdf)
      return
    }
    setUploading(true)
    setUploadProgress(10)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10))
    }, 500)

    try {
      const fd = new FormData()
      fd.append("file", file)
      const upRes = await fetch("/api/upload-pdf", { method: "POST", body: fd })
      const upData = await upRes.json().catch(() => ({}))
      if (!upRes.ok) {
        throw new Error(upData.error || t.admin.bookUploadError)
      }
      
      setUploadProgress(90)

      const saveRes = await fetch(`/api/admin/library/books/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: newLanguage,
          language_label:
            newLanguage === OTHER_LANGUAGE_CODE ? newLanguageLabel.trim() : null,
          pdf_url: upData.url,
          pdf_key: upData.key || upData.public_id,
          file_size_bytes: file.size,
        }),
      })
      const saveData = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) throw new Error(saveData.error || t.admin.bookUploadError)
      
      setUploadProgress(100)
      toast.success(t.admin.bookUploadSuccess)
      setNewLanguage("")
      setNewLanguageLabel("")
      setUploadModalOpen(false)
      
      // Reload list
      const fresh = await fetch(`/api/admin/library/books/${id}`)
      if (fresh.ok) {
        const data = await fresh.json()
        setFiles(Array.isArray(data.files) ? data.files : [])
      }
    } catch (e: any) {
      toast.error(e?.message || t.admin.bookUploadError)
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm(t.admin.bookConfirmDelete)) return
    setDeletingFileId(fileId)
    try {
      const res = await fetch(`/api/admin/library/books/${id}/files/${fileId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast.success(t.admin.bookDeleteSuccess)
    } catch {
      toast.error(t.admin.bookDeleteError)
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
              {t.admin.bookBack}
            </Button>
          </Link>
          <h1 className="text-xl font-black flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t.admin.bookEditTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/library/${id}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="w-4 h-4" />
              {t.admin.bookPreview}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? t.admin.bookSaving : t.admin.bookSave}
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
                {t.admin.bookFilesTitle}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t.admin.bookFilesDesc}
              </p>
            </div>
            <Badge variant="secondary">{files.length} {t.admin.bookFilesCount}</Badge>
          </div>

          {/* Existing files */}
          <div className="space-y-2">
            {files.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/40 p-4 rounded-lg text-center">
                {t.admin.bookNoFiles}
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
                      {t.admin.bookViewFile}
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
                      {t.admin.bookDeleteFile}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add new file */}
          <div className="border-t border-border pt-4">
            <Dialog open={uploadModalOpen} onOpenChange={(open) => !uploading && setUploadModalOpen(open)}>
              <DialogTrigger asChild>
                <Button className="gap-2 font-bold">
                  <Plus className="w-4 h-4" />
                  {t.admin.bookAddLang}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    {t.admin.bookUploadDialogTitle}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bk-newlang">{t.admin.bookLangSelectLabel}</Label>
                    <select
                      id="bk-newlang"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="w-full border border-border bg-background rounded-md px-3 h-10 text-sm"
                      disabled={uploading}
                    >
                      <option value="">{t.admin.bookLangSelectPlaceholder}</option>
                      {BOOK_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.labelAr}
                          {usedLanguageCodes.has(l.code) ? ` ${t.admin.bookLangReplaced}` : ""}
                        </option>
                      ))}
                      <option value={OTHER_LANGUAGE_CODE}>{t.admin.bookOtherLang}</option>
                    </select>
                  </div>
                  
                  {newLanguage === OTHER_LANGUAGE_CODE && (
                    <div className="space-y-2">
                    <Label htmlFor="bk-langlabel">{t.admin.bookLangNameLabel}</Label>
                    <Input
                      id="bk-langlabel"
                      value={newLanguageLabel}
                      onChange={(e) => setNewLanguageLabel(e.target.value)}
                      placeholder={t.admin.bookLangNameLabel}
                      disabled={uploading}
                    />
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label>ملف الـ PDF</Label>
                    {!newLanguage ? (
                        <div className="p-6 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground bg-muted/20">
                            {t.admin.bookSelectLangFirst}
                        </div>
                    ) : (
                        <label
                          onDragOver={(e) => { e.preventDefault(); if(!uploading) setIsDragging(true) }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if(uploading) return;
                            const file = e.dataTransfer.files?.[0];
                            if(file) void uploadLanguageFile(file);
                          }}
                          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 transition-all ${
                            uploading ? "opacity-50 cursor-not-allowed bg-muted border-border" :
                            isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-border cursor-pointer hover:bg-muted/50"
                          }`}
                        >
                          {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : (
                            <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                          )}
                          <div className="text-center">
                              <p className={`text-sm font-bold ${isDragging ? "text-primary" : ""}`}>
                                {uploading ? t.admin.bookUploading : isDragging ? t.admin.bookDropActive : t.admin.bookDropLabel}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{t.admin.bookMaxSize}</p>
                          </div>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) void uploadLanguageFile(f)
                              e.target.value = ""
                            }}
                          />
                        </label>
                    )}
                  </div>

                  {uploading && (
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-bold text-primary">
                            <span>{t.admin.bookUploadingProgress}</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
