"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Edit2, Trash2, Save, X, Loader2, Search, FolderTree,
  ChevronDown, ChevronRight, BookOpen, Video, Lightbulb, Tag,
  AlertTriangle, Eye, EyeOff
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string | null
  description: string | null
  short_description: string | null
  color: string | null
  icon: string | null
  icon_url: string | null
  parent_id: string | null
  parent_name: string | null
  display_order: number
  is_active: boolean
  courses_count: number
  lessons_count: number
  public_lessons_count: number
}

interface FormState {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  parent_id: string
  color: string
  icon: string
  display_order: number
  is_active: boolean
}

const emptyForm: FormState = {
  name: '', slug: '', description: '', short_description: '',
  parent_id: '', color: '#1E3A5F', icon: '', display_order: 0, is_active: true,
}

const PRESET_COLORS = ['#1E3A5F', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#65A30D', '#9333EA', '#475569']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/academy/admin/categories')
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data || [])
        if (json.warning === 'migration_pending') {
          setWarning('لم يتم تشغيل ترحيلة (029) بعد. يتم عرض التصنيفات بدون إحصاءات الاستخدام.')
        } else {
          setWarning(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCats()
  }, [])

  const openCreate = (parentId?: string) => {
    setForm({ ...emptyForm, parent_id: parentId || '' })
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setForm({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || '',
      description: cat.description || '',
      short_description: cat.short_description || '',
      parent_id: cat.parent_id || '',
      color: cat.color || '#1E3A5F',
      icon: cat.icon || '',
      display_order: cat.display_order || 0,
      is_active: cat.is_active,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload: Record<string, any> = { ...form, parent_id: form.parent_id || null }
      const url = form.id ? `/api/academy/admin/categories/${form.id}` : '/api/academy/admin/categories'
      const method = form.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await fetchCats()
        setShowForm(false)
        setForm(emptyForm)
      } else {
        const json = await res.json().catch(() => ({}))
        alert(json?.error || json?.message || 'فشل الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`حذف التصنيف "${cat.name}"؟`)) return
    setDeletingId(cat.id)
    try {
      let res = await fetch(`/api/academy/admin/categories/${cat.id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}))
        const proceed = confirm(json?.message || 'هذا التصنيف مستخدم. هل تريد المتابعة؟')
        if (!proceed) return
        res = await fetch(`/api/academy/admin/categories/${cat.id}?force=1`, { method: 'DELETE' })
      }
      if (res.ok) {
        await fetchCats()
      } else {
        const json = await res.json().catch(() => ({}))
        alert(json?.error || json?.message || 'فشل الحذف')
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Build hierarchical tree from flat list.
  const tree = useMemo(() => {
    const map = new Map<string, Category & { children: Category[] }>()
    categories.forEach(c => map.set(c.id, { ...c, children: [] as any }))
    const roots: (Category & { children: Category[] })[] = []
    map.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children.push(c)
      } else {
        roots.push(c)
      }
    })
    return roots
  }, [categories])

  const matchesSearch = (c: Category): boolean => {
    if (!search.trim() && showInactive) return true
    if (!showInactive && !c.is_active) return false
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)) ?? false
  }

  const filteredTree = useMemo(() => {
    // If a search term is set, flatten + filter all rows; otherwise show full hierarchy.
    if (!search.trim() && showInactive) return tree
    const flat: Category[] = []
    const walk = (nodes: (Category & { children: Category[] })[]) => {
      for (const n of nodes) {
        if (matchesSearch(n)) flat.push(n)
        walk(n.children as any)
      }
    }
    walk(tree as any)
    return flat.map(c => ({ ...c, children: [] as any }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, search, showInactive])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Totals across academy
  const totals = useMemo(() => {
    return categories.reduce((acc, c) => {
      acc.categories += 1
      acc.courses += Number(c.courses_count || 0)
      acc.lessons += Number(c.lessons_count || 0)
      acc.public_lessons += Number(c.public_lessons_count || 0)
      return acc
    }, { categories: 0, courses: 0, lessons: 0, public_lessons: 0 })
  }, [categories])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-blue-600" />
            تصنيفات الأكاديمية
          </h1>
          <p className="text-muted-foreground mt-1">
            نظّم محتوى الأكاديمية بالكامل (الدورات، الدروس، الحلقات، الأسئلة) من خلال شجرة تصنيفات موحّدة.
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          تصنيف جديد
        </button>
      </div>

      {warning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={<Tag className="w-5 h-5" />} label="إجمالي التصنيفات" value={totals.categories} color="blue" />
        <StatTile icon={<BookOpen className="w-5 h-5" />} label="دورات مرتبطة" value={totals.courses} color="emerald" />
        <StatTile icon={<Lightbulb className="w-5 h-5" />} label="دروس داخل دورات" value={totals.lessons} color="amber" />
        <StatTile icon={<Video className="w-5 h-5" />} label="حلقات عامة" value={totals.public_lessons} color="purple" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الرابط، أو الوصف..."
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
          />
        </div>
        <button
          onClick={() => setShowInactive(s => !s)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${showInactive ? 'border-border bg-card' : 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'}`}
        >
          {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showInactive ? 'إظهار كل التصنيفات' : 'إخفاء التصنيفات المعطّلة'}
        </button>
      </div>

      {/* Tree */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد تصنيفات بعد. أنشئ تصنيفًا جديدًا للبدء.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(filteredTree as (Category & { children: Category[] })[]).map(root => (
              <CategoryNode
                key={root.id}
                node={root}
                depth={0}
                expanded={expanded}
                toggle={toggle}
                openEdit={openEdit}
                openCreate={openCreate}
                handleDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleSave}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold">{form.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="اسم التصنيف *">
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  />
                </Field>
                <Field label="الرابط (يُولّد تلقائياً إذا تركته فارغاً)">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value })}
                    placeholder="quran-sciences"
                    className="w-full p-2 border border-border rounded-lg bg-background ltr-input"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </Field>
              </div>

              <Field label="وصف مختصر (يظهر في البطاقات)">
                <input
                  type="text"
                  value={form.short_description}
                  onChange={e => setForm({ ...form, short_description: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </Field>

              <Field label="الوصف الكامل">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="التصنيف الأب">
                  <select
                    value={form.parent_id}
                    onChange={e => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  >
                    <option value="">— بدون (تصنيف رئيسي)</option>
                    {categories
                      .filter(c => c.id !== form.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.parent_name ? `${c.parent_name} / ${c.name}` : c.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="ترتيب العرض">
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="اللون">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color || '#1E3A5F'}
                      onChange={e => setForm({ ...form, color: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-border bg-background"
                    />
                    <input
                      type="text"
                      value={form.color || ''}
                      onChange={e => setForm({ ...form, color: e.target.value })}
                      placeholder="#1E3A5F"
                      className="flex-1 p-2 border border-border rounded-lg bg-background ltr-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: c, outline: form.color === c ? '2px solid black' : 'none' }}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="رمز / أيقونة (اختياري)">
                  <input
                    type="text"
                    value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    placeholder="book / video / scroll"
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                <span className="text-sm">تفعيل التصنيف</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 sticky bottom-0 bg-card">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {form.id ? 'حفظ التغييرات' : 'إنشاء التصنيف'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: 'blue' | 'emerald' | 'amber' | 'purple' }) {
  const colorMap = {
    blue:    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300',
    amber:   'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300',
    purple:  'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800/50 dark:text-purple-300',
  } as const
  return (
    <div className={`border rounded-xl p-4 flex items-center gap-3 ${colorMap[color]}`}>
      <div className="opacity-80">{icon}</div>
      <div>
        <p className="text-xs font-medium opacity-80">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold block mb-1">{label}</span>
      {children}
    </label>
  )
}

interface CategoryNodeProps {
  node: Category & { children: Category[] }
  depth: number
  expanded: Set<string>
  toggle: (id: string) => void
  openEdit: (cat: Category) => void
  openCreate: (parentId?: string) => void
  handleDelete: (cat: Category) => void
  deletingId: string | null
}

function CategoryNode({ node, depth, expanded, toggle, openEdit, openCreate, handleDelete, deletingId }: CategoryNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isExpanded = expanded.has(node.id) || depth === 0
  const totalUsage = Number(node.courses_count) + Number(node.public_lessons_count)

  return (
    <>
      <li className="px-4 py-3 hover:bg-muted/40 transition-colors">
        <div
          className="flex items-center gap-3"
          style={{ paddingInlineStart: `${depth * 24}px` }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(node.id)}
            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${hasChildren ? 'hover:bg-muted' : 'opacity-30 cursor-default'}`}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            ) : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
          </button>

          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: node.color || '#1E3A5F' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold ${node.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{node.name}</h3>
              {node.slug && <span className="text-xs text-muted-foreground font-mono">/{node.slug}</span>}
              {!node.is_active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">معطّل</span>
              )}
            </div>
            {node.short_description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{node.short_description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3" /> {node.courses_count} دورة</span>
              <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" /> {node.public_lessons_count} حلقة عامة</span>
              <span className="inline-flex items-center gap-1"><Lightbulb className="w-3 h-3" /> {node.lessons_count} درس</span>
              {totalUsage === 0 && <span className="text-amber-600 dark:text-amber-400">— غير مستخدم</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openCreate(node.id)}
              title="إضافة تصنيف فرعي"
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openEdit(node)}
              title="تعديل"
              className="p-2 rounded-lg hover:bg-muted"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(node)}
              disabled={deletingId === node.id}
              title="حذف"
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-50"
            >
              {deletingId === node.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </li>
      {hasChildren && isExpanded && (
        <>
          {node.children.map(child => (
            <CategoryNode
              key={child.id}
              node={child as any}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              openEdit={openEdit}
              openCreate={openCreate}
              handleDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </>
      )}
    </>
  )
}
