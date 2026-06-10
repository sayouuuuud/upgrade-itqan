'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Archive, Search, BookOpen, RotateCcw, Users, Loader2,
  GraduationCap, AlertCircle, Filter, X, UserCheck, BookMarked
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/skeletons'

type ItemType = 'course' | 'halaqah'
type TabType = 'all' | 'courses' | 'halaqat'

interface ArchiveItem {
  id: string
  item_type: ItemType
  name: string
  description: string | null
  thumbnail_url: string | null
  is_active: boolean
  archived_at: string | null
  archive_reason: string | null
  specialization: string | null
  category_name: string
  original_teacher_name: string
  original_teacher_email: string | null
  archived_by_name: string
  total_lessons: number
  total_enrolled: number
  completed_enrolled: number
}

interface Teacher {
  id: string
  name: string
  email: string
}

const REASON_LABELS: Record<string, string> = {
  teacher_deleted: 'حذف المدرس',
  manual: 'أرشفة يدوية',
}

function TypeBadge({ type }: { type: ItemType }) {
  if (type === 'course') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      <BookOpen className="w-3 h-3" /> كورس
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
      <GraduationCap className="w-3 h-3" /> حلقة
    </span>
  )
}

function ReasonBadge({ reason }: { reason: string | null }) {
  if (!reason) return null
  const label = REASON_LABELS[reason] || reason
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      {label}
    </span>
  )
}

