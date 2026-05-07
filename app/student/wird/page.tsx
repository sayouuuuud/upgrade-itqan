"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen, Bell, BellOff, Plus, Trash2, GripVertical,
  Loader2, CheckCircle, Sun, Moon, BookMarked, FileText,
  Hash, Layers, Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SURAHS } from "@/lib/data/surahs"

// ─── Types ───────────────────────────────────────────────────────────────────
type WirdItemType = "surah" | "pages" | "juz" | "ayahs" | "custom"

interface WirdItem {
  id: string
  type: WirdItemType
  label: string     // human-readable title, e.g. "سورة البقرة"
  detail: string    // detail, e.g. "صفحة 1–5" or "2 صفحات"
}

interface WirdSettings {
  fajr_reminder_enabled: boolean
  maghrib_reminder_enabled: boolean
  wird_items: WirdItem[]
  daily_goal_note: string | null
}

// ─── Type labels ─────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<WirdItemType, React.ElementType> = {
  surah: BookOpen,
  pages: FileText,
  juz: Layers,
  ayahs: Hash,
  custom: BookMarked,
}

const TYPE_LABELS: Record<WirdItemType, string> = {
  surah: "سورة",
  pages: "صفحات",
  juz: "جزء",
  ayahs: "آيات",
  custom: "مخصص",
}

