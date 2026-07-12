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
import { useI18n } from "@/lib/i18n/context";

const COLOR_FIELDS: { key: keyof ThemeColors; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
  { key: "primary", labelAr: "اللون الأساسي", labelEn: "Primary Color", descAr: "الأزرار والروابط والعناصر الرئيسية", descEn: "Buttons, links, and main elements" },
  { key: "primaryForeground", labelAr: "نص اللون الأساسي", labelEn: "Primary Foreground", descAr: "النص فوق اللون الأساسي", descEn: "Text on top of primary color" },
  { key: "accent", labelAr: "اللون المميّز", labelEn: "Accent Color", descAr: "التمييزات والشارات الذهبية", descEn: "Accents and golden badges" },
  { key: "accentForeground", labelAr: "نص اللون المميّز", labelEn: "Accent Foreground", descAr: "النص فوق اللون المميّز", descEn: "Text on top of accent color" },
  { key: "secondary", labelAr: "اللون الثانوي", labelEn: "Secondary Color", descAr: "الخلفيات الثانوية والبطاقات", descEn: "Secondary backgrounds and cards" },
  { key: "secondaryForeground", labelAr: "نص اللون الثانوي", labelEn: "Secondary Foreground", descAr: "النص فوق اللون الثانوي", descEn: "Text on top of secondary color" },
  { key: "background", labelAr: "خلفية الصفحة", labelEn: "Background", descAr: "خلفية الموقع العامة", descEn: "General website background" },
  { key: "foreground", labelAr: "لون النص", labelEn: "Foreground", descAr: "لون النص الأساسي", descEn: "Main text color" },
  { key: "card", labelAr: "خلفية البطاقات", labelEn: "Card Background", descAr: "خلفية الكروت والصناديق", descEn: "Background of cards and boxes" },
  { key: "cardForeground", labelAr: "نص البطاقات", labelEn: "Card Foreground", descAr: "النص داخل الكروت", descEn: "Text inside cards" },
  { key: "popover", labelAr: "خلفية القوائم المنسدلة", labelEn: "Popover Background", descAr: "لون خلفية القوائم", descEn: "Background color of dropdown menus" },
  { key: "popoverForeground", labelAr: "نص القوائم المنسدلة", labelEn: "Popover Foreground", descAr: "النص داخل القوائم", descEn: "Text inside dropdown menus" },
  { key: "input", labelAr: "خلفية الحقول", labelEn: "Input Background", descAr: "خلفية حقول الإدخال", descEn: "Background of input fields" },
  { key: "success", labelAr: "النجاح", labelEn: "Success Color", descAr: "رسائل النجاح والموافقات", descEn: "Success messages and approvals" },
  { key: "successForeground", labelAr: "نص النجاح", labelEn: "Success Foreground", descAr: "النص فوق لون النجاح", descEn: "Text on top of success color" },
  { key: "warning", labelAr: "التحذير", labelEn: "Warning Color", descAr: "تنبيهات ورسائل تحذيرية", descEn: "Alerts and warning messages" },
  { key: "warningForeground", labelAr: "نص التحذير", labelEn: "Warning Foreground", descAr: "النص فوق لون التحذير", descEn: "Text on top of warning color" },
  { key: "destructive", labelAr: "الخطر والإلغاء", labelEn: "Destructive Color", descAr: "زر الحذف أو الخطأ", descEn: "Delete button or error state" },
  { key: "destructiveForeground", labelAr: "نص الخطر", labelEn: "Destructive Foreground", descAr: "النص فوق لون الخطر", descEn: "Text on top of destructive color" },
  { key: "muted", labelAr: "الخلفية الباهتة", labelEn: "Muted Background", descAr: "للعناصر الثانوية جداً", descEn: "For highly secondary elements" },
  { key: "mutedForeground", labelAr: "النص الباهت", labelEn: "Muted Foreground", descAr: "للنصوص غير الأساسية", descEn: "For non-essential texts" },
  { key: "border", labelAr: "لون الحدود", labelEn: "Border Color", descAr: "إطارات العناصر والفواصل", descEn: "Element borders and separators" },
  { key: "ring", labelAr: "لون التحديد", labelEn: "Ring Color", descAr: "إطار التركيز حول الحقول", descEn: "Focus ring around fields" },
  { key: "sidebar", labelAr: "خلفية القائمة الجانبية", labelEn: "Sidebar Background", descAr: "لون القائمة الجانبية", descEn: "Color of the sidebar" },
  { key: "sidebarForeground", labelAr: "نص القائمة الجانبية", labelEn: "Sidebar Foreground", descAr: "النص داخل القائمة الجانبية", descEn: "Text inside the sidebar" },
  { key: "sidebarPrimary", labelAr: "مميز القائمة الجانبية", labelEn: "Sidebar Primary", descAr: "العناصر النشطة في القائمة", descEn: "Active items in the sidebar" },
  { key: "sidebarPrimaryForeground", labelAr: "نص مميز القائمة", labelEn: "Sidebar Primary Foreground", descAr: "النص على العنصر النشط", descEn: "Text on active sidebar item" },
  { key: "sidebarBorder", labelAr: "حدود القائمة الجانبية", labelEn: "Sidebar Border", descAr: "الفواصل داخل القائمة", descEn: "Separators inside the sidebar" },
]

