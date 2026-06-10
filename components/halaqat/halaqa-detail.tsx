"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Users,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  Video,
  Radio,
  CalendarClock,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import { GENDER_LABELS, type HalaqaPlatform } from '@/lib/halaqat'
import { HalaqaSessions } from '@/components/halaqat/halaqa-sessions'

interface Halaqa {
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
}

interface Student {
  enrollment_id: string
  student_id: string
  student_name: string
  student_email: string
  avatar_url: string | null
  joined_at: string
  is_active: boolean
  attendance_count: number
  total_sessions: number
}

interface AvailableStudent {
  id: string
  name: string
  email: string
  gender?: string
}

interface Props {
  halaqaId: string
  basePath: string
  /** Endpoint used to list candidate students for enrollment. */
  studentsCatalogEndpoint: string
  platform: HalaqaPlatform
}

export function HalaqaDetail({
  halaqaId,
  basePath,
  studentsCatalogEndpoint,
  platform,
}: Props) {
  const router = useRouter()
  const [halaqa, setHalaqa] = useState<Halaqa | null>(null)
  const [permissions, setPermissions] = useState<{ can_manage: boolean; is_enrolled: boolean } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'students' | 'overview' | 'sessions'>('overview')
  const [showAdd, setShowAdd] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [togglingLive, setTogglingLive] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch(`/api/halaqat/${halaqaId}`),
        fetch(`/api/halaqat/${halaqaId}/students`),
      ])
      if (hRes.ok) {
        const json = await hRes.json()
        setHalaqa(json.data)
        setPermissions(json.permissions)
      }
      if (sRes.ok) {
        const json = await sRes.json()
        setStudents(json.students || [])
      }
    } catch (e) {
      console.error('failed to fetch halaqa detail', e)
    } finally {
      setLoading(false)
    }
  }, [halaqaId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function openAddModal() {
    setShowAdd(true)
    setSearchTerm('')
    try {
      const r = await fetch(studentsCatalogEndpoint)
      if (r.ok) {
        const json = await r.json()
        const list = Array.isArray(json) ? json : json.data || json.students || []
        setAvailableStudents(list)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function addStudent(studentId: string) {
    setAddingId(studentId)
    try {
      const r = await fetch(`/api/halaqat/${halaqaId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      if (r.ok) {
        await refresh()
        setShowAdd(false)
      } else {
        const err = await r.json().catch(() => ({}))
        alert(err.error || 'تعذر إضافة الطالب')
      }
    } finally {
      setAddingId(null)
    }
  }

  async function removeStudent(studentId: string) {
    if (!confirm('إزالة الطالب من الحلقة؟')) return
    setRemovingId(studentId)
    try {
      const r = await fetch(`/api/halaqat/${halaqaId}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      if (r.ok) await refresh()
    } finally {
      setRemovingId(null)
    }
  }

  async function toggleLive() {
    if (!halaqa) return
    setTogglingLive(true)
    try {
      const method = halaqa.is_live ? 'DELETE' : 'POST'
      const r = await fetch(`/api/halaqat/${halaqaId}/live`, { method })
      if (r.ok) {
        await refresh()
        if (!halaqa.is_live) {
          router.push(`${basePath}/${halaqaId}/live`)
        }
      }
    } finally {
      setTogglingLive(false)
    }
  }

  const enrolledIds = useMemo(() => new Set(students.map((s) => s.student_id)), [students])
  const filteredAvailable = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return availableStudents.filter((s) => {
      if (enrolledIds.has(s.id)) return false
      if (halaqa?.gender === 'male' && s.gender === 'female') return false
      if (halaqa?.gender === 'female' && s.gender === 'male') return false
      if (!term) return true
      return s.name.toLowerCase().includes(term) || (s.email || '').toLowerCase().includes(term)
    })
  }, [availableStudents, enrolledIds, halaqa, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!halaqa) {
    return (
      <div className="text-center py-16">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-muted-foreground">لم يتم العثور على الحلقة أو لا تملك صلاحية الوصول</p>
        <Link href={basePath} className="inline-block mt-4 text-emerald-600 hover:underline">
          العودة للحلقات
        </Link>
      </div>
    )
  }

  const canManage = !!permissions?.can_manage
  const scheduled = halaqa.scheduled_at
    ? new Intl.DateTimeFormat('ar', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(halaqa.scheduled_at))
    : null

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-l from-emerald-500/10 to-transparent p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              href={basePath}
              className="shrink-0 p-2 -m-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 flex-wrap">
                {halaqa.name}
                {halaqa.is_live && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse" /> مباشر الآن
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                {halaqa.teacher_name && (
                  <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full">
                    <GraduationCap className="w-3 h-3" /> {halaqa.teacher_name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" /> {halaqa.current_students}/{halaqa.max_students}
                </span>
                <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full">
                  {GENDER_LABELS[halaqa.gender] || 'مختلط'}
                </span>
                {scheduled && (
                  <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full">
                    <CalendarClock className="w-3 h-3" /> {scheduled}
                  </span>
                )}
                {halaqa.duration_minutes && (
                  <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> {halaqa.duration_minutes} دقيقة
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${basePath}/${halaqaId}/live`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
            >
              <Video className="w-4 h-4" />
              {halaqa.is_live ? 'انضم للبث' : 'دخول الغرفة'}
            </Link>
            {canManage && (
              <button
                onClick={toggleLive}
                disabled={togglingLive}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors ${
                  halaqa.is_live
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {togglingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                {halaqa.is_live ? 'إنهاء البث' : 'بدء البث المباشر'}
              </button>
            )}
          </div>
        </div>
        {halaqa.description && (
          <p className="text-sm text-muted-foreground mt-3 sm:mt-4 leading-relaxed">{halaqa.description}</p>
        )}
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-colors ${
            tab === 'overview'
              ? 'border-emerald-500 text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-colors ${
            tab === 'sessions'
              ? 'border-emerald-500 text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          الجلسات
        </button>
        <button
          onClick={() => setTab('students')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-colors ${
            tab === 'students'
              ? 'border-emerald-500 text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          الطلاب ({students.length})
        </button>
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile title="حالة الحلقة" value={halaqa.is_active ? 'نشطة' : 'متوقفة'} accent={halaqa.is_active ? 'text-emerald-600' : 'text-muted-foreground'} />
          <InfoTile title="عدد الطلاب الحالي" value={`${halaqa.current_students} / ${halaqa.max_students}`} />
          <InfoTile title="الجنس المسموح" value={GENDER_LABELS[halaqa.gender] || 'مختلط'} />
          {scheduled && <InfoTile title="الموعد القادم" value={scheduled} />}
          {halaqa.meeting_link && (
            <InfoTile title="رابط بديل" value={<a className="text-emerald-600 underline" href={halaqa.meeting_link} target="_blank" rel="noreferrer">فتح الرابط</a>} />
          )}
          <InfoTile
            title="رابط البث الداخلي"
            value={
              <Link href={`${basePath}/${halaqaId}/live`} className="text-emerald-600 underline">
                LiveKit Room
              </Link>
            }
          />
        </div>
      )}

      {tab === 'sessions' && <HalaqaSessions halaqaId={halaqaId} canManage={canManage} />}

      {tab === 'students' && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {students.length} طالب من أصل {halaqa.max_students}
              </p>
              <button
                onClick={openAddModal}
                disabled={students.length >= halaqa.max_students}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                إضافة طالب
              </button>
            </div>
          )}

          {students.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
              لم يلتحق أي طالب بهذه الحلقة بعد
            </div>
          ) : (
            <div className="grid gap-3">
              {students.map((s) => (
                <div
                  key={s.enrollment_id}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 sm:p-4"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.student_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">{s.student_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{s.student_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.student_email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {s.attendance_count}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {s.total_sessions} جلسة
                    </span>
                  </div>
                  {!s.is_active && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      موقوف
                    </span>
                  )}
                  {canManage && s.is_active && (
                    <button
                      onClick={() => removeStudent(s.student_id)}
                      disabled={removingId === s.student_id}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="إزالة"
                    >
                      {removingId === s.student_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAdd && canManage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-lg">إضافة طلاب للحلقة</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="search"
                  placeholder="ابحث بالاسم أو البريد…"
                  className="w-full pr-10 pl-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  لا يوجد طلاب مطابقون
                </p>
              ) : (
                filteredAvailable.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addStudent(s.id)}
                    disabled={addingId === s.id}
                    className="w-full flex items-center gap-3 p-3 bg-secondary/40 hover:bg-secondary rounded-lg transition-colors text-right disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                      <span className="font-bold text-sm">{s.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                    {addingId === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : (
                      <Plus className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoTile({
  title,
  value,
  accent,
}: {
  title: string
  value: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className={`font-bold ${accent || ''}`}>{value}</p>
    </div>
  )
}
