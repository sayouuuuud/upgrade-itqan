"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Video,
  Trash2,
  Edit2,
  X,
  Loader2,
  GraduationCap,
  Radio,
  CalendarClock,
  Search,
  Sparkles,
  Shield,
  BookOpen,
  ChevronLeft,
} from 'lucide-react'
import { GENDER_LABELS, type HalaqaPlatform } from '@/lib/halaqat'

export interface HalaqaItem {
  id: string
  name: string
  description: string | null
  teacher_id: string | null
  teacher_name: string | null
  gender: string
  max_students: number
  current_students: number
  meeting_link: string | null
  livekit_room_name: string | null
  is_active: boolean
  platform: HalaqaPlatform
  scheduled_at: string | null
  duration_minutes: number | null
  is_live: boolean
  created_at: string
}

interface TeacherOption { id: string; name: string }

export type HalaqatViewerRole = 'admin' | 'host' | 'student'

interface Props {
  platform: HalaqaPlatform
  /**
   * What capabilities does the viewer have for this list?
   *  - 'admin': full CRUD + can pick any teacher
   *  - 'host':  CRUD on their own halaqat; new halaqat owned by them
   *  - 'student': read-only, can join live rooms they're enrolled in
   */
  role: HalaqatViewerRole
  basePath: string
  /** API path for the teacher-picker (admin only). */
  teachersEndpoint?: string
  /** Scope for the list endpoint. */
  scope?: 'mine' | 'enrolled' | 'all'
}

const PLATFORM_THEME: Record<HalaqaPlatform, {
  accent: string
  badge: string
  icon: React.ReactNode
  label: string
  sublabel: string
  empty: string
}> = {
  academy: {
    accent: 'from-indigo-500/15 to-violet-500/5 border-indigo-500/20',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    icon: <GraduationCap className="w-7 h-7 text-indigo-600" />,
    label: 'حلقات الأكاديمية',
    sublabel: 'بيئة تعليمية متكاملة للمدرسين والطلاب',
    empty: 'لا توجد حلقات بعد — أنشئ أول حلقة وابدأ رحلتك التعليمية',
  },
  maqraa: {
    accent: 'from-emerald-500/15 to-teal-500/5 border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: <BookOpen className="w-7 h-7 text-emerald-600" />,
    label: 'حلقات المقرأة',
    sublabel: 'حلقات تحفيظ وتجويد القرآن الكريم بإشراف مباشر',
    empty: 'لا توجد حلقات بعد — أنشئ حلقة وابدأ التلقي مع الطلاب',
  },
}

const emptyForm = {
  name: '',
  description: '',
  teacher_id: '',
  gender: 'both',
  max_students: 20,
  meeting_link: '',
  scheduled_at: '',
  duration_minutes: 60,
}

function formatRelativeFromNow(value: string | null): string | null {
  if (!value) return null
  try {
    const d = new Date(value)
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return null
  }
}

