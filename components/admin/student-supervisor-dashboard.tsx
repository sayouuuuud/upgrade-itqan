"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { StatusBadge } from "@/components/status-badge"
import {
  Users, ClipboardList, Clock, ArrowLeft, MessagesSquare,
  Loader2, CheckCircle, AlertCircle, FileText
} from "lucide-react"
import { StatsGridSkeleton, TableSkeleton } from "@/components/admin/skeletons"

interface SupervisorDashboardData {
  stats: any
  latestRecitations: any[]
}

export function StudentSupervisorDashboard({ name }: { name?: string }) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar"
  const [data, setData] = useState<SupervisorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats")
        if (res.ok) setData(await res.json())
        else setData({ error: true, message: await res.text() } as any)
      } catch (err) {
        setData({ error: true, message: String(err) } as any)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
        <StatsGridSkeleton count={4} />
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    )
  }

  if (data && (data as any).error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="text-red-500 font-bold text-xl">حدث خطأ أثناء تحميل البيانات</div>
        <code className="bg-red-50 text-red-800 p-2 rounded text-sm">{(data as any).message}</code>
      </div>
    )
  }

  if (!data) return null

  const { stats, latestRecitations } = data
  const sd = stats.statusDistribution || {}
  const pendingReview = (sd.pending || 0) + (sd.in_review || 0)

  const statCards = [
    { label: t.admin.totalStudents, value: stats.totalStudents, icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/admin/users" },
    { label: "تسميعات تنتظر المراجعة", value: pendingReview, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", href: "/admin/recitations" },
    { label: t.admin.todaysRecitations, value: stats.recitationsToday, icon: ClipboardList, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", href: "/admin/recitations" },
    { label: "تسميعات متقنة", value: sd.mastered || 0, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", href: "/admin/recitations" },
  ]

  const quickLinks = [
    { href: "/admin/users", label: t.admin.users, desc: "إدارة الطلاب ومتابعتهم", icon: Users },
    { href: "/admin/recitations", label: t.admin.recitations, desc: "مراجعة تسميعات الطلاب", icon: ClipboardList },
    { href: "/admin/conversations", label: t.admin.conversations, desc: "متابعة المحادثات", icon: MessagesSquare },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black text-foreground">{name ? `مرحباً، ${name}` : "لوحة مشرف الطلاب"}</h1>
        <p className="text-sm text-muted-foreground mt-1">متابعة الطلاب وتسميعاتهم — نظرة سريعة على ما يحتاج اهتمامك</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:border-primary/40 transition-colors">
            <div className={`w-10 h-10 ${bg} rounded-md flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h3 className={`text-2xl sm:text-3xl font-bold ${color} mb-1`}>{value?.toLocaleString(isAr ? "ar-EG" : "en-US")}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-muted/30 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>

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
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? "text-right" : "text-left"}`}>{t.admin.student}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? "text-right" : "text-left"}`}>{t.admin.surah}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? "text-right" : "text-left"}`}>{t.admin.reader}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? "text-right" : "text-left"}`}>{t.admin.status}</th>
                <th className={`py-4 px-6 font-medium whitespace-nowrap ${isAr ? "text-right" : "text-left"}`}>{t.admin.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {latestRecitations.length > 0 ? latestRecitations.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6 font-medium whitespace-nowrap text-foreground">{rec.studentName}</td>
                  <td className="py-4 px-6 text-muted-foreground whitespace-nowrap font-medium">{t.reader.surah} {rec.surah} <span className="text-muted-foreground/60 font-normal">({rec.fromAyah}-{rec.toAyah})</span></td>
                  <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">{rec.assignedReaderName || "---"}</td>
                  <td className="py-4 px-6 whitespace-nowrap"><StatusBadge status={rec.status as any} /></td>
                  <td className="py-4 px-6 text-muted-foreground/60 whitespace-nowrap text-xs">{new Date(rec.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground/50">{t.admin.noRecentRecitations}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
