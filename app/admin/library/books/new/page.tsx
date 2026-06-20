"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BookOpen, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { BookForm, emptyBookForm, type BookFormValue } from "@/components/library/book-form"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

function buildPayload(v: BookFormValue) {
  return {
    title: v.title.trim(),
    author: v.author.trim() || null,
    description: v.description.trim() || null,
    cover_image_url: v.cover_image_url,
    cover_image_key: v.cover_image_key,
    pages_count: v.pages_count.trim() === "" ? null : Number(v.pages_count),
    publish_date: v.publish_date || null,
    category_id: v.category_id || null,
    is_published: v.is_published,
    display_order: v.display_order.trim() === "" ? 0 : Number(v.display_order),
  }
}

export default function NewBookPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const tr = (ar: string, en: string) => (isAr ? ar : en)

  const router = useRouter()
  const [form, setForm] = useState<BookFormValue>({ ...emptyBookForm })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(tr("العنوان مطلوب", "Title is required"))
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/library/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || tr("تعذر حفظ الكتاب", "Could not save book"))
      toast.success(tr("تم إنشاء الكتاب — ارفع الآن ملفات اللغات", "Book created — upload language files now"))
      router.push(`/admin/library/books/${data.id}/edit`)
    } catch (e: any) {
      toast.error(e?.message || tr("تعذر حفظ الكتاب", "Could not save book"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/admin/library/books">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className={cn("w-4 h-4", isAr ? "" : "rotate-180")} />
              {tr("رجوع", "Back")}
            </Button>
          </Link>
          <h1 className="text-xl font-black flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {tr("كتاب جديد", "New Book")}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tr("حفظ ومتابعة", "Save and Continue")}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {tr("أضف بيانات الكتاب أولاً، وبعد الحفظ ستفتح صفحة التعديل لإضافة ملفات اللغات.", "Add book details first. After saving, the edit page will open to add language files.")}
      </p>

      <BookForm value={form} onChange={setForm} />
    </div>
  )
}