export function HalaqatList({
  platform,
  role,
  basePath,
  teachersEndpoint,
  scope,
}: Props) {
  const theme = PLATFORM_THEME[platform]
  const isAdminViewer = role === 'admin'
  const canEdit = role === 'admin' || role === 'host'

  const [halaqat, setHalaqat] = useState<HalaqaItem[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'live' | 'inactive'>('all')

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<HalaqaItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchData() {
    const params = new URLSearchParams({ platform })
    if (scope) params.set('scope', scope)
    try {
      const promises: Promise<Response>[] = [
        fetch(`/api/halaqat?${params.toString()}`),
      ]
      if (isAdminViewer && teachersEndpoint) {
        promises.push(fetch(teachersEndpoint))
      }
      const [halaqaRes, teachersRes] = await Promise.all(promises)
      if (halaqaRes.ok) {
        const json = await halaqaRes.json()
        setHalaqat(json.data || [])
      }
      if (teachersRes && teachersRes.ok) {
        const json = await teachersRes.json()
        const list = Array.isArray(json) ? json : json.data || []
        setTeachers(list.map((t: any) => ({ id: t.id, name: t.name })))
      }
    } catch (e) {
      console.error('Failed to fetch halaqat', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, scope])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return halaqat.filter((h) => {
      if (filter === 'live' && !h.is_live) return false
      if (filter === 'inactive' && h.is_active !== false) return false
      if (term) {
        return (
          h.name.toLowerCase().includes(term) ||
          (h.description || '').toLowerCase().includes(term) ||
          (h.teacher_name || '').toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [halaqat, search, filter])

  const liveCount = halaqat.filter((h) => h.is_live).length
  const totalStudents = halaqat.reduce((sum, h) => sum + (h.current_students || 0), 0)

  function openAdd() {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }
  function openEdit(h: HalaqaItem) {
    setEditItem(h)
    setForm({
      name: h.name,
      description: h.description || '',
      teacher_id: h.teacher_id || '',
      gender: h.gender || 'both',
      max_students: h.max_students || 20,
      meeting_link: h.meeting_link || '',
      scheduled_at: h.scheduled_at ? h.scheduled_at.slice(0, 16) : '',
      duration_minutes: h.duration_minutes || 60,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editItem ? `/api/halaqat/${editItem.id}` : '/api/halaqat'
      const method = editItem ? 'PATCH' : 'POST'
      const body: any = {
        ...form,
        platform,
        max_students: Number(form.max_students),
        duration_minutes: Number(form.duration_minutes),
      }
      if (!body.teacher_id) body.teacher_id = undefined
      if (!body.scheduled_at) body.scheduled_at = undefined
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'تعذر الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف الحلقة وجميع بياناتها؟ لا يمكن التراجع.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/halaqat/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else alert('تعذر الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border bg-gradient-to-l ${theme.accent} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 mt-0.5">{theme.icon}</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 flex-wrap">
              {theme.label}
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  <Radio className="w-3 h-3 animate-pulse" /> {liveCount} مباشر
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{theme.sublabel}</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={openAdd}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl font-bold transition-transform hover:scale-105 shadow-sm"
          >
            <Plus className="w-5 h-5" /> حلقة جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="إجمالي الحلقات" value={halaqat.length} icon={<Users className="w-4 h-4" />} />
        <StatCard label="حلقات مباشرة الآن" value={liveCount} icon={<Radio className="w-4 h-4" />} accent="text-red-600 dark:text-red-400" />
        <StatCard label="إجمالي الطلاب" value={totalStudents} icon={<GraduationCap className="w-4 h-4" />} />
        <StatCard label="نشطة" value={halaqat.filter(h => h.is_active !== false).length} icon={<Sparkles className="w-4 h-4" />} accent="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الحلقة أو المدرس…"
            className="w-full pr-10 pl-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div className="flex bg-secondary/50 rounded-xl p-1 text-sm">
          {(['all', 'live', 'inactive'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === k ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {k === 'all' ? 'الكل' : k === 'live' ? 'مباشر' : 'متوقف'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 sm:p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground opacity-60" />
          </div>
          <h3 className="font-bold text-lg mb-2">لا توجد حلقات لعرضها</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-5">{theme.empty}</p>
          {canEdit && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> إضافة حلقة
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HalaqaCard
              key={h.id}
              halaqa={h}
              themeBadge={theme.badge}
              basePath={basePath}
              role={role}
              onEdit={canEdit ? openEdit : undefined}
              onDelete={canEdit ? handleDelete : undefined}
              deleting={deletingId === h.id}
            />
          ))}
        </div>
      )}

      {showModal && canEdit && (
        <HalaqaFormModal
          editItem={editItem}
          form={form}
          setForm={setForm}
          teachers={teachers}
          saving={saving}
          isAdmin={isAdminViewer}
          platform={platform}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span className={accent || 'text-muted-foreground'}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-extrabold ${accent || ''}`}>{value}</p>
    </div>
  )
}

function HalaqaCard({
  halaqa: h,
  themeBadge,
  basePath,
  role,
  onEdit,
  onDelete,
  deleting,
}: {
  halaqa: HalaqaItem
  themeBadge: string
  basePath: string
  role: HalaqatViewerRole
  onEdit?: (h: HalaqaItem) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}) {
  const scheduled = formatRelativeFromNow(h.scheduled_at)
  return (
    <div className="group relative bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-emerald-500/40 transition-all overflow-hidden">
      {h.is_live && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
          <Radio className="w-3 h-3 animate-pulse" /> مباشر الآن
        </span>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-tight truncate">{h.name}</h3>
          {h.teacher_name && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              <GraduationCap className="w-3 h-3 inline ml-1" />
              {h.teacher_name}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium ${
            h.is_active !== false
              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'
          }`}
        >
          {h.is_active !== false ? 'نشطة' : 'متوقفة'}
        </span>
      </div>

      {h.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{h.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
        <span className={`px-2 py-0.5 rounded-full font-medium border ${themeBadge}`}>
          {GENDER_LABELS[h.gender] || 'مختلط'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-secondary/50 text-foreground">
          <Users className="w-3 h-3" /> {h.current_students}/{h.max_students}
        </span>
        {scheduled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-secondary/50 text-foreground">
            <CalendarClock className="w-3 h-3" /> {scheduled}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={`${basePath}/${h.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-foreground/90 hover:bg-foreground text-background rounded-lg text-sm font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          {role === 'student' ? 'فتح الحلقة' : 'إدارة الحلقة'}
        </Link>
        <Link
          href={`${basePath}/${h.id}/live`}
          className={`inline-flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
            h.is_live
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          title={h.is_live ? 'انضم للبث المباشر' : 'دخول الغرفة'}
        >
          <Video className="w-4 h-4" />
        </Link>
        {onEdit && (
          <button
            onClick={() => onEdit(h)}
            className="inline-flex items-center justify-center py-2 px-3 rounded-lg text-sm border border-border hover:bg-secondary transition-colors"
            title="تعديل"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(h.id)}
            disabled={deleting}
            className="inline-flex items-center justify-center py-2 px-3 rounded-lg text-sm border border-red-200 dark:border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="حذف"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function HalaqaFormModal({
  editItem,
  form,
  setForm,
  teachers,
  saving,
  isAdmin,
  platform,
  onClose,
  onSubmit,
}: {
  editItem: HalaqaItem | null
  form: typeof emptyForm
  setForm: (f: typeof emptyForm) => void
  teachers: TeacherOption[]
  saving: boolean
  isAdmin: boolean
  platform: HalaqaPlatform
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            {editItem ? 'تعديل الحلقة' : 'إضافة حلقة جديدة'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <Field label="اسم الحلقة" required>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={platform === 'maqraa' ? 'حلقة تجويد الجزء الأول' : 'حلقة الصحابة لتحفيظ القرآن'}
              className="input"
            />
          </Field>
          <Field label="الوصف">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="تفاصيل عن أهداف الحلقة، الجمهور المستهدف، طبيعة المحتوى…"
              className="input resize-none"
            />
          </Field>

          {isAdmin && teachers.length > 0 && (
            <Field label="المدرس">
              <select
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="input"
              >
                <option value="">اختر مدرساً</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="الجنس">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input"
              >
                <option value="both">مختلط</option>
                <option value="male">ذكور فقط</option>
                <option value="female">إناث فقط</option>
              </select>
            </Field>
            <Field label="الحد الأقصى للطلاب">
              <input
                type="number"
                min={1}
                max={500}
                value={form.max_students}
                onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="موعد البدء (اختياري)">
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="مدة الجلسة بالدقائق">
              <input
                type="number"
                min={5}
                max={360}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>

          <Field label="رابط بديل خارجي (اختياري)">
            <input
              type="url"
              value={form.meeting_link}
              onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
              placeholder="https://meet.example.com/..."
              className="input"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              يستخدم البث الافتراضي LiveKit المدمج — اترك الحقل فارغاً في الغالب.
            </p>
          </Field>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editItem ? 'حفظ التعديلات' : 'إنشاء الحلقة'}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          outline: none;
          transition: box-shadow 120ms;
        }
        :global(.input:focus) {
          box-shadow: 0 0 0 2px rgb(16 185 129 / 0.4);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-bold block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
