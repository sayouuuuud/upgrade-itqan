"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  BookOpen, UserCheck, ClipboardList, ArrowLeft, MessagesSquare,
  Loader2, Clock, Star, Mic, Users
} from "lucide-react"
import { StatsGridSkeleton } from "@/components/admin/skeletons"

interface Reader {
  id: string
  name: string
  approval_status: string
  is_accepting_recitations?: boolean
  rating?: number
  pending_reviews_count?: string
}

interface Application {
  id: string
  name: string
  approval_status: string
  city?: string
  qualification?: string
  created_at: string
}

export function ReciterSupervisorDashboard({ name }: { name?: string }) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const isAr = t.locale === "ar"
  const [readers, setReaders] = useState<Reader[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [readersRes, appsRes] = await Promise.all([
          fetch("/api/admin/readers"),
          fetch("/api/admin/reader-applications"),
        ])
        if (readersRes.ok) {
          const d = await readersRes.json()
          setReaders(d.readers || [])
        }
        if (appsRes.ok) {
          const d = await appsRes.json()
          setApps(d.applications || [])
        }
      } catch (err) {
        console.error(err)
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
      </div>
    )
  }

  const pendingApps = apps.filter(a => a.approval_status === "pending_approval")
  const approvedReaders = readers.filter(r => r.approval_status === "approved")
  const acceptingReaders = approvedReaders.filter(r => r.is_accepting_recitations)
  const totalPendingReviews = readers.reduce((s, r) => s + parseInt(r.pending_reviews_count || "0"), 0)

  const statCards = [
    { label: "المقرئون المعتمدون", value: approvedReaders.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", href: "/admin/readers" },
    { label: "طلبات انضمام معلقة", value: pendingApps.length, icon: UserCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", href: "/admin/reader-applications" },
    { label: "يستقبلون التسميعات", value: acceptingReaders.length, icon: Mic, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", href: "/admin/readers" },
    { label: "مراجعات قيد الانتظار", value: totalPendingReviews, icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", href: "/admin/recitations" },
  ]

  const quickLinks = [
    { href: "/admin/readers", label: t.admin.readers, desc: "إدارة المقرئين ومتابعتهم", icon: BookOpen },
    { href: "/admin/reader-applications", label: t.admin.readerApplications, desc: "مراجعة طلبات الانضمام", icon: UserCheck },
    { href: "/admin/recitations", label: t.admin.recitations, desc: "متابعة التسميعات", icon: ClipboardList },
    { href: "/community/maqraa/forum", label: "منتدى المقرأة", desc: "متابعة نقاشات المقرأة", icon: MessagesSquare },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black text-foreground">{name ? `مرحباً، ${name}` : "لوحة مشرف المقرئين"}</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة المقرئين وطلبات الانضمام ومتابعة جودة التسميعات</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h3 className="font-bold text-foreground">طلبات انضمام تنتظر المراجعة</h3>
            <p className="text-sm text-muted-foreground mt-1">أحدث طلبات المقرئين</p>
          </div>
          <Link href="/admin/reader-applications" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            {t.admin.viewAll}
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {pendingApps.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">لا توجد طلبات معلقة حالياً</div>
          ) : pendingApps.slice(0, 5).map(app => (
            <Link key={app.id} href="/admin/reader-applications" className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{app.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {[app.qualification, app.city].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">ينتظر</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
