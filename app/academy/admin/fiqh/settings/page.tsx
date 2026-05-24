'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Edit2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  CheckCircle2,
  EyeOff,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  slug: string
  name_ar: string
  name_en: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  open_count: number
  published_count: number
}

const emptyForm = {
  slug: '',
  name_ar: '',
  name_en: '',
  description: '',
  sort_order: 100,
  is_active: true,
}

type FormState = typeof emptyForm

export default function AdminFiqhSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/academy/admin/fiqh/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm, sort_order: nextSortOrder(categories) })
    setError('')
    setShowModal(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({
      slug: c.slug,
      name_ar: c.name_ar,
      name_en: c.name_en || '',
      description: c.description || '',
      sort_order: c.sort_order,
      is_active: c.is_active,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name_ar.trim()) {
      setError('الاسم العربي مطلوب')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editing
        ? `/api/academy/admin/fiqh/categories/${editing.id}`
        : '/api/academy/admin/fiqh/categories'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error || 'تعذّر الحفظ')
        return
      }
      setShowModal(false)
      await load()
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c: Category) {
    await fetch(`/api/academy/admin/fiqh/categories/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    await load()
  }

  async function remove(c: Category) {
    const inUse = c.open_count + c.published_count > 0
    const msg = inUse
      ? `هذا التصنيف مرتبط بـ ${c.open_count + c.published_count} سؤال. سيتم إخفاؤه بدلاً من حذفه. هل تريد المتابعة؟`
      : 'سيتم حذف التصنيف نهائياً. هل أنت متأكد؟'
    if (!confirm(msg)) return
    await fetch(`/api/academy/admin/fiqh/categories/${c.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link
            href="/academy/admin/fiqh"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowRight className="w-3 h-3" />
            العودة لصندوق الأسئلة الفقهية
          </Link>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            إعدادات الأسئلة الفقهية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة تصنيفات الأسئلة الفقهية المعروضة في المكتبة وعند طرح سؤال جديد.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          تصنيف جديد
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-base">لم يتم إنشاء أي تصنيفات بعد</h3>
          <p className="text-sm text-muted-foreground mt-1">
            ابدأ بإنشاء تصنيف لتنظيم الأسئلة الفقهية.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            تصنيف جديد
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th className="text-start font-bold px-4 py-3">الاسم</th>
                <th className="text-start font-bold px-4 py-3">الرمز</th>
                <th className="text-start font-bold px-4 py-3">ترتيب</th>
                <th className="text-start font-bold px-4 py-3">أسئلة نشطة</th>
                <th className="text-start font-bold px-4 py-3">منشورة</th>
                <th className="text-start font-bold px-4 py-3">الحالة</th>
                <th className="text-end font-bold px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((c) => (
                <tr key={c.id} className={cn(!c.is_active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{c.name_ar}</div>
                    {c.name_en && (
                      <div className="text-xs text-muted-foreground">{c.name_en}</div>
                    )}
                    {c.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.sort_order}</td>
                  <td className="px-4 py-3">{c.open_count}</td>
                  <td className="px-4 py-3">{c.published_count}</td>
                  <td className="px-4 py-3">
                    {c.is_active ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> نشط
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold inline-flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> مخفي
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(c)}
                        title={c.is_active ? 'إخفاء' : 'إظهار'}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        {c.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        title="تعديل"
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        title="حذف"
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-black text-lg">
                {editing ? 'تعديل التصنيف' : 'تصنيف جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Field
                label="الاسم بالعربية"
                required
                value={form.name_ar}
                onChange={(v) => setForm({ ...form, name_ar: v })}
              />
              <Field
                label="الاسم بالإنجليزية"
                value={form.name_en}
                onChange={(v) => setForm({ ...form, name_en: v })}
              />
              <Field
                label="الرمز (slug)"
                placeholder="مثال: salah أو jumua"
                hint="اختياري — يُنشأ تلقائياً من الاسم"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
              />
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  وصف مختصر
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">ترتيب العرض</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: parseInt(e.target.value || '0', 10) })
                    }
                    className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">الحالة</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl text-sm font-bold border transition-colors',
                      form.is_active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    )}
                  >
                    {form.is_active ? 'نشط' : 'مخفي'}
                  </button>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-muted/80"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function nextSortOrder(items: Category[]): number {
  if (!items.length) return 100
  const max = items.reduce((a, b) => (b.sort_order > a ? b.sort_order : a), 0)
  return max + 10
}