// ─── Modal استعادة عنصر من الأرشيف ──────────────────────────────────────────
function RestoreModal({
  item,
  teachers,
  onClose,
  onRestored,
}: {
  item: ArchiveItem
  teachers: Teacher[]
  onClose: () => void
  onRestored: () => void
}) {
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRestore = async () => {
    setSaving(true)
    setError(null)
    try {
      const endpoint =
        item.item_type === 'course'
          ? `/api/academy/admin/archive/courses/${item.id}/restore`
          : `/api/academy/admin/archive/halaqat/${item.id}/restore`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTeacher ? { teacher_id: selectedTeacher } : {}),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        onRestored()
        onClose()
      } else {
        setError(data.error || 'حدث خطأ أثناء الاستعادة')
      }
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold">استعادة من الأرشيف</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* معلومات العنصر */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TypeBadge type={item.item_type} />
              <p className="font-bold truncate">{item.name}</p>
            </div>
            {item.original_teacher_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                المدرس الأصلي: <span className="font-medium text-foreground">{item.original_teacher_name}</span>
              </p>
            )}
          </div>

          {/* اختيار مدرس جديد */}
          <div>
            <label className="text-sm font-bold block mb-2">
              تعيين مدرس جديد
              <span className="text-muted-foreground font-normal mr-1">(اختياري)</span>
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">— بدون مدرس (سيبقى معلقاً) —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.email}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">
              إذا لم تختر مدرساً، سيتم استعادة المحتوى بدون مدرس ويمكن تعيين واحد لاحقاً.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors text-sm"
            >
              إلغاء
            </button>
            <button
              onClick={handleRestore}
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              استعادة
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdminUnifiedArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [reasonFilter, setReasonFilter] = useState('')
  const [restoreTarget, setRestoreTarget] = useState<ArchiveItem | null>(null)
  const [counts, setCounts] = useState({ total: 0, courses: 0, halaqat: 0 })
  const [loadError, setLoadError] = useState<string | null>(null)

  // debounce
  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const fetchArchive = () => {
    setLoading(true)
    setLoadError(null)
    const p = new URLSearchParams()
    if (activeTab !== 'all') p.set('type', activeTab)
    if (searchDebounced) p.set('search', searchDebounced)
    if (reasonFilter) p.set('reason', reasonFilter)
    fetch(`/api/academy/admin/archive?${p}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.error || `فشل تحميل الأرشيف (${r.status})`)
        }
        return r.json()
      })
      .then((d) => {
        setItems(d.data || [])
        setCounts(d.counts || { total: 0, courses: 0, halaqat: 0 })
      })
      .catch((e) => {
        setItems([])
        setCounts({ total: 0, courses: 0, halaqat: 0 })
        setLoadError(e?.message || 'تعذّر تحميل الأرشيف')
      })
      .finally(() => setLoading(false))
  }

  const fetchTeachers = () => {
    // Only assignable teachers (approved + active) appear in the restore picker.
    fetch('/api/academy/admin/teachers?assignable=1')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTeachers(Array.isArray(d) ? d : d?.data || []))
  }

  useEffect(() => {
    fetchArchive()
  }, [activeTab, searchDebounced, reasonFilter])

  useEffect(() => {
    fetchTeachers()
  }, [])

  const tabs: { key: TabType; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'all',     label: 'الكل',    count: counts.total,   icon: Archive },
    { key: 'courses', label: 'الكورسات', count: counts.courses, icon: BookOpen },
    { key: 'halaqat', label: 'الحلقات',  count: counts.halaqat, icon: GraduationCap },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="w-7 h-7" />
          الأرشيف الشامل
        </h1>
        <p className="text-white/85 mt-1.5 text-sm leading-relaxed">
          كل المحتوى المؤرشف — كورسات وحلقات — يمكن استعادتها وتعيين مدرس جديد لها
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative p-4 rounded-2xl border text-right transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                : 'bg-card border-border hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <tab.icon className={`w-6 h-6 mb-2 ${activeTab === tab.key ? 'text-white' : 'text-muted-foreground'}`} />
            <p className={`text-2xl font-black ${activeTab === tab.key ? 'text-white' : 'text-foreground'}`}>
              {tab.count}
            </p>
            <p className={`text-sm font-medium ${activeTab === tab.key ? 'text-white/80' : 'text-muted-foreground'}`}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث بالعنوان أو الاس��..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
          >
            <option value="">كل الأسباب</option>
            <option value="teacher_deleted">حذف المدرس</option>
            <option value="manual">أرشفة يدوية</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loadError ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-red-200 dark:border-red-900/40">
          <AlertCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-bold mb-2 text-red-600">تعذّر تحميل الأرشيف</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">{loadError}</p>
          <button
            onClick={fetchArchive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> إعادة المحاولة
          </button>
        </div>
      ) : loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-bold mb-2">لا يوجد محتوى مؤرشف</h3>
          <p className="text-muted-foreground text-sm">
            {search || reasonFilter
              ? 'لا توجد نتائج تطابق معايير البحث'
              : 'المحتوى المؤرشف سيظهر هنا تلقائياً'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">النوع والاسم</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">المدرس الأصلي</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">المسجلون</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">سبب الأرشفة</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">المؤرشف بواسطة</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">التاريخ</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={`${item.item_type}-${item.id}`} className="hover:bg-muted/20 transition-colors group">
                    {/* النوع والاسم */}
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            item.item_type === 'course'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}>
                            {item.item_type === 'course'
                              ? <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              : <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            }
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeBadge type={item.item_type} />
                          </div>
                          <p className="font-bold text-sm truncate max-w-[200px]">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                          )}
                          {item.category_name && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                              {item.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* المدرس الأصلي */}
                    <td className="p-4">
                      {item.original_teacher_name ? (
                        <div>
                          <p className="text-sm font-medium">{item.original_teacher_name}</p>
                          {item.original_teacher_email && (
                            <p className="text-xs text-muted-foreground" dir="ltr">{item.original_teacher_email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>

                    {/* المسجلون */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{item.total_enrolled}</span>
                        {item.item_type === 'course' && item.total_lessons > 0 && (
                          <span className="text-xs text-muted-foreground">
                            · {item.total_lessons} درس
                          </span>
                        )}
                      </div>
                      {item.completed_enrolled > 0 && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {item.completed_enrolled} أكمل
                        </p>
                      )}
                    </td>

                    {/* سبب الأرشفة */}
                    <td className="p-4">
                      <ReasonBadge reason={item.archive_reason} />
                    </td>

                    {/* المؤرشف بواسطة */}
                    <td className="p-4 text-sm text-muted-foreground">
                      {item.archived_by_name || '—'}
                    </td>

                    {/* التاريخ */}
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {item.archived_at
                        ? new Date(item.archived_at).toLocaleDateString('ar-EG', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })
                        : '—'}
                    </td>

                    {/* الإجراءات */}
                    <td className="p-4">
                      <button
                        onClick={() => setRestoreTarget(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        استعادة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreTarget && (
        <RestoreModal
          item={restoreTarget}
          teachers={teachers}
          onClose={() => setRestoreTarget(null)}
          onRestored={fetchArchive}
        />
      )}
    </div>
  )
}
