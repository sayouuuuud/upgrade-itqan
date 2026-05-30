'use client'

import { Trash2, Plus, GripVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

/* ============================================================================
   Reusable field editors for the homepage CMS.
   All values are bilingual { ar, en } objects (or plain strings/numbers).
   ============================================================================ */

type Bi = { ar?: string; en?: string }

export function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
      <div className="border-b border-border pb-3">
        <h2 className="font-semibold text-foreground text-lg">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

/** Bilingual single-line text field. */
export function BiField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Bi | undefined
  onChange: (v: Bi) => void
}) {
  const v = value || {}
  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">العربية</span>
          <Input dir="rtl" value={v.ar || ''} onChange={e => onChange({ ...v, ar: e.target.value })} className="bg-muted/30 border-border text-foreground" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">English</span>
          <Input dir="ltr" value={v.en || ''} onChange={e => onChange({ ...v, en: e.target.value })} className="bg-muted/30 border-border text-foreground" />
        </div>
      </div>
    </div>
  )
}

/** Bilingual multi-line text field. */
export function BiArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: Bi | undefined
  onChange: (v: Bi) => void
  rows?: number
}) {
  const v = value || {}
  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">العربية</span>
          <Textarea dir="rtl" rows={rows} value={v.ar || ''} onChange={e => onChange({ ...v, ar: e.target.value })} className="bg-muted/30 border-border text-foreground resize-none" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">English</span>
          <Textarea dir="ltr" rows={rows} value={v.en || ''} onChange={e => onChange({ ...v, en: e.target.value })} className="bg-muted/30 border-border text-foreground resize-none" />
        </div>
      </div>
    </div>
  )
}

/** Plain single-line string field (links, numbers, etc.). */
export function PlainField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string | number | undefined
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      <Input dir="ltr" type={type} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="bg-muted/30 border-border text-foreground font-mono text-sm" />
    </div>
  )
}

/** Color picker + hex field. */
export function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string
  value: string | undefined
  fallback: string
  onChange: (v: string) => void
}) {
  const v = value || fallback
  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        <input type="color" value={v} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent flex-shrink-0" />
        <Input value={v} onChange={e => onChange(e.target.value)} className="flex-1 font-mono text-sm bg-muted/30 border-border text-foreground" />
      </div>
    </div>
  )
}

/**
 * Generic repeater for arrays of objects. Renders each item with a delete
 * button and an "add" button at the bottom. `renderItem` returns the editor
 * fields for one item.
 */
export function Repeater<T>({
  label,
  items,
  onChange,
  newItem,
  renderItem,
  itemLabel,
}: {
  label: string
  items: T[]
  onChange: (items: T[]) => void
  newItem: () => T
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode
  itemLabel?: (index: number) => string
}) {
  const list = Array.isArray(items) ? items : []

  const update = (i: number, patch: Partial<T>) => {
    const next = [...list]
    next[i] = { ...(next[i] as any), ...patch }
    onChange(next)
  }
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground">{list.length}</span>
      </div>
      <div className="space-y-4">
        {list.map((item, i) => (
          <div key={i} className="relative rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <GripVertical className="w-3.5 h-3.5" />
                {itemLabel ? itemLabel(i) : `#${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-30">↓</button>
                <button type="button" onClick={() => remove(i)} className="text-destructive hover:bg-destructive/10 rounded p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {renderItem(item, patch => update(i, patch), i)}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={() => onChange([...list, newItem()])} className="gap-2 w-full border-dashed">
        <Plus className="w-4 h-4" />
        {label}
      </Button>
    </div>
  )
}
