'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Clock, CheckCircle, XCircle, ArrowLeft,
  FileCheck, Loader2, GraduationCap, Library, Route, BookMarked,
} from 'lucide-react'

interface Counts {
  pending: number
  approved: number
  rejected: number
  all: number
}

const EMPTY: Counts = { pending: 0, approved: 0, rejected: 0, all: 0 }

interface RecentLesson {
  id: string
  title: string
  course_title: string
  teacher_name: string
  status: string
  created_at: string
}

interface QueueInfo {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  endpoint: string
}

const QUEUES: QueueInfo[] = [
  { key: 'lessons', label: 'الدروس', href: '/academy/content-supervisor/lessons', icon: BookOpen, endpoint: '/api/academy/supervisor/content?status=pending' },
  { key: 'courses', label: 'الدورات', href: '/academy/content-supervisor/courses', icon: GraduationCap, endpoint: '/api/academy/supervisor/courses?status=pending' },
  { key: 'series', label: 'السلاسل', href: '/academy/content-supervisor/series', icon: Library, endpoint: '/api/academy/supervisor/series?status=pending' },
  { key: 'paths', label: 'مسارات المقرئ', href: '/academy/content-supervisor/paths', icon: Route, endpoint: '/api/academy/supervisor/paths?status=pending' },
  { key: 'academy-paths', label: 'مسارات الأكاديمية', href: '/academy/content-supervisor/academy-paths', icon: BookMarked, endpoint: '/api/academy/supervisor/academy-paths?status=pending' },
]

export default function ContentSupervisorDashboard() {
  const [countsByQueue, setCountsByQueue] = useState<Record<string, Counts>>({})
  const [recent, setRecent] = useState<RecentLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    Promise.all(
      QUEUES.map(q =>
        fetch(q.endpoint)
          .then(r => (r.ok ? r.json() : null))
          .then(d => ({ key: q.key, data: d }))
          .catch(() => ({ key: q.key, data: null })),
      ),
    )
      .then(results => {
        const map: Record<string, Counts> = {}
        results.forEach(({ key, data }) => {
          map[key] = (data && data.counts) || EMPTY
          if (key === 'lessons' && data?.data) setRecent((data.data || []).slice(0, 5))
        })
        setCountsByQueue(map)
      })
      .finally(() => setLoading(false))

    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.user?.name) setName(d.user.name) })
      .catch(() => {})
  }, [])

  const totals = Object.values(countsByQueue).reduce(
    (acc, c) => ({
      pending: acc.pending + c.pending,
      approved: acc.approved + c.approved,
      rejected: acc.rejected + c.rejected,
      all: acc.all + c.all,
    }),
    { ...EMPTY },
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">{name ? `مرحباً، ${name}` : 'لوحة التحكم'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مشرف المحتوى — مراجعة محتوى المعلمين والمقرئين واعتماده قبل النشر
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="بانتظار المراجعة"
          value={totals.pending}
          icon={Clock}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          label="معتمدة"
          value={totals.approved}
          icon={CheckCircle}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="مرفوضة"
          value={totals.rejected}
          icon={XCircle}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/10"
        />
        <StatCard
          label="إجمالي المحتوى"
          value={totals.all}
          icon={BookOpen}
          color="text-primary"
          bg="bg-primary/10"
        />
      </div>

      {/* Review queues */}
      <div>
        <h2 className="font-bold text-foreground mb-3">طوابير المراجعة</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUEUES.map(q => {
            const pending = countsByQueue[q.key]?.pending ?? 0
            const Icon = q.icon
            return (
              <Link
                key={q.key}
                href={q.href}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {pending > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {pending}
                    </span>
                  )}
                </div>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{q.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pending > 0 ? `${pending} بانتظار المراجعة` : 'لا جديد'}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Pending lessons preview */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">دروس بانتظار المراجعة</h2>
          </div>
          <Link
            href="/academy/content-supervisor/lessons"
            className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-foreground">لا توجد دروس بانتظار المراجعة</p>
            <p className="text-xs text-muted-foreground mt-1">جميع الدروس تمت مراجعتها</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map(l => (
              <Link
                key={l.id}
                href={`/academy/content-supervisor/lessons/${l.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {l.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {l.course_title} • {l.teacher_name}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0 mr-3">
                  ينتظر
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, color, bg,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
    </div>
  )
}
