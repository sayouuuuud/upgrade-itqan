"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Users, BookOpen, ClipboardList, GraduationCap, Award, TrendingUp, Activity, LayoutDashboard, BarChart3 } from "lucide-react"
import { StatsGridSkeleton } from "@/components/admin/skeletons"
import { ViewsChart } from "@/components/admin/analytics/views-chart"
import { VisitorStats } from "@/components/admin/analytics/visitors-stats"

interface PlatformOverview {
  users: { total: number; active: number; new_30: number }
  roleDistribution: { role: string; count: number }[]
  academy: { courses: number; lessons: number; enrollments: number }
  maqraa: { recitations: number; pending: number; reviewed_7: number }
}

export function DashboardSuper() {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar"
  const ds = (t as any).dashboardSuper as Record<string, string> | undefined

  const [data, setData] = useState<PlatformOverview | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/platform-overview")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/admin/analytics?days=30")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setAnalytics(d) })
      .catch(() => {})
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
        <StatsGridSkeleton count={3} />
        <StatsGridSkeleton count={4} />
        <StatsGridSkeleton count={3} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">{isAr ? "حدث خطأ أثناء تحميل النظرة الشاملة" : "An error occurred while loading overview"}</div>
        {error && <code className="bg-red-50 text-red-800 p-2 rounded text-sm">{error}</code>}
      </div>
    )
  }

  const { users, academy, maqraa, roleDistribution } = data

  // Visits analytics (shared page_views table) — owned by the Super Admin only.
  const chartData = (analytics?.overTime || []).map((d: any) => ({
    date: d.raw_date || d.day,
    views_count: parseInt(d.views || "0"),
    visitors_count: parseInt(d.visitors || "0"),
  }))
  const topCountriesMapped = (analytics?.topCountries || []).map((c: any) => ({
    country: c.country,
    count: parseInt(c.views || "0"),
  }))
  const deviceTypesRaw = analytics?.deviceTypes || []
  const totalDevices = deviceTypesRaw.reduce((sum: number, d: any) => sum + parseInt(d.count || "0"), 0)
  const deviceTypesMapped = deviceTypesRaw.map((d: any) => ({
    device_type: d.device_type,
    count: parseInt(d.count || "0"),
    percentage: totalDevices > 0 ? Math.round((parseInt(d.count || "0") / totalDevices) * 100) : 0,
  }))

  const globalCards = [
    {
      label: isAr ? isAr ? "إجمالي المستخدمين" : "Total Users" : "Total Users",
      value: users.total,
      sub: isAr ? isAr ? `${users.active} نشط • ${users.new_30} جديد هذا الشهر` : `${users.active} Active • ${users.new_30} New this month` : `${users.active} Active • ${users.new_30} New this month`,
      icon: Users,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/admin/users",
    },
    {
      label: isAr ? isAr ? "المستخدمون النشطون" : "Active Users" : "Active Users",
      value: users.active,
      sub: isAr ? isAr ? `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% من الإجمالي` : `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% of total` : `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% of total`,
      icon: Activity,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/admin/users",
    },
    {
      label: ds?.newUsers30 ?? 'New Users (30 days)',
      value: users.new_30,
      sub: ds?.bothPlatforms ?? 'Across both platforms',
      icon: TrendingUp,
      color: "bg-accent/10 text-accent border-accent/20",
      href: "/admin/users",
    },
  ]

  const maqraaCards = [
    {
      label: ds?.totalRecitations ?? 'Total Recitations',
      value: maqraa.recitations,
      icon: ClipboardList,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/admin/recitations",
    },
    {
      label: ds?.pendingRecitations ?? 'Pending Recitations',
      value: maqraa.pending,
      icon: ClipboardList,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
      href: "/admin/recitations",
    },
    {
      label: ds?.reviews7Days ?? 'Reviews (7 days)',
      value: maqraa.reviewed_7,
      icon: BookOpen,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/admin/recitations",
    },
  ]

  const academyCards = [
    {
      label: ds?.courses ?? 'Courses',
      value: academy.courses,
      icon: LayoutDashboard,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/admin/academy/courses",
    },
    {
      label: ds?.lessons ?? 'Lessons',
      value: academy.lessons,
      icon: BookOpen,
      color: "bg-accent/10 text-accent border-accent/20",
      href: "/admin/academy/courses",
    },
    {
      label: ds?.enrollments ?? 'Enrollments',
      value: academy.enrollments,
      icon: GraduationCap,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/admin/academy/students",
    },
  ]

  return (
    <div className="space-y-8 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{ds?.overviewTitle ?? 'Platform Overview'}</h2>
        <p className="text-sm text-muted-foreground mt-1">{ds?.overviewDesc ?? 'Unified statistics across both platforms'}</p>
      </div>

      {/* Global / cross-platform */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{ds?.usersSection ?? 'Users — Platform-wide'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {globalCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href} className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm hover:shadow-md transition-shadow block">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center border mb-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {card.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
                </p>
                <p className="text-sm font-medium text-foreground mt-1">{card.label}</p>
                {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Visits analytics — Super Admin only */}
      {analytics && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{ds?.visitsSection ?? 'Visit Analytics'}</h3>
          </div>
          <ViewsChart data={chartData} />
          <VisitorStats countryData={topCountriesMapped} deviceData={deviceTypesMapped} />
        </section>
      )}

      {/* Side-by-side: Maqraa + Academy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maqraa */}
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">{ds?.maqraahTitle ?? 'Maqraah'}</h3>
            </div>
            <Link href="/admin/recitations" className="text-xs text-primary hover:underline">{ds?.manageMaqraah ?? 'Manage Maqraah'}</Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border">
            {maqraaCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.label} href={card.href} className="p-4 text-center hover:bg-muted/30 transition-colors block">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border mx-auto mb-2 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {card.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Academy */}
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" />
              <h3 className="font-bold text-foreground">{ds?.academyTitle ?? 'Academy'}</h3>
            </div>
            <Link href="/admin/academy/courses" className="text-xs text-primary hover:underline">{ds?.manageAcademy ?? 'Manage Academy'}</Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border">
            {academyCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.label} href={card.href} className="p-4 text-center hover:bg-muted/30 transition-colors block">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border mx-auto mb-2 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {card.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      {/* Role Distribution */}
      {roleDistribution.length > 0 && (
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/50">
            <h3 className="font-bold text-foreground">توزيع الأدوار</h3>
            <p className="text-sm text-muted-foreground mt-0.5">عدد المستخدمين لكل دور عبر المنصتين</p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {roleDistribution.map((row) => {
              const pct = Math.round((row.count / Math.max(users.total, 1)) * 100)
              return (
                <div key={row.role} className="bg-muted/40 rounded-lg p-3">
                  <p className="text-lg font-bold text-foreground">
                    {row.count.toLocaleString(isAr ? "ar-EG" : "en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.role}</p>
                  <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
