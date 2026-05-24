"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BookOpen, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { BookForm, emptyBookForm, type BookFormValue } from "@/components/library/book-form"

function buildPayload(v: BookFormValue) {
  return {
    title: v.title.trim(),
    author: v.author.trim() || null,
    description: v.description.trim() || null,
    cover_image_url: v.cover_image_url,
    cover_image_key: v.cover_image_key,
    pages_count: v.pages_count.trim() === "" ? null : Number(v.pages_count),
    publish_date: v.publish_date || null,
    category: v.category || null,
    is_published: v.is_published,
    display_order: v.display_order.trim() === "" ? 0 : Number(v.display_order),
  }
}

export default function NewBookPage() {
  const router = useRouter()
  const [form, setForm] = useState<BookFormValue>({ ...emptyBookForm })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("العنوان مطلوب")
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
      if (!res.ok) throw new Error(data.error || "تعذر حفظ الكتاب")
      toast.success("تم إنشاء الكتاب — ارفع الآن ملفات اللغات")
      router.push(`/admin/library/books/${data.id}/edit`)
    } catch (e: any) {
      toast.error(e?.message || "تعذر حفظ الكتاب")
    } finally {
      setSaving(false)
    }
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
            كتاب جديد
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ ومتابعة
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        أضف بيانات الكتاب أولاً، وبعد الحفظ ستفتح صفحة التعديل لإضافة ملفات اللغات.
      </p>

      <BookForm value={form} onChange={setForm} />
    </div>
  )
}