const BRAND_COLOR_FIELDS: { key: keyof ThemeColors; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
  { key: "academyPrimary", labelAr: "لون الأكاديمية", labelEn: "Academy Color", descAr: "اللون الأساسي للسايدبار والعناصر في واجهة الأكاديمية", descEn: "Primary color for sidebar and elements in academy interface" },
  { key: "maintenanceBg", labelAr: "خلفية الصيانة", labelEn: "Maintenance Background", descAr: "لون خلفية صفحة وضع الصيانة", descEn: "Background color of the maintenance mode page" },
  { key: "maintenanceGold", labelAr: "الذهبي للصيانة", labelEn: "Maintenance Gold", descAr: "لون العناوين والحدود في صفحة الصيانة", descEn: "Color of headers and borders on maintenance page" },
]

const RADIUS_OPTIONS = [
  { value: "0rem", labelAr: "حاد", labelEn: "Sharp" },
  { value: "0.375rem", labelAr: "خفيف", labelEn: "Mild" },
  { value: "0.625rem", labelAr: "متوسط (الافتراضي)", labelEn: "Medium (Default)" },
  { value: "1rem", labelAr: "دائري", labelEn: "Round" },
  { value: "1.5rem", labelAr: "دائري جداً", labelEn: "Very Round" },
]

