"use client"

import { useEffect, useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface BookCategoryOption {
  id: string
  name: string
  slug: string
}

export interface BookFormValue {
  title: string
  author: string
  description: string
  cover_image_url: string | null
  cover_image_key: string | null
  pages_count: string
  publish_date: string
  category_id: string
  is_published: boolean
  display_order: string
}

export const emptyBookForm: BookFormValue = {
  title: "",
  author: "",
  description: "",
  cover_image_url: null,
  cover_image_key: null,
  pages_count: "",
  publish_date: "",
  category_id: "",
  is_published: true,
  display_order: "0",
}

interface BookFormProps {
  value: BookFormValue
  onChange: (v: BookFormValue) => void
}

export function BookForm({ value, onChange }: BookFormProps) {
  const [uploadingCover, setUploadingCover] = useState(false)
  const [categories, setCategories] = useState<BookCategoryOption[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const update = <K extends keyof BookFormValue>(k: K, v: BookFormValue[K]) =>
    onChange({ ...value, [k]: v })

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch("/api/library/categories")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setCategories(Array.isArray(data.categories) ? data.categories : [])
      } catch {
        // silent: form still works without categories
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "تعذر رفع الصورة")
      }
      const data = await res.json()
      onChange({
        ...value,
        cover_image_url: data.url || data.imageUrl,
        cover_image_key: data.public_id || null,
      })
      toast.success("تم رفع الغلاف")
    } catch (e: any) {
      toast.error(e?.message || "تعذر رفع الصورة")
    } finally {
      setUploadingCover(false)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (uploadingCover) return
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (uploadingCover) return
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      void handleCoverUpload(file)
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
          {/* Cover image uploader */}
          <div className="space-y-2">
            <Label>صورة الغلاف</Label>
            <div className="relative aspect-[3/4] w-full bg-muted rounded-xl overflow-hidden border border-border">
              {value.cover_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value.cover_image_url}
                    alt="cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...value, cover_image_url: null, cover_image_key: null })
                    }
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-90"
                    title="حذف"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <label 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`absolute inset-0 flex flex-col items-center justify-center text-xs gap-2 transition-all ${
                    uploadingCover ? 'opacity-50 cursor-not-allowed' :
                    isDragging ? 'bg-primary/10 text-primary cursor-pointer' : 'text-muted-foreground hover:bg-muted/60 cursor-pointer'
                  }`}
                >
                  {uploadingCover ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className={`w-6 h-6 ${isDragging ? 'text-primary' : ''}`} />
                  )}
                  <span className={isDragging ? 'font-bold text-primary' : ''}>
                    {isDragging ? 'أفلت الصورة هنا' : 'اختر صورة أو اسحبها هنا'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingCover}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handleCoverUpload(f)
                      e.target.value = ""
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Main fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bk-title">العنوان *</Label>
              <Input
                id="bk-title"
                value={value.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="اسم الكتاب"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bk-author">المؤلف</Label>
                <Input
                  id="bk-author"
                  value={value.author}
                  onChange={(e) => update("author", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-category">التصنيف</Label>
                <select
                  id="bk-category"
                  value={value.category_id}
                  onChange={(e) => update("category_id", e.target.value)}
                  className="w-full border border-border bg-background rounded-md px-3 h-10 text-sm"
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-pages">عدد الصفحات</Label>
                <Input
                  id="bk-pages"
                  type="number"
                  min={0}
                  value={value.pages_count}
                  onChange={(e) => update("pages_count", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-date">تاريخ النشر</Label>
                <Input
                  id="bk-date"
                  type="date"
                  value={value.publish_date}
                  onChange={(e) => update("publish_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-order">ترتيب العرض</Label>
                <Input
                  id="bk-order"
                  type="number"
                  value={value.display_order}
                  onChange={(e) => update("display_order", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    checked={value.is_published}
                    onCheckedChange={(checked) => update("is_published", checked)}
                  />
                  <span className="text-sm">{value.is_published ? "منشور" : "مسودة"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bk-desc">الوصف</Label>
          <Textarea
            id="bk-desc"
            value={value.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            placeholder="وصف الكتاب..."
          />
        </div>
      </CardContent>
    </Card>
  )
}
