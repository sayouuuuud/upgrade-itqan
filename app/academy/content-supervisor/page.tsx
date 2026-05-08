'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Clock, CheckCircle, XCircle, ArrowLeft,
  TrendingUp, FileCheck, Loader2,
} from 'lucide-react'

interface Counts {
  pending: number
  approved: number
  rejected: number
  all: number
}

interface RecentLesson {
  id: string
  title: string
  course_title: string
  teacher_name: string
  status: string
  created_at: string
}

export default function ContentSupervisorDashboard() {
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0, all: 0 })
  const [recent, setRecent] = useState<RecentLesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/academy/supervisor/content?status=pending')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setCounts(d.counts || counts)
          setRecent((d.data || []).slice(0, 5))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const reviewedTotal = counts.approved + counts.rejected
  const completionRate = counts.all > 0 ? Math.round((reviewedTotal / counts.all) * 100) : 0

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
        <h1 className="text-2xl font-black text-foreground">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مراجعة دروس المعلمين واعتمادها قبل النشر
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="بانتظار المراجعة"
          value={counts.pending}
          icon={Clock}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          label="معتمدة"
          value={counts.approved}
          icon={CheckCircle}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="مرفوضة"
          value={counts.rejected}
          icon={XCircle}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/10"
        />
        <StatCard
          label="إجمالي الدروس"
          value={counts.all}
          icon={BookOpen}
          color="text-primary"
          bg="bg-primary/10"
        />
      </div>

      {/* Completion progress */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">معدل المراجعة</h2>
          </div>
          <span className="text-2xl font-black text-primary">{completionRate}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          تم مراجعة {reviewedTotal} من {counts.all} درس إجمالاً
        </p>
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