export function ThemeEditor({ initialTheme }: { initialTheme: ThemeConfig }) {
    const { t } = useI18n();
    const isAr = t.locale === "ar";
  const router = useRouter()
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  const setColor = (key: keyof ThemeColors, value: string) =>
    setTheme((t) => ({
      ...t,
      [mode]: {
        colors: {
          ...t[mode].colors,
          [key]: value,
        },
      },
    }))

  // Inline CSS-var style for the live preview box only — keeps the surrounding
  // admin shell stable while still showing exactly how the palette looks.
  const previewStyle = useMemo(() => {
    const c = theme[mode].colors
    return {
      "--p": c.primary,
      "--pf": c.primaryForeground,
      "--a": c.accent,
      "--af": c.accentForeground,
      "--bg": c.background,
      "--fg": c.foreground,
      "--sec": c.secondary,
      "--secf": c.secondaryForeground,
      "--card": c.card,
      "--card-fg": c.cardForeground,
      "--sidebar-bg": c.sidebar,
      "--sidebar-fg": c.sidebarForeground,
      "--rad": theme.radius,
      "--acad": c.academyPrimary,
      "--maint-bg": c.maintenanceBg,
      "--maint-gold": c.maintenanceGold,
      fontFamily: THEME_FONTS[theme.font]?.stack,
    } as React.CSSProperties
  }, [theme, mode])

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
        // Hard reload so the Server Component (ThemeStyleInjector) re-runs and
        // injects the new CSS variables — router.refresh() alone can hit a
        // stale serverless cache and show the old theme.
        setTimeout(() => {
          window.location.reload()
        }, 800)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setTheme(DEFAULT_THEME)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{isAr ? "محرّر التصميم والألوان" : "Theme and Color Editor"}</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {isAr ? "تحكّم في ألوان المنصة والخط ودرجة الاستدارة. يُطبَّق على الموقع كاملاً فور الحفظ." : "Control platform colors, font, and border radius. Applied site-wide immediately upon saving."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {isAr ? "استعادة الافتراضي" : "Restore Default"}</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? (isAr ? "تم الحفظ" : "Saved") : (isAr ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </div>
        </div>

        {/* Light/Dark Mode Toggle */}
        <div className="flex items-center gap-3 bg-muted rounded-lg p-3 w-fit">
          <span className="text-sm font-medium text-muted-foreground">{isAr ? "اختر الوضع:" : "Select Mode:"}</span>
          <div className="flex gap-1 bg-background rounded p-1">
            {(['light', 'dark'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'light' ? (isAr ? '☀️ فاتح' : '☀️ Light') : (isAr ? '🌙 داكن' : '🌙 Dark')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <div className="lg:col-span-3 space-y-6">
          {/* Colors */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-card-foreground mb-4">
              <Palette className="h-4 w-4 text-primary" /> {isAr ? "الألوان" : "Colors"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{isAr ? f.labelAr : f.labelEn}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label={isAr ? f.labelAr : f.labelEn}
                      value={theme[mode].colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                    />
                    <Input
                      value={theme[mode].colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="font-mono text-sm uppercase"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{isAr ? f.descAr : f.descEn}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Brand / section-specific colors */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-card-foreground mb-1">
              <Palette className="h-4 w-4 text-primary" /> {isAr ? "ألوان الواجهات الخاصة" : "Special Interface Colors"}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {isAr ? "ألوان الأكاديمية وصفحة الصيانة — تنعكس فور الحفظ على كامل المنصة." : "Academy and maintenance page colors — reflect immediately upon saving across the platform."}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {BRAND_COLOR_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{isAr ? f.labelAr : f.labelEn}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label={isAr ? f.labelAr : f.labelEn}
                      value={theme[mode].colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                    />
                    <Input
                      value={theme[mode].colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="font-mono text-sm uppercase"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{isAr ? f.descAr : f.descEn}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Typography & radius */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Type className="h-4 w-4 text-primary" /> {isAr ? "الخط" : "Font"}</Label>
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
                <Square className="h-4 w-4 text-primary" /> {isAr ? "درجة استدارة الحواف" : "Border Radius"}</Label>
              <Select value={theme.radius} onValueChange={(v) => setTheme((t) => ({ ...t, radius: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {isAr ? r.labelAr : r.labelEn}
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
            <p className="text-sm font-medium text-muted-foreground">{isAr ? "معاينة حيّة" : "Live Preview"}</p>
            <div
              style={previewStyle}
              className="overflow-hidden rounded-2xl border shadow-sm"
            >
              <div style={{ background: "var(--bg)", color: "var(--fg)" }} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{isAr ? "منصة إتقان" : "Itqan Platform"}</span>
                  <span
                    style={{ background: "var(--a)", color: "var(--af)", borderRadius: "var(--rad)" }}
                    className="px-2.5 py-1 text-xs font-semibold"
                  >
                    {isAr ? "مميّز" : "Featured"}</span>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                  {isAr ? "هذه معاينة مباشرة لمظهر المنصة بالألوان والخط المختارين. جرّب التغييرات قبل الحفظ." : "This is a live preview of the platform's appearance with selected colors and font. Test changes before saving."}</p>
                <div
                  style={{ background: "var(--sec)", color: "var(--secf)", borderRadius: "var(--rad)" }}
                  className="p-3 text-sm"
                >
                  {isAr ? "بطاقة ثانوية بلون الخلفية الثانوية." : "Secondary card with secondary background color."}</div>
                <div
                  style={{ background: "var(--card)", color: "var(--card-fg)", borderRadius: "var(--rad)", border: "1px solid var(--sec)" }}
                  className="p-3 text-sm"
                >
                  {isAr ? "صندوق بطاقة أساسية." : "Primary card box."}</div>
                <div
                  style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-fg)", borderRadius: "var(--rad)", border: "1px solid var(--sec)" }}
                  className="p-3 text-sm font-semibold"
                >
                  {isAr ? "لون القائمة الجانبية." : "Sidebar color."}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    style={{ background: "var(--p)", color: "var(--pf)", borderRadius: "var(--rad)" }}
                    className="px-4 py-2 text-sm font-semibold"
                  >
                    {isAr ? "زر أساسي" : "Primary Button"}</button>
                  <button
                    style={{ borderRadius: "var(--rad)", borderColor: "var(--p)", color: "var(--p)" }}
                    className="border-2 px-4 py-2 text-sm font-semibold"
                  >
                    {isAr ? "زر محدّد" : "Selected Button"}</button>
                </div>
                {/* Main palette swatches */}
                <div className="flex gap-1.5 pt-1">
                  {(["primary", "accent", "secondary", "background", "foreground"] as (keyof ThemeColors)[]).map((k) => (
                    <span
                      key={k}
                      title={k}
                      style={{ background: theme[mode].colors[k] }}
                      className="h-7 flex-1 rounded-md border border-black/10"
                    />
                  ))}
                </div>
                {/* Academy & maintenance swatches */}
                <div className="flex gap-2 pt-1 items-center">
                  <span className="text-xs opacity-60 shrink-0">{isAr ? "واجهات خاصة:" : "Special Interfaces:"}</span>
                  <span
                    title={isAr ? "لون الأكاديمية" : "Academy Color"}
                    style={{ background: "var(--acad)" }}
                    className="h-6 flex-1 rounded-md border border-black/10"
                  />
                  <span
                    title={isAr ? "خلفية الصيانة" : "Maintenance Background"}
                    style={{ background: "var(--maint-bg)" }}
                    className="h-6 flex-1 rounded-md border border-black/10"
                  />
                  <span
                    title={isAr ? "الذهبي للصيانة" : "Maintenance Gold"}
                    style={{ background: "var(--maint-gold)" }}
                    className="h-6 flex-1 rounded-md border border-black/10"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">
              {isAr ? "ملاحظة: المعاينة تعرض الوضع الفاتح. تُطبَّق الألوان على كامل المنصة بعد الضغط على حفظ." : "Note: Preview shows light mode. Colors apply to entire platform after clicking save."}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
