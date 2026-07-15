"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import {
  BookOpen, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ChevronRight, AlertTriangle, Layers, Sparkles, Mic, ArrowUpDown, Hash,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"

type Path = {
  id: string
  title: string
  description: string | null
  unit_type: string
  range_from: number | null
  range_to: number | null
  direction: "asc" | "desc"
  level: string
  total_units: number
  estimated_days: number | null
  require_audio: boolean
  is_published: boolean
  is_active: boolean
  created_by_name?: string
  created_at: string
  stats?: { enrolled: string; active: string; completed: string; avg_progress: string }
}

const RANGE_MAX: Record<string, number> = { juz: 30, surah: 114, hizb: 60, page: 604 }

// Quick presets to spare readers from manual range setup.
type Preset = {
  key: string
  labelAr: string
  labelEn: string
  descriptionAr: string
  descriptionEn: string
  unit_type: string
  range_from: number
  range_to: number
  direction: "asc" | "desc"
  level: string
}
const PRESETS: Preset[] = [
  { key: "juz30", labelAr: (t.addedTranslations_2026?.['جزء عمّ'] || 'جزء عمّ'), labelEn: "Juz Amma", descriptionAr: (t.addedTranslations_2026?.['السور القصيرة (النبأ → الناس)'] || 'السور القصيرة (النبأ → الناس)'), descriptionEn: "Short Surahs (An-Naba → An-Nas)", unit_type: "surah", range_from: 78, range_to: 114, direction: "desc", level: "beginner" },
  { key: "juz29", labelAr: (t.addedTranslations_2026?.['جزء تبارك'] || 'جزء تبارك'), labelEn: "Juz Tabarak", descriptionAr: (t.addedTranslations_2026?.['من سورة الملك'] || 'من سورة الملك'), descriptionEn: "From Surah Al-Mulk", unit_type: "surah", range_from: 67, range_to: 77, direction: "desc", level: "beginner" },
  { key: "full_surah", labelAr: (t.addedTranslations_2026?.['المصحف كامل (بالسور)'] || 'المصحف كامل (بالسور)'), labelEn: "Entire Quran (By Surah)", descriptionAr: (t.addedTranslations_2026?.['الفاتحة → الناس، 114 سورة'] || 'الفاتحة → الناس، 114 سورة'), descriptionEn: "Al-Fatihah → An-Nas, 114 Surahs", unit_type: "surah", range_from: 1, range_to: 114, direction: "desc", level: "advanced" },
  { key: "full_juz", labelAr: (t.addedTranslations_2026?.['المصحف كامل (بالأجزاء)'] || 'المصحف كامل (بالأجزاء)'), labelEn: "Entire Quran (By Juz)", descriptionAr: (t.addedTranslations_2026?.['30 جزءاً بالترتيب'] || '30 جزءاً بالترتيب'), descriptionEn: "30 Juz in order", unit_type: "juz", range_from: 1, range_to: 30, direction: "desc", level: "advanced" },
]

