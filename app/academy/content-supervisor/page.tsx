'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import {
  BookOpen, Clock, CheckCircle, XCircle, ArrowLeft,
  FileCheck, Loader2, GraduationCap, Library, Route, BookMarked,
  Activity, Sparkles, AlertCircle, ChevronLeft
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
  labelAr: string
  labelEn: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  endpoint: string
  colorClass: string
  bgClass: string
}

const QUEUES: QueueInfo[] = [
  { key: 'lessons', labelAr: 'الدروس', labelEn: 'Lessons', href: '/academy/content-supervisor/lessons', icon: BookOpen, endpoint: '/api/academy/supervisor/content?status=pending', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-500/10' },
  { key: 'courses', labelAr: 'الدورات', labelEn: 'Courses', href: '/academy/content-supervisor/courses', icon: GraduationCap, endpoint: '/api/academy/supervisor/courses?status=pending', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-500/10' },
  { key: 'series', labelAr: 'السلاسل', labelEn: 'Series', href: '/academy/content-supervisor/series', icon: Library, endpoint: '/api/academy/supervisor/series?status=pending', colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-500/10' },
  { key: 'paths', labelAr: 'مسارات المقرئ', labelEn: 'Reciter Paths', href: '/academy/content-supervisor/paths', icon: Route, endpoint: '/api/academy/supervisor/paths?status=pending', colorClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-500/10' },
  { key: 'academy-paths', labelAr: 'مسارات الأكاديمية', labelEn: 'Academy Paths', href: '/academy/content-supervisor/academy-paths', icon: BookMarked, endpoint: '/api/academy/supervisor/academy-paths?status=pending', colorClass: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-500/10' },
]

export default function ContentSupervisorDashboard() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            {name 
              ? (isAr ? `مرحباً بك، ${name}` : `Welcome, ${name}`) 
              : (isAr ? 'لوحة تحكم الإشراف' : 'Supervisor Dashboard')}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {isAr 
              ? 'مشرف المحتوى — إدارة ومراجعة محتوى المعلمين قبل نشره بالأكاديمية' 
              : 'Content Supervisor — Manage and review teacher content before publishing to the academy'}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label={isAr ? 'بانتظار المراجعة' : 'Pending Review'}
          value={totals.pending}
          icon={Clock}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
          border="border-amber-500/20"
        />
        <StatCard
          label={isAr ? 'تم اعتمادها' : 'Approved'}
          value={totals.approved}
          icon={CheckCircle}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
        />
        <StatCard
          label={isAr ? 'مرفوضة' : 'Rejected'}
          value={totals.rejected}
          icon={XCircle}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/10"
          border="border-rose-500/20"
        />
        <StatCard
          label={isAr ? 'إجمالي المحتوى' : 'Total Content'}
          value={totals.all}
          icon={BookOpen}
          color="text-primary"
          bg="bg-primary/10"
          border="border-primary/20"
        />
      </div>

      {/* Review queues */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/50 bg-muted/20">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            {isAr ? 'طوابير المراجعة النشطة' : 'Active Review Queues'}
          </h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUEUES.map(q => {
            const pending = countsByQueue[q.key]?.pending ?? 0
            const Icon = q.icon
            return (
              <Link
                key={q.key}
                href={q.href}
                className="group relative flex flex-col justify-between p-5 bg-background border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-md transition-all overflow-hidden"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${q.bgClass.replace('/10', '')}`} />
                
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${q.bgClass} flex items-center justify-center border border-background shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${q.colorClass}`} />
                  </div>
                  {pending > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" />
                      {pending} {isAr ? 'طلب جديد' : 'new requests'}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/50">
                      {isAr ? 'مكتمل' : 'Completed'}
                    </span>
                  )}
                </div>
                
                <div className="relative z-10">
                  <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                    {isAr ? q.labelAr : q.labelEn}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">
                      {pending > 0 
                        ? (isAr ? 'يتطلب إجراء' : 'Action Required') 
                        : (isAr ? 'لا يوجد مهام حالية' : 'No tasks pending')}
                    </p>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Pending lessons preview */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground text-lg">{isAr ? 'أحدث الدروس بانتظار المراجعة' : 'Recent Lessons Pending Review'}</h2>
          </div>
          <Link
            href="/academy/content-supervisor/lessons"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isAr ? 'تصفح الكل' : 'Browse All'}
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{isAr ? 'ممتاز! لا توجد دروس بانتظار المراجعة' : 'Excellent! No lessons pending review'}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isAr 
                ? 'لقد قمت بإنجاز عملك بنجاح. سيتم إشعارك عند وجود دروس جديدة بانتظار مراجعتك.' 
                : 'You have completed your work successfully. You will be notified when new lessons await your review.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recent.map(l => (
              <Link
                key={l.id}
                href={`/academy/content-supervisor/lessons/${l.id}`}
                className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors group"
              >
                <div className="min-w-0 flex-1 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-base">
                      {l.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground truncate bg-muted px-2 py-0.5 rounded-md">
                        {l.course_title}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">•</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {isAr ? 'المعلم:' : 'Teacher:'} <span className="font-medium text-foreground/80">{l.teacher_name}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {isAr ? 'قيد الانتظار' : 'Pending'}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, color, bg, border
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  border: string
}) {
  return (
    <div className={`bg-card border ${border} rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow`}>
      <div className={`absolute top-0 left-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
        <Icon className="w-24 h-24" />
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 ${bg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <div>
          <p className="text-4xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}

