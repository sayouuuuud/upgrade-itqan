'use client'

import { Layers, Plus, Trash2, Trophy, ArrowDown } from 'lucide-react'

export interface StageRow {
  name: string
  advance_count: number
  min_verses: number
  description: string
}

/** A sensible default new round. */
function newStage(index: number): StageRow {
  const names = ['الدور التمهيدي', 'الدور الثاني', 'الدور الثالث', 'الدور الرابع']
  return { name: names[index] || `الدور ${index + 1}`, advance_count: 10, min_verses: 0, description: '' }
}

/**
 * Controlled multi-stage builder used inside the create-competition modal.
 *
 * - `value` is the ordered list of stages. An empty list (or a single entry)
 *   means a classic single-round competition.
 * - The LAST stage is always the final (its winners are crowned), so it never
 *   shows an "advance count" — only earlier rounds do.
 */
export function StageBuilder({
  value,
  onChange,
  accent = 'amber',
}: {
  value: StageRow[]
  onChange: (stages: StageRow[]) => void
  accent?: 'amber' | 'emerald'
}) {
  const enabled = value.length >= 2
  const accentText = accent === 'emerald' ? 'text-emerald-700' : 'text-amber-700'
  const accentRing = accent === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-amber-500'
  const accentBtn = accent === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
  const accentBox = accent === 'emerald' ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'

  const enable = () => onChange([newStage(0), { ...newStage(1), name: 'النهائي', advance_count: 0 }])
  const disable = () => onChange([])

  const update = (i: number, patch: Partial<StageRow>) => {
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  const addStage = () => {
    // Insert a new round just before the final one so the last stays the final.
    const head = value.slice(0, -1)
    const final = value[value.length - 1]
    onChange([...head, newStage(head.length), final])
  }
  const removeStage = (i: number) => {
    if (value.length <= 2) { onChange([]); return } // back to single round
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className={`space-y-3 rounded-2xl border p-4 ${accentBox}`}>
      <label className="flex items-center gap-3 text-sm font-bold">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => (e.target.checked ? enable() : disable())}
          className={`h-4 w-4 ${accent === 'emerald' ? 'accent-emerald-600' : 'accent-amber-600'}`}
        />
        <Layers className={`h-4 w-4 ${accentText}`} />
        مسابقة متعددة المراحل (أدوار إقصائية)
      </label>
      <p className={`text-xs leading-relaxed ${accentText}`}>
        فعّل هذا الخيار لتقسيم المسابقة إلى أدوار: في كل دور يتأهّل أصحاب أعلى الدرجات إلى الدور التالي، حتى الدور النهائي
        الذي يُتوّج فيه الفائزون. اترك الخيار مغلقاً لمسابقة من دور واحد.
      </p>

      {enabled && (
        <div className="space-y-3">
          {value.map((stage, i) => {
            const isFinal = i === value.length - 1
            return (
              <div key={i} className="rounded-xl border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black">
                    {isFinal ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs text-yellow-800">
                        <Trophy className="h-3.5 w-3.5" /> النهائي
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                        المرحلة {i + 1}
                      </span>
                    )}
                  </div>
                  {!isFinal && value.length > 2 && (
                    <button type="button" onClick={() => removeStage(i)} className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-xs font-bold">
                    <span>اسم المرحلة</span>
                    <input
                      value={stage.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="مثال: الدور التمهيدي"
                      className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 ${accentRing}`}
                    />
                  </label>
                  {!isFinal && (
                    <label className="block space-y-1 text-xs font-bold">
                      <span>عدد المتأهّلين للدور التالي</span>
                      <input
                        type="number"
                        min={1}
                        value={stage.advance_count || ''}
                        onChange={(e) => update(i, { advance_count: Number(e.target.value) })}
                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 ${accentRing}`}
                      />
                    </label>
                  )}
                  <label className="block space-y-1 text-xs font-bold">
                    <span>الحد الأدنى للآيات (اختياري)</span>
                    <input
                      type="number"
                      min={0}
                      value={stage.min_verses || ''}
                      onChange={(e) => update(i, { min_verses: Number(e.target.value) })}
                      className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 ${accentRing}`}
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-bold sm:col-span-2">
                    <span>وصف / مهمة المرحلة (اختياري)</span>
                    <input
                      value={stage.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="ما المطلوب في هذه المرحلة؟"
                      className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 ${accentRing}`}
                    />
                  </label>
                </div>
                {!isFinal && (
                  <div className="mt-2 flex justify-center text-muted-foreground">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })}
          <button
            type="button"
            onClick={addStage}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition ${accentBtn}`}
          >
            <Plus className="h-4 w-4" /> إضافة مرحلة
          </button>
        </div>
      )}
    </div>
  )
}
