'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap, ShieldCheck, ShieldAlert, Search, CheckCircle2,
  XCircle, Loader2, Star, Users, BookOpen, Mail, Phone, BadgeCheck,
  Filter, UserCheck, Settings, Award, Briefcase, Plus, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

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

export default function SupervisorTeachersPage() {
    const { t } = useI18n();
  const academy = (t as any).academy as Record<string, string> | undefined
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const TABS: { key: TabKey; label: string; icon: any; color: string }[] = [
    { key: 'pending',  label: (t.addedTranslations_2026?.['بانتظار التوثيق'] || (t.addedTranslations_2026?.['بانتظار التوثيق'] || 'بانتظار التوثيق')), icon: ShieldAlert, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { key: 'verified', label: (t.addedTranslations_2026?.['موثقون'] || (t.addedTranslations_2026?.['موثقون'] || 'موثقون')), icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'all',      label: (t.addedTranslations_2026?.['الكل'] || (t.addedTranslations_2026?.['الكل'] || 'الكل')), icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  ]

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
      ? ((t.addedTranslations_2026?.['هل تريد توثيق الأستاذ «${teacher.name}»؟ سيظهر للطلاب بشارة التوثيق.'] || (t.addedTranslations_2026?.['هل تريد توثيق الأستاذ «${teacher.name}»؟ سيظهر للطلاب بشارة التوثيق.'] || 'هل تريد توثيق الأستاذ «${teacher.name}»؟ سيظهر للطلاب بشارة التوثيق.')))
      : ((t.addedTranslations_2026?.['هل تريد سحب علامة التوثيق من الأستاذ «${teacher.name}»؟'] || (t.addedTranslations_2026?.['هل تريد سحب علامة التوثيق من الأستاذ «${teacher.name}»؟'] || 'هل تريد سحب علامة التوثيق من الأستاذ «${teacher.name}»؟')))
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
        alert(data?.error || ((t.addedTranslations_2026?.['تعذّر تنفيذ العملية'] || (t.addedTranslations_2026?.['تعذّر تنفيذ العملية'] || 'تعذّر تنفيذ العملية'))))
      }
    } finally {
      setActingId(null)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
              <UserCheck className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">{(t.addedTranslations_2026?.['توثيق المدرسين'] || (t.addedTranslations_2026?.['توثيق المدرسين'] || 'توثيق المدرسين'))}</h1>
              <p className="text-muted-foreground font-medium max-w-lg">
                {(t.addedTranslations_2026?.['مراجعة طلبات التوثيق والملفات المهنية للمدرسين واعتمادهم رسمياً في المنصة.'] || (t.addedTranslations_2026?.['مراجعة طلبات التوثيق والملفات المهنية للمدرسين واعتمادهم رسمياً في المنصة.'] || 'مراجعة طلبات التوثيق والملفات المهنية للمدرسين واعتمادهم رسمياً في المنصة.'))}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-3xl font-black text-amber-500">{counts.pending}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase mt-1">{(t.addedTranslations_2026?.['بانتظار التوثيق'] || (t.addedTranslations_2026?.['بانتظار التوثيق'] || 'بانتظار التوثيق'))}</span>
            </div>
            <div className="flex-1 md:flex-none bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-3xl font-black text-emerald-500">{counts.verified}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase mt-1">{(t.addedTranslations_2026?.['موثقون'] || (t.addedTranslations_2026?.['موثقون'] || 'موثقون'))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-xl p-4 rounded-[32px] border border-white/20 dark:border-white/5 shadow-lg shadow-black/5">
        
        {/* Custom Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto">
          {TABS.map((t) => {
            const active = tab === t.key
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative shrink-0 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 flex items-center gap-3 group overflow-hidden',
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-100'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground scale-95 hover:scale-100'
                )}
              >
                {active && <div className="absolute inset-0 bg-white/20 dark:bg-white/10 animate-pulse-slow" />}
                <Icon className={cn("w-4 h-4 relative z-10 transition-transform group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className="relative z-10 whitespace-nowrap">{t.label}</span>
                <span
                  className={cn(
                    'relative z-10 text-[11px] px-2 py-0.5 rounded-lg font-black transition-colors',
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground border border-border'
                  )}
                >
                  {counts[t.key]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-96 shrink-0">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder={(t.addedTranslations_2026?.['بحث بالاسم أو البريد أو التخصص...'] || (t.addedTranslations_2026?.['بحث بالاسم أو البريد أو التخصص...'] || 'بحث بالاسم أو البريد أو التخصص...'))}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 bg-background border-2 border-border hover:border-primary/30 focus:border-primary rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* List */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="p-4 bg-card rounded-2xl border shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <p className="text-sm font-bold text-muted-foreground animate-pulse">{(t.addedTranslations_2026?.['جاري تحميل البيانات...'] || (t.addedTranslations_2026?.['جاري تحميل البيانات...'] || 'جاري تحميل البيانات...'))}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card/40 backdrop-blur-md border-2 border-dashed border-border rounded-[40px] p-24 text-center shadow-none flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
              <ShieldAlert className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">
              {search ? ((t.addedTranslations_2026?.['لا توجد نتائج مطابقة للبحث'] || (t.addedTranslations_2026?.['لا توجد نتائج مطابقة للبحث'] || 'لا توجد نتائج مطابقة للبحث'))) : ((t.addedTranslations_2026?.['القائمة فارغة'] || (t.addedTranslations_2026?.['القائمة فارغة'] || 'القائمة فارغة')))}
            </h3>
            <p className="text-muted-foreground font-bold max-w-sm mx-auto">
              {search ? ((t.addedTranslations_2026?.['جرب استخدام كلمات بحث مختلفة.'] || (t.addedTranslations_2026?.['جرب استخدام كلمات بحث مختلفة.'] || 'جرب استخدام كلمات بحث مختلفة.'))) : ((t.addedTranslations_2026?.['لا يوجد مدرسون حالياً في هذا القسم.'] || (t.addedTranslations_2026?.['لا يوجد مدرسون حالياً في هذا القسم.'] || 'لا يوجد مدرسون حالياً في هذا القسم.')))}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filtered.map((teacher) => (
              <article
                key={teacher.id}
                className="group bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] p-6 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 shadow-inner flex items-center justify-center font-black text-2xl text-primary shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    {teacher.avatar_url ? (
                      <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      teacher.name?.[0] || (t.addedTranslations_2026?.['م'] || (t.addedTranslations_2026?.['م'] || 'م'))
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-black text-xl text-foreground truncate group-hover:text-primary transition-colors">{teacher.name}</h3>
                      {teacher.is_verified ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                          <BadgeCheck className="w-3.5 h-3.5" /> {(t.addedTranslations_2026?.['موثّق'] || (t.addedTranslations_2026?.['موثّق'] || 'موثّق'))}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
                          <ShieldAlert className="w-3.5 h-3.5" /> {(t.addedTranslations_2026?.['بانتظار التوثيق'] || (t.addedTranslations_2026?.['بانتظار التوثيق'] || 'بانتظار التوثيق'))}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-2">
                      <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 opacity-70" /> {teacher.email}
                      </p>
                      {teacher.phone && (
                        <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <Phone className="w-4 h-4 opacity-70" /> {teacher.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specialty & Bio */}
                <div className="mt-6 flex-1 relative z-10">
                  {teacher.specialization && (
                    <p className="font-bold text-foreground text-base mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      {teacher.specialization}
                    </p>
                  )}
                  {teacher.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 bg-muted/30 p-3 rounded-xl border border-white/5">
                      {teacher.bio}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/50 relative z-10">
                  <div className="bg-muted/40 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <BookOpen className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-lg font-black text-foreground">{teacher.courses_count ?? 0}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{(t.addedTranslations_2026?.['دورات'] || (t.addedTranslations_2026?.['دورات'] || 'دورات'))}</span>
                  </div>
                  <div className="bg-muted/40 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <Users className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-lg font-black text-foreground">{teacher.students_count ?? 0}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{(t.addedTranslations_2026?.['طلاب'] || (t.addedTranslations_2026?.['طلاب'] || 'طلاب'))}</span>
                  </div>
                  <div className="bg-muted/40 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <Star className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-lg font-black text-foreground">{teacher.rating ? Number(teacher.rating).toFixed(1) : '—'}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{(t.addedTranslations_2026?.['تقييم'] || (t.addedTranslations_2026?.['تقييم'] || 'تقييم'))}</span>
                  </div>
                  <div className="bg-muted/40 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <Award className="w-4 h-4 text-purple-500 mb-1" />
                    <span className="text-lg font-black text-foreground">{teacher.years_of_experience ? `${teacher.years_of_experience}+` : '—'}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{(t.addedTranslations_2026?.['خبرة'] || (t.addedTranslations_2026?.['خبرة'] || 'خبرة'))}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-border/50 relative z-10">
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                    {(t.addedTranslations_2026?.['انضم:'] || (t.addedTranslations_2026?.['انضم:'] || 'انضم:'))} {formatDate(teacher.created_at)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelected(teacher)}
                      className="px-5 py-2 rounded-xl border-2 border-border text-foreground hover:border-primary/50 hover:bg-muted font-bold text-sm transition-all"
                    >
                      {(t.addedTranslations_2026?.['التفاصيل'] || (t.addedTranslations_2026?.['التفاصيل'] || 'التفاصيل'))}
                    </button>
                    {teacher.is_verified ? (
                      <button
                        disabled={actingId === teacher.id}
                        onClick={() => handleAction(teacher, 'unverify')}
                        className="px-5 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        {actingId === teacher.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        {(t.addedTranslations_2026?.['سحب التوثيق'] || (t.addedTranslations_2026?.['سحب التوثيق'] || 'سحب التوثيق'))}
                      </button>
                    ) : (
                      <button
                        disabled={actingId === teacher.id}
                        onClick={() => handleAction(teacher, 'verify')}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                      >
                        {actingId === teacher.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {(t.addedTranslations_2026?.['اعتماد وتوثيق'] || (t.addedTranslations_2026?.['اعتماد وتوثيق'] || 'اعتماد وتوثيق'))}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modern Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="bg-card/95 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/10 dark:border-white/5 shrink-0 relative z-10">
              <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                {(t.addedTranslations_2026?.['الملف التعريفي للمدرس'] || (t.addedTranslations_2026?.['الملف التعريفي للمدرس'] || 'الملف التعريفي للمدرس'))}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto relative z-10 flex-1 space-y-8 custom-scrollbar">
              
              {/* Profile Main Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
                <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary flex items-center justify-center font-black text-4xl shrink-0 overflow-hidden border-2 border-white/10 shadow-xl shadow-primary/10">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    selected.name?.[0] || (t.addedTranslations_2026?.['م'] || (t.addedTranslations_2026?.['م'] || 'م'))
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-center sm:justify-start">
                    <h2 className="text-3xl font-black text-foreground">{selected.name}</h2>
                    {selected.is_verified ? (
                      <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4" /> {(t.addedTranslations_2026?.['موثّق رسمياً'] || (t.addedTranslations_2026?.['موثّق رسمياً'] || 'موثّق رسمياً'))}
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> {(t.addedTranslations_2026?.['بانتظار التوثيق'] || (t.addedTranslations_2026?.['بانتظار التوثيق'] || 'بانتظار التوثيق'))}
                      </span>
                    )}
                  </div>
                  {selected.specialization && (
                    <p className="text-lg font-bold text-primary flex items-center justify-center sm:justify-start gap-2">
                      <Briefcase className="w-5 h-5" />
                      {selected.specialization}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-4 pt-2">
                    <p className="text-sm font-semibold text-muted-foreground flex items-center justify-center sm:justify-start gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border">
                      <Mail className="w-4 h-4" /> {selected.email}
                    </p>
                    {selected.phone && (
                      <p className="text-sm font-semibold text-muted-foreground flex items-center justify-center sm:justify-start gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border">
                        <Phone className="w-4 h-4" /> {selected.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selected.bio && (
                <div className="bg-card/50 border border-border rounded-[24px] p-6 shadow-inner">
                  <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-primary" /> {(t.addedTranslations_2026?.['نبذة شخصية'] || (t.addedTranslations_2026?.['نبذة شخصية'] || 'نبذة شخصية'))}
                  </h4>
                  <p className="text-base text-muted-foreground leading-loose whitespace-pre-line font-medium">
                    {selected.bio}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/30 border border-white/5 rounded-[24px] p-5 text-center">
                  <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{selected.courses_count ?? 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{(t.addedTranslations_2026?.['دورات تعليمية'] || (t.addedTranslations_2026?.['دورات تعليمية'] || 'دورات تعليمية'))}</p>
                </div>
                <div className="bg-muted/30 border border-white/5 rounded-[24px] p-5 text-center">
                  <Users className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{selected.students_count ?? 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{(t.addedTranslations_2026?.['إجمالي الطلاب'] || (t.addedTranslations_2026?.['إجمالي الطلاب'] || 'إجمالي الطلاب'))}</p>
                </div>
                <div className="bg-muted/30 border border-white/5 rounded-[24px] p-5 text-center">
                  <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{selected.rating ? Number(selected.rating).toFixed(1) : '—'}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{(t.addedTranslations_2026?.['متوسط التقييم'] || (t.addedTranslations_2026?.['متوسط التقييم'] || 'متوسط التقييم'))}</p>
                </div>
                <div className="bg-muted/30 border border-white/5 rounded-[24px] p-5 text-center">
                  <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{selected.years_of_experience ? `+${selected.years_of_experience}` : '—'}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{(t.addedTranslations_2026?.['سنوات خبرة'] || (t.addedTranslations_2026?.['سنوات خبرة'] || 'سنوات خبرة'))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subjects */}
                {selected.subjects?.length ? (
                  <div className="bg-card/50 border border-border rounded-[24px] p-6 shadow-inner">
                    <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2 mb-4">
                      <GraduationCap className="w-4 h-4 text-primary" /> {(t.addedTranslations_2026?.['المواد التي يُدرسها'] || (t.addedTranslations_2026?.['المواد التي يُدرسها'] || 'المواد التي يُدرسها'))}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selected.subjects.map((s, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 font-black border border-blue-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Certifications */}
                {selected.certifications?.length ? (
                  <div className="bg-card/50 border border-border rounded-[24px] p-6 shadow-inner">
                    <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4 text-primary" /> {(t.addedTranslations_2026?.['الشهادات والمؤهلات'] || (t.addedTranslations_2026?.['الشهادات والمؤهلات'] || 'الشهادات والمؤهلات'))}
                    </h4>
                    <ul className="space-y-3">
                      {selected.certifications.map((c, i) => (
                        <li key={i} className="text-sm font-bold text-foreground flex items-start gap-3 bg-muted/40 p-3 rounded-xl border border-white/5">
                          <BadgeCheck className="w-5 h-5 text-purple-500 shrink-0" />
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-white/10 dark:border-white/5 shrink-0 bg-muted/20 flex flex-col sm:flex-row justify-end gap-3 z-10">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-3 rounded-xl border-2 border-border text-foreground hover:bg-muted transition-colors text-sm font-black"
              >
                {(t.addedTranslations_2026?.['إغلاق النافذة'] || (t.addedTranslations_2026?.['إغلاق النافذة'] || 'إغلاق النافذة'))}
              </button>
              {selected.is_verified ? (
                <button
                  disabled={actingId === selected.id}
                  onClick={() => handleAction(selected, 'unverify')}
                  className="px-8 py-3 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-destructive/20"
                >
                  {actingId === selected.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  {(t.addedTranslations_2026?.['سحب التوثيق من المدرس'] || (t.addedTranslations_2026?.['سحب التوثيق من المدرس'] || 'سحب التوثيق من المدرس'))}
                </button>
              ) : (
                <button
                  disabled={actingId === selected.id}
                  onClick={() => handleAction(selected, 'verify')}
                  className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {actingId === selected.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {(t.addedTranslations_2026?.['اعتماد وتوثيق المدرس رسمياً'] || (t.addedTranslations_2026?.['اعتماد وتوثيق المدرس رسمياً'] || 'اعتماد وتوثيق المدرس رسمياً'))}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