// ─── Add item form ────────────────────────────────────────────────────────────
function AddItemForm({ onAdd }: { onAdd: (item: WirdItem) => void }) {
  const [type, setType] = useState<WirdItemType>("surah")
  const [surahIdx, setSurahIdx] = useState(0)
  const [pageFrom, setPageFrom] = useState(1)
  const [pageTo, setPageTo] = useState(1)
  const [juzNum, setJuzNum] = useState(1)
  const [surahForAyah, setSurahForAyah] = useState(0)
  const [ayahFrom, setAyahFrom] = useState(1)
  const [ayahTo, setAyahTo] = useState(7)
  const [customLabel, setCustomLabel] = useState("")

  const buildItem = (): WirdItem => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    if (type === "surah") {
      const s = SURAHS[surahIdx]
      return { id, type, label: s.name, detail: `${s.verses} آية` }
    }
    if (type === "pages") {
      const detail = pageFrom === pageTo ? `صفحة ${pageFrom}` : `صفحات ${pageFrom}–${pageTo}`
      return { id, type, label: "قراءة صفحات", detail }
    }
    if (type === "juz") {
      return { id, type, label: `الجزء ${juzNum}`, detail: `جزء ${juzNum} من القرآن الكريم` }
    }
    if (type === "ayahs") {
      const s = SURAHS[surahForAyah]
      const detail = ayahFrom === ayahTo ? `آية ${ayahFrom}` : `الآيات ${ayahFrom}–${ayahTo}`
      return { id, type, label: s.name, detail }
    }
    return { id, type: "custom", label: customLabel || "ورد مخصص", detail: "" }
  }

  const handleAdd = () => {
    if (type === "custom" && !customLabel.trim()) return
    onAdd(buildItem())
  }

  return (
    <div className="bg-muted/40 border border-border rounded-2xl p-5 space-y-4">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">إضافة عنصر جديد</p>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABELS) as WirdItemType[]).map((t) => {
          const Icon = TYPE_ICONS[t]
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                type === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {TYPE_LABELS[t]}
            </button>
          )
        })}
      </div>

      {/* Dynamic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {type === "surah" && (
          <div className="sm:col-span-2">
            <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">اختر السورة</Label>
            <select
              value={surahIdx}
              onChange={(e) => setSurahIdx(Number(e.target.value))}
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {SURAHS.map((s, i) => (
                <option key={s.number} value={i}>{s.number}. {s.name}</option>
              ))}
            </select>
          </div>
        )}

        {type === "pages" && (
          <>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">من الصفحة</Label>
              <Input
                type="number" min={1} max={604} value={pageFrom}
                onChange={(e) => { const v = Math.max(1, Math.min(604, +e.target.value || 1)); setPageFrom(v); if (v > pageTo) setPageTo(v) }}
                className="h-10 rounded-xl font-bold"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">إلى الصفحة</Label>
              <Input
                type="number" min={pageFrom} max={604} value={pageTo}
                onChange={(e) => setPageTo(Math.max(pageFrom, Math.min(604, +e.target.value || pageFrom)))}
                className="h-10 rounded-xl font-bold"
              />
            </div>
          </>
        )}

        {type === "juz" && (
          <div className="sm:col-span-2">
            <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">رقم الجزء</Label>
            <Input
              type="number" min={1} max={30} value={juzNum}
              onChange={(e) => setJuzNum(Math.max(1, Math.min(30, +e.target.value || 1)))}
              className="h-10 rounded-xl font-bold"
            />
          </div>
        )}

        {type === "ayahs" && (
          <>
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">السورة</Label>
              <select
                value={surahForAyah}
                onChange={(e) => { setSurahForAyah(Number(e.target.value)); setAyahFrom(1); setAyahTo(1) }}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SURAHS.map((s, i) => (
                  <option key={s.number} value={i}>{s.number}. {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">من الآية</Label>
              <Input
                type="number" min={1} max={SURAHS[surahForAyah]?.verses ?? 1} value={ayahFrom}
                onChange={(e) => setAyahFrom(Math.max(1, +e.target.value || 1))}
                className="h-10 rounded-xl font-bold"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">إلى الآية</Label>
              <Input
                type="number" min={ayahFrom} max={SURAHS[surahForAyah]?.verses ?? 1} value={ayahTo}
                onChange={(e) => setAyahTo(Math.max(ayahFrom, +e.target.value || ayahFrom))}
                className="h-10 rounded-xl font-bold"
              />
            </div>
          </>
        )}

        {type === "custom" && (
          <div className="sm:col-span-2">
            <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">وصف الورد</Label>
            <Input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="مثال: قراءة الأذكار، حفظ سورة..."
              className="h-10 rounded-xl font-bold"
            />
          </div>
        )}
      </div>

      <Button onClick={handleAdd} className="gap-2 rounded-xl h-10 font-bold">
        <Plus className="w-4 h-4" />
        إضافة إلى الورد
      </Button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WirdSettingsPage() {
  const [settings, setSettings] = useState<WirdSettings>({
    fajr_reminder_enabled: true,
    maghrib_reminder_enabled: true,
    wird_items: [],
    daily_goal_note: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/student/wird-settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setSettings({ ...d, wird_items: d.wird_items ?? [] })
      })
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async (next: WirdSettings) => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/student/wird-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }, [])

  const update = (patch: Partial<WirdSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const addItem = (item: WirdItem) => {
    setSettings((prev) => ({ ...prev, wird_items: [...prev.wird_items, item] }))
  }

  const removeItem = (id: string) => {
    setSettings((prev) => ({ ...prev, wird_items: prev.wird_items.filter((i) => i.id !== id) }))
  }

  const moveItem = (from: number, to: number) => {
    setSettings((prev) => {
      const items = [...prev.wird_items]
      const [moved] = items.splice(from, 1)
      items.splice(to, 0, moved)
      return { ...prev, wird_items: items }
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
            <BookOpen className="w-3 h-3" />
            الورد اليومي
          </div>
          <h1 className="text-3xl font-black text-foreground">إعدادات الورد</h1>
          <p className="text-muted-foreground font-medium text-sm">
            حدد وردك اليومي وخصص تذكيرات الفجر والمغرب.
          </p>
        </div>

        <Button
          onClick={() => save(settings)}
          disabled={saving}
          className="gap-2 rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 flex-shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-primary font-bold bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" />
          تم حفظ إعدادات الورد بنجاح
        </div>
      )}

      {/* Reminders card */}
      <Card className="border-border rounded-3xl shadow-sm bg-card/70">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">التذكيرات التلقائية</CardTitle>
              <CardDescription className="text-sm">سيصلك إشعار بعد أذان الفجر والمغرب مباشرة.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-3">
          {/* Fajr toggle */}
          <button
            type="button"
            onClick={() => update({ fajr_reminder_enabled: !settings.fajr_reminder_enabled })}
            className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all ${
              settings.fajr_reminder_enabled
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                settings.fajr_reminder_enabled ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
              }`}>
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">تذكير الفجر</p>
                <p className="text-xs text-muted-foreground">بعد أذان الفجر</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              settings.fajr_reminder_enabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                settings.fajr_reminder_enabled ? "left-5" : "left-0.5"
              }`} />
            </div>
          </button>

          {/* Maghrib toggle */}
          <button
            type="button"
            onClick={() => update({ maghrib_reminder_enabled: !settings.maghrib_reminder_enabled })}
            className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all ${
              settings.maghrib_reminder_enabled
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                settings.maghrib_reminder_enabled ? "bg-indigo-500/10 text-indigo-500" : "bg-muted text-muted-foreground"
              }`}>
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">تذكير المغرب</p>
                <p className="text-xs text-muted-foreground">بعد أذان المغرب</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              settings.maghrib_reminder_enabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                settings.maghrib_reminder_enabled ? "left-5" : "left-0.5"
              }`} />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Wird items card */}
      <Card className="border-border rounded-3xl shadow-sm bg-card/70">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">عناصر الورد</CardTitle>
              <CardDescription className="text-sm">أضف ما تريد قراءته يومياً من القرآن الكريم.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {/* Current items list */}
          {settings.wird_items.length > 0 ? (
            <ul className="space-y-2">
              {settings.wird_items.map((item, idx) => {
                const Icon = TYPE_ICONS[item.type]
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-background border border-border rounded-2xl"
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, idx - 1)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none px-1"
                      >▲</button>
                      <button
                        type="button"
                        disabled={idx === settings.wird_items.length - 1}
                        onClick={() => moveItem(idx, idx + 1)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none px-1"
                      >▼</button>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      )}
                    </div>

                    <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                      {TYPE_LABELS[item.type]}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">لم تُضِف أي عنصر بعد</p>
              <p className="text-xs">أضف السور أو الصفحات أو الأجزاء التي تريد قراءتها يومياً.</p>
            </div>
          )}

          {/* Add item form */}
          <AddItemForm onAdd={addItem} />
        </CardContent>
      </Card>

      {/* Daily goal note */}
      <Card className="border-border rounded-3xl shadow-sm bg-card/70">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-bold">ملاحظة / هدف شخصي</CardTitle>
          <CardDescription className="text-sm">اكتب هدفك أو تذكيراً شخصياً لنفسك.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <textarea
            value={settings.daily_goal_note ?? ""}
            onChange={(e) => update({ daily_goal_note: e.target.value || null })}
            rows={3}
            placeholder="مثال: أريد ختم القرآن خلال شهر رمضان..."
            className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </CardContent>
      </Card>

      {/* Save footer */}
      <div className="flex items-center justify-end gap-4 pb-6">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-primary font-bold animate-in fade-in slide-in-from-right-2">
            <CheckCircle className="w-4 h-4" />
            تم الحفظ
          </span>
        )}
        <Button
          onClick={() => save(settings)}
          disabled={saving}
          className="gap-2 rounded-2xl h-11 px-8 font-bold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  )
}
