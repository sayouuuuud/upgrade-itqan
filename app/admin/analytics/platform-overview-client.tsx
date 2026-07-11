"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  Loader2,
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  GraduationCap,
  Mic,
  ClipboardCheck,
  Clock,
  LineChart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Overview = {
  users: { total: number; active: number; new_30: number }
  roleDistribution: { role: string; count: number }[]
  academy: { courses: number; lessons: number; enrollments: number }
  maqraa: { recitations: number; pending: number; reviewed_7: number }
}

const getRoleLabels = (isAr: boolean): Record<string, string> => ({
  admin: isAr ? "المدير العام" : "Super Admin",
  super_admin: isAr ? "المدير العام" : "Super Admin",
  maqraa_admin: isAr ? "مدير المقرأة" : "Maqraa Admin",
  academy_admin: isAr ? "مدير الأكاديمية" : "Academy Admin",
  teacher: isAr ? "معلم" : "Teacher",
  reader: isAr ? "مقرئ" : "Reader",
  student: isAr ? "طالب" : "Student",
  parent: isAr ? "ولي أمر" : "Parent",
  student_supervisor: isAr ? "مشرف طلاب" : "Student Supervisor",
  reciter_supervisor: isAr ? "مشرف مقرئين" : "Reciter Supervisor",
  content_supervisor: isAr ? "مشرف محتوى" : "Content Supervisor",
  fiqh_supervisor: isAr ? "مشرف فقه" : "Fiqh Supervisor",
  quality_supervisor: isAr ? "مشرف جودة" : "Quality Supervisor",
  supervisor: isAr ? "مشرف" : "Supervisor",
})

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: number
  tone: string
}) {
  return (
    <Card className="rounded-2xl border border-border bg-card/60">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-black text-foreground">{value.toLocaleString("ar-EG")}</p>
          <p className="text-xs font-bold text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PlatformOverviewClient() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/platform-overview")
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{isAr ? "تعذر تحميل الإحصائيات." : "Failed to load statistics."}</p>
  }

  const maxRole = Math.max(1, ...data.roleDistribution.map((r) => r.count))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <LineChart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">{isAr ? "نظرة عامة على المنصة" : "Platform Overview"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "إحصائيات شاملة للمدير العام تجمع بين الأكاديمية والمقرأة." : "Comprehensive statistics for Super Admin combining Academy and Maqraa."}</p>
        </div>
      </div>

      {/* Members */}
      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">{isAr ? "الأعضاء" : "Members"}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label={isAr ? "إجمالي الأعضاء" : "Total Members"} value={data.users.total} tone="bg-primary/10 text-primary" />
          <StatCard
            icon={UserCheck}
            label={isAr ? "الأعضاء النشطون" : "Active Members"}
            value={data.users.active}
            tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={UserPlus}
            label={isAr ? "أعضاء جدد (30 يوم)" : "New Members (30 days)"}
            value={data.users.new_30}
            tone="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
        </div>
      </section>

      {/* Academy vs Maqraa side by side */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black text-foreground">
              <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {isAr ? "الأكاديمية" : "Academy"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <BookOpen className="mx-auto mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-black text-foreground">{data.academy.courses.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "الدورات" : "Courses"}</p>
            </div>
            <div className="text-center">
              <ClipboardCheck className="mx-auto mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-black text-foreground">{data.academy.lessons.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "الدروس" : "Lessons"}</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-black text-foreground">{data.academy.enrollments.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "الالتحاقات" : "Enrollments"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black text-foreground">
              <Mic className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? "المقرأة" : "Maqraa"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Mic className="mx-auto mb-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-2xl font-black text-foreground">{data.maqraa.recitations.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "التلاوات" : "Recitations"}</p>
            </div>
            <div className="text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-amber-500" />
              <p className="text-2xl font-black text-foreground">{data.maqraa.pending.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "قيد المراجعة" : "Pending Review"}</p>
            </div>
            <div className="text-center">
              <ClipboardCheck className="mx-auto mb-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-2xl font-black text-foreground">{data.maqraa.reviewed_7.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "مُراجعة (7 أيام)" : "Reviewed (7 days)"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Role distribution */}
      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">{isAr ? "توزيع الأدوار" : "Role Distribution"}</h2>
        <Card className="rounded-3xl border border-border bg-card/60">
          <CardContent className="space-y-3 p-6">
            {data.roleDistribution.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">{isAr ? "لا توجد بيانات." : "No data available."}</p>
            ) : (
              data.roleDistribution.map((r) => (
                <div key={r.role} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">{getRoleLabels(isAr)[r.role] ?? r.role}</span>
                    <span className="font-black text-muted-foreground">{r.count.toLocaleString("ar-EG")}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(r.count / maxRole) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
