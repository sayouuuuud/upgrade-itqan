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
  const { locale, t } = useI18n()
  const te = (t as any).templateEditor as Record<string, string> | undefined
  const base = apiBase || `/api/${scopePath}/admin/certificates`
  const isAr = locale === "ar"
  const lbl = (f: FieldDef) => (isAr ? f.label_ar : f.label_en)

  const [positions, setPositions] = useState<Record<string, FieldAnchor>>({})
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef<{ key: string; dx: number; dy: number } | null>(null)

  // Track canvas size so we can render field sample text at the correct
  // pixel size (font_size is stored as % of the canvas short side, mirroring
  // the render engine).
  useEffect(() => {
    const node = canvasRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setCanvasSize({ w: width, h: height })
        }
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [open])

  const minSide = Math.min(canvasSize.w || 1, canvasSize.h || 1)

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
        toast({ title: te?.savedTitle ?? 'Template saved' })
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
        const e = await r1.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: te?.savePositionsFail ?? 'Failed to save positions',
          description: e.error || r1.statusText,
        })
        return
      }
      const r2 = await fetch(
        `${base}/templates/${template.id}/preview?format=png&t=${Date.now()}`,
      )
      if (!r2.ok) {
        // Preview endpoint returns JSON on failure, image on success.
        const ct = r2.headers.get("content-type") || ""
        const detail = ct.includes("json")
          ? ((await r2.json().catch(() => ({}))).error as string | undefined)
          : await r2.text().catch(() => "")
        toast({
          variant: "destructive",
          title: te?.previewFail ?? 'Failed to generate preview',
          description: detail || r2.statusText,
        })
        return
      }
      const blob = await r2.blob()
      setPreviewSrc(URL.createObjectURL(blob))
    } catch (err) {
      toast({
        variant: "destructive",
          title: te?.previewError ?? 'Preview error',
        description: err instanceof Error ? err.message : String(err),
      })
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
        className="!max-w-[95vw] !w-[95vw] h-[92vh] flex flex-col"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-primary" />
            {te?.editorTitle ?? 'Field Position Editor'}
            <Badge variant="secondary">{template.name}</Badge>
          </DialogTitle>
          <DialogDescription>
            {te?.editorDesc ?? 'Select a field from the list then drag it to its position on the template. Press preview to see the result.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden">
          {/* Toolbox */}
          <aside className="md:w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide opacity-70">
                {te?.addField ?? 'Add Field'}
              </Label>
              <Select onValueChange={(v) => addField(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={te?.selectField ?? 'Select field…'} />
                </SelectTrigger>
                <SelectContent>
                  {unplaced.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {lbl(f)}
                    </SelectItem>
                  ))}
                  {unplaced.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {te?.allFieldsAdded ?? 'All fields added'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 rounded-lg border bg-card p-3">
              <Label className="text-xs uppercase tracking-wide opacity-70">
                {te?.placedFields ?? 'Placed Fields'}
              </Label>
              <div className="mt-2 space-y-1">
                {placedKeys.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {te?.noFieldsYet ?? 'No fields yet'}
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
                  {te?.properties ?? 'Properties:'}{' '}
                  <span className="text-primary">{lbl(activeDef)}</span>
                </p>

                <div className="space-y-1">
                  <Label className="text-xs">
                    {IMAGE_FIELDS.has(activeDef.key)
                      ? (te?.imageSize ?? 'Image size (% of width)')
                      : (te?.fontSize ?? 'Font size (% of shorter side)')}{" "}
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
                        <Label className="text-xs">{te?.align ?? 'Align'}</Label>
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
                            <SelectItem value="left">{te?.alignLeft ?? 'Left'}</SelectItem>
                            <SelectItem value="center">{te?.alignCenter ?? 'Center'}</SelectItem>
                            <SelectItem value="right">{te?.alignRight ?? 'Right'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{te?.weight ?? 'Weight'}</Label>
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
                            <SelectItem value="normal">{te?.weightNormal ?? 'Normal'}</SelectItem>
                            <SelectItem value="bold">{te?.weightBold ?? 'Bold'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{te?.color ?? 'Color'}</Label>
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
                        {te?.maxWidth ?? 'Max width (%)'} —{" "}
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
                    {te?.rotation ?? 'Rotation (deg)'} —{" "}
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
                  ? (te?.fieldsPlacedAr ?? `${placedKeys.length} fields placed · drag any pin to move`).replace('{n}', String(placedKeys.length))
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
                  {te?.preview ?? 'Preview'}
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {te?.save ?? 'Save'}
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
                {/* Live field renders — mirrors the actual render engine so
                    every property change (font size / weight / color /
                    align / rotation / max_width) is visible in real time. */}
                {placedKeys.map((k) => {
                  const def = ALL_FIELDS.find((f) => f.key === k)!
                  const pos = positions[k]
                  const isActive = activeKey === k
                  const isImg = IMAGE_FIELDS.has(def.key)
                  const align = pos.align || def.default_align || "center"
                  const translate =
                    align === "center"
                      ? "-translate-x-1/2 -translate-y-1/2"
                      : align === "left"
                        ? "translate-x-0 -translate-y-1/2"
                        : "-translate-x-full -translate-y-1/2"
                  const sizePct = pos.font_size ?? def.default_size ?? 4
                  const fontPx = (minSide * sizePct) / 100
                  const imgWidthPx = (canvasSize.w * sizePct) / 100
                  const color = pos.color || def.default_color || "#0f172a"
                  const weight = (pos.weight || def.default_weight) === "bold" ? 800 : 400
                  const maxWidth = pos.max_width ?? def.default_max_width
                  const rotate = pos.rotate ? ` rotate(${pos.rotate}deg)` : ""
                  const placement: React.CSSProperties = {
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: rotate ? rotate.trim() : undefined,
                  }
                  return (
                    <div
                      key={k}
                      onPointerDown={(e) => startDrag(e, k)}
                      className={cn(
                        "absolute z-10 cursor-grab active:cursor-grabbing select-none",
                        translate,
                        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-white rounded-sm",
                      )}
                      style={placement}
                      title={lbl(def)}
                    >
                      {isImg ? (
                        <div
                          style={{
                            width: `${imgWidthPx}px`,
                            maxWidth: "90%",
                            opacity: def.key === "watermark" ? 0.18 : 1,
                          }}
                          className="pointer-events-none"
                        >
                          {/* Placeholder box for image-type fields. The real
                              asset (logo / signature / watermark) shows up in
                              the server preview; in the editor we keep a
                              labelled box so the admin can position it. */}
                          <div
                            className="flex items-center justify-center rounded-md border-2 border-dashed border-primary/50 bg-primary/5 text-primary text-[10px] font-bold"
                            style={{ height: `${imgWidthPx * 0.6}px` }}
                          >
                            {lbl(def)}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: `${fontPx}px`,
                            fontWeight: weight,
                            color,
                            textAlign: align,
                            maxWidth: maxWidth ? `${maxWidth * canvasSize.w}px` : undefined,
                            letterSpacing: pos.letter_spacing
                              ? `${pos.letter_spacing}px`
                              : undefined,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontFamily:
                              template.language === "en"
                                ? "'Inter', 'Cairo', sans-serif"
                                : "'Cairo', 'Amiri', sans-serif",
                          }}
                          className="pointer-events-none"
                        >
                          {def.sample}
                        </div>
                      )}
                      {isActive && (
                        <span
                          className="absolute -top-2 -start-2 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow"
                          style={{ pointerEvents: "none" }}
                        >
                          <GripVertical className="w-2.5 h-2.5" />
                          {lbl(def)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {previewSrc && (
              <div className="border-t bg-background/60 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-medium">
                  {"آخر معاينة"}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <a href={previewSrc} target="_blank" rel="noreferrer">
                      <Eye className="w-3 h-3" />
                      {"افتح في تبويب"}
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
