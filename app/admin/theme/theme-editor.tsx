"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Palette, Save, RotateCcw, Loader2, CheckCircle, Type, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_THEME,
  THEME_FONTS,
  type ThemeConfig,
  type ThemeColors,
  type ThemeFontId,
} from "@/lib/admin/theme"

const COLOR_FIELDS: { key: keyof ThemeColors; labelAr: string; descAr: string }[] = [
  { key: "primary", labelAr: "اللون الأساسي", descAr: "الأزرار والروابط والعناصر الرئيسية" },
  { key: "primaryForeground", labelAr: "نص اللون الأساسي", descAr: "النص فوق اللون الأساسي" },
  { key: "accent", labelAr: "اللون المميّز", descAr: "التمييزات والشارات الذهبية" },
  { key: "accentForeground", labelAr: "نص اللون المميّز", descAr: "النص فوق اللون المميّز" },
  { key: "secondary", labelAr: "اللون الثانوي", descAr: "الخلفيات الثانوية والبطاقات" },
  { key: "secondaryForeground", labelAr: "نص اللون الثانوي", descAr: "النص فوق اللون الثانوي" },
  { key: "background", labelAr: "خلفية الصفحة", descAr: "خلفية الموقع العامة" },
  { key: "foreground", labelAr: "لون النص", descAr: "لون النص الأساسي" },
  { key: "ring", labelAr: "لون التحديد", descAr: "إطار التركيز حول الحقول" },
]

const RADIUS_OPTIONS = [
  { value: "0rem", label: "حاد" },
  { value: "0.375rem", label: "خفيف" },
  { value: "0.625rem", label: "متوسط (الافتراضي)" },
  { value: "1rem", label: "دائري" },
  { value: "1.5rem", label: "دائري جداً" },
]

export function ThemeEditor({ initialTheme }: { initialTheme: ThemeConfig }) {
  const router = useRouter()
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setColor = (key: keyof ThemeColors, value: string) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }))

  // Inline CSS-var style for the live preview box only — keeps the surrounding
  // admin shell stable while still showing exactly how the palette looks.
  const previewStyle = useMemo(() => {
    const c = theme.colors
    return {
      "--p": c.primary,
      "--pf": c.primaryForeground,
      "--a": c.accent,
      "--af": c.accentForeground,
      "--bg": c.background,
      "--fg": c.foreground,
      "--sec": c.secondary,
      "--secf": c.secondaryForeground,
      "--rad": theme.radius,
      fontFamily: THEME_FONTS[theme.font]?.stack,
    } as React.CSSProperties
  }, [theme])

  const fontHref = THEME_FONTS[theme.font]?.href

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setTheme(DEFAULT_THEME)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">محرّر التصميم والألوان</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              تحكّم في ألوان المنصة والخط ودرجة الاستدارة. يُطبَّق على الموقع كاملاً فور الحفظ.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            استعادة الافتراضي
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "تم الحفظ" : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <div className="lg:col-span-3 space-y-6">
          {/* Colors */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-card-foreground mb-4">
              <Palette className="h-4 w-4 text-primary" /> الألوان
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{f.labelAr}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label={f.labelAr}
                      value={theme.colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                    />
                    <Input
                      value={theme.colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="font-mono text-sm uppercase"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{f.descAr}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Typography & radius */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Type className="h-4 w-4 text-primary" /> الخط
              </Label>
              <Select value={theme.font} onValueChange={(v) => setTheme((t) => ({ ...t, font: v as ThemeFontId }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(THEME_FONTS) as ThemeFontId[]).map((id) => (
                    <SelectItem key={id} value={id}>
                      {THEME_FONTS[id].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Square className="h-4 w-4 text-primary" /> درجة استدارة الحواف
              </Label>
              <Select value={theme.radius} onValueChange={(v) => setTheme((t) => ({ ...t, radius: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">معاينة حيّة</p>
            <div
              style={previewStyle}
              className="overflow-hidden rounded-2xl border shadow-sm"
            >
              <div style={{ background: "var(--bg)", color: "var(--fg)" }} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">منصة إتقان</span>
                  <span
                    style={{ background: "var(--a)", color: "var(--af)", borderRadius: "var(--rad)" }}
                    className="px-2.5 py-1 text-xs font-semibold"
                  >
                    مميّز
                  </span>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                  هذه معاينة مباشرة لمظهر المنصة بالألوان والخط المختارين. جرّب التغييرات قبل الحفظ.
                </p>
                <div
                  style={{ background: "var(--sec)", color: "var(--secf)", borderRadius: "var(--rad)" }}
                  className="p-3 text-sm"
                >
                  بطاقة ثانوية بلون الخلفية الثانوية.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    style={{ background: "var(--p)", color: "var(--pf)", borderRadius: "var(--rad)" }}
                    className="px-4 py-2 text-sm font-semibold"
                  >
                    زر أساسي
                  </button>
                  <button
                    style={{ borderRadius: "var(--rad)", borderColor: "var(--p)", color: "var(--p)" }}
                    className="border-2 px-4 py-2 text-sm font-semibold"
                  >
                    زر محدّد
                  </button>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {(["primary", "accent", "secondary", "background", "foreground"] as (keyof ThemeColors)[]).map((k) => (
                    <span
                      key={k}
                      title={k}
                      style={{ background: theme.colors[k] }}
                      className="h-7 flex-1 rounded-md border border-black/10"
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">
              ملاحظة: المعاينة تعرض الوضع الفاتح. تُطبَّق الألوان على كامل المنصة بعد الضغط على حفظ.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
