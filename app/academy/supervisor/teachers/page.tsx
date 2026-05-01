'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap, ShieldCheck, ShieldAlert, Search, CheckCircle2,
  XCircle, Loader2, Star, Users, BookOpen, Mail, Phone, BadgeCheck,
  Filter,
} from 'lucide-react'

interface SupervisorTeacher {
  id: string
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
  is_active: boolean
  bio: string | null
  specialization: string | null
  years_of_experience: number | null
  certifications: string[] | null
  subjects: string[] | null
  rating: number | null
  total_students: number | null
  total_courses: number | null
  is_accepting_students: boolean | null
  is_verified: boolean
  courses_count: number
  students_count: number
}

interface Counts {
  pending: number
  verified: number
  all: number
}

type TabKey = 'pending' | 'verified' | 'all'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending',  label: 'بانتظار التوثيق' },
  { key: 'verified', label: 'موثقون' },
  { key: 'all',      label: 'الكل' },
]

export default function SupervisorTeachersPage() {
  const [teachers, setTeachers] = useState<SupervisorTeacher[]>([])
  const [counts, setCounts] = useState<Counts>({ pending: 0, verified: 0, all: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('pending')
  const [search, setSearch] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SupervisorTeacher | null>(null)

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/supervisor/teachers?status=${tab}`)
      if (res.ok) {
        const data = await res.json()
        setTeachers(data.data || [])
        if (data.counts) setCounts({ pending: 0, verified: 0, all: 0, ...data.counts })
      }
    } catch (e) {
      console.error('Failed to fetch teachers:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeachers() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter(t =>
      [t.name, t.email, t.specialization || '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [teachers, search])

  const handleAction = async (teacher: SupervisorTeacher, action: 'verify' | 'unverify') => {
    const confirmMsg = action === 'verify'
      ? `هل تريد توثيق الأستاذ «${teacher.name}»؟ سيظهر للطلاب بشارة التوثيق.`
      : `هل تريد سحب علامة التوثيق من الأستاذ «${teacher.name}»؟`
    if (!confirm(confirmMsg)) return

    setActingId(teacher.id)
    try {
      const res = await fetch(`/api/academy/supervisor/teachers/${teacher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        await fetchTeachers()
        if (selected?.id === teacher.id) {
          setSelected({ ...teacher, is_verified: action === 'verify' })
        }
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || 'تعذّر تنفيذ العملية')
      }
    } finally {
      setActingId(null)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            توثيق المدرسين
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مراجعة ملفات المدرسين واعتمادهم رسمياً في الأكاديمية
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'pending',  label: 'بانتظار التوثيق', value: counts.pending,  color: 'text-yellow-600', icon: ShieldAlert },
          { key: 'verified', label: 'موثقون',          value: counts.verified, color: 'text-green-600',  icon: ShieldCheck },
          { key: 'all',      label: 'إجمالي المدرسين', value: counts.all,      color: 'text-foreground', icon: GraduationCap },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.key} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {t.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-background text-foreground'}`}>
                  {counts[t.key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative flex-1 max-w-md sm:mr-auto">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو التخصص..."
            className="w-full pr-10 pl-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[240px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">
            {search ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد مدرسون في هذا التبويب'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(teacher => (
            <article
              key={teacher.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* Top row */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden">
                  {teacher.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    teacher.name?.[0] || 'م'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground truncate text-base">{teacher.name}</h3>
                    {teacher.is_verified ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> موثّق
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> غير موثّق
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" /> {teacher.email}
                  </p>
                  {teacher.phone && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {teacher.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Specialty + bio */}
              {(teacher.specialization || teacher.bio) && (
                <div className="text-sm">
                  {teacher.specialization && (
                    <p className="font-bold text-foreground">{teacher.specialization}</p>
                  )}
                  {teacher.bio && (
                    <p className="text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{teacher.bio}</p>
                  )}
                </div>
              )}

              {/* Subjects + certifications chips */}
              {(teacher.subjects?.length || teacher.certifications?.length) ? (
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects?.slice(0, 4).map((s, i) => (
                    <span key={`s-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold">
                      {s}
                    </span>
                  ))}
                  {teacher.certifications?.slice(0, 3).map((c, i) => (
                    <span key={`c-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold">
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-border">
                <Stat icon={BookOpen}  label="دورات"   value={teacher.courses_count ?? 0} />
                <Stat icon={Users}     label="طلاب"    value={teacher.students_count ?? 0} />
                <Stat icon={Star}      label="تقييم"   value={teacher.rating ? Number(teacher.rating).toFixed(1) : '—'} />
                <Stat                  label="خبرة"    value={teacher.years_of_experience ? `${teacher.years_of_experience}س` : '—'} />
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  انضم في {formatDate(teacher.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelected(teacher)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    عرض الملف
                  </button>
                  {teacher.is_verified ? (
                    <button
                      disabled={actingId === teacher.id}
                      onClick={() => handleAction(teacher, 'unverify')}
                      className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {actingId === teacher.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      سحب التوثيق
                    </button>
                  ) : (
                    <button
                      disabled={actingId === teacher.id}
                      onClick={() => handleAction(teacher, 'verify')}
                      className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {actingId === teacher.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      اعتماد
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                ملف المدرس
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden">
                  {selected.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    selected.name?.[0] || 'م'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-foreground">{selected.name}</h2>
                    {selected.is_verified ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> موثّق
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> بانتظار التوثيق
                      </span>
                    )}
                  </div>
                  {selected.specialization && (
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {selected.specialization}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {selected.email}
                  </p>
                  {selected.phone && (
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {selected.phone}
                    </p>
                  )}
                </div>
              </div>

              {selected.bio && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">نبذة</h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selected.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={BookOpen} label="دورات"   value={selected.courses_count ?? 0} large />
                <Stat icon={Users}    label="طلاب"    value={selected.students_count ?? 0} large />
                <Stat icon={Star}     label="تقييم"   value={selected.rating ? Number(selected.rating).toFixed(1) : '—'} large />
                <Stat                 label="خبرة"    value={selected.years_of_experience ? `${selected.years_of_experience} سنة` : '—'} large />
              </div>

              {selected.subjects?.length ? (
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">المواد</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.subjects.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selected.certifications?.length ? (
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">الشهادات</h4>
                  <ul className="space-y-1.5">
                    {selected.certifications.map((c, i) => (
                      <li key={i} className="text-sm text-foreground flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-bold"
                >
                  إغلاق
                </button>
                {selected.is_verified ? (
                  <button
                    disabled={actingId === selected.id}
                    onClick={() => handleAction(selected, 'unverify')}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    {actingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    سحب التوثيق
                  </button>
                ) : (
                  <button
                    disabled={actingId === selected.id}
                    onClick={() => handleAction(selected, 'verify')}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    {actingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    اعتماد كأستاذ موثّق
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  large = false,
}: {
  icon?: React.ElementType
  label: string
  value: string | number
  large?: boolean
}) {
  return (
    <div className={`rounded-xl bg-muted/40 ${large ? 'p-4' : 'p-2.5'} text-center`}>
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {Icon && <Icon className={large ? 'w-4 h-4' : 'w-3 h-3'} />}
        <span className={`uppercase tracking-wider font-bold ${large ? 'text-[11px]' : 'text-[10px]'}`}>{label}</span>
      </div>
      <p className={`font-black text-foreground ${large ? 'text-xl mt-1' : 'text-base mt-0.5'}`}>{value}</p>
    </div>
  )
}
