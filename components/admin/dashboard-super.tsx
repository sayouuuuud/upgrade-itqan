"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Users, BookOpen, ClipboardList, GraduationCap, Award, TrendingUp, Activity, LayoutDashboard, BarChart3, Mic } from "lucide-react"
import { StatsGridSkeleton } from "@/components/admin/skeletons"
import { ViewsChart } from "@/components/admin/analytics/views-chart"
import { VisitorStats } from "@/components/admin/analytics/visitors-stats"
import { DonutChart } from "@/components/ui/donut-chart"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
  const adminRoles = (t as any).adminRoles as Record<string, string> | undefined
  const [hoveredRoleSegment, setHoveredRoleSegment] = useState<string | null>(null)

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
        <div className="text-red-500 font-bold text-xl">{ds?.errorLoadingOverview ?? 'An error occurred while loading overview'}</div>
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
      label: isAr ? "إجمالي المستخدمين" : "Total Users",
      value: users.total,
      sub: isAr ? `${users.active} نشط • ${users.new_30} جديد هذا الشهر` : `${users.active} Active • ${users.new_30} New this month`,
      icon: Users,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/admin/users",
    },
    {
      label: isAr ? "المستخدمون النشطون" : "Active Users",
      value: users.active,
      sub: isAr ? `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% من الإجمالي` : `${Math.round((users.active / Math.max(users.total, 1)) * 100)}% of total`,
      icon: Activity,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/admin/users",
    },
    {
      label: ds?.newUsers30 ?? (isAr ? 'مستخدمون جدد (30 يوماً)' : 'New Users (30 days)'),
      value: users.new_30,
      sub: ds?.bothPlatforms ?? (isAr ? 'في كلا المنصتين' : 'Across both platforms'),
      icon: TrendingUp,
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      href: "/admin/users",
    },
    {
      label: isAr ? 'إجمالي التلاوات' : 'Total Recitations',
      value: maqraa.recitations,
      icon: Mic,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      sub: isAr ? `${maqraa.pending} بانتظار المراجعة` : `${maqraa.pending} pending review`,
      href: "/admin/recitations",
    },
    {
      label: isAr ? 'إجمالي التسجيلات' : 'Total Enrollments',
      value: academy.enrollments,
      icon: GraduationCap,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      sub: isAr ? 'في دورات الأكاديمية' : 'In Academy courses',
      href: "/academy/admin/students",
    },
    {
      label: isAr ? 'المحتوى التعليمي' : 'Educational Content',
      value: academy.courses + academy.lessons,
      icon: BookOpen,
      color: "bg-rose-500/10 text-rose-600 border-rose-200",
      sub: isAr ? `${academy.courses} دورة • ${academy.lessons} درس` : `${academy.courses} courses • ${academy.lessons} lessons`,
      href: "/academy/admin/courses",
    }
  ]

  const maqraaCards = [
    {
      label: ds?.totalRecitations ?? (isAr ? 'إجمالي التلاوات' : 'Total Recitations'),
      value: maqraa.recitations,
      icon: ClipboardList,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/admin/recitations",
    },
    {
      label: ds?.pendingRecitations ?? (isAr ? 'تلاوات قيد المراجعة' : 'Pending Recitations'),
      value: maqraa.pending,
      icon: ClipboardList,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
      href: "/admin/recitations",
    },
    {
      label: ds?.reviews7Days ?? (isAr ? 'مراجعات (7 أيام)' : 'Reviews (7 days)'),
      value: maqraa.reviewed_7,
      icon: BookOpen,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/admin/recitations",
    },
  ]

  const academyCards = [
    {
      label: ds?.courses ?? (isAr ? 'الدورات' : 'Courses'),
      value: academy.courses,
      icon: LayoutDashboard,
      color: "bg-primary/10 text-primary border-primary/20",
      href: "/academy/admin/courses",
    },
    {
      label: ds?.lessons ?? (isAr ? 'الدروس' : 'Lessons'),
      value: academy.lessons,
      icon: BookOpen,
      color: "bg-accent/10 text-accent border-accent/20",
      href: "/academy/admin/courses",
    },
    {
      label: ds?.enrollments ?? (isAr ? 'الاشتراكات' : 'Enrollments'),
      value: academy.enrollments,
      icon: GraduationCap,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/academy/admin/students",
    },
  ]

  return (
    <div className="space-y-8 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Global / cross-platform */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {globalCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href} className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block relative overflow-hidden group min-h-[120px] flex flex-col justify-between">
                <div className={`absolute top-0 rtl:left-0 ltr:right-0 w-16 h-16 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full -z-10 group-hover:scale-110 transition-transform duration-300`}></div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-sm shrink-0 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-foreground/80 leading-tight">{card.label}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground mb-0.5">
                    {card.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
                  </p>
                  {card.sub && <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1" title={card.sub}>{card.sub}</p>}
                </div>
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
            <Link href="/academy/admin/courses" className="text-xs text-primary hover:underline">{ds?.manageAcademy ?? 'Manage Academy'}</Link>
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
      {roleDistribution.length > 0 && (() => {
        const donutData = roleDistribution.map((row, index) => ({
          value: row.count,
          color: `var(--chart-${(index % 5) + 1})`,
          label: adminRoles?.[row.role] ?? row.role,
        }))
        const activeSegment = donutData.find(s => s.label === hoveredRoleSegment)
        const displayValue = activeSegment?.value ?? users.total
        const displayLabel = activeSegment?.label ?? (ds?.roleDistributionTitle ?? 'Role Distribution')
        const displayPercentage = activeSegment ? (activeSegment.value / Math.max(users.total, 1)) * 100 : 100

        return (
          <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-foreground">{ds?.roleDistributionTitle ?? 'Role Distribution'}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{ds?.roleDistributionDesc ?? 'Number of users per role across both platforms'}</p>
            </div>
            <div className="p-5 flex flex-col md:flex-row items-center gap-8 justify-center">
              <div className="relative flex items-center justify-center">
                <DonutChart
                  data={donutData}
                  size={250}
                  strokeWidth={30}
                  onSegmentHover={(segment) => setHoveredRoleSegment(segment?.label ?? null)}
                  centerContent={
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={displayLabel}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "circOut" }}
                        className="flex flex-col items-center justify-center text-center"
                      >
                        <p className="text-muted-foreground text-xs font-medium truncate max-w-[120px]">
                          {displayLabel}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {displayValue.toLocaleString(isAr ? "ar-EG" : "en-US")}
                        </p>
                        {activeSegment && (
                          <p className="text-sm font-medium text-muted-foreground">
                            [{displayPercentage.toFixed(0)}%]
                          </p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  }
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 flex-1 w-full max-w-2xl">
                {donutData.map((segment, index) => (
                  <motion.div
                    key={segment.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 cursor-pointer",
                      hoveredRoleSegment === segment.label 
                        ? "bg-card border-primary/40 shadow-sm scale-[1.02]" 
                        : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50"
                    )}
                    onMouseEnter={() => setHoveredRoleSegment(segment.label)}
                    onMouseLeave={() => setHoveredRoleSegment(null)}
                  >
                    <div
                      className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-medium text-foreground truncate flex-1">
                      {segment.label}
                    </span>
                    <span className="text-xs font-bold text-foreground bg-background px-2 py-1 rounded-md shadow-sm border border-border/50">
                      {segment.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )
      })()}
    </div>
  )
}
