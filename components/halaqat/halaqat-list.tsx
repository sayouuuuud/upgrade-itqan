"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useI18n } from '@/lib/i18n/context'

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
interface PathOption { id: string; title: string; type: 'tajweed' | 'memorization' }

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

const PLATFORM_THEME_STATIC: Record<HalaqaPlatform, {
  accent: string
  badge: string
  icon: React.ReactNode
}> = {
  academy: {
    accent: 'from-indigo-500/15 to-violet-500/5 border-indigo-500/20',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    icon: <GraduationCap className="w-7 h-7 text-indigo-600" />,
  },
  maqraa: {
    accent: 'from-emerald-500/15 to-teal-500/5 border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: <BookOpen className="w-7 h-7 text-emerald-600" />,
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
  scope: 'public',
  path_type: '' as '' | 'tajweed' | 'memorization',
  path_id: '',
  auto_enroll: false,
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
  const { t } = useI18n()
  const th = (t as any).halaqat
  const staticTheme = PLATFORM_THEME_STATIC[platform]
  const theme = {
    ...staticTheme,
    label: platform === 'academy' ? (th?.academyLabel ?? 'حلقات الأكاديمية') : (th?.maqraaLabel ?? 'حلقات المقرأة'),
    sublabel: platform === 'academy' ? (th?.academySub ?? 'بيئة تعليمية متكاملة للمدرسين والطلاب') : (th?.maqraaSub ?? 'حلقات تحفيظ وتجويد القرآن الكريم بإشراف مباشر'),
    empty: platform === 'academy' ? (th?.academyEmpty ?? 'لا توجد حلقات بعد — أنشئ أول حلقة وابدأ رحلتك التعليمية') : (th?.maqraaEmpty ?? 'لا توجد حلقات بعد — أنشئ حلقة وابدأ التلقي مع الطلاب'),
  }
  const isAdminViewer = role === 'admin'
  const canEdit = role === 'admin' || role === 'host'

  const [halaqat, setHalaqat] = useState<HalaqaItem[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [paths, setPaths] = useState<PathOption[]>([])
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

  async function fetchPaths() {
    // Only maqraa halaqat can be bound to learning paths.
    if (platform !== 'maqraa') return
    try {
      const [tajRes, memRes] = await Promise.all([
        fetch('/api/reader/tajweed-paths'),
        fetch('/api/reader/memorization-paths'),
      ])
      const merged: PathOption[] = []
      if (tajRes.ok) {
        const json = await tajRes.json()
        for (const p of json.paths || []) {
          merged.push({ id: p.id, title: p.title, type: 'tajweed' })
        }
      }
      if (memRes.ok) {
        const json = await memRes.json()
        for (const p of json.paths || []) {
          merged.push({ id: p.id, title: p.title, type: 'memorization' })
        }
      }
      setPaths(merged)
    } catch (e) {
      console.error('Failed to fetch paths', e)
    }
  }

  useEffect(() => {
    fetchData()
    fetchPaths()
    // Check if we should open modal automatically based on URL params
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('new') === 'true' && canEdit) {
      const initialScope = searchParams.get('scope')
      setForm(prev => ({ ...prev, scope: initialScope === 'path_only' ? 'path_only' : 'public' }))
      setShowModal(true)
    }
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
      scope: (h as any).scope || 'public',
      path_type: ((h as any).path_type as '' | 'tajweed' | 'memorization') || '',
      path_id: (h as any).path_id || '',
      auto_enroll: Boolean((h as any).auto_enroll),
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
      // Path binding only applies to path_only halaqat with a selected path.
      if (body.scope !== 'path_only' || !body.path_type || !body.path_id) {
        body.path_type = null
        body.path_id = null
        body.auto_enroll = false
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      }       else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || (th?.saveFail ?? 'تعذر الحفظ'))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(th?.deleteConfirm ?? 'حذف الحلقة وجميع بياناتها؟ لا يمكن التراجع.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/halaqat/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else alert(th?.deleteFail ?? 'تعذر الحذف')
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

  const FADE_UP_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      initial="hidden" animate="show" viewport={{ once: true }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6 relative"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className={`relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-l ${theme.accent} p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm`}>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 mt-0.5">{theme.icon}</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 flex-wrap">
              {theme.label}
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  <Radio className="w-3 h-3 animate-pulse" /> {liveCount} {th?.liveCount ?? 'مباشر'}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{theme.sublabel}</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={openAdd}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 z-10"
          >
            <Plus className="w-5 h-5" /> {th?.newHalaqa ?? 'حلقة جديدة'}
          </button>
        )}
      </motion.div>

      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={th?.totalHalaqat ?? 'إجمالي الحلقات'} value={halaqat.length} icon={<Users className="w-4 h-4" />} />
        <StatCard label={th?.liveNow ?? 'حلقات مباشرة الآن'} value={liveCount} icon={<Radio className="w-4 h-4" />} accent="text-red-600 dark:text-red-400" />
        <StatCard label={th?.totalStudents ?? 'إجمالي الطلاب'} value={totalStudents} icon={<GraduationCap className="w-4 h-4" />} />
        <StatCard label={th?.active ?? 'نشطة'} value={halaqat.filter(h => h.is_active !== false).length} icon={<Sparkles className="w-4 h-4" />} accent="text-emerald-600 dark:text-emerald-400" />
      </motion.div>

      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-card/50 backdrop-blur-sm p-2 rounded-2xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={th?.searchPlaceholder ?? 'ابحث باسم الحلقة أو المدرس…'}
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
              {k === 'all' ? (th?.filterAll ?? 'الكل') : k === 'live' ? (th?.filterLive ?? 'مباشر') : (th?.filterInactive ?? 'متوقف')}
            </button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 rounded-3xl p-12 sm:p-16 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground opacity-60" />
          </div>
          <h3 className="font-bold text-lg mb-2">{th?.noHalaqat ?? 'لا توجد حلقات لعرضها'}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-5">{theme.empty}</p>
          {canEdit && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> {th?.addHalaqa ?? 'إضافة حلقة'}
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <HalaqaCard
                  halaqa={h}
                  themeBadge={theme.badge}
                  basePath={basePath}
                  role={role}
                  onEdit={canEdit ? openEdit : undefined}
                  onDelete={canEdit ? handleDelete : undefined}
                  deleting={deletingId === h.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {showModal && canEdit && (
        <HalaqaFormModal
          editItem={editItem}
          form={form}
          setForm={setForm}
          teachers={teachers}
          paths={paths}
          saving={saving}
          isAdmin={isAdminViewer}
          platform={platform}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </motion.div>
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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 rounded-3xl p-5 relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        <span className={accent || 'text-muted-foreground'}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`text-3xl font-black ${accent || ''}`}>{value}</p>
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
  const { t: i18nT } = useI18n()
  const th = (i18nT as any).halaqat
  const scheduled = formatRelativeFromNow(h.scheduled_at)
  return (
    <div className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {h.is_live && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-[11px] font-black bg-red-500 text-white px-2.5 py-1 rounded-full shadow-lg shadow-red-500/20">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> {th?.liveNowBadge ?? 'مباشر الآن'}
        </span>
      )}
      
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 pr-1">
            <h3 className="font-bold text-xl leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{h.name}</h3>
            {h.teacher_name && (
              <p className="text-xs font-medium text-muted-foreground mt-1.5 truncate flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-muted"><GraduationCap className="w-3 h-3 text-foreground" /></div>
                {h.teacher_name}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-black border ${
              h.is_active !== false
                ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'
            }`}
          >
            {h.is_active !== false ? (th?.activeBadge ?? 'نشطة') : (th?.inactiveBadge ?? 'متوقفة')}
          </span>
          {(h as any).scope === 'path_only' && (
            <span className="shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-black border bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-400">
              {th?.pathOnly ?? 'Path Only'}
            </span>
          )}
        </div>

        {h.description && (
          <p className="text-sm font-medium text-muted-foreground line-clamp-2 mb-5 leading-relaxed">{h.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] border ${themeBadge}`}>
            {GENDER_LABELS[h.gender] || (th?.genderMixed ?? 'Mixed')}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="w-3.5 h-3.5" /> {h.current_students}/{h.max_students}
          </span>
          {scheduled && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-full sm:w-auto mt-1 sm:mt-0">
              <CalendarClock className="w-3.5 h-3.5" /> {scheduled}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border/50">
        <Link
          href={`${basePath}/${h.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          {role === 'student' ? (th?.openHalaqa ?? 'Open Halaqa') : (th?.manageHalaqa ?? 'Manage Halaqa')}
        </Link>
        <Link
          href={`${basePath}/${h.id}/live`}
          className={`inline-flex items-center justify-center py-2.5 px-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
            h.is_live
              ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/20'
          }`}
          title={h.is_live ? (th?.joinLiveTitle ?? 'Join Live Broadcast') : (th?.enterRoomTitle ?? 'Enter Room')}
        >
          <Video className="w-4 h-4" />
        </Link>
        {onEdit && (
          <button
            onClick={() => onEdit(h)}
            className="inline-flex items-center justify-center py-2.5 px-3 rounded-xl text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            title={th?.edit ?? 'Edit'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(h.id)}
            disabled={deleting}
            className="inline-flex items-center justify-center py-2.5 px-3 rounded-xl text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50"
            title={th?.delete ?? 'Delete'}
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
  paths,
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
  paths: PathOption[]
  saving: boolean
  isAdmin: boolean
  platform: HalaqaPlatform
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const { t } = useI18n()
  const th = (t as any).halaqat as Record<string, string> | undefined
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border/50 shrink-0">
          <h3 className="text-xl font-black flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            {editItem ? (th?.editHalaqa ?? 'Edit Halaqa') : (th?.addNewHalaqa ?? 'Add New Halaqa')}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <Field label={th?.formFieldName ?? 'Halaqa Name'} required>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={platform === 'maqraa'
                ? (th?.formNamePlaceholderMaqraa ?? 'e.g. Tajweed Part 1')
                : (th?.formNamePlaceholderAcademy ?? 'e.g. Al-Sahaba Memorization Circle')}
              className="input"
            />
          </Field>
          <Field label={th?.formFieldDesc ?? 'Description'}>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={th?.formDescPlaceholder ?? 'Details about goals, target audience, content…'}
              className="input resize-none"
            />
          </Field>

          {isAdmin && teachers.length > 0 && (
            <Field label={th?.formFieldTeacher ?? 'Teacher'}>
              <select
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="input"
              >
                <option value="">{th?.formSelectTeacher ?? 'Select a teacher'}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={th?.formFieldGender ?? 'Gender'}>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input"
              >
                <option value="both">{th?.genderBoth ?? 'Mixed'}</option>
                <option value="male">{th?.genderMale ?? 'Male only'}</option>
                <option value="female">{th?.genderFemale ?? 'Female only'}</option>
              </select>
            </Field>
            <Field label={th?.formFieldMaxStudents ?? 'Max Students'}>
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

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground block mb-2">{th?.formFieldScope ?? 'Visibility'}</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 p-3 border border-border rounded-lg bg-background cursor-pointer hover:border-blue-500/50 flex-1 transition-colors">
                <input 
                  type="radio" 
                  name="scope" 
                  value="public" 
                  checked={form.scope === 'public'} 
                  onChange={e => setForm({...form, scope: 'public'})}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-sm">{th?.scopePublic ?? 'Public Halaqa'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{th?.scopePublicDesc ?? 'Available to all students'}</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 border border-border rounded-lg bg-background cursor-pointer hover:border-emerald-500/50 flex-1 transition-colors">
                <input 
                  type="radio" 
                  name="scope" 
                  value="path_only" 
                  checked={form.scope === 'path_only'} 
                  onChange={e => setForm({...form, scope: 'path_only'})}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{th?.scopePathOnly ?? 'Path Specific'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{th?.scopePathOnlyDesc ?? 'For path students only'}</p>
                </div>
              </label>
            </div>
          </div>

          {form.scope === 'path_only' && platform === 'maqraa' && (
            <div className="space-y-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <Field label={th?.formLinkPath ?? 'Link Halaqa to a Path'}>
                <select
                  value={form.path_type && form.path_id ? `${form.path_type}:${form.path_id}` : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) {
                      setForm({ ...form, path_type: '', path_id: '', auto_enroll: false })
                      return
                    }
                    const [type, id] = v.split(':')
                    setForm({ ...form, path_type: type as 'tajweed' | 'memorization', path_id: id })
                  }}
                  className="input"
                >
                  <option value="">{th?.formSelectPath ?? '— Select a path —'}</option>
                  <optgroup label={th?.pathsTajweed ?? 'Tajweed Paths'}>
                    {paths
                      .filter((p) => p.type === 'tajweed')
                      .map((p) => (
                        <option key={`tajweed:${p.id}`} value={`tajweed:${p.id}`}>
                          {p.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label={th?.pathsMemorization ?? 'Memorization Paths'}>
                    {paths
                      .filter((p) => p.type === 'memorization')
                      .map((p) => (
                        <option key={`memorization:${p.id}`} value={`memorization:${p.id}`}>
                          {p.title}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </Field>
              {form.path_id && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.auto_enroll}
                    onChange={(e) => setForm({ ...form, auto_enroll: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded"
                  />
                  <span>
                    <span className="font-bold text-sm block">{th?.autoEnroll ?? 'Auto-enroll path students'}</span>
                    <span className="text-xs text-muted-foreground">
                      {th?.autoEnrollDesc ?? 'All active path students will be added to the halaqa on creation'}</span>
                  </span>
                </label>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={th?.formFieldSchedule ?? 'Start Date (optional)'}>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={th?.formFieldDuration ?? 'Session Duration (minutes)'}>
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

          <Field label={th?.formFieldMeetingLink ?? 'External Meeting Link (optional)'}>
            <input
              type="url"
              value={form.meeting_link}
              onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
              placeholder="https://meet.example.com/..."
              className="input"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {th?.meetingLinkHint ?? 'Default streaming uses built-in LiveKit — leave empty in most cases.'}</p>
          </Field>

          <div className="flex gap-4 pt-4 border-t border-border/50 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
            >
              {th?.cancel ?? 'Cancel'}</button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:shadow-none"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editItem ? (th?.saveEdits ?? 'Save Changes') : (th?.createHalaqa ?? 'Create Halaqa')}
            </button>
          </div>
        </form>
      </motion.div>
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
