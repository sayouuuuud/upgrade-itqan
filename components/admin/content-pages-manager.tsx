"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Pencil,
  ArrowRight,
  Save,
  Eye,
  EyeOff,
  Globe,
  Clock,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SLUG_LABELS: Record<string, { ar: string; icon: string }> = {
  about:   { ar: "من نحن",           icon: "👥" },
  terms:   { ar: "الشروط والأحكام",  icon: "📋" },
  privacy: { ar: "سياسة الخصوصية",  icon: "🔒" },
  faq:     { ar: "الأسئلة الشائعة",  icon: "❓" },
}

interface PageSummary {
  id: string
  slug: string
  title_ar: string
  title_en: string
  is_published: boolean
  updated_at: string
  updated_by_name: string | null
}

interface PageDetail extends PageSummary {
  content_ar: string
  content_en: string
  meta_desc_ar: string
  meta_desc_en: string
}

export function ContentPagesManager() {
  const { data, mutate } = useSWR<{ pages: PageSummary[] }>(
    "/api/admin/content-pages",
    fetcher
  )

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [form, setForm] = useState<Partial<PageDetail> | null>(null)

  const { data: pageData, isLoading: loadingPage } = useSWR<{ page: PageDetail }>(
    selectedSlug ? `/api/admin/content-pages/${selectedSlug}` : null,
    fetcher,
    {
      onSuccess(d) {
        setForm(d.page)
      },
    }
  )

  function handleChange(field: keyof PageDetail, value: string | boolean) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  async function handleReset() {
    if (!selectedSlug) return
    setResetting(true)
    try {
      const res = await fetch(`/api/admin/content-pages/${selectedSlug}/reset`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `خطأ ${res.status}`)
      }
      toast.success("تمت إعادة الضبط إلى القيم الافتراضية")
      // Re-fetch the page to refresh the form
      mutate()
      // Trigger SWR revalidation of the current page detail
      const detail = await fetch(`/api/admin/content-pages/${selectedSlug}`).then(r => r.json())
      if (detail?.page) setForm(detail.page)
    } catch (e: any) {
      toast.error(e?.message || "فشل في إعادة الضبط")
    } finally {
      setResetting(false)
    }
  }

  async function handleSave() {
    if (!selectedSlug || !form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content-pages/${selectedSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `خطأ ${res.status}`)
      }
      toast.success("تم حفظ الصفحة بنجاح")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "فشل في حفظ الصفحة")
    } finally {
      setSaving(false)
    }
  }

  const pages = data?.pages ?? []

  // ─── List view ────────────────────────────────────────────────────────────
  if (!selectedSlug) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">صفحات المحتوى الثابت</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تحرير محتوى صفحات الموقع العامة التي يراها الزوار
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pages.map((page) => {
            const label = SLUG_LABELS[page.slug]
            return (
              <Card
                key={page.slug}
                className="cursor-pointer hover:border-primary/50 transition-colors border-border/60"
                onClick={() => setSelectedSlug(page.slug)}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {label?.ar ?? page.title_ar}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          /{page.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={page.is_published ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {page.is_published ? "منشور" : "مسودة"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      آخر تعديل:{" "}
                      {new Date(page.updated_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {page.updated_by_name && ` · ${page.updated_by_name}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Edit view ────────────────────────────────────────────────────────────
  const label = SLUG_LABELS[selectedSlug]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setSelectedSlug(null); setForm(null) }}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {label?.ar ?? selectedSlug}
            </h1>
            <p className="text-xs text-muted-foreground">/{selectedSlug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 text-xs"
          >
            <a href={`/${selectedSlug}`} target="_blank" rel="noreferrer">
              <Globe className="w-3.5 h-3.5" />
              معاينة
            </a>
          </Button>

          {/* Reset to defaults */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                disabled={resetting}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {resetting ? "جاري الإعادة..." : "إعادة الضبط"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إعادة الضبط إلى القيم الافتراضية؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم استبدال المحتوى الحالي بالنص الافتراضي الأصلي لهذه الصفحة.
                  لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  نعم، أعد الضبط
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </div>

      {loadingPage || !form ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          جاري التحميل...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Published toggle */}
          <Card className="border-border/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {form.is_published
                    ? <Eye className="w-4 h-4 text-green-600" />
                    : <EyeOff className="w-4 h-4 text-muted-foreground" />
                  }
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {form.is_published ? "الصفحة منشورة" : "الصفحة مسودة"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {form.is_published
                        ? "مرئية للزوار على الموقع"
                        : "مخفية عن الزوار حتى تنشر"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => handleChange("is_published", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content tabs: AR / EN */}
          <Tabs defaultValue="ar">
            <TabsList className="mb-4">
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>

            <TabsContent value="ar" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">المحتوى العربي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title_ar">عنوان الصفحة</Label>
                    <Input
                      id="title_ar"
                      value={form.title_ar ?? ""}
                      onChange={(e) => handleChange("title_ar", e.target.value)}
                      dir="rtl"
                      placeholder="عنوان الصفحة بالعربية"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="meta_desc_ar">وصف SEO</Label>
                    <Input
                      id="meta_desc_ar"
                      value={form.meta_desc_ar ?? ""}
                      onChange={(e) => handleChange("meta_desc_ar", e.target.value)}
                      dir="rtl"
                      placeholder="وصف قصير يظهر في نتائج البحث"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="content_ar">المحتوى</Label>
                    <Textarea
                      id="content_ar"
                      value={form.content_ar ?? ""}
                      onChange={(e) => handleChange("content_ar", e.target.value)}
                      dir="rtl"
                      rows={14}
                      placeholder="محتوى الصفحة بالعربية..."
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      يدعم Markdown: **عريض**، *مائل*، ## عنوان، - قائمة
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">English Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title_en">Page Title</Label>
                    <Input
                      id="title_en"
                      value={form.title_en ?? ""}
                      onChange={(e) => handleChange("title_en", e.target.value)}
                      placeholder="Page title in English"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="meta_desc_en">SEO Description</Label>
                    <Input
                      id="meta_desc_en"
                      value={form.meta_desc_en ?? ""}
                      onChange={(e) => handleChange("meta_desc_en", e.target.value)}
                      placeholder="Short description shown in search results"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="content_en">Content</Label>
                    <Textarea
                      id="content_en"
                      value={form.content_en ?? ""}
                      onChange={(e) => handleChange("content_en", e.target.value)}
                      rows={14}
                      placeholder="Page content in English..."
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Markdown supported: **bold**, *italic*, ## heading, - list
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
