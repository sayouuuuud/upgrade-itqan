'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  Filter,
  Loader2,
  Medal,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  status: string
  max_participants: number | null
  prizes_description: string | null
  rules?: string | null
  tajweed_rules?: string[] | null
  badge_key?: string | null
  points_multiplier?: number | string | null
  min_verses?: number | null
  is_featured?: boolean
  winner_name?: string | null
  entries_count?: number
  evaluated_count?: number
  average_score?: number
}

type CompetitionForm = {
  title: string
  description: string
  type: string
  start_date: string
  end_date: string
  max_participants: number
  prizes_description: string
  rules: string
  tajweed_rules: string
  badge_key: string
  points_multiplier: number
  min_verses: number
  is_featured: boolean
}

const TYPE_CONFIG: Record<string, { label: string; hint: string; badge: string; color: string; icon: typeof Trophy }> = {
  monthly: {
    label: 'مسابقة شهرية',
    hint: 'تلاوات خاصة يحكمها القراء مع شارة ونقاط مضاعفة للفائز',
    badge: 'star_of_halaqah',
    color: 'from-amber-500 to-orange-500',
    icon: Trophy,
  },
  ramadan: {
    label: 'مسابقة رمضان',
    hint: 'ترتيب الطلاب حسب عدد الآيات المحفوظة والمسجلة خلال الشهر',
    badge: 'ramadan_badge',
    color: 'from-emerald-500 to-teal-500',
    icon: Sparkles,
  },
  tajweed: {
    label: 'مسابقة التجويد',
    hint: 'تقييم تطبيق أحكام تجويد محددة من القراء',
    badge: 'tajweed_master',
    color: 'from-violet-500 to-purple-500',
    icon: ClipboardCheck,
  },
  memorization: {
    label: 'الحفظ',
    hint: 'قياس الحفظ والمراجعة بعدد الآيات',
    badge: 'hafiz_juz_amma',
    color: 'from-blue-500 to-cyan-500',
    icon: Target,
  },
  weekly: {
    label: 'أسبوعية',
    hint: 'تحدي سريع لمدة أسبوع',
    badge: 'star_of_halaqah',
    color: 'from-sky-500 to-blue-500',
    icon: Medal,
  },
  special: {
    label: 'خاصة',
    hint: 'مسابقة مخصصة حسب احتياج الإدارة',
    badge: 'star_of_halaqah',
    color: 'from-rose-500 to-pink-500',
    icon: Award,
  },
}

const STATUSES: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'قادمة', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  active: { label: 'نشطة', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  ended: { label: 'منتهية', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'ملغاة', className: 'bg-red-50 text-red-700 border-red-100' },
}