export default function ReaderMemorizationPathsPage() {
  const { t } = useI18n()
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const TYPE_LABELS: Record<string, string> = {
    juz: t.reader.memorizationPaths.divisionWords.juz,
    surah: t.reader.memorizationPaths.divisionWords.surah,
    hizb: t.reader.memorizationPaths.divisionWords.hizb,
    page: t.reader.memorizationPaths.divisionWords.page,
    custom: t.reader.memorizationPaths.divisionWords.custom,
  }

  const UNIT_WORD: Record<string, string> = {
    juz: t.reader.memorizationPaths.unitWords.juz,
    surah: t.reader.memorizationPaths.unitWords.surah,
    hizb: t.reader.memorizationPaths.unitWords.hizb,
    page: t.reader.memorizationPaths.unitWords.page
  }

  const LEVEL_LABELS: Record<string, string> = {
    beginner: t.reader.memorizationPaths.levelBeginner,
    intermediate: t.reader.memorizationPaths.levelIntermediate,
    advanced: t.reader.memorizationPaths.levelAdvanced,
  }

  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [schemaNotice, setSchemaNotice] = useState<{
    notice: "migration_not_applied" | "schema_prerequisite_missing"
    missing_relation?: string | null
  } | null>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    unit_type: "surah",
    range_from: "1",
    range_to: "114",
    direction: "desc" as "asc" | "desc",
    level: "beginner",
    require_audio: false,
    estimated_days: "",
    is_published: false,
  })

  // ─── Derived preview + validation for the create form ───
  const max = RANGE_MAX[form.unit_type] || 1
  const from = parseInt(form.range_from, 10)
  const to = parseInt(form.range_to, 10)
  const rangeValid =
    Number.isFinite(from) && Number.isFinite(to) &&
    from >= 1 && to >= 1 && from <= max && to <= max
  // Units are generated inclusively regardless of order (server clamps/sorts).
  const unitCount = rangeValid ? Math.abs(to - from) + 1 : 0
  const unitWord = UNIT_WORD[form.unit_type] || (isAr ? t.reader.memorizationPaths.unitWords.custom : "Unit")
  const canSubmit = !!form.title.trim() && rangeValid && unitCount > 0

  function applyPreset(p: Preset) {
    setForm(f => ({
      ...f,
      unit_type: p.unit_type,
      range_from: String(p.range_from),
      range_to: String(p.range_to),
      direction: p.direction,
      level: p.level,
      title: f.title.trim() ? f.title : (isAr ? p.labelAr : p.labelEn),
    }))
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/reader/memorization-paths?include_stats=1")
      const data = await res.json()
      if (data.notice === "migration_not_applied" || data.notice === "schema_prerequisite_missing") {
        setSchemaNotice({ notice: data.notice, missing_relation: data.missing_relation })
      } else {
        setSchemaNotice(null)
      }
      setPaths(data.paths || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [])

  async function submit() {
    if (!form.title.trim()) {
      toast.error(t.reader.memorizationPaths.errorTitleRequired)
      return
    }
    if (!rangeValid || unitCount === 0) {
      toast.error(t.reader.memorizationPaths.errorInvalidRange.replace("{max}", String(max)))
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/reader/memorization-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          unit_type: form.unit_type,
          range_from: form.unit_type === "custom" ? null : parseInt(form.range_from, 10) || 1,
          range_to:   form.unit_type === "custom" ? null : parseInt(form.range_to, 10) || RANGE_MAX[form.unit_type] || 1,
          direction: form.direction,
          level: form.level,
          require_audio: form.require_audio,
          estimated_days: form.estimated_days ? parseInt(form.estimated_days, 10) : null,
          is_published: form.is_published,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t.reader.memorizationPaths.errorCreateFailed)
        return
      }
      toast.success(
        t.reader.memorizationPaths.successCreated + 
        (data.total_units ? ((t.addedTranslations_2026?.[' بـ ${data.total_units} وحدة'] || (t.addedTranslations_2026?.[' بـ ${data.total_units} وحدة'] || ' بـ ${data.total_units} وحدة'))) : "") +
        (form.is_published 
          ? t.reader.memorizationPaths.successPublished 
          : t.reader.memorizationPaths.successDraft),
      )
      setOpenCreate(false)
      setForm({
        title: "", description: "", unit_type: "surah",
        range_from: "1", range_to: "114", direction: "desc",
        level: "beginner", require_audio: false, estimated_days: "", is_published: false,
      })
      await load()
    } catch {
      toast.error(t.reader.memorizationPaths.errorServerConnection)
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(p: Path) {
    const next = !p.is_published
    await fetch(`/api/reader/memorization-paths/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: next }),
    })
    toast.success(next 
      ? t.reader.memorizationPaths.successPublishToggle 
      : t.reader.memorizationPaths.successHideToggle)
    await load()
  }

  async function remove(p: Path) {
    const confirmMsg = t.reader.memorizationPaths.confirmDelete.replace("{title}", p.title)
    if (!confirm(confirmMsg)) return
    const res = await fetch(`/api/reader/memorization-paths/${p.id}`, { method: "DELETE" })
    if (res.ok) toast.success(t.reader.memorizationPaths.successDeleted)
    else toast.error(t.reader.memorizationPaths.errorDeleteFailed)
    await load()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            {t.reader.memorizationPaths.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.reader.memorizationPaths.subtitle}
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.reader.memorizationPaths.createNewPathBtn}
        </Button>
      </div>

      {schemaNotice && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-sm text-foreground">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              {schemaNotice.notice === "schema_prerequisite_missing" ? (
                <>
                  <strong>{(t.addedTranslations_2026?.['اتصال قاعدة البيانات مش على schema التطبيق المطلوبة.'] || (t.addedTranslations_2026?.['اتصال قاعدة البيانات مش على schema التطبيق المطلوبة.'] || 'اتصال قاعدة البيانات مش على schema التطبيق المطلوبة.'))}</strong> {(t.addedTranslations_2026?.['الجدول الأساسي'] || (t.addedTranslations_2026?.['الجدول الأساسي'] || 'الجدول الأساسي'))}
                  <code className="bg-amber-500/15 px-2 py-0.5 mx-1 rounded">{schemaNotice.missing_relation}</code>
                  {(t.addedTranslations_2026?.['غير موجود، فتأكد من DATABASE_URL/POSTGRES_URL أو شغّل السكريبتات الأساسية قبل'] || (t.addedTranslations_2026?.['غير موجود، فتأكد من DATABASE_URL/POSTGRES_URL أو شغّل السكريبتات الأساسية قبل'] || 'غير موجود، فتأكد من DATABASE_URL/POSTGRES_URL أو شغّل السكريبتات الأساسية قبل'))}
                  <code className="bg-amber-500/15 px-2 py-0.5 mx-1 rounded">scripts/022-memorization-paths.sql</code>
                </>
              ) : (
                <>
                  <strong>{(t.addedTranslations_2026?.['الميجريشن لسه ما اتشغّلش.'] || (t.addedTranslations_2026?.['الميجريشن لسه ما اتشغّلش.'] || 'الميجريشن لسه ما اتشغّلش.'))}</strong> {(t.addedTranslations_2026?.['راسل الإدارة لتشغيل'] || (t.addedTranslations_2026?.['راسل الإدارة لتشغيل'] || 'راسل الإدارة لتشغيل'))}
                  <code className="bg-amber-500/15 px-2 py-0.5 mx-1 rounded">scripts/022-memorization-paths.sql</code>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <PageLoadingSkeleton />
      ) : paths.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-4">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">{t.reader.memorizationPaths.noPathsYet}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-md mx-auto">
            {t.reader.memorizationPaths.noPathsYetDesc}
          </p>
          <Button onClick={() => setOpenCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t.reader.memorizationPaths.createNewPathBtn}
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t.reader.memorizationPaths.totalPaths, value: paths.length, icon: Layers, tone: "text-primary bg-primary/10" },
              { label: t.reader.memorizationPaths.published, value: paths.filter(p => p.is_published).length, icon: Eye, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
              { label: t.reader.memorizationPaths.totalEnrolled, value: paths.reduce((s, p) => s + (Number(p.stats?.enrolled) || 0), 0), icon: Users, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
              { label: t.reader.memorizationPaths.totalUnits, value: paths.reduce((s, p) => s + (Number(p.total_units) || 0), 0), icon: Hash, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
            ].map((s, i) => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-black leading-none">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">{s.label}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map(p => (
            <Card key={p.id} className="p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/reader/memorization-paths/${p.id}`}
                    className="font-semibold text-lg hover:text-primary line-clamp-2 transition-colors"
                  >
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline">{TYPE_LABELS[p.unit_type] || p.unit_type}</Badge>
                    <Badge variant="secondary">{p.total_units} {p.total_units === 1 ? t.reader.memorizationPaths.unitCountSingular : t.reader.memorizationPaths.unitsCount}</Badge>
                    {p.level && LEVEL_LABELS[p.level] && (
                      <Badge variant="outline" className="border-primary/30 text-primary">{LEVEL_LABELS[p.level]}</Badge>
                    )}
                    {p.is_published ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
                        <Eye className="h-3 w-3 me-1" /> {t.reader.memorizationPaths.publishedLabel}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 me-1" /> {t.reader.memorizationPaths.draftLabel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="border rounded-xl p-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" /> {t.reader.memorizationPaths.enrolledLabel}
                  </div>
                  <div className="text-lg font-semibold">{p.stats?.enrolled || "0"}</div>
                </div>
                <div className="border rounded-xl p-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t.reader.memorizationPaths.passedLabel}
                  </div>
                  <div className="text-lg font-semibold">{p.stats?.completed || "0"}</div>
                </div>
                <div className="border rounded-xl p-2">
                  <div className="text-xs text-muted-foreground">{t.reader.memorizationPaths.avgProgress}</div>
                  <div className="text-lg font-semibold">{p.stats?.avg_progress || "0"}%</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/reader/memorization-paths/${p.id}`}>
                    {t.reader.memorizationPaths.manageBtn} <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button
                  variant={p.is_published ? "secondary" : "default"} size="sm"
                  onClick={() => togglePublish(p)}
                >
                  {p.is_published ? t.reader.memorizationPaths.hideBtn : t.reader.memorizationPaths.publishBtn}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(p)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          </div>
        </>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.reader.memorizationPaths.dialogTitle}</DialogTitle>
            <DialogDescription>
              {t.reader.memorizationPaths.dialogDesc}
            </DialogDescription>
          </DialogHeader>

          {/* Quick presets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {t.reader.memorizationPaths.quickPresets}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map(p => {
                const active =
                  form.unit_type === p.unit_type &&
                  form.range_from === String(p.range_from) &&
                  form.range_to === String(p.range_to) &&
                  form.direction === p.direction
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`text-start rounded-2xl border p-3 transition-all ${
                      active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center justify-between gap-2">
                      {isAr ? p.labelAr : p.labelEn}
                      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{isAr ? p.descriptionAr : p.descriptionEn}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label>{t.reader.memorizationPaths.pathTitleLabel}</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={t.reader.memorizationPaths.pathTitlePlaceholder}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>{t.reader.memorizationPaths.pathDescLabel}</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder={t.reader.memorizationPaths.pathDescPlaceholder}
              />
            </div>

            <div className="space-y-1">
              <Label>{t.reader.memorizationPaths.divisionTypeLabel}</Label>
              <Select
                value={form.unit_type}
                onValueChange={v => {
                  const m = RANGE_MAX[v] || 1
                  setForm({ ...form, unit_type: v, range_from: "1", range_to: String(m) })
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="surah">{t.reader.memorizationPaths.divSurah}</SelectItem>
                  <SelectItem value="juz">{t.reader.memorizationPaths.divJuz}</SelectItem>
                  <SelectItem value="hizb">{t.reader.memorizationPaths.divHizb}</SelectItem>
                  <SelectItem value="page">{t.reader.memorizationPaths.divPage}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" /> {t.reader.memorizationPaths.memorizationOrder}
              </Label>
              <Select
                value={form.direction}
                onValueChange={v => setForm({ ...form, direction: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t.reader.memorizationPaths.naturalOrder.replace("{unit}", unitWord).replace("{from}", form.range_from)}</SelectItem>
                  <SelectItem value="asc">{t.reader.memorizationPaths.reverseOrder.replace("{unit}", unitWord).replace("{to}", form.range_to)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{t.reader.memorizationPaths.fromUnitLabel.replace("{unit}", unitWord)}</Label>
              <Input
                type="number" min="1" max={max}
                value={form.range_from}
                onChange={e => setForm({ ...form, range_from: e.target.value })}
                className={!rangeValid && form.range_from ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-1">
              <Label>{t.reader.memorizationPaths.toUnitLabel.replace("{unit}", unitWord)}</Label>
              <Input
                type="number" min="1" max={max}
                value={form.range_to}
                onChange={e => setForm({ ...form, range_to: e.target.value })}
                className={!rangeValid && form.range_to ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-1">
              <Label>{t.reader.memorizationPaths.levelLabel}</Label>
              <Select
                value={form.level}
                onValueChange={v => setForm({ ...form, level: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t.reader.memorizationPaths.levelBeginner}</SelectItem>
                  <SelectItem value="intermediate">{t.reader.memorizationPaths.levelIntermediate}</SelectItem>
                  <SelectItem value="advanced">{t.reader.memorizationPaths.levelAdvanced}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{t.reader.memorizationPaths.expectedDurationLabel}</Label>
              <Input
                type="number" min="1"
                value={form.estimated_days}
                onChange={e => setForm({ ...form, estimated_days: e.target.value })}
                placeholder={t.reader.memorizationPaths.optionalPlaceholder}
              />
            </div>

            {/* Live preview / validation */}
            <div className="md:col-span-2">
              {rangeValid ? (
                <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Layers className="h-5 w-5" />
                  </div>
                  <p className="text-sm">
                    {t.reader.memorizationPaths.willGenerateNote
                      .replace("{count}", String(unitCount))
                      .replace("{unit}", unitCount === 1 ? unitWord : ((t.addedTranslations_2026?.['${unitWord}اً'] || (t.addedTranslations_2026?.['${unitWord}اً'] || '${unitWord}اً'))))
                      .replace("{type}", TYPE_LABELS[form.unit_type])}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">
                    {t.reader.memorizationPaths.invalidRangeError
                      .replace("{max}", String(max))
                      .replace("{type}", TYPE_LABELS[form.unit_type])}
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex items-center gap-2 rounded-xl border p-3">
              <input
                id="r_require_audio" type="checkbox" className="h-4 w-4 accent-primary"
                checked={form.require_audio}
                onChange={e => setForm({ ...form, require_audio: e.target.checked })}
              />
              <Label htmlFor="r_require_audio" className="cursor-pointer flex items-center gap-1.5">
                <Mic className="h-4 w-4 text-muted-foreground" />
                {t.reader.memorizationPaths.requiresAudioNote}
              </Label>
            </div>

            <div className="md:col-span-2 flex items-center gap-2 rounded-xl border p-3">
              <input
                id="r_is_published" type="checkbox" className="h-4 w-4 accent-primary"
                checked={form.is_published}
                onChange={e => setForm({ ...form, is_published: e.target.checked })}
              />
              <Label htmlFor="r_is_published" className="cursor-pointer flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {t.reader.memorizationPaths.publishImmediatelyNote}
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>{t.reader.memorizationPaths.cancelBtn}</Button>
            <Button onClick={submit} disabled={creating || !canSubmit} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {rangeValid && unitCount > 0 
                ? t.reader.memorizationPaths.createPathBtnWithCount.replace("{count}", String(unitCount)).replace("{unit}", unitCount === 1 ? unitWord : ((t.addedTranslations_2026?.['${unitWord}اً'] || (t.addedTranslations_2026?.['${unitWord}اً'] || '${unitWord}اً'))))
                : t.reader.memorizationPaths.createPathBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
