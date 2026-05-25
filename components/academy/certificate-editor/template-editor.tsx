"use client"

// Visual field-placement editor for certificate templates.
//
// Opens the template image in a draggable, ruler-aware canvas.  The admin
// can:
//   • Add a field marker (one click on the empty canvas after picking a key
//     from the toolbox)
//   • Drag a marker to its final location
//   • Adjust per-field options (size, weight, color, align, rotation, width)
//   • Preview the rendered certificate (PNG) at any time
//   • Save → POST `field_positions` to the template's PATCH endpoint

import { useEffect, useMemo, useRef, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  Loader2,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Eye,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  ALL_FIELDS,
  type FieldAnchor,
  type FieldDef,
} from "@/lib/certificate/fields"

interface TemplateEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: {
    id: string
    name: string
    template_url: string
    field_positions: Record<string, FieldAnchor>
    language: "ar" | "en"
  } | null
  // Where to PATCH the positions / fetch previews. Either pass
  // `scopePath` (legacy) for the path `/api/${scopePath}/admin/...`
  // or pass an explicit `apiBase` (e.g. `/api/admin/certificates-center`).
  scopePath?: "academy" | "maqraa"
  apiBase?: string
  onSaved?: () => void
}

const IMAGE_FIELDS = new Set(["logo", "watermark", "signature"])