const emptyForm: CompetitionForm = {
  title: '',
  description: '',
  type: 'monthly',
  start_date: '',
  end_date: '',
  max_participants: 100,
  prizes_description: '',
  rules: '',
  tajweed_rules: '',
  badge_key: 'star_of_halaqah',
  points_multiplier: 2,
  min_verses: 0,
  is_featured: false,
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getProgress(comp: Competition) {
  if (!comp.max_participants) return 0
  return Math.min(100, Math.round(((comp.entries_count || 0) / comp.max_participants) * 100))
}

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Competition | null>(null)
  const [form, setForm] = useState<CompetitionForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchCompetitions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/academy/admin/competitions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCompetitions(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompetitions()
  }, [typeFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: competitions.length,
      active: competitions.filter((item) => item.status === 'active').length,
      entries: competitions.reduce((sum, item) => sum + (item.entries_count || 0), 0),
      evaluated: competitions.reduce((sum, item) => sum + (item.evaluated_count || 0), 0),
    }
  }, [competitions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return competitions
    return competitions.filter((item) =>
      [item.title, item.description, TYPE_CONFIG[item.type]?.label]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    )
  }, [competitions, search])

  const openAdd = (type = 'monthly') => {
    const config = TYPE_CONFIG[type]
    setEditItem(null)
    setForm({ ...emptyForm, type, badge_key: config.badge, points_multiplier: ['monthly', 'ramadan', 'tajweed'].includes(type) ? 2 : 1 })
    setShowModal(true)
  }

  const openEdit = (comp: Competition) => {
    const config = TYPE_CONFIG[comp.type] || TYPE_CONFIG.monthly
    setEditItem(comp)
    setForm({
      title: comp.title,
      description: comp.description || '',
      type: comp.type || 'monthly',
      start_date: comp.start_date ? comp.start_date.slice(0, 10) : '',
      end_date: comp.end_date ? comp.end_date.slice(0, 10) : '',
      max_participants: comp.max_participants || 100,
      prizes_description: comp.prizes_description || '',
      rules: comp.rules || '',
      tajweed_rules: Array.isArray(comp.tajweed_rules) ? comp.tajweed_rules.join(', ') : '',
      badge_key: comp.badge_key || config.badge,
      points_multiplier: Number(comp.points_multiplier || 2),
      min_verses: comp.min_verses || 0,
      is_featured: Boolean(comp.is_featured),
    })
    setShowModal(true)
  }

  const updateType = (type: string) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.monthly
    setForm({
      ...form,
      type,
      badge_key: config.badge,
      points_multiplier: ['monthly', 'ramadan', 'tajweed'].includes(type) ? 2 : 1,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.start_date || !form.end_date) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/competitions/${editItem.id}` : '/api/academy/admin/competitions'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tajweed_rules: form.tajweed_rules.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        setShowModal(false)
        fetchCompetitions()
      } else {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'حدث خطأ في الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المسابقة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/competitions/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCompetitions()
      else alert('لا يمكن الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#132f4c] via-[#165f46] to-[#d97706] p-8 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" /> منظومة المسابقات والتحفيز
            </div>
            <h1 className="text-3xl font-black lg:text-4xl">إدارة المسابقات باحترافية</h1>
            <p className="text-sm leading-7 text-white/80 lg:text-base">
              أنشئ مسابقات شهرية ورمضانية وتجويد، تابع المشاركات والتحكيم، وحدد الشارات والنقاط المضاعفة للفائزين من مكان واحد واضح.
            </p>
          </div>
          <button
            onClick={() => openAdd('monthly')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-[#165f46] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" /> مسابقة جديدة
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="كل المسابقات" value={stats.total} icon={Trophy} tone="amber" />
        <StatCard title="المسابقات النشطة" value={stats.active} icon={CheckCircle2} tone="emerald" />
        <StatCard title="إجمالي المشاركات" value={stats.entries} icon={Users} tone="blue" />
        <StatCard title="تم تحكيمها" value={stats.evaluated} icon={ClipboardCheck} tone="purple" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {Object.entries(TYPE_CONFIG).filter(([type]) => ['monthly', 'ramadan', 'tajweed'].includes(type)).map(([type, config]) => {
          const Icon = config.icon
          return (
            <button
              key={type}
              onClick={() => openAdd(type)}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-right shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`h-2 bg-gradient-to-l ${config.color}`} />
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className={`rounded-2xl bg-gradient-to-l ${config.color} p-3 text-white shadow-md`}><Icon className="h-6 w-6" /></div>
                  <Plus className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <div>
                  <h3 className="font-black">{config.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{config.hint}</p>
                </div>
              </div>
            </button>
          )
        })}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">قائمة المسابقات</h2>
            <p className="text-sm text-muted-foreground">فلترة وبحث سريع بدل القائمة المتزاحمة.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم المسابقة..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pe-9 ps-3 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 sm:w-64"
              />
            </div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500">
              <option value="all">كل الأنواع</option>
              {Object.entries(TYPE_CONFIG).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500">
              <option value="all">كل الحالات</option>
              {Object.entries(STATUSES).map(([status, item]) => <option key={status} value={status}>{item.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Filter className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="font-bold">لا توجد مسابقات مطابقة</p>
            <p className="mt-1 text-sm text-muted-foreground">جرّب تغيير الفلاتر أو أنشئ مسابقة جديدة.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((comp) => {
              const config = TYPE_CONFIG[comp.type] || TYPE_CONFIG.monthly
              const Icon = config.icon
              const status = STATUSES[comp.status] || STATUSES.upcoming
              const progress = getProgress(comp)
              return (
                <article key={comp.id} className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:shadow-md">
                  <div className={`h-1.5 bg-gradient-to-l ${config.color}`} />
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className={`shrink-0 rounded-2xl bg-gradient-to-l ${config.color} p-3 text-white shadow-sm`}><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black">{comp.title}</h3>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{comp.description || config.hint}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => openEdit(comp)} className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(comp.id)} disabled={deletingId === comp.id} className="rounded-xl p-2 text-red-500 transition hover:bg-red-50">
                          {deletingId === comp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <InfoPill icon={CalendarDays} label="المدة" value={`${formatDate(comp.start_date)} - ${formatDate(comp.end_date)}`} />
                      <InfoPill icon={Users} label="المشاركات" value={`${comp.entries_count || 0}/${comp.max_participants || '∞'}`} />
                      <InfoPill icon={Award} label="الجائزة" value={`×${comp.points_multiplier || 1} + ${comp.badge_key || config.badge}`} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>نسبة التسجيل</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full bg-gradient-to-l ${config.color}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-3 py-1">تم تحكيم {comp.evaluated_count || 0}</span>
                      <span className="rounded-full bg-muted px-3 py-1">متوسط الدرجة {Math.round(comp.average_score || 0)}%</span>
                      {comp.winner_name && <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">الفائز: {comp.winner_name}</span>}
                      {comp.min_verses ? <span className="rounded-full bg-muted px-3 py-1">حد الآيات: {comp.min_verses}</span> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setShowModal(false)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-6 backdrop-blur">
              <div>
                <h3 className="text-xl font-black">{editItem ? 'تعديل المسابقة' : 'إنشاء مسابقة جديدة'}</h3>
                <p className="mt-1 text-sm text-muted-foreground">كل الحقول المهمة ظاهرة بوضوح لتجنب التلخبط.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-xl p-2 transition hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(TYPE_CONFIG).filter(([type]) => ['monthly', 'ramadan', 'tajweed'].includes(type)).map(([type, config]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateType(type)}
                    className={`rounded-2xl border p-4 text-right transition ${form.type === type ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-border hover:bg-muted/60'}`}
                  >
                    <p className="font-black">{config.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{config.hint}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="اسم المسابقة" required>
                  <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="مثال: مسابقة رمضان للحفظ" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" />
                </Field>
                <Field label="نوع المسابقة">
                  <select value={form.type} onChange={(event) => updateType(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500">
                    {Object.entries(TYPE_CONFIG).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="وصف مختصر">
                <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="اشرح المطلوب من الطالب وطريقة التقييم..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 resize-none" />
              </Field>

              <div className="grid gap-4 md:grid-cols-4">
                <Field label="تاريخ البداية" required><input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label="تاريخ النهاية" required><input required type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label="الحد الأقصى"><input type="number" min={1} value={form.max_participants} onChange={(event) => setForm({ ...form, max_participants: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
                <Field label="حد الآيات"><input type="number" min={0} value={form.min_verses} onChange={(event) => setForm({ ...form, min_verses: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" /></Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="الشارة الممنوحة للفائز">
                  <select value={form.badge_key} onChange={(event) => setForm({ ...form, badge_key: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500">
                    <option value="star_of_halaqah">نجم الحلقة</option>
                    <option value="ramadan_badge">شارة رمضان</option>
                    <option value="tajweed_master">متقن التجويد</option>
                    <option value="hafiz_juz_amma">حافظ جزء عمّ</option>
                  </select>
                </Field>
                <Field label="مضاعف النقاط">
                  <input type="number" min={1} step="0.5" value={form.points_multiplier} onChange={(event) => setForm({ ...form, points_multiplier: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" />
                </Field>
              </div>

              <Field label="أحكام التجويد المطلوبة">
                <input value={form.tajweed_rules} onChange={(event) => setForm({ ...form, tajweed_rules: event.target.value })} placeholder="مثال: الغنة، المد، الإخفاء" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500" />
              </Field>

              <Field label="قواعد المسابقة">
                <textarea rows={3} value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} placeholder="الشروط، طريقة التسجيل، وطريقة اختيار الفائز..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 resize-none" />
              </Field>

              <Field label="الجوائز">
                <textarea rows={2} value={form.prizes_description} onChange={(event) => setForm({ ...form, prizes_description: event.target.value })} placeholder="شارة + نقاط مضاعفة + تكريم..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 resize-none" />
              </Field>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-sm font-bold">
                <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} className="h-4 w-4 accent-amber-600" />
                إبراز المسابقة للطلاب في الواجهة
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-border py-3 font-bold transition hover:bg-muted">إلغاء</button>
                <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 font-bold text-white transition hover:bg-amber-700 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editItem ? 'حفظ التعديلات' : 'إنشاء المسابقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: typeof Trophy; tone: 'amber' | 'emerald' | 'blue' | 'purple' }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      </div>
    </div>
  )
}

function InfoPill({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="truncate font-bold">{value}</p>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-bold">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      {children}
    </label>
  )
}
