"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { StatusBadge } from "@/components/status-badge"
import {
  Users, BookOpen, ClipboardList, Clock, ArrowLeft,
  TrendingUp, Download, UserCheck, Loader2, Eye
} from "lucide-react"
import { ViewsChart } from "@/components/admin/analytics/views-chart"
import { VisitorStats } from "@/components/admin/analytics/visitors-stats"
import { SuspendedStudents } from "@/components/admin/SuspendedStudents"

export default function AdminDashboard() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [data, setData] = useState<{ stats: any, latestRecitations: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          // Instead of failing silently, display an error
          setData({ error: true, message: await res.text() } as any)
        }
      } catch (err) {
        console.error(err)
        setData({ error: true, message: String(err) } as any)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
    // Load analytics in parallel
    fetch('/api/admin/analytics?days=30').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setAnalytics(d)
    }).catch(() => { })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (data && (data as any).error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">حدث خطأ أثناء تحميل البيانات</div>
        <div className="text-muted-foreground">يرجى المحاولة مرة أخرى أو التواصل مع الدعم.</div>
        <code className="bg-red-50 text-red-800 p-2 rounded text-sm">{(data as any).message}</code>
      </div>
    )
  }

  if (!data) return null;

  const { stats, latestRecitations } = data

  const statCards = [
    { label: t.admin.totalStudents, value: stats.totalStudents, icon: Users, iconBg: "bg-primary/10 text-primary border-primary/20" },
    { label: t.admin.totalReaders, value: stats.totalReaders, icon: BookOpen, iconBg: "bg-accent/10 text-accent border-accent/20" },
    { label: t.admin.todaysRecitations, value: stats.recitationsToday, icon: ClipboardList, iconBg: "bg-primary/10 text-primary border-primary/20" },
    { label: t.admin.avgReviewTime, value: stats.avgReviewTime, icon: Clock, iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    { label: t.admin.pendingReaderApps, value: stats.pendingReaderApps, icon: UserCheck, iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ]

  const chartData = (analytics?.overTime || []).map((d: any) => ({
    date: d.raw_date || d.day,
    views_count: parseInt(d.views || '0'),
    visitors_count: parseInt(d.visitors || '0')
  }))

  const topCountriesMapped = (analytics?.topCountries || []).map((c: any) => ({
    country: c.country,
    count: parseInt(c.views || '0')
  }))

  const deviceTypesRaw = analytics?.deviceTypes || []
  const totalDevices = deviceTypesRaw.reduce((sum: number, d: any) => sum + parseInt(d.count || '0'), 0)
  const deviceTypesMapped = deviceTypesRaw.map((d: any) => ({
    device_type: d.device_type,
    count: parseInt(d.count || '0'),
    percentage: totalDevices > 0 ? Math.round((parseInt(d.count || '0') / totalDevices) * 100) : 0
  }))

  const totalViews = parseInt(analytics?.overview?.total_views || '0')
  const uniqueVisitors = parseInt(analytics?.overview?.unique_visitors || '0')
  const totalStudents = stats.totalStudents
  const totalReaders = stats.totalReaders

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {totalViews.toLocaleString(isAr ? "ar-EG" : "en-US")}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.admin.totalViews} (30 {isAr ? t.admin.daysAgo : 'Days'})</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {uniqueVisitors.toLocaleString(isAr ? "ar-EG" : "en-US")}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.admin.uniqueVisitors}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {(totalStudents + totalReaders).toLocaleString(isAr ? "ar-EG" : "en-US")}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.admin.totalMembers}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-900/50">
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {stats.recitationsToday?.toLocaleString(isAr ? "ar-EG" : "en-US") || '0'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.admin.todaysRecitations}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isTime = stat.label === t.admin.avgReviewTime;
          const displayValue = isTime && data.stats.avgReviewTimeUnit
            ? `${stat.value} ${t[data.stats.avgReviewTimeUnit as keyof typeof t] || stat.value}`
            : stat.value?.toLocaleString(isAr ? "ar-EG" : "en-US");

          return (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-md flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{displayValue}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Views Chart */}
      {analytics && (
        <ViewsChart data={chartData} />
      )}

      {/* Suspended Students Section */}
      <SuspendedStudents />

      {/* Advanced Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6">
          {/* Visitor Stats (Countries & Devices) */}
          <div className="lg:col-span-1">
            <VisitorStats
              countryData={topCountriesMapped}
              deviceData={deviceTypesMapped}
            />
          </div>
        </div>
      )}

      {/* Latest Recitations Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50 mb-0">
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
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.student}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.surah}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.reader}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.status}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {latestRecitations.length > 0 ? latestRecitations.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6 font-medium whitespace-nowrap text-foreground">{rec.studentName}</td>
                  <td className="py-4 px-6 text-muted-foreground whitespace-nowrap font-medium">{t.reader.surah} {rec.surah} <span className="text-muted-foreground/60 font-normal">({rec.fromAyah}-{rec.toAyah})</span></td>
                  <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">{rec.assignedReaderName || "---"}</td>
                  <td className="py-4 px-6 whitespace-nowrap"><StatusBadge status={rec.status as any} /></td>
                  <td className="py-4 px-6 text-muted-foreground/60 whitespace-nowrap text-xs">{new Date(rec.createdAt).toLocaleDateString(t.locale === 'ar' ? "ar-SA" : "en-US")}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground/50">
                    {t.admin.noRecentRecitations}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
