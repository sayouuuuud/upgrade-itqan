'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import {
  Search, Clock, CheckCircle, XCircle, GraduationCap,
  User, ChevronLeft, Loader2, Layers, Filter, Sparkles, ArrowLeft
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  status: string
  level: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_for_review_at: string | null
  created_at: string
  teacher_id: string
  teacher_name: string
  teacher_avatar: string | null
  reviewer_name: string | null
  total_lessons: number
}

type FilterType = 'pending' | 'approved' | 'rejected' | 'all'

interface FilterTab {
  key: FilterType
  labelAr: string
  labelEn: string
  icon: any
}

const FILTER_TABS: FilterTab[] = [
  { key: 'pending', labelAr: 'بانتظار المراجعة', labelEn: 'Pending Review', icon: Clock },
  { key: 'approved', labelAr: 'المعتمدة', labelEn: 'Approved', icon: CheckCircle },
  { key: 'rejected', labelAr: 'المرفوضة', labelEn: 'Rejected', icon: XCircle },
  { key: 'all', labelAr: 'الكل', labelEn: 'All', icon: Filter },
]

export default function ContentCoursesListPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<Course[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ status: filter })
    if (searchDebounced) params.set('search', searchDebounced)
    fetch(`/api/academy/supervisor/courses?${params}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d) {
          setCourses(d.data || [])
          if (d.counts) setCounts(d.counts)
        }
      })
      .finally(() => setLoading(false))
  }, [filter, searchDebounced])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/academy/content-supervisor"
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAr ? 'العودة للوحة الإشراف' : 'Back to Dashboard'}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <GraduationCap className="w-6 h-6" />
            </div>
            {isAr ? 'مراجعة الدورات' : 'Review Courses'}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {isAr ? 'مراجعة الدورات الكاملة المرسلة من المعلمين قبل نشرها' : 'Review complete courses submitted by teachers before publishing'}
          </p>
        </div>
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={isAr ? 'ابحث بعنوان الدورة أو اسم المعلم...' : 'Search by course title or teacher name...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map(({ key, labelAr, labelEn, icon: Icon }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                {isAr ? labelAr : labelEn}
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-16 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{isAr ? 'لا توجد دورات حالياً' : 'No courses found'}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {searchDebounced 
              ? (isAr ? 'لم نعثر على أي نتائج مطابقة لبحثك، جرب كلمات مفتاحية أخرى.' : 'No matching results found. Try other keywords.')
              : (isAr ? 'لا توجد دورات في هذا القسم حالياً، ستظهر الدورات هنا عند إرسالها للمراجعة.' : 'No courses in this section currently. Courses will appear here when submitted for review.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map(c => (
            <Link
              key={c.id}
              href={`/academy/content-supervisor/courses/${c.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden"
            >
              {/* Highlight bar on the side for pending */}
              {c.status === 'pending_review' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500" />
              )}
              
              <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  {c.level && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-medium text-foreground/80">{c.level}</span>
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {c.teacher_avatar ? (
                        <img src={c.teacher_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-primary" />
                      )}
                    </div>
                    {c.teacher_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {c.total_lessons} {isAr ? 'درس' : 'lessons'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(c.submitted_for_review_at || c.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 mt-4 sm:mt-0 pl-2">
                <StatusBadge status={c.status} isAr={isAr} />
                <span className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAr ? 'المراجعة' : 'Review'}
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const config: Record<string, { labelAr: string; labelEn: string; cls: string; Icon: any }> = {
    pending_review: { labelAr: 'بانتظار المراجعة', labelEn: 'Pending Review', cls: 'bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400', Icon: Clock },
    published: { labelAr: 'منشورة', labelEn: 'Published', cls: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400', Icon: CheckCircle },
    rejected: { labelAr: 'مرفوضة', labelEn: 'Rejected', cls: 'bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:text-rose-400', Icon: XCircle },
    draft: { labelAr: 'مسودة', labelEn: 'Draft', cls: 'bg-muted text-muted-foreground border border-border/50', Icon: GraduationCap },
    archived: { labelAr: 'مؤرشفة', labelEn: 'Archived', cls: 'bg-muted text-muted-foreground border border-border/50', Icon: GraduationCap },
  }
  const c = config[status] || config.draft
  const Icon = c.Icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 shadow-sm ${c.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {isAr ? c.labelAr : c.labelEn}
    </span>
  )
}