export function CertificateTemplateEditor({
  open,
  onOpenChange,
  template,
  scopePath = "academy",
  apiBase,
  onSaved,
}: TemplateEditorProps) {
  const { locale } = useI18n()
  const base = apiBase || `/api/${scopePath}/admin/certificates`
  const isAr = locale === "ar"
  const lbl = (f: FieldDef) => (isAr ? f.label_ar : f.label_en)

  const [positions, setPositions] = useState<Record<string, FieldAnchor>>({})
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef<{ key: string; dx: number; dy: number } | null>(null)

  // Reset state when opening a new template
  useEffect(() => {
    if (open && template) {
      setPositions({ ...(template.field_positions || {}) })
      setActiveKey(null)
      setPreviewSrc(null)
      setImgLoaded(false)
    }
  }, [open, template])

  const placedKeys = useMemo(() => Object.keys(positions), [positions])
  const unplaced = ALL_FIELDS.filter((f) => !positions[f.key])

  function addField(key: string) {
    const def = ALL_FIELDS.find((f) => f.key === key)
    if (!def) return
    setPositions((p) => ({
      ...p,
      [key]: {
        x: 0.5,
        y: 0.5,
        font_size: def.default_size,
        weight: def.default_weight,
        color: def.default_color,
        align: def.default_align,
        max_width: def.default_max_width,
      },
    }))
    setActiveKey(key)
  }

  function updateField(key: string, patch: Partial<FieldAnchor>) {
    setPositions((p) => ({ ...p, [key]: { ...p[key], ...patch } }))
  }

  function removeField(key: string) {
    setPositions((p) => {
      const c = { ...p }
      delete c[key]
      return c
    })
    if (activeKey === key) setActiveKey(null)
  }

  function startDrag(e: React.PointerEvent, key: string) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pos = positions[key]
    if (!pos) return
    const px = pos.x * rect.width
    const py = pos.y * rect.height
    draggingRef.current = {
      key,
      dx: e.clientX - rect.left - px,
      dy: e.clientY - rect.top - py,
    }
    setActiveKey(key)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = draggingRef.current
    const canvas = canvasRef.current
    if (!d || !canvas) return
    const rect = canvas.getBoundingClientRect()
    let nx = (e.clientX - rect.left - d.dx) / rect.width
    let ny = (e.clientY - rect.top - d.dy) / rect.height
    nx = Math.max(0, Math.min(1, nx))
    ny = Math.max(0, Math.min(1, ny))
    setPositions((p) => ({ ...p, [d.key]: { ...p[d.key], x: nx, y: ny } }))
  }

  function endDrag() {
    draggingRef.current = null
  }

  async function save() {
    if (!template) return
    setSaving(true)
    try {
      const res = await fetch(
        `${base}/templates/${template.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field_positions: positions }),
        },
      )
      if (res.ok) {
        toast({ title: isAr ? "تم حفظ القالب" : "Template saved" })
        onSaved?.()
        onOpenChange(false)
      } else {
        const e = await res.json().catch(() => ({}))
        toast({ variant: "destructive", title: e.error || "Save failed" })
      }
    } finally {
      setSaving(false)
    }
  }

  async function preview() {
    if (!template) return
    setPreviewing(true)
    setPreviewSrc(null)
    try {
      // We want to use the *unsaved* positions in the preview.  Pipe them
      // through a temporary save → preview flow:
      // First persist current positions, then GET the rendered PNG.
      const r1 = await fetch(
        `${base}/templates/${template.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field_positions: positions }),
        },
      )
      if (!r1.ok) {
        toast({ variant: "destructive", title: isAr ? "تعذر حفظ المواضع" : "Save failed" })
        return
      }
      const r2 = await fetch(
        `${base}/templates/${template.id}/preview?format=png&t=${Date.now()}`,
      )
      if (!r2.ok) {
        toast({ variant: "destructive", title: isAr ? "تعذر إنشاء المعاينة" : "Preview failed" })
        return
      }
      const blob = await r2.blob()
      setPreviewSrc(URL.createObjectURL(blob))
    } finally {
      setPreviewing(false)
    }
  }

  if (!template) return null

  const activeDef = activeKey ? ALL_FIELDS.find((f) => f.key === activeKey) : null
  const activePos = activeKey ? positions[activeKey] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[92vh] flex flex-col"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-primary" />
            {isAr ? "محرر مواضع الحقول" : "Field placement editor"}
            <Badge variant="secondary">{template.name}</Badge>
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? "اختر الحقل من القائمة ثم اسحبه إلى مكانه المناسب على التيمبلت. اضغط معاينة لرؤية النتيجة."
              : "Pick a field from the toolbox, then drag it into place on the template. Click preview to see the result."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden">
          {/* Toolbox */}
          <aside className="md:w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide opacity-70">
                {isAr ? "أضف حقل" : "Add field"}
              </Label>
              <Select onValueChange={(v) => addField(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر حقل…" : "Pick a field…"} />
                </SelectTrigger>
                <SelectContent>
                  {unplaced.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {lbl(f)}
                    </SelectItem>
                  ))}
                  {unplaced.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {isAr ? "كل الحقول مضافة" : "All fields placed"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 rounded-lg border bg-card p-3">
              <Label className="text-xs uppercase tracking-wide opacity-70">
                {isAr ? "الحقول الموضوعة" : "Placed fields"}
              </Label>
              <div className="mt-2 space-y-1">
                {placedKeys.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "لا توجد حقول بعد" : "No fields yet"}
                  </p>
                )}
                {placedKeys.map((k) => {
                  const f = ALL_FIELDS.find((x) => x.key === k)!
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveKey(k)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                        activeKey === k && "bg-primary/10 text-primary",
                      )}
                    >
                      <span>{lbl(f)}</span>
                      <Trash2
                        className="w-3.5 h-3.5 text-red-500 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeField(k)
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Per-field options */}
            {activeDef && activePos && (
              <div className="rounded-lg border bg-card p-3 space-y-3 text-sm">
                <p className="font-bold">
                  {isAr ? "خصائص: " : "Properties: "}
                  <span className="text-primary">{lbl(activeDef)}</span>
                </p>

                <div className="space-y-1">
                  <Label className="text-xs">
                    {IMAGE_FIELDS.has(activeDef.key)
                      ? isAr
                        ? "حجم الصورة (% من العرض)"
                        : "Image width (% of canvas)"
                      : isAr
                        ? "حجم الخط (% من أقصر ضلع)"
                        : "Font size (% of short side)"}{" "}
                    — {activePos.font_size?.toFixed(1) ?? "—"}
                  </Label>
                  <Slider
                    value={[activePos.font_size ?? activeDef.default_size ?? 4]}
                    min={1}
                    max={80}
                    step={0.1}
                    onValueChange={(v) =>
                      updateField(activeDef.key, { font_size: v[0] })
                    }
                  />
                </div>

                {!IMAGE_FIELDS.has(activeDef.key) && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{isAr ? "محاذاة" : "Align"}</Label>
                        <Select
                          value={activePos.align || activeDef.default_align || "center"}
                          onValueChange={(v) =>
                            updateField(activeDef.key, { align: v as FieldAnchor["align"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">{isAr ? "يسار" : "Left"}</SelectItem>
                            <SelectItem value="center">{isAr ? "وسط" : "Center"}</SelectItem>
                            <SelectItem value="right">{isAr ? "يمين" : "Right"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{isAr ? "السمك" : "Weight"}</Label>
                        <Select
                          value={activePos.weight || activeDef.default_weight || "normal"}
                          onValueChange={(v) =>
                            updateField(activeDef.key, { weight: v as FieldAnchor["weight"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">{isAr ? "عادي" : "Normal"}</SelectItem>
                            <SelectItem value="bold">{isAr ? "عريض" : "Bold"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{isAr ? "اللون" : "Color"}</Label>
                      <Input
                        type="color"
                        value={activePos.color || activeDef.default_color || "#000000"}
                        onChange={(e) =>
                          updateField(activeDef.key, { color: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">
                        {isAr ? "أقصى عرض (٪)" : "Max width (%)"} —{" "}
                        {Math.round((activePos.max_width ?? 0.7) * 100)}%
                      </Label>
                      <Slider
                        value={[(activePos.max_width ?? 0.7) * 100]}
                        min={5}
                        max={100}
                        step={1}
                        onValueChange={(v) =>
                          updateField(activeDef.key, { max_width: v[0] / 100 })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">
                    {isAr ? "دوران (درجة)" : "Rotation (°)"} —{" "}
                    {activePos.rotate || 0}°
                  </Label>
                  <Slider
                    value={[activePos.rotate || 0]}
                    min={-30}
                    max={30}
                    step={1}
                    onValueChange={(v) => updateField(activeDef.key, { rotate: v[0] })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    {isAr ? "X" : "X"}:{" "}
                    {(activePos.x * 100).toFixed(1)}%
                  </div>
                  <div>
                    {isAr ? "Y" : "Y"}:{" "}
                    {(activePos.y * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-background/60">
              <div className="text-xs text-muted-foreground">
                {isAr
                  ? `${placedKeys.length} حقل موضوع · اسحب أي علامة لتحريكها`
                  : `${placedKeys.length} fields placed · drag any pin to move`}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={preview}
                  disabled={previewing}
                >
                  {previewing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {isAr ? "معاينة" : "Preview"}
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isAr ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <div
                ref={canvasRef}
                className="relative bg-white shadow-xl select-none"
                style={{
                  aspectRatio: "1.4142 / 1",
                  width: "min(100%, 1100px)",
                }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.template_url}
                  alt={template.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onLoad={() => setImgLoaded(true)}
                />
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {/* Markers */}
                {placedKeys.map((k) => {
                  const def = ALL_FIELDS.find((f) => f.key === k)!
                  const pos = positions[k]
                  const isActive = activeKey === k
                  return (
                    <div
                      key={k}
                      onPointerDown={(e) => startDrag(e, k)}
                      className={cn(
                        "absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing",
                        "rounded-full px-3 py-1 text-xs font-bold border-2 shadow-md",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white/95 text-primary border-primary/50 hover:bg-primary/10",
                      )}
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                      }}
                    >
                      {lbl(def)}
                    </div>
                  )
                })}
              </div>
            </div>

            {previewSrc && (
              <div className="border-t bg-background/60 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-medium">
                  {isAr ? "آخر معاينة" : "Latest preview"}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <a href={previewSrc} target="_blank" rel="noreferrer">
                      <Eye className="w-3 h-3" />
                      {isAr ? "افتح في تبويب" : "Open in tab"}
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPreviewSrc(null)}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
            {previewSrc && (
              <div className="border-t p-3 bg-muted/40 max-h-64 overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="preview" className="mx-auto max-h-60 shadow" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
