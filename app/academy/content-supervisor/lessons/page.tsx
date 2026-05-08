'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search, Clock, CheckCircle, XCircle, BookOpen,
  User, ChevronLeft, Loader2,
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  status: string
  created_at: string
  course_title: string
  teacher_name: string
  teacher_avatar: string | null
  reviewer_name: string | null
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all'

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: 'pending',  label: 'بانتظار المراجعة' },
  { key: 'approved', label: 'المعتمدة' },
  { key: 'rejected', label: 'المرفوضة' },
  { key: 'all',      label: 'الكل' },
]

export default function ContentLessonsListPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
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
    fetch(`/api/academy/supervisor/content?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setLessons(d.data || [])
          if (d.counts) setCounts({ ...counts, ...d.counts })
        }
      })
      .finally(() => setLoading(false))
  }, [filter, searchDebounced])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">الدروس</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مراجعة الدروس المرفوعة من المعلمين
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="بحث بعنوان الدرس، الدورة، أو اسم المعلم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto bg-muted/40 p-1 rounded-2xl w-fit max-w-full">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${
              filter === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            <span className="mr-2 text-xs opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-bold text-foreground">لا توجد دروس</p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchDebounced ? 'لا نتائج مطابقة لبحثك' : 'لا توجد دروس في هذه الفئة'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map(l => (
            <Link
              key={l.id}
              href={`/academy/content-supervisor/lessons/${l.id}`}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {l.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {l.course_title}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {l.teacher_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(l.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  {l.duration_minutes && (
                    <span>{l.duration_minutes} دقيقة</span>
                  )}
                </div>
              </div>

              <StatusBadge status={l.status} />
              <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string; Icon: any }> = {
    pending_review: { label: 'بانتظار المراجعة', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',     Icon: Clock },
    approved:       { label: 'معتمد',          cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', Icon: CheckCircle },
    rejected:       { label: 'مرفوض',          cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',          Icon: XCircle },
    draft:          { label: 'مسودة',          cls: 'bg-muted text-muted-foreground',                            Icon: BookOpen },
  }
  const c = config[status] || config.draft
  const Icon = c.Icon
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full shrink-0 ${c.cls}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}
