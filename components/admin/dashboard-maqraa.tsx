"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { StatusBadge } from "@/components/status-badge"
import {
  Users, BookOpen, ClipboardList, Clock,
  ArrowLeft, UserCheck, CheckCircle2,
} from "lucide-react"
import { MaqraaInsights } from "@/components/admin/analytics/maqraa-insights"
import { SuspendedStudents } from "@/components/admin/SuspendedStudents"
import { StudentSupervisorDashboard } from "@/components/admin/student-supervisor-dashboard"
import { ReciterSupervisorDashboard } from "@/components/admin/reciter-supervisor-dashboard"
import { StatsGridSkeleton, StatsMiniGridSkeleton, ChartSkeleton, TableSkeleton } from "@/components/admin/skeletons"

export function DashboardMaqraa() {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar"

  const [data, setData] = useState<{ stats: any; latestRecitations: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<{ role: string; name?: string } | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setMe({ role: d.user.role, name: d.user.name })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (me && (me.role === "student_supervisor" || me.role === "reciter_supervisor")) {
      setLoading(false)
      return
    }
    if (me === null) return

    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (res.ok) {
          setData(await res.json())
        } else {
          setData({ error: true, message: await res.text() } as any)
        }
      } catch (err) {
        setData({ error: true, message: String(err) } as any)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [me])

  if (me?.role === "student_supervisor") return <StudentSupervisorDashboard name={me.name} />
  if (me?.role === "reciter_supervisor") return <ReciterSupervisorDashboard name={me.name} />

  if (loading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
        <StatsGridSkeleton count={4} />
        <StatsMiniGridSkeleton count={5} />
        <ChartSkeleton />
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-accent animate-pulse rounded-md" />
              <div className="h-4 w-48 bg-accent animate-pulse rounded-md" />
            </div>
          </div>
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    )
  }

  if (data && (data as any).error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">{t.admin.dashLoadError}</div>
        <div className="text-muted-foreground">{t.admin.dashLoadErrorHint}</div>
        <code className="bg-red-50 text-red-800 p-2 rounded text-sm">{(data as any).message}</code>
      </div>
    )
  }

  if (!data) return null

  const { stats, latestRecitations } = data

  const statCards = [
    { label: t.admin.totalStudents, value: stats.totalStudents, icon: Users, iconBg: "bg-primary/10 text-primary border-primary/20" },
    { label: t.admin.totalReaders, value: stats.totalReaders, icon: BookOpen, iconBg: "bg-accent/10 text-accent border-accent/20" },
    { label: t.admin.todaysRecitations, value: stats.recitationsToday, icon: ClipboardList, iconBg: "bg-primary/10 text-primary border-primary/20" },
    { label: t.admin.avgReviewTime, value: stats.avgReviewTime, icon: Clock, iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    { label: t.admin.pendingReaderApps, value: stats.pendingReaderApps, icon: UserCheck, iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ]

  // Maqraa-focused summary metrics derived from the recitation status distribution.
  const statusDist: Record<string, number> = stats.statusDistribution || {}
  const totalRecitations = Object.values(statusDist).reduce((sum: number, n: any) => sum + (Number(n) || 0), 0)
  const masteredCount = Number(statusDist.mastered || 0)
  const inReviewCount = Number(statusDist.in_review || 0)

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: isAr ? "إجمالي التلاوات" : "Total recitations", value: totalRecitations, icon: ClipboardList, circle: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
          { label: isAr ? "تلاوات متقنة" : "Mastered recitations", value: masteredCount, icon: CheckCircle2, circle: "bg-emerald-500/10 border-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400" },
          { label: isAr ? "قيد المراجعة" : "In review", value: inReviewCount, icon: Clock, circle: "bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-900/50", iconColor: "text-amber-700 dark:text-amber-400" },
          { label: t.admin.totalMembers, value: stats.totalStudents + stats.totalReaders, icon: Users, circle: "bg-accent/10 border-accent/20", iconColor: "text-accent" },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${card.circle}`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {card.value?.toLocaleString(isAr ? "ar-EG" : "en-US")}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const isTime = stat.label === t.admin.avgReviewTime
          const displayValue = isTime && data.stats.avgReviewTimeUnit
            ? `${stat.value} ${t[data.stats.avgReviewTimeUnit as keyof typeof t] || stat.value}`
            : stat.value?.toLocaleString(isAr ? "ar-EG" : "en-US")
          return (
            <div key={stat.label} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-md flex items-center justify-center border`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{displayValue}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <MaqraaInsights
        statusDistribution={statusDist}
        readersActivity={stats.readersActivity || []}
        recitationsOverTime={stats.recitationsOverTime || []}
      />

      <SuspendedStudents />

      {/* Latest Recitations */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
          <div>
            <h3 className="font-bold text-foreground">{t.admin.latestRecitations}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.admin.mostRecentSubmissions}</p>
          </div>
          <Link href="/admin/recitations" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            {t.admin.viewAll}
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-card">
                {[t.admin.student, t.admin.surah, t.admin.reader, t.admin.status, t.admin.date].map((h) => (
                  <th key={h} className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {latestRecitations.length > 0
                ? latestRecitations.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium whitespace-nowrap text-foreground">{rec.studentName}</td>
                    <td className="py-4 px-6 text-muted-foreground whitespace-nowrap font-medium">
                      {t.reader.surah} {rec.surah}{" "}
                      <span className="text-muted-foreground/60 font-normal">({rec.fromAyah}-{rec.toAyah})</span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">{rec.assignedReaderName || "---"}</td>
                    <td className="py-4 px-6 whitespace-nowrap"><StatusBadge status={rec.status as any} /></td>
                    <td className="py-4 px-6 text-muted-foreground/60 whitespace-nowrap text-xs">
                      {new Date(rec.createdAt).toLocaleDateString(t.locale === "ar" ? "ar-SA" : "en-US")}
                    </td>
                  </tr>
                ))
                : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground/50">{t.admin.noRecentRecitations}</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
